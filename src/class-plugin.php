<?php
/**
 * Plugin functionality for AAA Option Optimizer.
 *
 * @package Emilia\OptionOptimizer
 */

namespace Emilia\OptionOptimizer;

/**
 * Core functionality of AAA Option Optimizer.
 */
class Plugin {
	/**
	 * Holds the names of the options accessed during the request.
	 *
	 * @var array
	 */
	protected $accessed_options = [];

	/**
	 * Registers hooks.
	 */
	public function register_hooks() {
		// Hook into all actions and filters to monitor option accesses.
		add_filter( 'all', [ $this, 'monitor_option_accesses' ] );

		// Use the shutdown action to update the option with tracked data.
		add_action( 'shutdown', [ $this, 'update_tracked_options' ] );

		require_once plugin_dir_path( AAA_OPTION_OPTIMIZER_FILE ) . 'src/class-rest.php';
		// Register the REST routes.
		$rest = new REST();
		$rest->register_hooks();

		if ( is_admin() ) {
			require_once plugin_dir_path( AAA_OPTION_OPTIMIZER_FILE ) . 'src/class-admin-page.php';

			// Register the admin page.
			$admin_page = new Admin_Page();
			$admin_page->register_hooks();
		}
	}

	/**
	 * Monitor all actions and filters for option accesses.
	 *
	 * @param string $tag The current action or filter tag being executed.
	 */
	public function monitor_option_accesses( $tag ) {
		// Check if the tag is related to an option access.
		if ( strpos( $tag, 'option_' ) === 0 ) {
			$option_name = substr( $tag, strlen( 'option_' ) );
			$this->add_option_usage( $option_name );
		}
	}

	/**
	 * Add an option to the list of used options if it's not already there.
	 *
	 * @param string $option_name Name of the option being accessed.
	 */
	protected function add_option_usage( $option_name ) {
		// Check if this option hasn't been tracked yet and add it to the array.
		if ( ! in_array( $option_name, $this->accessed_options, true ) ) {
			$this->accessed_options[] = $option_name;
		}
	}

	/**
	 * Update the 'option_optimizer' option with the list of used options at the end of the page load.
	 */
	public function update_tracked_options() {
		// Retrieve the existing option_optimizer data.
		$option_optimizer = get_option( 'option_optimizer', [ 'used_options' => [] ] );

		// Merge the newly accessed options with the existing ones, avoiding duplicates.
		$updated_used_options             = array_unique( array_merge( $option_optimizer['used_options'], $this->accessed_options ) );
		$option_optimizer['used_options'] = $updated_used_options;

		// Update the 'option_optimizer' option with the new list.
		update_option( 'option_optimizer', $option_optimizer, true );
	}

}
