import { Editor, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings.js';
import { CalendarModal } from './modal.js';

export default class DateInserter extends Plugin {
	settings: Settings;
	settingTab: SettingTab;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'open-calendar',
			name: 'Open Calendar',
			editorCallback: (editor: Editor) => {
				new CalendarModal(this.app, this.settings, editor).open();
			},
		});

		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
		this.settingTab.updateStyleSheet();
	}

	onunload() {
		this.settingTab.updateStyleSheet(true);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
