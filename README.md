# Obsidian Date Inserter

This is an [Obsidian](https://obsidian.md/) plugin which can insert a date at the cursor position using a calendar.

The calendar can be called up in one of the following ways.

- Using hotkey. (**recommend**)
- Selecting `Date Inserter: Open Calendar` from the command palette.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-date-inserter/master/demo/%20date-insert.gif)

- You can custom format of date.
  - ex1) `mm/dd/yyyy` => `01/23/2024`
  - ex2) `DD mm-dd` => `Tuesday 01-23`
  - ex3) `yyyy.mm.dd(D)` => `2024.01.23(Tue)`

**Note:** The calendar for this plugin uses [vanillajs-datepicker](https://mymth.github.io/vanillajs-datepicker/#/). Please check this link ([vanillajs-datepicker > Date String & Format](https://mymth.github.io/vanillajs-datepicker/#/date-string+format)) for format details.

## Installation

Install the plugin in one of the following ways.

- [Community Plugins browser](#community-plugins-browser)
- [Manually](#manually)
- [BRAT Plugin Manager](#brat-plugin-manager)

### Community Plugins browser

This plugin is available in Obsidian's Community Plugins Browser.

1. Launch the Obsidian application.
1. Open the `Settings`, select `Community Plugins`, and select `Browse`.
1. Search for `Date Inserter`, and click it.
1. Click the `Install`.

### Manually

You can also install this plugin manually.

1. Access to [Releases](https://github.com/namikaze-40p/obsidian-date-inserter/releases), and download the 3 files(`main.js`, `manifest.json`, `style.css`) of latest version.
1. Create a new folder named `date-inserter`.
1. Move download the 3 files to the `date-inserter` folder.
1. Place the folder in your `.obsidian/plugins` directory. If you don't know where that is, you can go to Community Plugins inside Obsidian. There is a folder icon on the right of Installed Plugins. Click that and it opens your plugins folder.
1. Reload plugins. (the easiest way is just restarting Obsidian)
1. Activate the plugin as normal.

### BRAT Plugin Manager

You can also install this plugin using the BRAT plugin.

1. Install BRAT using the Obsidian Plugin manager
1. In your Obsidian settings on the left, select BRAT in the list.
1. In BRAT settings, click the button Add Beta Plugin
1. In the textbox, supply the URL to this repo
	- https://github.com/namikaze-40p/obsidian-date-inserter
1. Once `Date Inserter` is installed, activate it in your Obsidian settings.
