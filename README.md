# Date Inserter

An [Obsidian](https://obsidian.md/) plugin that lets you insert a date at the cursor position using a calendar.

## How to use

### Insert date to markdown

- Place the cursor where you want to insert the date.
- Open the calendar using one of the following methods:
  - Press the assigned hotkey (**recommended**).
  - Choose `Date Inserter: Open Calendar` from the command palette.
- Select on a date in the calendar to insert it.

![demo](https://raw.githubusercontent.com/namikaze-40p/obsidian-date-inserter/main/demo/insert-date.gif)

- You can custom format of date.
  - ex1) `mm/dd/yyyy` => `01/23/2024`
  - ex2) `DD mm-dd` => `Tuesday 01-23`
  - ex3) `yyyy.mm.dd(D)` => `2024.01.23(Tue)`

> [!NOTE]
> The calendar for this plugin uses [vanillajs-datepicker](https://mymth.github.io/vanillajs-datepicker/#/). Please check this link ([vanillajs-datepicker > Date String & Format](https://mymth.github.io/vanillajs-datepicker/#/date-string+format)) for format details.

### Copy date to clipboard

- Open the calendar using one of the following methods:
  - Press the assigned hotkey (**recommended**).
  - Select `Date Inserter: Copy Date to Clipboard` from the command palette.
- Paste the copied date wherever you like.

![demo](https://github.com/namikaze-40p/obsidian-date-inserter/blob/main/demo/ver-0.5.0/copy-to-clipboard.gif)

## Installation

You can find and install this plugin through Obsidian’s Community Plugins Browser.  
For detailed steps or alternative installation methods, click [here](https://github.com/namikaze-40p/obsidian-date-inserter/blob/main/docs/installation.md).
