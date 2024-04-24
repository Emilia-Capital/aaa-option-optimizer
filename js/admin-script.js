/**
 * JavaScript for the admin page.
 *
 * @package Emilia\OptionOptimizer
 */

jQuery( document ).ready(
	function ($) {
		if ( $( '#unused_options_table' ).length ) {
			var table1 = new DataTable( '#unused_options_table', { pageLength: 25, columns: [ null, null, { searchable: false}, { searchable: false, orderable: false} ] } );
		}
		if ( $( '#used_not_autloaded_table' ).length ) {
			var table2 = new DataTable( '#used_not_autloaded_table', { pageLength: 25, columns: [ null, null, { searchable: false }, { searchable: false }, { searchable: false, orderable: false } ] } );
		}
		if ( $( '#requested_do_not_exist_table' ).length ) {
			var table3 = new DataTable( '#requested_do_not_exist_table', { pageLength: 25, columns: [ null, null, { searchable: false }, { searchable: false, orderable: false } ] } );
		}

		$( '#aaa_get_all_options' ).on(
			'click',
			function (e) {
				e.preventDefault();
				$( '#all_options_table' ).show();
				var table4 = new DataTable(
					'#all_options_table',
					{
						pageLength: 25,
						ajax: {
							url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/all-options/',
							type: 'GET',
							dataSrc: 'data',
						},
						rowId: 'row_id',
						columns: [
							{ data: 'name' },
							{ data: 'plugin' },
							{
								data: 'size',
								render: function (data, type, row, meta) {
									return '<span class="num">' + data + '</span>';
								}
						},
							{
								data: 'autoload',
								className: 'autoload',
						},
							{
								data: 'value',
								render: function (data, type, row, meta) {
									let output = '<button class="button dashicon" popovertarget="' + row.name + '"><span class="dashicons dashicons-search"></span> Show value</button>'
									+ '<div id="' + row.name + '" popover class="aaa-option-optimizer-popover">'
									+ '<button class="aaa-option-optimizer-popover__close" popovertarget="' + row.name + '" popovertargetaction="hide">X</button>'
									+ '<p><strong>Value of <code>' + row.name + '</code></strong></p>'
									+ '<pre>' + data + '</pre></div>';

									if ( row.autoload === 'no' ) {
										output += '<button class="button dashicon add-autoload" data-option="' + row.name + '"><span class="dashicons dashicons-plus"></span> Add Autoload</button>';
									} else {
										output += '<button class="button dashicon remove-autoload" data-option="' + row.name + '"><span class="dashicons dashicons-minus"></span> Remove Autoload</button>';
									}

									output += '<button class="button button-delete delete-option" data-option="' + row.name + '"><span class="dashicons dashicons-trash"></span> Delete option</button>';
									return output;
								},
								orderable: false,
								className: 'actions',
						},
						]
					}
				);
				$( this ).hide();
			}
		);

		// Handle the "Remove Autoload" button click.
		$( 'table tbody' ).on(
			'click',
			'.add-autoload',
			function (e) {
				e.preventDefault();

				var optionName = $( this ).data( 'option' );
				var tableId	   = $( this ).closest( 'table' ).attr( 'id' );
				var table      = $( this ).closest( 'table' ).DataTable();

				var requestData = {
					'autoload': 'yes'
				};

				$.ajax(
					{
						url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/update-autoload/' + optionName,
						method: 'POST',
						beforeSend: function (xhr) {
							xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce );
						},
						data: requestData,
						success: function (response) {
							if (tableId !== 'all_options_table') {
								table
									.row( 'tr#option_' + optionName )
									.remove()
									.draw( 'page' );
							} else {
								$( 'tr#option_' + optionName ).find( 'td.autoload' ).text( 'yes' );
								$( 'tr#option_' + optionName ).find( 'button.add-autoload' ).replaceWith( '<button class="button dashicon remove-autoload" data-option="' + optionName + '"><span class="dashicons dashicons-minus"></span> Remove Autoload</button>' );
							}
						},
						error: function (response) {
							console.log( response );
							alert( 'Failed to add autoload for ' + optionName );
						}
					}
				);
			}
		);

		// Handle the "Remove autoload" button click.
		$( 'table tbody' ).on(
			'click',
			'.remove-autoload',
			function (e) {
				e.preventDefault();

				var optionName = $( this ).data( 'option' );
				var tableId	   = $( this ).closest( 'table' ).attr( 'id' );
				var table      = $( this ).closest( 'table' ).DataTable();

				var requestData = {
					'autoload': 'no'
				};

				$.ajax(
					{
						url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/update-autoload/' + optionName,
						method: 'POST',
						beforeSend: function (xhr) {
							xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce );
						},
						data: requestData,
						success: function (response) {
							if (tableId !== 'all_options_table') {
								table
									.row( 'tr#option_' + optionName )
									.remove()
									.draw( 'page' );
							} else {
								$( 'tr#option_' + optionName ).find( 'td.autoload' ).text( 'no' );
								$( 'tr#option_' + optionName ).find( 'button.remove-autoload' ).replaceWith( '<button class="button dashicon add-autoload" data-option="' + optionName + '"><span class="dashicons dashicons-plus"></span> Add Autoload</button>' );
							}
						},
						error: function (response) {
							console.log( response );
							alert( 'Failed to remove autoload for ' + optionName );
						}
					}
				);
			}
		);

		// Handle the "Delete Option" button click.
		$( 'table tbody' ).on(
			'click',
			'.delete-option',
			function (e) {
				e.preventDefault();

				var optionName = $( this ).data( 'option' );
				var table      = $( this ).closest( 'table' ).DataTable();

				$.ajax(
					{
						url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/delete-option/' + optionName,
						method: 'POST',
						beforeSend: function (xhr) {
							xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce );
						},
						success: function (response) {
							let cleanOptionName = optionName.replace( /\./g, '' ).replace( /\:/g, '' );
							table
								.row( 'tr#option_' + optionName )
								.remove()
								.draw( 'page' );
						},
						error: function (response) {
							console.log( response );
							alert( 'Failed to delete option ' + optionName );
						}
					}
				);
			}
		);

		// Handle the "Create Option with value 'false'" button click.
		$( 'table tbody' ).on(
			'click',
			'.create-option-false',
			function (e) {
				e.preventDefault();

				var optionName = $( this ).data( 'option' );
				var table      = $( this ).closest( 'table' ).DataTable();

				$.ajax(
					{
						url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/create-option-false/' + optionName,
						method: 'POST',
						beforeSend: function (xhr) {
							xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce );
						},
						success: function (response) {
							let cleanOptionName = optionName.replace( /\./g, '' ).replace( /\:/g, '' );
							table
								.row( 'tr#option_' + optionName )
								.remove()
								.draw( 'page' );
						},
						error: function (response) {
							console.log( response );
							alert( 'Failed to create option ' + optionName );
						}
					}
				);
			}
		);
	}
);
