import { Editor, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, LegacySettings, SettingTab, Settings } from './settings.js';
import { CalendarModal } from './modal.js';
import { generateDateFormatSpec } from './dateFormatSpec.js';

export default class DateInserter extends Plugin {
  settings!: Settings;

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

    this.addSettingTab(new SettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const data: (Partial<Settings> & LegacySettings) | null = await this.loadData();
    this.settings = Object.assign(structuredClone(DEFAULT_SETTINGS), data);
    await this.migrateSettingValues(data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async updateDateFormatSpecs(): Promise<void> {
    const { dateFormatSpecs, language } = this.settings;
    this.settings.dateFormatSpecs = dateFormatSpecs.map(({ format }) =>
      generateDateFormatSpec(format, language),
    );
    await this.saveSettings();
  }

  private async migrateSettingValues(
    data: (Partial<Settings> & LegacySettings) | null,
  ): Promise<void> {
    const needsDateFormatSpecs = !(data?.dateFormatSpecs && data.dateFormatSpecs.length > 1);
    const hasLegacyFields = !!data && ('format' in data || 'format2' in data);
    if (!needsDateFormatSpecs && !hasLegacyFields) {
      return;
    }

    const settings = this.settings as Settings & LegacySettings;
    if (needsDateFormatSpecs) {
      const formats = [
        settings.format || DEFAULT_SETTINGS.dateFormatSpecs[0].format,
        settings.format2 || '',
      ];
      settings.dateFormatSpecs = formats.map((format) => ({
        format,
        regex: '',
        minLength: 0,
        maxLength: 0,
      }));
      settings.defaultDate = DEFAULT_SETTINGS.defaultDate;
    }
    delete settings.format;
    delete settings.format2;

    if (needsDateFormatSpecs) {
      await this.updateDateFormatSpecs();
    } else {
      await this.saveSettings();
    }
  }
}
