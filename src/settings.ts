import { App, PluginSettingTab, Setting } from 'obsidian';

import DateInserter from './main.js';
import { LANGUAGES } from './locales.js';
import { createStyles, deleteStyles } from './util.js';

export interface Settings {
	format: string;
	format2: string;
	language: string;
	weekStart: number;
	todayHighlight: boolean;
	daysOfWeekHighlighted: {
		sun: 0 | undefined;
		mon: 1 | undefined;
		tue: 2 | undefined;
		wed: 3 | undefined;
		thu: 4 | undefined;
		fri: 5 | undefined;
		sat: 6 | undefined;
	};
}

export const DEFAULT_SETTINGS: Settings = {
	format: 'mm/dd/yyyy',
	format2: '',
	language: 'en',
	weekStart: 0,
	todayHighlight: true,
	daysOfWeekHighlighted: {
		sun: undefined,
		mon: undefined,
		tue: undefined,
		wed: undefined,
		thu: undefined,
		fri: undefined,
		sat: undefined,
	},
};

const DAY_OF_WEEK = {
	sun: 0 as const,
	mon: 1 as const,
	tue: 2 as const,
	wed: 3 as const,
	thu: 4 as const,
	fri: 5 as const,
	sat: 6 as const,
};

export class SettingTab extends PluginSettingTab {

	constructor(app: App, private _plugin: DateInserter) {
		super(app, _plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Date format to be inserted.')
			.addText(text => text
				.setPlaceholder('mm/dd/yyyy')
				.setValue(this._plugin.settings.format)
				.onChange(async value => {
					this._plugin.settings.format = value;
					await this._plugin.saveSettings();
				}));

		containerEl.createDiv('setting-date-format-description', el => {
			el.createDiv('').setText('ex1) mm/dd/yyyy => 01/23/2024');
			el.createDiv('').setText('ex2) DD mm-dd => Tuesday 01-23');
			el.createDiv('').setText('ex3) yyyy.mm.dd(D) => 2024.01.23(Tue)');

			const divEl = el.createDiv('format-details');
			divEl.setText('Please check the link below for format details.');

			const aTag = el.createEl('a');
			aTag.setText('vanillajs-datepicker > Date String & Format');
			aTag.setAttrs({ href: 'https://mymth.github.io/vanillajs-datepicker/#/date-string+format' });
		});

		new Setting(containerEl)
			.setName('Another date format (Optional)')
			.setDesc('Another date format to be inserted. If set, display buttons to select a format at the bottom of the calendar. Buttons can be selected by clicking or by “1" or “2" shortcut keys.')
			.addText(text => text
				.setPlaceholder('mm/dd/yyyy')
				.setValue(this._plugin.settings.format2)
				.onChange(async value => {
					this._plugin.settings.format2 = value;
					await this._plugin.saveSettings();
					this.updateStyleSheet();
				}));

		new Setting(containerEl)
			.setName('Language')
			.setDesc('Set calendar and date-related languages.')
			.addDropdown(dropdown => dropdown
				.addOptions(LANGUAGES)
				.setValue(this._plugin.settings.language)
				.onChange(async value => {
					this._plugin.settings.language = value;
					await this._plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Week start')
			.setDesc('Start day of the week.')
			.addDropdown(dropdown => dropdown
				.addOptions({
					[DAY_OF_WEEK.sun]: 'Sunday',
					[DAY_OF_WEEK.mon]: 'Monday',
					[DAY_OF_WEEK.tue]: 'Tuesday',
					[DAY_OF_WEEK.wed]: 'Wednesday',
					[DAY_OF_WEEK.thu]: 'Thursday',
					[DAY_OF_WEEK.fri]: 'Friday',
					[DAY_OF_WEEK.sat]: 'Saturday',
				})
				.setValue(`${this._plugin.settings.weekStart}`)
				.onChange(async value => {
					this._plugin.settings.weekStart = parseInt(value, 10) || DAY_OF_WEEK.sun;
					await this._plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Highlight the today')
			.setDesc('Whether to highlight the today.')
			.addToggle(toggle => toggle.setValue(this._plugin.settings.todayHighlight)
				.onChange(async value => {
					this._plugin.settings.todayHighlight = value;
					await this._plugin.saveData(this._plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Highlight days of week')
			.setDesc('Days of the week to highlight in the calendar.');

		containerEl.createDiv('setting-day-of-week', el => {
			new Setting(el)
				.setDesc('Sunday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.sun === DAY_OF_WEEK.sun)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.sun = value ? DAY_OF_WEEK.sun : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Monday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.mon === DAY_OF_WEEK.mon)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.mon = value ? DAY_OF_WEEK.mon : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Tuesday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.tue === DAY_OF_WEEK.tue)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.tue = value ? DAY_OF_WEEK.tue : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Wednesday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.wed === DAY_OF_WEEK.wed)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.wed = value ? DAY_OF_WEEK.wed : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Thursday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.thu === DAY_OF_WEEK.thu)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.thu = value ? DAY_OF_WEEK.thu : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Friday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.fri === DAY_OF_WEEK.fri)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.fri = value ? DAY_OF_WEEK.fri : undefined;
						await this._plugin.saveSettings();
					}),
				);

			new Setting(el)
				.setDesc('Saturday')
				.addToggle(toggle => toggle
					.setValue(this._plugin.settings.daysOfWeekHighlighted.sat === DAY_OF_WEEK.sat)
					.onChange(async value => {
						this._plugin.settings.daysOfWeekHighlighted.sat = value ? DAY_OF_WEEK.sat : undefined;
						await this._plugin.saveSettings();
					}),
				);
		});
	}

	updateStyleSheet(isTeardown = false): void {
		deleteStyles();
		if (isTeardown) {
			return;
		}

		const { format2 } = this._plugin.settings;
		const formatButtonsHeight = format2 ? '2.5rem' : '0px';
		createStyles([
			{ selector: '.modal.date-inserter-modal',  property: 'height', value: `calc(388px + ${formatButtonsHeight})` },
		]);
	}
}
