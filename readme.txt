=== AAA Option Optimizer ===
Contributors: joostdevalk
Tags: options, database, cleanup
Requires at least: 6.2
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0
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

== Installation ==
1. Search for AAA Option Optimizer on the repository.
2. Install the plugin.
3. Wait a week or so. Or, if you're in a hurry, click around on pages on your site, be sure to try and hit every page on your site and in your admin.
4. Go to the plugin's admin page and optimize your option usage.

== Screenshots ==
1. Screenshot of the admin screen.

== Changelog ==

= 1.0 =

Initial release on GitHub.
