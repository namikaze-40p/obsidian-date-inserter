import { Editor, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings.js';
import { CalendarModal } from './modal.js';

export default class DateInserter extends Plugin {
	settings: Settings;
	private _settingTab: SettingTab;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'open-calendar',
			name: 'Open Calendar',
			editorCallback: (editor: Editor) => {
				new CalendarModal(this.app, this.settings, editor).open();
			},
		});

		this.addCommand({
			id: 'copy-date-to-clipboard',
			name: 'Copy Date to Clipboard',
			callback: () => {
				new CalendarModal(this.app, this.settings).open();
			},
		});

		this._settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this._settingTab);
		this._settingTab.updateStyleSheet();
	}

	onunload() {
		this._settingTab.updateStyleSheet(true);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
