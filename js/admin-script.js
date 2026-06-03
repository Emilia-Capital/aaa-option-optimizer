/* global jQuery, aaaOptionOptimizer, Option, DataTable, alert */

/**
 * JavaScript for the admin page.
 *
 * @package
 */

/**
 * Initializes the data tables and sets up event handlers.
 */
jQuery( document ).ready( function () {
	/**
	 * Array of table selectors to initialize.
	 *
	 * @type {string[]}
	 */
	const tablesToInitialize = [
		'#unused_options_table',
		'#used_not_autoloaded_table',
		'#requested_do_not_exist_table',
	];

	jQuery( '#all_options_table' ).hide();
	jQuery( '#aaa_get_all_options' ).on( 'click', function ( e ) {
		e.preventDefault();
		jQuery( '#all_options_table' ).show();
		initializeDataTable( '#all_options_table' );
		jQuery( this ).hide();
	} );

	/**
	 * Generate row ID for an option name.
	 *
	 * @param {string} optionName - The option name.
	 * @return {string} The row ID.
	 */
	function generateRowId( optionName ) {
		return 'option_' + optionName.replace( /\./g, '_' );
	}

	/**
	 * Store sources (plugin names) for each table from AJAX responses.
	 *
	 * @type {Object}
	 */
	const tableSources = {};

	/**
	 * Creates a column filter setup function bound to a specific table selector.
	 *
	 * @param {string} tableSelector - The table selector.
	 * @return {Function} The filter setup function.
	 */
	function createColumnFilterSetup( tableSelector ) {
		return function () {
			setupColumnFilters.call( this, tableSelector );
		};
	}

	/**
	 * Initializes the DataTable for the given selector.
	 *
	 * @param {string} selector - The table selector.
	 */
	function initializeDataTable( selector ) {
		const filterSetup = createColumnFilterSetup( selector );

		const options = {
			pageLength: 25,
			autoWidth: false,
			responsive: true,
			columns: getColumns( selector ),
			rowId( data ) {
				return generateRowId( data.name );
			},
			initComplete() {
				this.api().columns( 'source:name' ).every( filterSetup );
			},
			language: aaaOptionOptimizer.i18n,
		};

		if ( selector === '#unused_options_table' ) {
			options.ajax = {
				url:
					aaaOptionOptimizer.root +
					'aaa-option-optimizer/v1/unused-options',
				headers: { 'X-WP-Nonce': aaaOptionOptimizer.nonce },
				type: 'GET',
				dataSrc( json ) {
					tableSources[ selector ] = json.sources || [];
					return json.data;
				},
			};
			options.serverSide = true;
			options.processing = true;
			options.language = {
				sZeroRecords: aaaOptionOptimizer.i18n.noAutoloadedButNotUsed,
			};
			options.initComplete = function () {
				getBulkActionsForm( selector, [ 'autoload-off' ] ).call( this );
				this.api().columns( 'source:name' ).every( filterSetup );
			};
			options.order = [ [ 1, 'asc' ] ]; // Order by 2nd column, first column is checkbox.
		}

		if ( selector === '#used_not_autoloaded_table' ) {
			options.ajax = {
				url:
					aaaOptionOptimizer.root +
					'aaa-option-optimizer/v1/used-not-autoloaded-options',
				headers: { 'X-WP-Nonce': aaaOptionOptimizer.nonce },
				type: 'GET',
				dataSrc( json ) {
					tableSources[ selector ] = json.sources || [];
					return json.data;
				},
			};
			options.serverSide = true;
			options.processing = true;
			options.language = {
				sZeroRecords: aaaOptionOptimizer.i18n.noUsedButNotAutoloaded,
			};
			options.initComplete = function () {
				getBulkActionsForm( selector, [ 'autoload-on' ] ).call( this );
				this.api().columns( 'source:name' ).every( filterSetup );
			};
			options.order = [ [ 1, 'asc' ] ]; // Order by 2nd column, first column is checkbox.
		}

		if ( selector === '#requested_do_not_exist_table' ) {
			options.ajax = {
				url: `${ aaaOptionOptimizer.root }aaa-option-optimizer/v1/options-that-do-not-exist`,
				headers: { 'X-WP-Nonce': aaaOptionOptimizer.nonce },
				type: 'GET',
				dataSrc( json ) {
					tableSources[ selector ] = json.sources || [];
					return json.data;
				},
			};
			options.serverSide = true;
			options.processing = true;
			options.initComplete = function () {
				this.api().columns( 'source:name' ).every( filterSetup );
			};
		}

		if ( selector === '#all_options_table' ) {
			options.ajax = {
				url: `${ aaaOptionOptimizer.root }aaa-option-optimizer/v1/all-options`,
				headers: { 'X-WP-Nonce': aaaOptionOptimizer.nonce },
				type: 'GET',
				dataSrc: 'data',
			};
			options.initComplete = function () {
				getBulkActionsForm( selector, [
					'autoload-on',
					'autoload-off',
				] ).call( this );
				this.api().columns( 'source:name' ).every( filterSetup );
			};
			options.order = [ [ 1, 'asc' ] ]; // Order by 2nd column, first column is checkbox.
		}

		new DataTable( selector, options ).columns.adjust().responsive.recalc();
	}

	/**
	 * Retrieves the columns configuration based on the selector.
	 *
	 * @param {string} selector - The table selector.
	 *
	 * @return {Object[]} - The columns configuration.
	 */
	function getColumns( selector ) {
		const commonColumns = [
			{
				name: 'checkbox',
				data: 'name',
				render: ( data, type, row ) => renderCheckboxColumn( row ),
				orderable: false,
				searchable: false,
				className: 'select-all',
			},
			{ name: 'name', data: 'name' },
			{
				name: 'source',
				data: 'plugin',
				render: ( data, type, row ) => renderSourceColumn( row ),
			},
			{ name: 'size', data: 'size', searchable: false },
			{
				name: 'autoload',
				data: 'autoload',
				className: 'autoload',
				searchable: false,
				orderable: false,
			},
			{
				name: 'value',
				data: 'value',
				render: ( data, type, row ) => renderValueColumn( row ),
				orderable: false,
				searchable: false,
				className: 'actions',
			},
		];
		if ( selector === '#requested_do_not_exist_table' ) {
			return [
				{ name: 'option', data: 'name' },
				{
					name: 'source',
					data: 'plugin',
					searchable: false,
					render: ( data, type, row ) => renderSourceColumn( row ),
				},
				{ name: 'calls', data: 'count', searchable: false },
				{
					name: 'option_name',
					data: 'option_name',
					render: ( data, type, row ) =>
						renderNonExistingOptionsColumn( row ),
					searchable: false,
					orderable: false,
					className: 'actions',
				},
			];
		} else if ( selector === '#used_not_autoloaded_table' ) {
			return [
				{
					name: 'checkbox',
					data: 'name',
					render: ( data, type, row ) => renderCheckboxColumn( row ),
					orderable: false,
					searchable: false,
					className: 'select-all',
				},
				{ name: 'name', data: 'name' },
				{
					name: 'source',
					data: 'plugin',
					render: ( data, type, row ) => renderSourceColumn( row ),
				},
				{ name: 'size', data: 'size', searchable: false },
				{
					name: 'autoload',
					data: 'autoload',
					className: 'autoload',
					searchable: false,
					orderable: false,
				},
				{ name: 'calls', data: 'count', searchable: false },
				{
					name: 'value',
					data: 'value',
					render: ( data, type, row ) => renderValueColumn( row ),
					orderable: false,
					searchable: false,
					className: 'actions',
				},
			];
		} else if ( selector === '#all_options_table' ) {
			return [
				{
					name: 'checkbox',
					data: 'name',
					render: ( data, type, row ) => renderCheckboxColumn( row ),
					orderable: false,
					searchable: false,
					className: 'select-all',
				},
				{ name: 'name', data: 'name' },
				{
					name: 'source',
					data: 'plugin',
					render: ( data, type, row ) => renderSourceColumn( row ),
				},
				{
					name: 'size',
					data: 'size',
					searchable: false,
					render: ( data ) => `<span class="num">${ data }</span>`,
				},
				{
					name: 'autoload',
					data: 'autoload',
					className: 'autoload',
					searchable: false,
				},
				{
					name: 'value',
					data: 'value',
					render: ( data, type, row ) => renderValueColumn( row ),
					orderable: false,
					searchable: false,
					className: 'actions',
				},
			];
		}

		return commonColumns;
	}

	/**
	 * Sets up the column filters for the DataTable.
	 *
	 * @param {string} tableSelector - The table selector to get sources from.
	 */
	function setupColumnFilters( tableSelector ) {
		const column = this;
		const select = document.createElement( 'select' );
		select.add(
			new Option( aaaOptionOptimizer.i18n.filterBySource, '', true, true )
		);
		column.footer().replaceChildren( select );

		select.addEventListener( 'change', function () {
			column.search( select.value, { exact: true } ).draw();
		} );

		// Use sources from AJAX response if available (for server-side processing),
		// otherwise fall back to column data (for client-side processing).
		const sources = tableSources[ tableSelector ];
		if ( sources && sources.length > 0 ) {
			sources.forEach( function ( source ) {
				select.add( new Option( source ) );
			} );
		} else {
			column
				.data()
				.unique()
				.sort()
				.each( function ( d ) {
					select.add( new Option( d ) );
				} );
		}
	}

	/**
	 * Renders the value column for a row.
	 *
	 * @param {Object} row - The row data.
	 *
	 * @return {string} - The HTML for the value column.
	 */
	function renderValueColumn( row ) {
		const popoverContent = `<div id="popover_${ row.name }" popover class="aaa-option-optimizer-popover">
			<button class="aaa-option-optimizer-popover__close" popovertarget="popover_${ row.name }" popovertargetaction="hide">X</button>
			<p><strong>Value of <code>${ row.name }</code></strong></p>
			<pre>${ row.value }</pre>
		</div>`;

		const actions = [
			`<button class="button dashicon" popovertarget="popover_${ row.name }">
				<span class="dashicons dashicons-search"></span>
				${ aaaOptionOptimizer.i18n.showValue }
			</button>`,
			popoverContent,
			row.autoload === 'no'
				? `<button class="button dashicon add-autoload" data-option="${ row.name }">
					<span class="dashicons dashicons-plus"></span>
					${ aaaOptionOptimizer.i18n.addAutoload }
				</button>`
				: `<button class="button dashicon remove-autoload" data-option="${ row.name }">
					<span class="dashicons dashicons-minus"></span>
					${ aaaOptionOptimizer.i18n.removeAutoload }
				</button>`,
			`<button class="button button-delete delete-option" data-option="${ row.name }">
				<span class="dashicons dashicons-trash"></span>
				${ aaaOptionOptimizer.i18n.deleteOption }
			</button>`,
		];

		return actions.join( '' );
	}

	/**
	 * Renders the value column for a row.
	 *
	 * @param {Object} row - The row data.
	 *
	 * @return {string} - The HTML for the value column.
	 */
	function renderNonExistingOptionsColumn( row ) {
		return `<button class="button button-primary create-option-false" data-option="${ row.name }">
				${ aaaOptionOptimizer.i18n.createOptionFalse }
			</button>`;
	}

	/**
	 * Renders the checkbox column for a row.
	 *
	 * @param {Object} row - The row data.
	 *
	 * @return {string} - The HTML for the value column.
	 */
	function renderCheckboxColumn( row ) {
		return `<label for="select-option-${ row.name }">
				<input type="checkbox" id="select-option-${ row.name }" class="select-option" data-option="${ row.name }">
			</label>`;
	}

	/**
	 * Escape HTML for safe insertion as text.
	 *
	 * @param {string} unsafe - The string to escape.
	 * @return {string} - The escaped string.
	 */
	function escapeHtml( unsafe ) {
		return String( unsafe )
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}

	/**
	 * Renders the Source column. For unknown sources, wraps the label
	 * in a button that opens a Report Origin popover.
	 *
	 * @param {Object} row - The row data.
	 *
	 * @return {string} - The HTML for the source column.
	 */
	let reportPopoverSeq = 0;
	function renderSourceColumn( row ) {
		const label = escapeHtml( row.plugin );
		if ( row.plugin_known ) {
			return label;
		}
		const popoverId = `aaa_report_${ ++reportPopoverSeq }`;
		return `${ renderReportPopover( row, popoverId ) }
			<button type="button" class="aaa-report-trigger" popovertarget="${ popoverId }" data-option="${ escapeHtml(
				row.name
			) }">${ label }<span class="aaa-report-trigger__action">${
				aaaOptionOptimizer.i18n.reportOrigin
			}</span></button>`;
	}

	/**
	 * Renders the Report Origin popover for an unknown row.
	 *
	 * @param {Object} row       - The row data.
	 * @param {string} popoverId - The popover element id.
	 *
	 * @return {string} - The popover HTML.
	 */
	function renderReportPopover( row, popoverId ) {
		const i18n = aaaOptionOptimizer.i18n;
		const optionName = escapeHtml( row.name );
		return `<div id="${ popoverId }" popover class="aaa-option-optimizer-popover aaa-report-popover" data-option="${ optionName }">
			<button type="button" class="aaa-option-optimizer-popover__close" popovertarget="${ popoverId }" popovertargetaction="hide">X</button>
			<p><strong>${ i18n.reportOriginOf } <code>${ optionName }</code></strong></p>
			<p>
				<label>
					${ i18n.reportSlugOrUrlLabel }
					<input type="text" class="aaa-report-input regular-text" placeholder="${ escapeHtml(
						i18n.reportSlugPlaceholder
					) }" autocomplete="off" />
				</label>
			</p>
			<p class="aaa-report-status" aria-live="polite"></p>
			<p class="description">${ escapeHtml( i18n.reportPrivacyNote ) }</p>
			${ renderConsentField() }
			<p>
				<button type="button" class="button aaa-report-cancel" popovertarget="${ popoverId }" popovertargetaction="hide">${
					i18n.reportCancel
				}</button>
				<button type="button" class="button button-primary aaa-report-submit" disabled>${
					i18n.reportSubmit
				}</button>
			</p>
		</div>`;
	}

	/**
	 * Renders the consent checkbox shown in the Report popover when the user
	 * has not yet consented to contacting our servers. Returns an empty string
	 * once consent has been granted (globally or earlier this session).
	 *
	 * @return {string} - The consent field HTML, or an empty string.
	 */
	function renderConsentField() {
		if ( aaaOptionOptimizer.hasRemoteConsent ) {
			return '';
		}
		return `<p class="aaa-report-consent">
			<label>
				<input type="checkbox" class="aaa-report-consent-input" />
				${ escapeHtml( aaaOptionOptimizer.i18n.reportConsentLabel ) }
			</label>
		</p>`;
	}

	/**
	 * Whether the report in this popover may be submitted: a slug must be
	 * verified, and consent must be granted (globally or via the popover
	 * checkbox).
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @return {boolean} - True when the report may be submitted.
	 */
	function reportCanSubmit( $popover ) {
		const optionName = $popover.data( 'option' );
		const state = reportState[ optionName ];
		const verified = !! ( state && state.slug && state.verifiedName );
		return verified && hasReportConsent( $popover );
	}

	/**
	 * Whether consent is satisfied for this popover.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @return {boolean} - True when consent is satisfied.
	 */
	function hasReportConsent( $popover ) {
		if ( aaaOptionOptimizer.hasRemoteConsent ) {
			return true;
		}
		return $popover.find( '.aaa-report-consent-input' ).is( ':checked' );
	}

	/**
	 * Extract a wp.org plugin slug from a slug or URL.
	 *
	 * @param {string} input - User input.
	 * @return {string} - Normalized slug, or empty string if invalid.
	 */
	function normalizeSlug( input ) {
		const trimmed = String( input || '' ).trim();
		if ( ! trimmed ) {
			return '';
		}
		// Try to pull a slug out of a wordpress.org URL.
		const urlMatch = trimmed.match(
			/wordpress\.org\/plugins\/([a-z0-9-]+)/i
		);
		if ( urlMatch ) {
			return urlMatch[ 1 ].toLowerCase();
		}
		// Otherwise treat input as a slug.
		if ( /^[a-z0-9-]+$/i.test( trimmed ) ) {
			return trimmed.toLowerCase();
		}
		return '';
	}

	// Per-popover state for the wp.org verification step.
	const reportState = {};

	/**
	 * Verify a slug against the wordpress.org plugin directory and update
	 * the popover UI accordingly.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @param {string} slug     - The slug to verify.
	 */
	function verifyReportSlug( $popover, slug ) {
		const optionName = $popover.data( 'option' );
		const i18n = aaaOptionOptimizer.i18n;
		const $status = $popover.find( '.aaa-report-status' );
		const $submit = $popover.find( '.aaa-report-submit' );

		reportState[ optionName ] = { slug: '', verifiedName: '' };
		$submit.prop( 'disabled', true );

		if ( ! slug ) {
			$status.text( '' );
			return;
		}

		$status.text( i18n.reportVerifying );

		jQuery
			.ajax( {
				url: `https://api.wordpress.org/plugins/info/1.0/${ encodeURIComponent(
					slug
				) }.json`,
				method: 'GET',
				dataType: 'json',
				timeout: 8000,
			} )
			.done( function ( data ) {
				if ( ! data || data.error || ! data.name ) {
					$status.text( i18n.reportNotFound );
					return;
				}
				reportState[ optionName ] = {
					slug,
					verifiedName: data.name,
				};
				$status.html(
					`✓ ${ i18n.reportVerified } <strong>${ escapeHtml(
						data.name
					) }</strong>`
				);
				$submit.prop( 'disabled', ! reportCanSubmit( $popover ) );
			} )
			.fail( function () {
				$status.text( i18n.reportVerifyError );
			} );
	}

	/**
	 * Submit a report to the configured endpoint.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 */
	function submitReport( $popover ) {
		const optionName = $popover.data( 'option' );
		const i18n = aaaOptionOptimizer.i18n;
		const state = reportState[ optionName ];
		if ( ! state || ! state.slug ) {
			return;
		}
		if ( ! hasReportConsent( $popover ) ) {
			return;
		}

		const $status = $popover.find( '.aaa-report-status' );
		const $submit = $popover.find( '.aaa-report-submit' );
		$submit.prop( 'disabled', true );
		$status.text( i18n.reportSubmitting );

		// If consent was granted here (not previously), persist it so the daily
		// refresh starts and the user isn't asked again.
		if ( ! aaaOptionOptimizer.hasRemoteConsent ) {
			persistConsent();
		}

		jQuery
			.ajax( {
				url: aaaOptionOptimizer.reportUrl,
				method: 'POST',
				contentType: 'application/json',
				data: JSON.stringify( {
					option_name: optionName,
					slug: state.slug,
					site: window.location.hostname,
				} ),
				timeout: 10000,
			} )
			.done( function () {
				$status.text( i18n.reportThanks );
			} )
			.fail( function () {
				$status.text( i18n.reportFailed );
				$submit.prop( 'disabled', false );
			} );
	}

	/**
	 * Persist the user's consent to contacting our servers, and remember it for
	 * the rest of this page session so further popovers don't ask again. Best
	 * effort — a failure here doesn't block the report the user just made.
	 */
	function persistConsent() {
		aaaOptionOptimizer.hasRemoteConsent = true;
		jQuery.ajax( {
			url: `${ aaaOptionOptimizer.root }aaa-option-optimizer/v1/set-consent`,
			method: 'POST',
			contentType: 'application/json',
			beforeSend: ( xhr ) =>
				xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce ),
			data: JSON.stringify( { consent: true } ),
		} );
	}

	// Debounced wp.org verification on input change. Per-popover timer so
	// concurrently-open popovers don't cancel each other's verification.
	jQuery( document ).on( 'input', '.aaa-report-input', function () {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		const raw = jQuery( this ).val();
		const slug = normalizeSlug( raw );
		const previous = $popover.data( 'verifyTimer' );
		if ( previous ) {
			clearTimeout( previous );
		}
		$popover.data(
			'verifyTimer',
			setTimeout( () => verifyReportSlug( $popover, slug ), 350 )
		);
	} );

	// Re-evaluate the submit button when consent is toggled.
	jQuery( document ).on( 'change', '.aaa-report-consent-input', function () {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		$popover
			.find( '.aaa-report-submit' )
			.prop( 'disabled', ! reportCanSubmit( $popover ) );
	} );

	// Submit handler.
	jQuery( document ).on( 'click', '.aaa-report-submit', function () {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		submitReport( $popover );
	} );

	jQuery( '#aaa-option-reset-data' ).on( 'click', function ( e ) {
		e.preventDefault();
		jQuery.ajax( {
			url: `${ aaaOptionOptimizer.root }aaa-option-optimizer/v1/reset`,
			method: 'POST',
			beforeSend: ( xhr ) =>
				xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce ),
			success: (
				response // eslint-disable-line no-unused-vars
			) =>
				( window.location = `${ window.location.href }&tracking_reset=true` ),
			error: ( response ) =>
				console.error( 'Failed to reset tracking.', response ), // eslint-disable-line no-console
		} );
	} );

	/**
	 * Handles the table actions (add-autoload, remove-autoload, delete-option).
	 *
	 * @param {Event} e - The click event.
	 */
	function handleTableActions( e ) {
		e.preventDefault();
		const button = jQuery( this );
		const table = button.closest( 'table' ).DataTable();
		const optionName = button.data( 'option' );

		const requestData = { option_name: optionName };
		let action = '';
		let route = '';

		if ( button.hasClass( 'create-option-false' ) ) {
			action = route = 'create-option-false';
		} else if ( button.hasClass( 'delete-option' ) ) {
			action = route = 'delete-option';
		} else {
			action = button.hasClass( 'add-autoload' )
				? 'add-autoload'
				: 'remove-autoload';
			route = 'update-autoload';
			requestData.autoload = action === 'add-autoload' ? 'yes' : 'no';
		}

		jQuery.ajax( {
			url: `${ aaaOptionOptimizer.root }aaa-option-optimizer/v1/${ route }`,
			method: 'POST',
			beforeSend: ( xhr ) =>
				xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce ),
			data: requestData,
			success: ( response ) =>
				updateRowOnSuccess( response, table, optionName, action ),
			error: ( response ) =>
				// eslint-disable-next-line no-console
				console.error(
					`Failed to ${ action } for ${ optionName }.`,
					response
				),
		} );
	}

	/**
	 * Updates the row on successful AJAX response.
	 *
	 * @param {Object}    response   - The AJAX response.
	 * @param {DataTable} table      - The DataTable instance.
	 * @param {string}    optionName - The option name.
	 * @param {string}    action     - The action performed.
	 */
	function updateRowOnSuccess( response, table, optionName, action ) {
		// Get the row ID for the option name.
		const rowId = generateRowId( optionName );
		if ( action === 'delete-option' || action === 'create-option-false' ) {
			table
				.row( 'tr#' + rowId )
				.remove()
				.draw( 'full-hold' );
		} else if (
			action === 'add-autoload' ||
			action === 'remove-autoload'
		) {
			const autoloadStatus = action === 'add-autoload' ? 'yes' : 'no';
			const buttonHTML =
				action === 'add-autoload'
					? `<button class="button dashicon remove-autoload" data-option="${ optionName }">
						<span class="dashicons dashicons-minus"></span>
						${ aaaOptionOptimizer.i18n.removeAutoload }
					</button>`
					: `<button class="button dashicon add-autoload" data-option="${ optionName }">
						<span class="dashicons dashicons-plus"></span>
						${ aaaOptionOptimizer.i18n.addAutoload }
					</button>`;

			jQuery( `tr#${ rowId }` )
				.find( 'td.autoload' )
				.text( autoloadStatus );
			const oldButton = `button.${
				action === 'add-autoload' ? 'add' : 'remove'
			}-autoload`;
			jQuery( `tr#${ rowId } ${ oldButton }` ).replaceWith( buttonHTML );
		}
	}

	// AJAX Event Handling (add-autoload, remove-autoload, delete-option).
	jQuery( 'table tbody' ).on(
		'click',
		'.add-autoload, .remove-autoload, .delete-option, .create-option-false',
		handleTableActions
	);

	// Select all options.
	jQuery( '.select-all-checkbox' ).on( 'change', function () {
		const table = jQuery( this ).closest( 'table' );
		const selectValue = jQuery( this ).prop( 'checked' );
		const selectedOptions = table.find( 'input.select-option' );
		selectedOptions.prop( 'checked', selectValue );

		// Match the checked value in the other select-all checkbox (not this one).
		const otherSelectAll = table.find( '.select-all-checkbox' ).not( this );
		otherSelectAll.prop( 'checked', selectValue );
	} );

	// Generates bulk actions form for DataTable.
	function getBulkActionsForm( selector, options ) {
		return function () {
			const container = jQuery( this.api().table().container() );

			const form = jQuery(
				'<form class="aaaoo-bulk-form" action="#" method="post" style="display:flex;gap:10px;"></form>'
			);

			let selectOptions = '';

			if ( options.includes( 'autoload-on' ) ) {
				selectOptions = `<option value="autoload-on">${ aaaOptionOptimizer.i18n.addAutoload }</option>`;
			}

			if ( options.includes( 'autoload-off' ) ) {
				selectOptions += `<option value="autoload-off">${ aaaOptionOptimizer.i18n.removeAutoload }</option>`;
			}

			const select = jQuery(
				`<select class="aaaoo-bulk-select">
					<option value="">${ aaaOptionOptimizer.i18n.bulkActions }</option>
					${ selectOptions }
					<option value="delete">${ aaaOptionOptimizer.i18n.delete }</option>
				</select>`
			);

			const button = jQuery(
				`<button type="submit" class="button aaaoo-apply-bulk-action" data-table="${ selector }">
					${ aaaOptionOptimizer.i18n.apply }
				</button>`
			);

			form.append( select, button );

			// Add the form to the .dt-start cell
			container.find( '.dt-layout-cell.dt-layout-start' ).prepend( form );

			// Move .dt-length to .dt-layout-cell.dt-end
			// const lengthSelector = container.find(".dt-length"); // same as div.dt-length
			// const targetEndCell = container.find(".dt-layout-cell.dt-end");
			// if (lengthSelector.length && targetEndCell.length) {
			// 	targetEndCell.append(lengthSelector);
			// }
		};
	}

	// Apply bulk action.
	jQuery( '.aaa-option-optimizer-tabs' ).on(
		'click',
		'.aaaoo-apply-bulk-action',
		function ( e ) {
			e.preventDefault();
			const button = jQuery( this );
			const select = jQuery( button ).siblings( '.aaaoo-bulk-select' );
			const bulkAction = select.val();

			if ( ! bulkAction ) {
				alert( aaaOptionOptimizer.i18n.noBulkActionSelected ); // eslint-disable-line no-alert
				return;
			}

			const table = jQuery( button.data( 'table' ) );
			const selectedOptions = table.find( 'input.select-option:checked' );
			if ( selectedOptions.length === 0 ) {
				alert( aaaOptionOptimizer.i18n.noOptionsSelected ); // eslint-disable-line no-alert
				return;
			}

			// For now we only have delete in bulk action.

			const requestData = {
				option_names: Array.from( selectedOptions ).map( ( option ) =>
					option.getAttribute( 'data-option' )
				),
			};

			const endpoint =
				'delete' === bulkAction
					? 'delete-options'
					: 'set-autoload-options';

			if ( bulkAction !== 'delete' ) {
				requestData.autoload =
					bulkAction === 'autoload-on' ? 'yes' : 'no';
			}

			jQuery.ajax( {
				url:
					aaaOptionOptimizer.root +
					'aaa-option-optimizer/v1/' +
					endpoint,
				method: 'POST',
				beforeSend: ( xhr ) =>
					xhr.setRequestHeader(
						'X-WP-Nonce',
						aaaOptionOptimizer.nonce
					),
				data: requestData,
				success: () => {
					const dt = table.DataTable();

					requestData.option_names.forEach( ( optionName ) => {
						dt.row( 'tr#option_' + optionName ).remove();
					} );

					dt.draw( 'full-hold' );

					// Clear the select-all checkbox.
					table
						.find( '.select-all-checkbox' )
						.prop( 'checked', false );
				},
				error: ( response ) => {
					// eslint-disable-next-line no-console
					console.error( 'Failed to delete options.', response );
				},
			} );
		}
	);

	// Initialize data tables.
	tablesToInitialize.forEach( function ( selector ) {
		if ( jQuery( selector ).length ) {
			initializeDataTable( selector );
		}
	} );

	// Migration functionality.
	jQuery( '#aaa-start-migration' ).on( 'click', function ( e ) {
		e.preventDefault();
		const button = jQuery( this );
		const progressContainer = jQuery( '#aaa-migration-progress' );
		const progressBar = jQuery( '#aaa-migration-progress-bar' );
		const statusText = jQuery( '#aaa-migration-status' );
		const total = aaaOptionOptimizer.migration.total;

		button.prop( 'disabled', true );
		progressContainer.show();
		statusText.text( aaaOptionOptimizer.i18n.migrating );

		/**
		 * Performs a single migration chunk via AJAX.
		 */
		function migrateChunk() {
			jQuery.ajax( {
				url:
					aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/migrate',
				method: 'POST',
				beforeSend: ( xhr ) =>
					xhr.setRequestHeader(
						'X-WP-Nonce',
						aaaOptionOptimizer.nonce
					),
				success( response ) {
					if ( ! response.success ) {
						statusText.text(
							response.message ||
								aaaOptionOptimizer.i18n.migrationError
						);
						button.prop( 'disabled', false );
						return;
					}

					const migrated = total - response.remaining;
					const percent = Math.round( ( migrated / total ) * 100 );

					progressBar.css( 'width', percent + '%' );
					statusText.text(
						aaaOptionOptimizer.i18n.migratedOf
							.replace( '%1$d', migrated )
							.replace( '%2$d', total )
					);

					if ( response.remaining > 0 ) {
						// Continue with next chunk.
						migrateChunk();
					} else {
						// Migration complete.
						statusText.text(
							aaaOptionOptimizer.i18n.migrationComplete
						);
						setTimeout( function () {
							window.location.reload();
						}, 1000 );
					}
				},
				error() {
					statusText.text( aaaOptionOptimizer.i18n.migrationError );
					button.prop( 'disabled', false );
				},
			} );
		}

		migrateChunk();
	} );
} );
