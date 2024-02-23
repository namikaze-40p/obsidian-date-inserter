import { App, PluginSettingTab, Setting } from 'obsidian';

import DateInserter from './main.js';

export interface Settings {
	format: string;
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

const LANGUAGES = {
	en: 'English',
	ja: '日本語',
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
	plugin: DateInserter;

	constructor(app: App, plugin: DateInserter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Date format to be inserted.')
			.addText(text => text
				.setPlaceholder('dd/mm/yyyy')
				.setValue(this.plugin.settings.format)
				.onChange(async value => {
					this.plugin.settings.format = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createDiv('setting-item-description', el => {
			el.createDiv('').setText('ex1) mm/dd/yyyy => 01/01/2024');
			el.createDiv('').setText('ex2) DD mm-dd => Monday 01-01');

			const divEl = el.createDiv('');
			divEl.setText('Please check the link below for format details.');
			divEl.style.marginTop = '0.5rem';

			const aTag = el.createEl('a');
			aTag.setText('vanillajs-datepicker > Date String & Format');
			aTag.setAttrs({ href: 'https://mymth.github.io/vanillajs-datepicker/#/date-string+format' });
			aTag.style.marginLeft = '0.5rem';
		})

		new Setting(containerEl)
			.setName('Language')
			.setDesc('Set calendar and date-related languages.')
			.addDropdown(dropdown => dropdown
				.addOptions(LANGUAGES)
				.setValue(this.plugin.settings.language)
				.onChange(async value => {
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
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
				.setValue(`${this.plugin.settings.weekStart}`)
				.onChange(async value => {
					console.log(value);
					this.plugin.settings.weekStart = parseInt(value, 10) || DAY_OF_WEEK.sun;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Highlight the today')
			.setDesc('Whether to highlight the today.')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.todayHighlight)
				.onChange(async value => {
					this.plugin.settings.todayHighlight = value;
					await this.plugin.saveData(this.plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Highlight days of week')
			.setDesc('Days of the week to highlight in the calendar.');

		new Setting(containerEl)
			.setDesc('Sunday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.sun === DAY_OF_WEEK.sun)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.sun = value ? DAY_OF_WEEK.sun : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Monday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.mon === DAY_OF_WEEK.mon)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.mon = value ? DAY_OF_WEEK.mon : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Tuesday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.tue === DAY_OF_WEEK.tue)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.tue = value ? DAY_OF_WEEK.tue : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Wednesday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.wed === DAY_OF_WEEK.wed)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.wed = value ? DAY_OF_WEEK.wed : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Thursday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.thu === DAY_OF_WEEK.thu)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.thu = value ? DAY_OF_WEEK.thu : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Friday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.fri === DAY_OF_WEEK.fri)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.fri = value ? DAY_OF_WEEK.fri : undefined;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setDesc('Saturday')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.daysOfWeekHighlighted.sat === DAY_OF_WEEK.sat)
				.onChange(async value => {
					this.plugin.settings.daysOfWeekHighlighted.sat = value ? DAY_OF_WEEK.sat : undefined;
					await this.plugin.saveSettings();
				}));
	}
}
