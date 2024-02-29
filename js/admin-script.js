/**
 * JavaScript for the admin page.
 *
 * @package Emilia\OptionOptimizer
 */

jQuery( document ).ready(
	function ($) {
		// Handle the "Remove Autoload" button click.
		$( '.remove-autoload' ).on(
			'click',
			function (e) {
				e.preventDefault();
				var optionName = $( this ).data( 'option' );

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
							$( 'tr#option_' + optionName ).remove();
						},
						error: function (response) {
							alert( 'Failed to remove autoload for ' + optionName );
						}
					}
				);
			}
		);

		// Handle the "Delete Option" button click.
		$( '.delete-option' ).on(
			'click',
			function (e) {
				e.preventDefault();
				var optionName = $( this ).data( 'option' );

				$.ajax(
					{
						url: aaaOptionOptimizer.root + 'aaa-option-optimizer/v1/delete-option/' + optionName,
						method: 'POST',
						beforeSend: function (xhr) {
							xhr.setRequestHeader( 'X-WP-Nonce', aaaOptionOptimizer.nonce );
						},
						success: function (response) {
							let cleanOptionName = optionName.replace( /\./g, '' ).replace( /\:/g, '' );
							console.log( 'tr#option_' + cleanOptionName + ' removed.' );
							$( 'tr#option_' + cleanOptionName ).remove();
						},
						error: function (response) {
							console.log( response );
							alert( 'Failed to delete option ' + optionName );
						}
					}
				);
			}
		);
	}
);
