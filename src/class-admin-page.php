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
			__( 'Option Optimizer', 'aaa-option-optimizer' ),
			'manage_options',
			'aaa-option-optimizer',
			[ $this, 'render_admin_page' ]
		);
	}

	/**
	 * Enqueue our scripts.
	 *
	 * @param string $hook The current page hook.
	 *
	 * @return void
	 */
	public function enqueue_scripts( $hook ) {
		if ( $hook !== 'tools_page_aaa-option-optimizer' ) {
			return;
		}

		wp_enqueue_style(
			'aaa-option-optimizer',
			plugin_dir_url( AAA_OPTION_OPTIMIZER_FILE ) . 'css/style.css',
			[],
			'2.0.1'
		);

		wp_enqueue_script(
			'datatables',
			plugin_dir_url( AAA_OPTION_OPTIMIZER_FILE ) . 'js/vendor/dataTables.min.js',
			[], // Dependencies.
			'2.0.1',
			true // In footer.
		);

		wp_enqueue_style(
			'datatables',
			plugin_dir_url( AAA_OPTION_OPTIMIZER_FILE ) . 'js/vendor/dataTables.dataTables.min.css',
			[],
			'2.0.1'
		);

		wp_enqueue_script(
			'aaa-option-optimizer-admin-js',
			plugin_dir_url( AAA_OPTION_OPTIMIZER_FILE ) . 'js/admin-script.js',
			[ 'jquery', 'datatables' ], // Dependencies.
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
	 * Get the length of a value.
	 *
	 * @param mixed $value The input value.
	 *
	 * @return string
	 */
	private function get_length( $value ) {
		if ( is_array( $value ) || is_object( $value ) ) {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- intended here.
			$length = strlen( serialize( $value ) );
		} elseif ( is_string( $value ) || is_numeric( $value ) ) {
			$length = strlen( strval( $value ) );
		}
		if ( ! isset( $length ) ) {
			return '-';
		}
		return number_format( ( $length / 1024 ), 2 );
	}

	/**
	 * Print a value.
	 *
	 * @param mixed $value The input value.
	 *
	 * @return string
	 */
	private function print_value( $value ) {
		if ( is_array( $value ) || is_object( $value ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r -- intended here.
			return print_r( $value, 1 );
		}
		return esc_html( $value );
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

		$unused_options         = [];
		$non_autoloaded_options = [];

		// Get the autoloaded options that aren't used.
		foreach ( $autoload_options as $option => $value ) {
			if ( isset( $option_optimizer['used_options'][ $option ] ) ) {
				continue;
			}
			$unused_options[ $option ] = $value;
		}

		// Determine the options that _are_ used, but not auto-loaded.
		foreach ( $option_optimizer['used_options'] as $option => $count ) {
			if ( isset( $autoload_options[ $option ] ) ) {
				continue;
			}
			$non_autoloaded_options[ $option ] = $count;
		}

		// Some of the options that are used but not auto-loaded, may not exist.
		if ( ! empty( $non_autoloaded_options ) ) {
			$options_that_do_not_exist   = [];
			$non_autoloaded_options_full = [];
			foreach ( $non_autoloaded_options as $option => $count ) {
				$value = get_option( $option, 'aaa-no-return-value' );
				if ( $value === 'aaa-no-return-value' ) {
					$options_that_do_not_exist[ $option ] = $count;
					continue;
				}
				$non_autoloaded_options_full[ $option ] = [
					'count' => $count,
					'value' => $value,
				];
			}
		}

		// Start HTML output.
		echo '<div class="wrap"><h1>' . esc_html__( 'AAA Option Optimizer', 'aaa-option-optimizer' ) . '</h1>';

		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->get_row( "SELECT count(*) AS count, SUM(LENGTH(option_value)) as autoload_size FROM {$wpdb->options} WHERE autoload='yes'" );

		echo '<h2>' . esc_html__( 'Stats', 'aaa-option-optimizer' ) . '</h2>';
		echo '<p>' .
			sprintf(
				// translators: %1$s is the date, %2$s is the number of options at stat, %3$s is the size at start in KB, %4$s is the number of options now, %5$s is the size in KB now.
				esc_html__( 'When you started on %1$s you had %2$s autoloaded options, for %3$sKB of memory. Now you have %4$s options, for %5$sKB of memory.', 'aaa-option-optimizer' ),
				esc_html( gmdate( 'Y-m-d', strtotime( $option_optimizer['starting_point_date'] ) ) ),
				isset( $option_optimizer['starting_point_num'] ) ? esc_html( $option_optimizer['starting_point_num'] ) : '-',
				number_format( ( $option_optimizer['starting_point_kb'] ), 1 ),
				esc_html( $result->count ),
				number_format( ( $result->autoload_size / 1024 ), 1 )
			) . '</p>';

		echo '<p>' . esc_html__( 'We\'ve found the following things you can maybe optimize:', 'aaa-option-optimizer' ) . '</p>';
		echo '<ul>';
		echo '<li><a href="#unused-autoloaded">' . esc_html__( 'Unused Autoloaded Options', 'aaa-option-optimizer' ) . '</a></li>';
		if ( ! empty( $non_autoloaded_options ) ) {
			echo '<li><a href="#used-not-autoloaded">' . esc_html__( 'Used But Not Autoloaded Options', 'aaa-option-optimizer' ) . '</a></li>';
		}
		if ( ! empty( $options_that_do_not_exist ) ) {
			echo '<li><a href="#requested-do-not-exist">' . esc_html__( 'Requested Options That Do Not Exist', 'aaa-option-optimizer' ) . '</a></li>';
		}
		echo '</ul>';
		// Render differences.
		echo '<h2 id="unused-autoloaded">' . esc_html__( 'Unused Autoloaded Options', 'aaa-option-optimizer' ) . '</h2>';
		if ( ! empty( $unused_options ) ) {
			echo '<p>' . esc_html__( 'The following options are autoloaded on each pageload, but AAA Option Optimizer has not been able to detect them being used.', 'aaa-option-optimizer' );
			echo '<table id="unused_options_table" class="aaa_option_table display compact">';
			echo '<thead>';
			echo '<tr>';
			echo '<th>' . esc_html__( 'Option', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Size', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Value', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Actions', 'aaa-option-optimizer' ) . '</th>';
			echo '</tr>';
			echo '</thead>';
			echo '<tbody>';
			foreach ( $unused_options as $option => $value ) {
				echo '<tr id="option_' . esc_attr( str_replace( ':', '', str_replace( '.', '', $option ) ) ) . '"><td>' . esc_html( $option ) . '</td>';
				echo '<td>' . esc_html( $this->get_length( $value ) ) . 'KB</td>';
				echo '<td class="value">';
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- output escaped in get_popover_html.
				echo $this->get_popover_html( $option, $value );
				echo '</td>';
				echo '<td><button class="button remove-autoload" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Remove Autoload', 'aaa-option-optimizer' ) . '</button> ';
				echo ' <button class="button delete-option" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Delete Option', 'aaa-option-optimizer' ) . '</button></td></tr>';
			}
			echo '</tbody>';
			echo '</table>';
		} else {
			echo '<p>' . esc_html__( 'All autoloaded options are in use.', 'aaa-option-optimizer' ) . '</p>';
		}

		// Render differences.
		if ( ! empty( $non_autoloaded_options ) ) {
			echo '<h2 id="used-not-autoloaded">' . esc_html__( 'Used But Not Autoloaded Options', 'aaa-option-optimizer' ) . '</h2>';
			echo '<p>' . esc_html__( 'The following options are *not* autoloaded on each pageload, but AAA Option Optimizer has detected that they are being used. If one of the options below has been called a lot and is not very big, you might consider adding autoload to that option.', 'aaa-option-optimizer' );
			echo '<table id="used_not_autloaded_table" class="aaa_option_table">';
			echo '<thead>';
			echo '<tr>';
			echo '<th>' . esc_html__( 'Option', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Size', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Value', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( '# Calls', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Actions', 'aaa-option-optimizer' ) . '</th>';
			echo '</tr>';
			echo '</thead>';
			echo '<tbody>';
			foreach ( $non_autoloaded_options_full as $option => $arr ) {
				echo '<tr id="option_' . esc_attr( str_replace( ':', '', str_replace( '.', '', $option ) ) ) . '">';
				echo '<td>' . esc_html( $option ) . '</td>';
				echo '<td>' . esc_html( $this->get_length( $arr['value'] ) ) . 'KB</td>';
				echo '<td class="value">';
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- output escaped in get_popover_html.
				echo $this->get_popover_html( $option, $arr['value'] );
				echo '</td>';
				echo '<td>' . esc_html( $arr['count'] ) . '</td>';
				echo '<td><button class="button add-autoload" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Add Autoload', 'aaa-option-optimizer' ) . '</button> ';
			}
			echo '</tbody>';
			echo '</table>';
		} else {
			echo '<p>' . esc_html__( 'All options that are used are autoloaded.', 'aaa-option-optimizer' ) . '</p>';
		}

		if ( ! empty( $options_that_do_not_exist ) ) {
			echo '<h2 id="requested-do-not-exist">' . esc_html__( 'Requested Options That Do Not Exist', 'aaa-option-optimizer' ) . '</h2>';
			echo '<p>' . esc_html__( 'The following options are requested sometimes, but AAA Option Optimizer has detected that they do not exist. If one of the options below has been called a lot, it might help to create it with a value of false.', 'aaa-option-optimizer' );
			echo '<table id="requested_do_not_exist_table" class="aaa_option_table">';
			echo '<thead>';
			echo '<tr>';
			echo '<th>' . esc_html__( 'Option', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( '# Calls', 'aaa-option-optimizer' ) . '</th>';
			echo '<th>' . esc_html__( 'Actions', 'aaa-option-optimizer' ) . '</th>';
			echo '</tr>';
			echo '</thead>';
			echo '<tbody>';
			foreach ( $options_that_do_not_exist as $option => $count ) {
				echo '<tr id="option_' . esc_attr( str_replace( ':', '', str_replace( '.', '', $option ) ) ) . '">';
				echo '<td>' . esc_html( $option ) . '</td>';
				echo '<td>' . esc_html( $count ) . '</td>';
				echo '<td><button class="button add-autoload" data-option="' . esc_attr( $option ) . '">' . esc_html__( 'Create Option with value false', 'aaa-option-optimizer' ) . '</button> ';
			}
			echo '</tbody>';
			echo '</table>';
		}

		echo '</div>'; // Close .wrap.
	}

	/**
	 * Get html to show a popover.
	 *
	 * @param string $name  The name of the option, used in the id of the popover.
	 * @param mixed  $value The value to show.
	 *
	 * @return string
	 */
	private function get_popover_html( string $name, $value ): string {
		$string = is_string( $value ) ? $value : wp_json_encode( $value );
		$id     = 'aaa-option-optimizer-' . esc_attr( $name );
		return '
		<button class="button" popovertarget="' . $id . '">' . esc_html__( 'Show value', 'aaa-option-optimizer' ) . '</button>
		<div id="' . $id . '" popover class="aaa-option-optimizer-popover">
		<button class="aaa-option-optimizer-popover__close" popovertarget="' . $id . '" popovertargetaction="hide">X</button>' .
		// translators: %s is the name of the option.
		'<p><strong>' . sprintf( esc_html__( 'Value of %s', 'aaa-option-optimizer' ), '<code>' . esc_html( $name ) . '</code>' ) . '</strong></p>
		<pre>' . esc_html( $string ) . '</pre>
		</div>';
	}
}
