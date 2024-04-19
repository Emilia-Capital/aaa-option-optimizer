/**
 * JavaScript for the admin page.
 *
 * @package Emilia\OptionOptimizer
 */

jQuery( document ).ready(
	function ($) {
		if ( $( '#unused_options_table' ).length ) {
			var table1 = new DataTable( '#unused_options_table', { columns: [ {}, {},{ searchable: false}, { searchable: false}, { searchable: false } ] } );
		}
		if ( $( '#used_not_autloaded_table' ).length ) {
			var table2 = new DataTable( '#used_not_autloaded_table', { columns: [ null, null, { searchable: false }, { searchable: false }, { searchable: false }, { searchable: false } ] } );
		}
		if ( $( '#requested_do_not_exist_table' ).length ) {
			var table3 = new DataTable( '#requested_do_not_exist_table', { columns: [ null, null, { searchable: false }, { searchable: false } ] } );
		}

		// Handle the "Remove Autoload" button click.
		$( 'table tbody' ).on(
			'click',
			'.add-autoload',
			function (e) {
				e.preventDefault();

				var optionName = $( this ).data( 'option' );
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
							table
								.row( 'tr#option_' + optionName )
								.remove()
								.draw( 'page' );
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
							table
								.row( 'tr#option_' + optionName )
								.remove()
								.draw( 'page' );
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
