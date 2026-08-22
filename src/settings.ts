import { App, PluginSettingTab, Setting } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';

import DateInserter from './main.js';
import { LANGUAGES, LOCALES } from './locales.js';

export type DateFormatSpec = {
  format: string;
  regex: string;
  minLength: number;
  maxLength: number;
};

export const DEFAULT_DATE_OPTIONS = { today: 'Today', selectedDate: 'Selected date' } as const;

export interface Settings {
  dateFormatSpecs: DateFormatSpec[];
  defaultDate: string;
  format: string;
  format2: string;
  language: string;
  weekStart: number;
  weekNumbers: number;
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
  dateFormatSpecs: [
    {
      format: 'mm/dd/yyyy',
      regex: '(?:0[1-9]|1[0-2])/(?:0[1-9]|[12][0-9]|3[01])/(?:\\d{4})',
      minLength: 10,
      maxLength: 10,
    },
  ],
  defaultDate: 'today',
  format: 'mm/dd/yyyy',
  format2: '',
  language: 'en',
  weekStart: 0,
  weekNumbers: 0,
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
  private static readonly DATE_FORMAT_META: { name: string; shortDesc: string }[] = [
    { name: 'Date format', shortDesc: 'Date format to be inserted.' },
    {
      name: 'Another date format (Optional)',
      shortDesc:
        'Another date format to be inserted. If set, display buttons to select a format at the bottom of the calendar. Buttons can be selected by clicking or by “1" or “2" shortcut keys.',
    },
  ];

  private static readonly WEEK_START_OPTIONS: Record<string, string> = {
    [DAY_OF_WEEK.sun]: 'Sunday',
    [DAY_OF_WEEK.mon]: 'Monday',
    [DAY_OF_WEEK.tue]: 'Tuesday',
    [DAY_OF_WEEK.wed]: 'Wednesday',
    [DAY_OF_WEEK.thu]: 'Thursday',
    [DAY_OF_WEEK.fri]: 'Friday',
    [DAY_OF_WEEK.sat]: 'Saturday',
  };

  private static readonly WEEK_NUMBERS_OPTIONS: Record<string, string> = {
    '0': 'Off',
    '1': 'ISO 8601',
    '2': 'Western traditional',
    '3': 'Middle Eastern',
    '4': 'Auto (based on week start)',
  };

  private static readonly DAY_OF_WEEK_CONTROLS: { key: string; label: string }[] = [
    { key: 'highlightSun', label: 'Sunday' },
    { key: 'highlightMon', label: 'Monday' },
    { key: 'highlightTue', label: 'Tuesday' },
    { key: 'highlightWed', label: 'Wednesday' },
    { key: 'highlightThu', label: 'Thursday' },
    { key: 'highlightFri', label: 'Friday' },
    { key: 'highlightSat', label: 'Saturday' },
  ];

  constructor(
    app: App,
    private _plugin: DateInserter,
  ) {
    super(app, _plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.buildDateFormatSetting(new Setting(containerEl), 0);
    this.buildDateFormatSetting(new Setting(containerEl), 1);

    new Setting(containerEl)
      .setName('Default date on calendar open')
      .setDesc('Choose which date is selected when opening the calendar.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(DEFAULT_DATE_OPTIONS)
          .setValue(this.getControlValue('defaultDate') as string)
          .onChange(async (value) => await this.setControlValue('defaultDate', value)),
      );

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Set calendar and date-related languages.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(LANGUAGES)
          .setValue(this.getControlValue('language') as string)
          .onChange(async (value) => await this.setControlValue('language', value)),
      );

    new Setting(containerEl)
      .setName('Week start')
      .setDesc('Start day of the week.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(SettingTab.WEEK_START_OPTIONS)
          .setValue(this.getControlValue('weekStart') as string)
          .onChange(async (value) => await this.setControlValue('weekStart', value)),
      );

    new Setting(containerEl)
      .setName('Week numbers')
      .setDesc('Show week numbers in the calendar.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(SettingTab.WEEK_NUMBERS_OPTIONS)
          .setValue(this.getControlValue('weekNumbers') as string)
          .onChange(async (value) => await this.setControlValue('weekNumbers', value)),
      );

    new Setting(containerEl)
      .setName('Highlight the today')
      .setDesc('Whether to highlight the today.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.getControlValue('todayHighlight') as boolean)
          .onChange(async (value) => await this.setControlValue('todayHighlight', value)),
      );

    this.buildDaysOfWeekHighlightedSetting(new Setting(containerEl));
  }

  /**
   * @since Obsidian 1.13.0
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: SettingTab.DATE_FORMAT_META[0].name,
        desc: SettingTab.DATE_FORMAT_META[0].shortDesc,
        render: (setting: Setting) => this.buildDateFormatSetting(setting, 0),
      },
      {
        name: SettingTab.DATE_FORMAT_META[1].name,
        desc: SettingTab.DATE_FORMAT_META[1].shortDesc,
        render: (setting: Setting) => this.buildDateFormatSetting(setting, 1),
      },
      {
        name: 'Default date on calendar open',
        desc: 'Choose which date is selected when opening the calendar.',
        control: {
          type: 'dropdown',
          key: 'defaultDate',
          options: DEFAULT_DATE_OPTIONS,
        },
      },
      {
        name: 'Language',
        desc: 'Set calendar and date-related languages.',
        control: {
          type: 'dropdown',
          key: 'language',
          options: LANGUAGES,
        },
      },
      {
        name: 'Week start',
        desc: 'Start day of the week.',
        control: {
          type: 'dropdown',
          key: 'weekStart',
          options: SettingTab.WEEK_START_OPTIONS,
        },
      },
      {
        name: 'Week numbers',
        desc: 'Show week numbers in the calendar.',
        control: {
          type: 'dropdown',
          key: 'weekNumbers',
          options: SettingTab.WEEK_NUMBERS_OPTIONS,
        },
      },
      {
        name: 'Highlight the today',
        desc: 'Whether to highlight the today.',
        control: {
          type: 'toggle',
          key: 'todayHighlight',
        },
      },
      {
        type: 'group',
        heading: 'Highlight days of week',
        items: SettingTab.DAY_OF_WEEK_CONTROLS.map(({ key, label }) => ({
          name: label,
          control: { type: 'toggle' as const, key },
        })),
      },
    ];
  }

  /**
   * Reads a value for one of the keys used by {@link getSettingDefinitions}.
   * @since Obsidian 1.13.0
   */
  getControlValue(key: string): unknown {
    switch (key) {
      case 'defaultDate':
        return this._plugin.settings.defaultDate || 'today';
      case 'language':
        return this._plugin.settings.language;
      case 'weekStart':
        return `${this._plugin.settings.weekStart}`;
      case 'weekNumbers':
        return `${this._plugin.settings.weekNumbers}`;
      case 'todayHighlight':
        return this._plugin.settings.todayHighlight;
      case 'highlightSun':
        return this._plugin.settings.daysOfWeekHighlighted.sun === DAY_OF_WEEK.sun;
      case 'highlightMon':
        return this._plugin.settings.daysOfWeekHighlighted.mon === DAY_OF_WEEK.mon;
      case 'highlightTue':
        return this._plugin.settings.daysOfWeekHighlighted.tue === DAY_OF_WEEK.tue;
      case 'highlightWed':
        return this._plugin.settings.daysOfWeekHighlighted.wed === DAY_OF_WEEK.wed;
      case 'highlightThu':
        return this._plugin.settings.daysOfWeekHighlighted.thu === DAY_OF_WEEK.thu;
      case 'highlightFri':
        return this._plugin.settings.daysOfWeekHighlighted.fri === DAY_OF_WEEK.fri;
      case 'highlightSat':
        return this._plugin.settings.daysOfWeekHighlighted.sat === DAY_OF_WEEK.sat;
      default:
        return undefined;
    }
  }

  /**
   * Persists a value for one of the keys used by {@link getSettingDefinitions}.
   * @since Obsidian 1.13.0
   */
  async setControlValue(key: string, value: unknown): Promise<void> {
    switch (key) {
      case 'defaultDate':
        this._plugin.settings.defaultDate = value as string;
        await this._plugin.saveSettings();
        return;
      case 'language':
        this._plugin.settings.language = value as string;
        await this.updateDateFormatSpecs();
        return;
      case 'weekStart':
        this._plugin.settings.weekStart = parseInt(value as string, 10) || DAY_OF_WEEK.sun;
        await this._plugin.saveSettings();
        return;
      case 'weekNumbers':
        this._plugin.settings.weekNumbers = parseInt(value as string, 10);
        await this._plugin.saveSettings();
        return;
      case 'todayHighlight':
        this._plugin.settings.todayHighlight = value as boolean;
        await this._plugin.saveSettings();
        return;
      case 'highlightSun':
        this._plugin.settings.daysOfWeekHighlighted.sun = value ? DAY_OF_WEEK.sun : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightMon':
        this._plugin.settings.daysOfWeekHighlighted.mon = value ? DAY_OF_WEEK.mon : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightTue':
        this._plugin.settings.daysOfWeekHighlighted.tue = value ? DAY_OF_WEEK.tue : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightWed':
        this._plugin.settings.daysOfWeekHighlighted.wed = value ? DAY_OF_WEEK.wed : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightThu':
        this._plugin.settings.daysOfWeekHighlighted.thu = value ? DAY_OF_WEEK.thu : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightFri':
        this._plugin.settings.daysOfWeekHighlighted.fri = value ? DAY_OF_WEEK.fri : undefined;
        await this._plugin.saveSettings();
        return;
      case 'highlightSat':
        this._plugin.settings.daysOfWeekHighlighted.sat = value ? DAY_OF_WEEK.sat : undefined;
        await this._plugin.saveSettings();
        return;
      default:
        return;
    }
  }

  private buildDateFormatSetting(setting: Setting, index: 0 | 1): void {
    const { name, shortDesc } = SettingTab.DATE_FORMAT_META[index];
    const fallback = index === 0 ? DEFAULT_SETTINGS.dateFormatSpecs[0].format : '';

    setting.setName(name).setDesc(this.buildDateFormatDesc(index, shortDesc));
    setting.addText(
      (text) =>
        (text
          .setPlaceholder('mm/dd/yyyy')
          .setValue(this._plugin.settings.dateFormatSpecs[index].format || fallback)
          .onChange(
            async (value) => (this._plugin.settings.dateFormatSpecs[index].format = value),
          ).inputEl.onblur = async () => await this.updateDateFormatSpecs()),
    );
  }

  private buildDateFormatDesc(index: 0 | 1, shortDesc: string): string | DocumentFragment {
    if (index !== 0) {
      return shortDesc;
    }

    return createFragment((el) => {
      el.createSpan({ text: shortDesc });

      const descEl = el.createDiv('setting-date-format-description');
      descEl.createDiv('').setText('ex1) mm/dd/yyyy => 01/23/2024');
      descEl.createDiv('').setText('ex2) DD mm-dd => Tuesday 01-23');
      descEl.createDiv('').setText('ex3) yyyy.mm.dd(D) => 2024.01.23(Tue)');

      const divEl = descEl.createDiv('format-details');
      divEl.setText('Please check the link below for format details.');

      const aTag = descEl.createEl('a');
      aTag.setText('vanillajs-datepicker > Date String & Format');
      aTag.setAttrs({ href: 'https://mymth.github.io/vanillajs-datepicker/#/date-string+format' });
    });
  }

  private buildDaysOfWeekHighlightedSetting(setting: Setting): void {
    setting
      .setName('Highlight days of week')
      .setDesc('Days of the week to highlight in the calendar.');

    const parent = setting.settingEl.parentElement;
    if (!parent) {
      return;
    }

    const el = parent.createDiv('setting-day-of-week');
    parent.insertAfter(el, setting.settingEl);

    for (const { key, label } of SettingTab.DAY_OF_WEEK_CONTROLS) {
      new Setting(el).setDesc(label).addToggle((toggle) =>
        toggle
          .setValue(this.getControlValue(key) as boolean)
          .onChange(async (value) => await this.setControlValue(key, value)),
      );
    }
  }

  async updateDateFormatSpecs(): Promise<void> {
    this._plugin.settings.dateFormatSpecs[0] = this.generateDateFormatSpec(
      this._plugin.settings.dateFormatSpecs[0].format,
    );
    this._plugin.settings.dateFormatSpecs[1] = this.generateDateFormatSpec(
      this._plugin.settings.dateFormatSpecs[1].format,
    );
    await this._plugin.saveSettings();
  }

  private generateDateFormatSpec(format: string): DateFormatSpec {
    const formatTokens = this.generateTokens(format);
    const { regex, min: minLength, max: maxLength } = this.generateRegex(format, formatTokens);
    return { format, regex, minLength, maxLength };
  }

  private generateTokens(format: string, tokens: string[] = []): string[] {
    const tokenTypes = [
      ['yyyy', 'yy', 'y'],
      ['mm', 'm'],
      ['MM', 'M'],
      ['dd', 'd'],
      ['DD', 'D'],
    ];
    const token = tokenTypes.reduce(
      (acc, tokens) => {
        const token = this.findFirstToken(format, tokens);
        if (token && token.index < acc.index) {
          return token;
        }
        return acc;
      },
      { format: '', index: Infinity },
    );

    if (token.format) {
      const nextFormat = format.slice(token.index + token.format.length);
      return this.generateTokens(nextFormat, [...tokens, token.format]);
    }
    return tokens;
  }

  private generateRegex(
    format: string,
    formatTokens: string[],
    result = { regex: '', min: 0, max: 0 },
  ): { regex: string; min: number; max: number } {
    const token = this.findFirstToken(format, formatTokens);
    if (token) {
      const { regex, min, max } = this.formatToRegexPattern(token.format);
      const prefix = format.slice(0, token.index);
      const tmpResult = { ...result };
      const escapedRegex = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      tmpResult.regex += escapedRegex + regex;
      tmpResult.min += prefix.length + min;
      tmpResult.max += prefix.length + max;
      formatTokens.shift();
      return this.generateRegex(
        format.slice(token.index + token.format.length),
        formatTokens,
        tmpResult,
      );
    } else {
      const finalResult = { ...result };
      const escapedRegex = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      finalResult.regex += escapedRegex;
      finalResult.min += format.length;
      finalResult.max += format.length;
      return finalResult;
    }
  }

  private formatToRegexPattern(format: string): { regex: string; min: number; max: number } {
    switch (format) {
      case 'dd': {
        const regex = '(?:0[1-9]|[12][0-9]|3[01])'; // ex: 01, 02, ..., 31
        return { regex, min: 2, max: 2 };
      }
      case 'd': {
        const regex = '(?:[1-9]|[12][0-9]|3[01])'; // ex: 1, 2, ..., 31
        return { regex, min: 1, max: 2 };
      }
      case 'DD': {
        const days = LOCALES[this._plugin.settings.language].days;
        const regex = `(?:${days.join('|')})`; // ex: Sunday, Monday, ..., Saturday
        const min = Math.min(...days.map((day) => day.length));
        const max = Math.max(...days.map((day) => day.length));
        return { regex, min, max };
      }
      case 'D': {
        const days = LOCALES[this._plugin.settings.language].daysShort;
        const regex = `(?:${days.join('|')})`; // ex: Sun, Mon, ..., Sat
        const min = Math.min(...days.map((day) => day.length));
        const max = Math.max(...days.map((day) => day.length));
        return { regex, min, max };
      }
      case 'mm': {
        const regex = '(?:0[1-9]|1[0-2])'; // ex: 01, 02, ..., 12
        return { regex, min: 2, max: 2 };
      }
      case 'm': {
        const regex = '(?:[1-9]|1[0-2])'; // ex: 1, 2, ..., 12
        return { regex, min: 1, max: 2 };
      }
      case 'MM': {
        const months = LOCALES[this._plugin.settings.language].months;
        const regex = `(?:${months.join('|')})`; // ex: January, February, ..., December
        const min = Math.min(...months.map((month) => month.length));
        const max = Math.max(...months.map((month) => month.length));
        return { regex, min, max };
      }
      case 'M': {
        const months = LOCALES[this._plugin.settings.language].monthsShort;
        const regex = `(?:${months.join('|')})`; // ex: Jan, Feb, ..., Dec
        const min = Math.min(...months.map((month) => month.length));
        const max = Math.max(...months.map((month) => month.length));
        return { regex, min, max };
      }
      case 'yyyy': {
        const regex = '(?:\\d{4})'; // ex: 0001, 0645, 1900, 2020
        return { regex, min: 4, max: 4 };
      }
      case 'yy': {
        const regex = '(?:\\d{2})'; // ex: 01, 45, 00, 20
        return { regex, min: 2, max: 2 };
      }
      case 'y': {
        const regex = '(?:\\d+)'; // ex: 1, 645, 1900, 2020
        return { regex, min: 1, max: 4 };
      }
      default:
        return { regex: '', min: 0, max: 0 };
    }
  }

  private findFirstToken(
    format: string,
    formatTokens: string[],
  ): { format: string; index: number } | null {
    let index = -1;
    let value: string | null = null;

    for (const token of formatTokens) {
      const idx = format.indexOf(token);
      if (idx >= 0) {
        index = idx;
        value = token;
        break;
      }
    }

    return value ? { format: value, index } : null;
  }
}
