<?php
/**
 * Loader for the known-plugins mapping.
 *
 * @package Progress_Planner\OptionOptimizer
 */

namespace Progress_Planner\OptionOptimizer;

/**
 * Class Known_Plugins
 *
 * Fetches the latest known-plugins.json from wp.org and caches it locally.
 * Falls back to the JSON file bundled with the plugin when no fresh remote
 * copy is available.
 */
class Known_Plugins {

	const REMOTE_URL = 'https://ps.w.org/aaa-option-optimizer/assets/known-plugins.json';
	const CACHE_KEY  = 'aaa_option_optimizer_known_plugins';
	const CRON_HOOK  = 'aaa_option_optimizer_refresh_known_plugins';

	/**
	 * In-memory cache for the current request.
	 *
	 * @var array<string, array<string, mixed>>|null
	 */
	private $list;

	/**
	 * Get the known-plugins mapping.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get(): array {
		if ( null !== $this->list ) {
			return $this->list;
		}

		$cached = \get_option( self::CACHE_KEY );
		if ( \is_array( $cached ) && ! empty( $cached ) ) {
			$this->list = $cached;
			return $this->list;
		}

		$this->list = $this->load_bundled();
		return $this->list;
	}

	/**
	 * Refresh the cached mapping from the remote URL.
	 *
	 * @return bool True when a fresh copy was stored, false otherwise.
	 */
	public function refresh(): bool {
		$response = \wp_remote_get(
			self::REMOTE_URL,
			[
				'timeout' => 10,
			]
		);

		if ( \is_wp_error( $response ) ) {
			return false;
		}

		if ( 200 !== \wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = \wp_remote_retrieve_body( $response );
		$data = \json_decode( $body, true );

		if ( ! \is_array( $data ) || empty( $data ) ) {
			return false;
		}

		\update_option( self::CACHE_KEY, $data, false );
		$this->list = $data;
		return true;
	}

	/**
	 * Load the JSON file bundled with the plugin.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function load_bundled(): array {
		$path = \plugin_dir_path( AAA_OPTION_OPTIMIZER_FILE ) . 'known-plugins/known-plugins.json';
		if ( ! \file_exists( $path ) ) {
			return [];
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a file bundled with the plugin.
		$data = \json_decode( (string) \file_get_contents( $path ), true );
		return \is_array( $data ) ? $data : [];
	}
}
