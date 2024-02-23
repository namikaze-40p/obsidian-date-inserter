import { Editor, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings.js';
import { CalendarModal } from './modal.js';

export default class DateInserter extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'open-calendar',
			name: 'Open Calendar',
			editorCallback: (editor: Editor) => {
				new CalendarModal(this.app, this.settings, editor).open();
			},
		});

		this.addSettingTab(new SettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
