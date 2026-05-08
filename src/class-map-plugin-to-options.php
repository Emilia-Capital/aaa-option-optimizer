<?php
/**
 * Functionality to map options to plugins.
 *
 * @package Progress_Planner\OptionOptimizer
 */

namespace Progress_Planner\OptionOptimizer;

/**
 * Class Map_Plugin_To_Options
 *
 * @package Progress_Planner\OptionOptimizer
 */
class Map_Plugin_To_Options {
	/**
	 * List of plugins we can recognize.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private $plugins_list = [];

	/**
	 * Find plugin in known plugin prefixes list.
	 *
	 * @param string $option The option name.
	 *
	 * @return string
	 */
	public function get_plugin_name( string $option ): string {
		$match = $this->find_match( $option );
		return null !== $match ? $match : __( 'Unknown', 'aaa-option-optimizer' );
	}

	/**
	 * Whether the option's source plugin is known.
	 *
	 * @param string $option The option name.
	 *
	 * @return bool
	 */
	public function is_known( string $option ): bool {
		return null !== $this->find_match( $option );
	}

	/**
	 * Look up the plugin name for an option, or null if no match.
	 *
	 * @param string $option The option name.
	 *
	 * @return string|null
	 */
	private function find_match( string $option ): ?string {
		if ( empty( $this->plugins_list ) ) {
			$known              = new Known_Plugins();
			$this->plugins_list = $known->get();
		}

		foreach ( $this->plugins_list as $plugin ) {
			foreach ( $plugin['option_prefixes'] as $prefix ) {
				if ( strpos( $option, $prefix ) === 0 && isset( $plugin['name'] ) ) {
					return $plugin['name'];
				}
			}
		}

		return null;
	}
}
