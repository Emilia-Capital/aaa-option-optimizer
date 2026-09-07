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
	 * Decode the HTML entities wordpress.org returns in plugin names.
	 *
	 * The API hands back already-encoded text ("Rankings &amp; Traffic"), so
	 * escaping it for display would encode the ampersand a second time and
	 * render a literal "&amp;". Decode first, then escape as usual.
	 *
	 * Uses the textarea trick rather than a regex so every named and numeric
	 * entity is handled; assigning to `innerHTML` on a detached textarea
	 * parses entities without executing anything or running markup.
	 *
	 * @param {string} value - Text that may contain HTML entities.
	 * @return {string} - The decoded text.
	 */
	function decodeEntities( value ) {
		const textarea = document.createElement( 'textarea' );
		textarea.innerHTML = String( value || '' );
		return textarea.value;
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
			<div class="aaa-report-combo">
				<label for="${ popoverId }_input">
					${ i18n.reportSlugOrUrlLabel }
				</label>
				<input type="text" id="${ popoverId }_input" class="aaa-report-input regular-text"
					placeholder="${ escapeHtml( i18n.reportSlugPlaceholder ) }"
					autocomplete="off" role="combobox" aria-expanded="false"
					aria-controls="${ popoverId }_list" aria-autocomplete="list" />
				<ul id="${ popoverId }_list" class="aaa-report-list" role="listbox"
					aria-label="${ escapeHtml( i18n.reportListLabel ) }" hidden></ul>
			</div>
			<p class="description">${ escapeHtml( i18n.reportSlugOrUrlHelp ) }</p>
			<div class="aaa-report-prefix-field" hidden>
				<p>
					<label>
						${ escapeHtml( i18n.reportPrefixLabel ) }
						<input type="text" class="aaa-report-prefix regular-text" value="" autocomplete="off" />
					</label>
				</p>
				<p class="description">${ escapeHtml( i18n.reportPrefixHelp ) }</p>
			</div>
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
	 * Find installed plugins matching what the user has typed.
	 *
	 * Matches on plugin name as well as slug, since people recognize
	 * "All in One SEO" rather than `all-in-one-seo-pack`. Matches that begin
	 * with the query sort ahead of ones that merely contain it, so typing
	 * "seo" offers the plugins named SEO-something first.
	 *
	 * @param {string} query - The current input value.
	 * @return {Array<{slug: string, name: string}>} - Matching plugins.
	 */
	function matchInstalledPlugins( query ) {
		const plugins = aaaOptionOptimizer.installedPlugins;
		if ( ! plugins ) {
			return [];
		}
		const needle = String( query || '' )
			.trim()
			.toLowerCase();
		const all = Object.keys( plugins ).map( ( slug ) => ( {
			slug,
			name: plugins[ slug ],
		} ) );

		if ( ! needle ) {
			return all;
		}

		const scored = [];
		for ( const item of all ) {
			const slug = item.slug.toLowerCase();
			const name = item.name.toLowerCase();
			if ( slug.startsWith( needle ) || name.startsWith( needle ) ) {
				scored.push( { item, rank: 0 } );
			} else if ( slug.includes( needle ) || name.includes( needle ) ) {
				scored.push( { item, rank: 1 } );
			}
		}
		scored.sort( ( a, b ) => a.rank - b.rank );
		return scored.map( ( entry ) => entry.item );
	}

	/**
	 * Render the suggestion list for a popover and show or hide it.
	 *
	 * The list is an aid, never a gate: it closes when nothing matches so the
	 * user is left typing into a plain text field, which is what reporting a
	 * plugin that is no longer installed needs.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @param {string} query    - The current input value.
	 */
	function renderReportList( $popover, query ) {
		const matches = matchInstalledPlugins( query );

		if ( ! matches.length ) {
			closeReportList( $popover );
			return;
		}

		const $list = $popover.find( '.aaa-report-list' );
		const $input = $popover.find( '.aaa-report-input' );
		const listId = $list.attr( 'id' );

		$list.html(
			matches
				.map(
					( item, index ) =>
						`<li id="${ listId }_opt${ index }" class="aaa-report-option" role="option" aria-selected="false" data-slug="${ escapeHtml(
							item.slug
						) }"><span class="aaa-report-option__name">${ escapeHtml(
							item.name
						) }</span><span class="aaa-report-option__slug">${ escapeHtml(
							item.slug
						) }</span></li>`
				)
				.join( '' )
		);
		$list.prop( 'hidden', false );
		$input.attr( 'aria-expanded', 'true' );
		$popover.data( 'activeOption', -1 );
		$input.removeAttr( 'aria-activedescendant' );
	}

	/**
	 * Hide the suggestion list and reset its selection state.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 */
	function closeReportList( $popover ) {
		const $input = $popover.find( '.aaa-report-input' );
		$popover.find( '.aaa-report-list' ).prop( 'hidden', true ).empty();
		$input.attr( 'aria-expanded', 'false' );
		$input.removeAttr( 'aria-activedescendant' );
		$popover.data( 'activeOption', -1 );
	}

	/**
	 * Move the highlight within the open suggestion list.
	 *
	 * Highlighting only marks an option; it does not put it in the field, so
	 * arrowing through the list never overwrites what the user typed until
	 * they commit with Enter or a click.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @param {number} step     - How far to move (1 down, -1 up).
	 */
	function moveReportListActive( $popover, step ) {
		const $options = $popover.find( '.aaa-report-option' );
		if ( ! $options.length ) {
			return;
		}
		const current = $popover.data( 'activeOption' );
		const index = typeof current === 'number' ? current : -1;
		let next = index + step;
		if ( next < 0 ) {
			next = $options.length - 1;
		} else if ( next >= $options.length ) {
			next = 0;
		}

		$options.attr( 'aria-selected', 'false' ).removeClass( 'is-active' );
		const $active = $options.eq( next );
		$active.attr( 'aria-selected', 'true' ).addClass( 'is-active' );
		$popover.data( 'activeOption', next );
		$popover
			.find( '.aaa-report-input' )
			.attr( 'aria-activedescendant', $active.attr( 'id' ) );

		const option = $active.get( 0 );
		if ( option && option.scrollIntoView ) {
			option.scrollIntoView( { block: 'nearest' } );
		}
	}

	/**
	 * Put a slug into the field and verify it straight away.
	 *
	 * Used when the user commits a suggestion, which is a complete value and
	 * so does not need the typing debounce.
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @param {string} slug     - The slug to apply.
	 */
	function chooseReportSlug( $popover, slug ) {
		const $input = $popover.find( '.aaa-report-input' );
		$input.val( slug );
		closeReportList( $popover );
		const pending = $popover.data( 'verifyTimer' );
		if ( pending ) {
			clearTimeout( pending );
		}
		verifyReportSlug( $popover, normalizeSlug( slug ) );
	}

	/**
	 * Prefixes that describe WordPress core's own bookkeeping rather than the
	 * plugin an option belongs to. Core keys several transients *by* plugin
	 * slug (`_site_transient_wp_plugin_dependencies_plugin_timeout_<slug>`),
	 * so the leading token is core's, not the plugin's -- suggesting it would
	 * claim a large share of core options for whichever plugin was reported.
	 *
	 * @type {string[]}
	 */
	const CORE_PREFIXES = [
		'wp_',
		'update_',
		'updates_',
		'theme_',
		'widget_',
		'can_compress_',
		'dismissed_',
		'auto_update_',
		'browser_',
		'php_check_',
		'plugin_',
		'settings_',
	];

	/**
	 * Suggest the option prefix a plugin uses.
	 *
	 * Derived from the option name, but only accepted when it looks like it
	 * actually belongs to the plugin the user picked: either it starts with a
	 * recognizable piece of the slug, or the option simply starts with the
	 * slug's own token. Anything that resolves to one of core's own prefixes
	 * is discarded rather than suggested.
	 *
	 * Returning an empty string is a normal outcome and means "no confident
	 * suggestion" -- the field is left blank for the user to fill in or leave
	 * alone, and an empty prefix reports just the one option.
	 *
	 * @param {string} optionName - The option being reported.
	 * @param {string} slug       - The verified wp.org slug.
	 * @return {string} - The suggested prefix, or an empty string.
	 */
	function suggestOptionPrefix( optionName, slug ) {
		const stripped = String( optionName || '' )
			.trim()
			.replace( /^_(?:site_)?transient_(?:timeout_)?/, '' );
		const match = stripped.match( /^_?[a-z0-9]+[_-]/i );
		if ( ! match ) {
			return '';
		}

		const candidate = match[ 0 ];
		if ( CORE_PREFIXES.includes( candidate.toLowerCase() ) ) {
			return '';
		}

		// Only suggest a prefix that plausibly belongs to the picked plugin:
		// the slug's tokens and the candidate should share a leading stem.
		const token = candidate.toLowerCase().replace( /[^a-z0-9]/g, '' );
		const slugTokens = String( slug || '' )
			.toLowerCase()
			.split( '-' )
			.filter( Boolean );
		const related = slugTokens.some(
			( part ) => part.startsWith( token ) || token.startsWith( part )
		);

		return related ? candidate : '';
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
	 * The prefix the user is submitting alongside the option name.
	 *
	 * Prefilled with a suggestion but freely editable, so whatever comes back
	 * here is the user's answer -- including an empty string, which means
	 * "report just this one option".
	 *
	 * @param {jQuery} $popover - The popover jQuery element.
	 * @return {string} - The prefix, or an empty string.
	 */
	function reportPrefixValue( $popover ) {
		return String(
			$popover.find( '.aaa-report-prefix' ).val() || ''
		).trim();
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
		// The prefix belongs to a confirmed plugin; hide it until there is one.
		const pendingReveal = $popover.data( 'revealTimer' );
		if ( pendingReveal ) {
			clearTimeout( pendingReveal );
		}
		$popover.find( '.aaa-report-prefix-field' ).prop( 'hidden', true );

		if ( ! slug ) {
			$status.text( '' );
			return;
		}

		$status.text( i18n.reportVerifying );

		const $input = $popover.find( '.aaa-report-input' );

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
				// The field may have moved on while this was in flight --
				// typing "progress-planner" passes through "progress", which
				// is itself a real slug. Only the current value may write.
				if ( normalizeSlug( $input.val() ) !== slug ) {
					return;
				}
				if ( ! data || data.error || ! data.name ) {
					$status.text( i18n.reportNotFound );
					return;
				}
				const pluginName = decodeEntities( data.name );
				reportState[ optionName ] = {
					slug,
					verifiedName: pluginName,
				};
				$status.html(
					`✓ ${ i18n.reportVerified } <strong>${ escapeHtml(
						pluginName
					) }</strong>`
				);
				// Now that a plugin is confirmed, offer the prefix field --
				// prefilled only when the suggestion relates to that plugin.
				// Deferred so it doesn't flash in and out mid-word when a
				// half-typed slug happens to be a real plugin.
				const previousReveal = $popover.data( 'revealTimer' );
				if ( previousReveal ) {
					clearTimeout( previousReveal );
				}
				$popover.data(
					'revealTimer',
					setTimeout( function () {
						if ( normalizeSlug( $input.val() ) !== slug ) {
							return;
						}
						$popover
							.find( '.aaa-report-prefix' )
							.val( suggestOptionPrefix( optionName, slug ) );
						$popover
							.find( '.aaa-report-prefix-field' )
							.prop( 'hidden', false );
					}, REPORT_PREFIX_REVEAL_DELAY )
				);
				$submit.prop( 'disabled', ! reportCanSubmit( $popover ) );
			} )
			.fail( function () {
				if ( normalizeSlug( $input.val() ) !== slug ) {
					return;
				}
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
					option_prefix: reportPrefixValue( $popover ),
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
	//
	// Typing a slug by hand passes through many prefixes that are themselves
	// valid-looking slugs, and querying each one reports "Plugin not found"
	// for a name the user is still in the middle of writing. Wait long enough
	// for a pause in typing. Picking from the datalist or pasting a URL
	// delivers a complete value in one event, so those verify promptly.
	const REPORT_TYPING_DELAY = 900;
	const REPORT_COMPLETE_DELAY = 150;
	// The prefix field is a second question, asked only once the first is
	// settled. Revealing it the moment a slug happens to verify makes it
	// appear and disappear while the user is still typing, so wait a beat
	// longer than the verification itself.
	const REPORT_PREFIX_REVEAL_DELAY = 400;

	jQuery( document ).on( 'input', '.aaa-report-input', function ( event ) {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		const raw = jQuery( this ).val();
		const slug = normalizeSlug( raw );
		const previous = $popover.data( 'verifyTimer' );
		if ( previous ) {
			clearTimeout( previous );
		}

		// A datalist pick or a paste arrives whole rather than character by
		// character; `inputType` is absent or non-insertText for those.
		const inputType = event.originalEvent && event.originalEvent.inputType;
		const typedOneChar = inputType === 'insertText';
		const delay = typedOneChar
			? REPORT_TYPING_DELAY
			: REPORT_COMPLETE_DELAY;

		// Clear a stale "not found" while the user is still typing, so the
		// popover doesn't argue with a half-written slug.
		if ( typedOneChar ) {
			$popover.find( '.aaa-report-status' ).text( '' );
		}

		$popover.data(
			'verifyTimer',
			setTimeout( () => verifyReportSlug( $popover, slug ), delay )
		);

		// Keep the suggestion list in step with what is being typed.
		renderReportList( $popover, raw );
	} );

	// Open the list on focus so the installed plugins are discoverable
	// without having to guess that typing reveals them.
	jQuery( document ).on( 'focus', '.aaa-report-input', function () {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		renderReportList( $popover, jQuery( this ).val() );
	} );

	// Commit a suggestion on click.
	jQuery( document ).on( 'mousedown', '.aaa-report-option', function ( e ) {
		// mousedown rather than click, and prevented, so the input keeps
		// focus and the blur handler doesn't close the list first.
		e.preventDefault();
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		chooseReportSlug( $popover, jQuery( this ).data( 'slug' ) );
	} );

	// Close the list when focus leaves the field.
	jQuery( document ).on( 'blur', '.aaa-report-input', function () {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		setTimeout( () => closeReportList( $popover ), 120 );
	} );

	// Keyboard handling for the combobox.
	jQuery( document ).on( 'keydown', '.aaa-report-input', function ( e ) {
		const $popover = jQuery( this ).closest( '.aaa-report-popover' );
		const $list = $popover.find( '.aaa-report-list' );
		const isOpen = ! $list.prop( 'hidden' );

		if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
			e.preventDefault();
			if ( ! isOpen ) {
				renderReportList( $popover, jQuery( this ).val() );
				return;
			}
			moveReportListActive( $popover, e.key === 'ArrowDown' ? 1 : -1 );
			return;
		}

		if ( e.key === 'Escape' ) {
			// Close the list but leave the popover and the typed value alone.
			if ( isOpen ) {
				e.preventDefault();
				e.stopPropagation();
				closeReportList( $popover );
			}
			return;
		}

		if ( e.key === 'Enter' ) {
			const active = $popover.data( 'activeOption' );
			// Only take over Enter when an option is actually highlighted;
			// otherwise the user is committing what they typed themselves.
			if ( isOpen && typeof active === 'number' && active >= 0 ) {
				e.preventDefault();
				const slug = $popover
					.find( '.aaa-report-option' )
					.eq( active )
					.data( 'slug' );
				chooseReportSlug( $popover, slug );
				return;
			}
			// A typed slug: close the list and verify it now rather than
			// waiting out the typing debounce.
			e.preventDefault();
			closeReportList( $popover );
			const pending = $popover.data( 'verifyTimer' );
			if ( pending ) {
				clearTimeout( pending );
			}
			verifyReportSlug( $popover, normalizeSlug( jQuery( this ).val() ) );
		}
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
