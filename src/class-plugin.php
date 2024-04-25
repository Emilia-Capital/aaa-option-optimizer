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
	 * @var string[]
	 */
	protected $accessed_options = [];

	/**
	 * Registers hooks.
	 *
	 * @return void
	 */
	public function register_hooks() {
		$this->accessed_options = get_option( 'option_optimizer', [ 'used_options' => [] ] )['used_options'];

		// Hook into all actions and filters to monitor option accesses.
		// @phpstan-ignore-next-line -- The 'all' hook does not need a return.
		add_filter( 'all', [ $this, 'monitor_option_accesses' ] );

		// Use the shutdown action to update the option with tracked data.
		add_action( 'shutdown', [ $this, 'update_tracked_options' ] );

		// Register the REST routes.
		$rest = new REST();
		$rest->register_hooks();

		if ( is_admin() ) {
			// Register the admin page.
			$admin_page = new Admin_Page();
			$admin_page->register_hooks();
		}
	}

	/**
	 * Monitor all actions and filters for option accesses.
	 *
	 * @param string $tag The current action or filter tag being executed.
	 *
	 * @return void
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
	 *
	 * @return void
	 */
	protected function add_option_usage( $option_name ) {
		// Check if this option hasn't been tracked yet and add it to the array.
		if ( ! array_key_exists( $option_name, $this->accessed_options ) ) {
			$this->accessed_options[ $option_name ] = 1;
			return;
		}
		++$this->accessed_options[ $option_name ];
	}

	/**
	 * Update the 'option_optimizer' option with the list of used options at the end of the page load.
	 *
	 * @return void
	 */
	public function update_tracked_options() {
		// phpcs:ignore WordPress.Security.NonceVerification -- not doing anything.
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'aaa-option-optimizer' ) {
			return;
		}
		// Retrieve the existing option_optimizer data.
		$option_optimizer = get_option( 'option_optimizer', [ 'used_options' => [] ] );

		$option_optimizer['used_options'] = $this->accessed_options;

		// Update the 'option_optimizer' option with the new list.
		update_option( 'option_optimizer', $option_optimizer, true );
	}
}
