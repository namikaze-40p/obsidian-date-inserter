# Obsidian Date Inserter

This is an [Obsidian](https://obsidian.md/) plugin which can insert a date at the cursor position using a calendar.

The calendar can be called up in one of the following ways.

- Selecting `Date Inserter` from the command palette.
- Using hotkey.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-date-inserter/master/demo/%20date-insert.gif)

- You can custom format of date.
  - ex 1: `mm/dd/yyyy` => `01/23/2024/`
  - ex 2: `DD mm-dd` => `Tuesday 01-23`

**Note:** The calendar for this plugin uses [vanillajs-datepicker](https://mymth.github.io/vanillajs-datepicker/#/). Please check this link ([vanillajs-datepicker > Date String & Format](https://mymth.github.io/vanillajs-datepicker/#/date-string+format)) for format details.

## Installation

It's not on the community plugin yet, because now waiting Obsidian team for review.

### Manual install

If you want to use this plugin, you can install in the following way.

1. Access to [Releases](https://github.com/namikaze-40p/obsidian-date-inserter/releases), and download the 3 files(`main.js`, `manifest.json`, `style.css`) of latest version.
1. Create a new folder named `date-inserter`.
1. Move download the 3 files to the `date-inserter` folder.
1. Place the folder in your `.obsidian/plugins` directory. If you don't know where that is, you can go to Community Plugins inside Obsidian. There is a folder icon on the right of Installed Plugins. Click that and it opens your plugins folder.
1. Reload plugins. (the easiest way is just restarting Obsidian)
1. Activate the plugin as normal.
