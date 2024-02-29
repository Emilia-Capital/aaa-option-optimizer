[![CS](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/cs.yml/badge.svg)](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/cs.yml)
[![Lint](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/lint.yml/badge.svg)](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/lint.yml)
[![Security](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/security.yml/badge.svg)](https://github.com/emilia-capital/aaa-option-optimizer/actions/workflows/security.yml)

# AAA Option Optimizer
This plugin tracks which of the autoloaded options are used on a page, and stores that data at the end of page render. It keeps an array of options that it has seen as being used. On the admin page, it compares all the autoloaded options to the array of stored options, and shows the autoloaded options that have not been used as you were browsing the site. If you've been to every page on your site, or you've kept the plugin around for a week or so, this means that those options probably don't need to be autoloaded.

## How to use this plugin
Install this plugin, and go through your entire site. Best is to use it normally for a couple of days, or to visit every page on your site and in your admin manually. Then go to the plugin's settings screen, and go through the unused options. You can either decide to remove an unused option (they might for instance be for plugins you no longer use), or to set it to not autoload. The latter action is much less destructive: it'll still be there, but it just won't be autoloaded.

![Screenshot of the admin panel](/.wordpress-org/screenshot-1.png)

## Frequently Asked Questions

### Why the AAA prefix in the plugin name?

Because the plugin needs to measure options being loaded, it benefits from being loaded itself first. As WordPress loads plugins alphabetically, 
starting the name with AAA made sense.

### Do I need to take precautions?

Yes!! Backup your database.


### How can I report security bugs?

You can report security bugs through the Patchstack Vulnerability Disclosure Program. The Patchstack team help validate, triage and handle any security vulnerabilities. [Report a security vulnerability.](https://patchstack.com/database/vdp/aaa-option-optimizer)
