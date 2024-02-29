<?php
/**
 * Admin page functionality for AAA Option Optimizer.
 *
 * @package Emilia\OptionOptimizer
 */

namespace Emilia\OptionOptimizer;

/**
 * Admin page functionality for AAA Option Optimizer.
 */
class Admin_Page {
	/**
	 * Register hooks.
	 */
	public function register_hooks() {
		add_action( 'admin_menu', [ $this, 'add_admin_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
	}

	/**
	 * Adds the admin page under the Tools menu.
	 */
	public function add_admin_page() {
		add_management_page(
			__( 'AAA Option Optimizer', 'aaa-option-optimizer' ),
			__( 'AAA Option Optimizer', 'aaa-option-optimizer' ),
			'manage_options',
			'aaa-option-optimizer',
			[ $this, 'render_admin_page' ]
		);
	}

	/**
	 * Enqueue our scripts.
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			'aaa-option-optimizer-admin-js',
			plugin_dir_url( AAA_OPTION_OPTIMIZER_FILE ) . 'js/admin-script.js',
			[ 'jquery' ], // Dependencies.
			filemtime( plugin_dir_path( AAA_OPTION_OPTIMIZER_FILE ) . 'js/admin-script.js' ), // Version.
			true // In footer.
		);

		wp_localize_script(
			'aaa-option-optimizer-admin-js',
			'aaaOptionOptimizer',
			[
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			]
		);
	}

	/**
	 * Renders the admin page.
	 */
	public function render_admin_page() {
		$option_optimizer = get_option( 'option_optimizer', [ 'used_options' => [] ] );
		$all_options      = wp_load_alloptions();
		// Filter out transients.
		$autoload_options = array_filter(
			$all_options,
			function ( $value, $key ) {
				return strpos( $key, '_transient_' ) === false;
			},
			ARRAY_FILTER_USE_BOTH
		);

		$unused_options = array_diff( array_keys( $autoload_options ), $option_optimizer['used_options'] );

		// Start HTML output.
		echo '<style>
			.aaa_option_table td, .aaa_option_table th { padding: 5px 10px; text-align: left; }
			.aaa_option_table tr:hover { background-color: white; }
		</style>';
		echo '<div class="wrap"><h1>' . esc_html__( 'AAA Option Optimizer', 'aaa-option-optimizer' ) . '</h1>';

		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->get_row( "SELECT count(*) AS count, SUM(LENGTH(option_value)) as autoload_size FROM {$wpdb->options} WHERE autoload='yes'" );

		echo '<p>' .
			sprintf(
				// translators: %1$s is the date, %2$s is the number of options at stat, %3$s is the size at start in KB, %4$s is the number of options now, %5$s is the size in KB now.
				esc_html__( 'When you started on %1$s you had %2$s autoloaded options, for %3$sKB of memory. Now you have %4$s options, for %5$sKB of memory.', 'aaa-option-optimizer' ),
				esc_html( gmdate( 'Y-m-d', strtotime( $option_optimizer['starting_point_date'] ) ) ),
				esc_html( $option_optimizer['starting_point_num'] ),
				number_format( ( $option_optimizer['starting_point_kb'] ), 1 ),
				esc_html( $result->count ),
				number_format( ( $result->autoload_size / 1024 ), 1 )
			) . '</p>';

			// Render differences.
		echo '<h2>' . esc_html__( 'Unused Autoloaded Options', 'aaa-option-optimizer' ) . '</h2>';
		if ( ! empty( $unused_options ) ) {
			echo '<table class="aaa_option_table">';
			echo '<tr>';
			echo '<th>Option</th>';
			echo '<th>Size</th>';
			echo '<th>Actions</th>';
			echo '</tr>';
			foreach ( $unused_options as $option ) {
				echo '<tr id="option_' . esc_attr( str_replace( ':', '', str_replace( '.', '', $option ) ) ) . '"><td>' . esc_html( $option ) . '</td>';
				echo '<td>' . number_format( ( strlen( $autoload_options[ $option ] ) / 1024 ), 2 ) . 'KB</td>';
				echo '<td><button class="button remove-autoload" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Remove Autoload', 'aaa-option-optimizer' ) . '</button> ';
				echo ' <button class="button delete-option" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Delete Option', 'aaa-option-optimizer' ) . '</button></td></tr>';
			}
			echo '</table>';
		} else {
			echo '<p>' . esc_html__( 'All autoloaded options are in use.', 'aaa-option-optimizer' ) . '</p>';
		}

		echo '</div>'; // Close .wrap.
	}
}
