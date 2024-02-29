<?php
/**
 * Plugin that tracks autoloaded options usage and allows the user to optimize them.
 *
 * @package Emilia\OptionOptimizer
 *
 * Plugin Name: AAA Option Optimizer
 * Plugin URI: https://joost.blog/plugins/aaa-option-optimizer/
 * Description: Tracks autoloaded options usage and allows the user to optimize them.
 * Version: 1.0.0
 * Author: Joost de Valk
 * Author URI: https://joost.blog/
 * Text Domain: aaa-option-optimizer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'AAA_OPTION_OPTIMIZER_FILE', __FILE__ );

register_activation_hook( __FILE__, 'aaa_option_optimizer_activation' );

/**
 * Activation hooked function to store start stats.
 *
 * @return void
 */
function aaa_option_optimizer_activation() {
	global $wpdb;
	//phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one time query, no caching needed.
	$autoload_size = $wpdb->get_var( "SELECT SUM(LENGTH(option_value)) as autoload_size FROM {$wpdb->options} WHERE autoload='yes'" );
	update_option(
		'option_optimizer',
		[
			'starting_point_kb'   => $autoload_size / 1024,
			'starting_point_date' => current_time( 'mysql' ),
			'used_options'        => [],
		],
		true
	);
}

/**
 * Initializes the plugin.
 *
 * @return void
 */
function aaa_option_optimizer_init() {
	require_once plugin_dir_path( __FILE__ ) . 'src/class-plugin.php';
	$optimizer = new Emilia\OptionOptimizer\Plugin();
	$optimizer->register_hooks();
}

aaa_option_optimizer_init();