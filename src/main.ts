import { Editor, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, SettingTab, Settings } from './settings.js';
import { CalendarModal } from './modal.js';

export default class DateInserter extends Plugin {
  settings: Settings;
  private _settingTab: SettingTab;

  async onload(): Promise<void> {
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

  onunload(): void {
    this._settingTab.updateStyleSheet(true);
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.migrateSettingValues();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async migrateSettingValues(): Promise<void> {
    if (this.settings.dateFormatSpecs?.length > 1) {
      return;
    }
    const dateFormatSpecs = [
      {
        format: this.settings.format || DEFAULT_SETTINGS.dateFormatSpecs[0].format,
        regex: '',
        minLength: 0,
        maxLength: 0,
      },
      {
        format: this.settings.format2 || '',
        regex: '',
        minLength: 0,
        maxLength: 0,
      },
    ];
    this.settings.dateFormatSpecs = dateFormatSpecs;
    this.settings.defaultDate = DEFAULT_SETTINGS.defaultDate;
    delete (this.settings as Partial<Settings>).format;
    delete (this.settings as Partial<Settings>).format2;
    await this.saveSettings();
    await this._settingTab.updateDateFormatSpecs();
  }
}
