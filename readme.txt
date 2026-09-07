=== AAA Option Optimizer ===
Contributors: joostdevalk, aristath, filipi, progressplanner
Tags: options, database, cleanup
Requires at least: 6.7
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.6.1
License: GPL3+
License URI: https://www.gnu.org/licenses/gpl-3.0.en.html

Plugin that tracks autoloaded options usage and allows the user to optimize them.

== Description ==
This plugin tracks which of the autoloaded options are used on a page, and stores that data at the end of page render. It keeps an array of options that it has seen as being used. On the admin page, it compares all the autoloaded options to the array of stored options, and shows the autoloaded options that have not been used as you were browsing the site. If you've been to every page on your site, or you've kept the plugin around for a week or so, this means that those options probably don't need to be autoloaded.

=== How to use this plugin ===
Install this plugin, and go through your entire site. Best is to use it normally for a couple of days, or to visit every page on your site and in your admin manually. Then go to the plugin's settings screen, and go through the unused options. You can either decide to remove an unused option (they might for instance be for plugins you no longer use), or to set it to not autoload. The latter action is much less destructive: it'll still be there, but it just won't be autoloaded.

== Frequently Asked Questions ==

= Why the AAA prefix in the plugin name? =

Because the plugin needs to measure options being loaded, it benefits from being loaded itself first. As WordPress loads plugins alphabetically,
starting the name with AAA made sense.

= Do I need to take precautions? =

Yes!! Backup your database.

= Where can I report bugs? =

Please use [our GitHub](https://github.com/ProgressPlanner/aaa-option-optimizer/) for reporting bugs or making code suggestions. Feel free to use the forums for asking questions too, of course.

For security issues, please see the next question.

= How can I report security issues? =

You can report security bugs through the Patchstack Vulnerability Disclosure Program. The Patchstack team help validate, triage and handle any security vulnerabilities. [Report a security vulnerability.](https://patchstack.com/database/vdp/aaa-option-optimizer)

= How can I add recognized plugins? =

Please do a pull request via GitHub on [this file](https://github.com/ProgressPlanner/aaa-option-optimizer/blob/develop/known-plugins/known-plugins.json) in the plugin.

== Installation ==
1. Search for AAA Option Optimizer on the repository.
2. Install the plugin.
3. Wait a week or so. Or, if you're in a hurry, click around on pages on your site, be sure to try and hit every page on your site and in your admin.
4. Go to the plugin's admin page and optimize your option usage.

== Screenshots ==

1. Screenshot of the admin screen, initial tab.
2. Screenshot of the "All options" screen, showing you can browse all the options.

== External services ==

This plugin connects to two external services to identify the source plugins of WordPress options.

= WordPress.org plugin directory (api.wordpress.org) =

When you click "Report" on an option whose source is "Unknown" and choose or type a plugin slug, the plugin queries `https://api.wordpress.org/plugins/info/1.0/{slug}.json` to verify the slug exists and to display the official plugin name for confirmation. Only the slug is sent. The list of installed plugins offered as suggestions in that field is read locally and is never sent anywhere.

WordPress.org terms of service: https://wordpress.org/about/privacy/

= Known-plugins mapping and origin reporting (option-optimizer-api.progressplanner.com) =

**This is off until you opt in.** Once you enable "Keep the known-plugins list up to date automatically" (on the plugin's settings tab, or by agreeing in the Report popover), the plugin fetches an updated list of recognized plugins once a day from `https://option-optimizer-api.progressplanner.com/known-plugins.json`. This lets the plugin identify newly-added plugins as the maintained list grows, without requiring a plugin update. With this request the plugin sends your plugin version and WordPress version, so the maintainers can keep anonymous usage statistics. No site identity is sent. Until you opt in, only the list bundled with the plugin is used and no request is made. The fetch URL can be overridden, or the feature disabled, via the `aaa_option_optimizer_known_plugins_url` filter.

When you submit a "Report origin" form, the plugin sends the option name you reported, the wp.org plugin slug you supplied, and your site's hostname to `https://option-optimizer-api.progressplanner.com/submit`. The submission is recorded as a GitHub issue for a maintainer to review and add to the recognized plugins list. The site hostname is hashed before storage and never published. The option name and slug appear in the public GitHub issue. Submissions only happen when you click Submit on the Report form; nothing is sent automatically.

The endpoint is operated by the plugin maintainers. The submission URL can be overridden via the `aaa_option_optimizer_report_url` filter for users who want to disable or redirect the feature.

== Changelog ==

= 1.7.0 =

* Add "Report origin" feature: for options whose source plugin is unknown, users can submit the matching wp.org slug to help maintainers expand the recognized plugins list. Submissions land as GitHub issues for maintainer review; no auto-merge.
* The "Report origin" slug field suggests the plugins installed on your site, so the slug can be picked from a list instead of typed. The field still accepts a typed slug or wp.org URL, so options left behind by a plugin that has since been deleted remain reportable. Suggestions are read locally and never sent anywhere.
* Recognized-plugins list can refresh once a day in the background from the maintainers' server, so the list grows for users without requiring plugin updates. This is opt-in: enable it on the settings tab or agree in the Report popover. The refresh sends only your plugin and WordPress version for anonymous statistics; no site identity is sent.

= 1.6.1 =

* Fix infinite recursion in option access monitoring that could cause a fatal error in certain hosting environments.

= 1.6.0

* Replace using 'all' filter for monitoring option usage with 'pre_option' filter for better performance.
* Migrate tracked options data from a single wp_option to a custom database table for improved performance and reliability.

= 1.5.1 =

* Add "select all" checkbox.
* Fix table filtering by Source column.

= 1.5.0 =

* Prefix the Datatables script slug to avoid conflict with other plugins.
* Add MainWP to known-plugins list
* Add SliceWP to known-plugins list
* Add more known prefixes for WooCommerce options
* Fixed a bug in bulk-actions

= 1.4.0 =

* Performance improvements.
* Added bulk-actions to allow optimizing & deleting options in bulk.
* Added more known plugins.

= 1.3.2 =

* Performance fix: Do not autoload the plugin option.

= 1.3.1 =

* Fix JS error when deleting an option.

= 1.3 =

* Make plugin work with the latest autoload changes.

= 1.2.1 =

* Fix error in `known-plugins.json`.
* Prevent fatal error when there's an error in `known-plugins.json`.

= 1.2 =

Enhancements:

* Overhaul of the UX, implementing proper tabs, better buttons and more.
* Added a new "All options" tab, which, when you hit the button, loads all the options from the database and allows you to manage them.
* Added a "Reset data" button which resets the tracking data.
* Added a link to the Optimize Options page from the Plugins page.
* Much improved recognition of core WordPress options, themes and plugins under "Source", thanks in part to pull requests from [Rogier Lankhorst](https://profiles.wordpress.org/rogierlankhorst/) and [system4pc](https://github.com/system4pc).
* You can now also filter all tables by Source so you can more easily find the options you're looking for.
* Many code and speed improvements under the hood, including adding a class autoloader and some i18n fixes.

= 1.1.1 =

Implement the missing functionality to create an option with value `false` when it's being loaded but doesn't exist.

= 1.1 =

The plugin now recognizes plugins from which the options came (thanks to a great pull by [Rogier Lankhorst](https://profiles.wordpress.org/rogierlankhorst/)). If you're a plugin developer and want your plugin's options
properly recognized, please do a pull request [on this file](https://github.com/ProgressPlanner/aaa-option-optimizer/blob/main/known-plugins/known-plugins.json).

Small enhancements:

* Column width is now automatically determined which leads to better spacing.
* Action buttons are now centered in their columns.

Bugs fixed:

* If you removed autoload from or deleted an option, it'd be removed from the table but would be back when you paginated, that's fixed - thanks to [Jono Alderson](https://profiles.wordpress.org/jonoaldersonwp/) for reporting.
* Fixed sorting by filesize by moving the `KB` to the table heading, so that you can now properly sort numbers.
* Fixed issue where an empty option would result in weird size output.

= 1.0.2 =

* Fixed a bug where the buttons wouldn't work in a paginated state.
* Show the value of an option in a `popover`, as suggested with a great pull request by [@rogierlankhorst](https://profiles.wordpress.org/rogierlankhorst/).

= 1.0.1 =

Fixed an error with values that are objects, not strings, which also caused sorting not to work for some people.

= 1.0 =

Initial release on GitHub and WordPress.org.
