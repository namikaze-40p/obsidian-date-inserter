import { App, PluginSettingTab, Setting } from 'obsidian';

import DateInserter from './main.js';
import { LANGUAGES, LOCALES } from './locales.js';
import { createStyles, deleteStyles } from './util.js';

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
  constructor(
    app: App,
    private _plugin: DateInserter,
  ) {
    super(app, _plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Date format')
      .setDesc('Date format to be inserted.')
      .addText(
        (text) =>
          (text
            .setPlaceholder('mm/dd/yyyy')
            .setValue(
              this._plugin.settings.dateFormatSpecs[0].format ||
                DEFAULT_SETTINGS.dateFormatSpecs[0].format,
            )
            .onChange(
              async (value) => (this._plugin.settings.dateFormatSpecs[0].format = value),
            ).inputEl.onblur = async () => await this.updateDateFormatSpecs()),
      );

    containerEl.createDiv('setting-date-format-description', (el) => {
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
      .setDesc(
        'Another date format to be inserted. If set, display buttons to select a format at the bottom of the calendar. Buttons can be selected by clicking or by “1" or “2" shortcut keys.',
      )
      .addText(
        (text) =>
          (text
            .setPlaceholder('mm/dd/yyyy')
            .setValue(this._plugin.settings.dateFormatSpecs[1].format || '')
            .onChange(
              async (value) => (this._plugin.settings.dateFormatSpecs[1].format = value),
            ).inputEl.onblur = async () => {
            this.updateStyleSheet();
            await this.updateDateFormatSpecs();
          }),
      );

    new Setting(containerEl)
      .setName('Default date on calendar open')
      .setDesc('Choose which date is selected when opening the calendar.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(DEFAULT_DATE_OPTIONS)
          .setValue(this._plugin.settings.defaultDate || 'today')
          .onChange(async (value) => {
            this._plugin.settings.defaultDate = value;
            await this._plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Set calendar and date-related languages.')
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(LANGUAGES)
          .setValue(this._plugin.settings.language)
          .onChange(async (value) => {
            this._plugin.settings.language = value;
            await this.updateDateFormatSpecs();
          }),
      );

    new Setting(containerEl)
      .setName('Week start')
      .setDesc('Start day of the week.')
      .addDropdown((dropdown) =>
        dropdown
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
          .onChange(async (value) => {
            this._plugin.settings.weekStart = parseInt(value, 10) || DAY_OF_WEEK.sun;
            await this._plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Highlight the today')
      .setDesc('Whether to highlight the today.')
      .addToggle((toggle) =>
        toggle.setValue(this._plugin.settings.todayHighlight).onChange(async (value) => {
          this._plugin.settings.todayHighlight = value;
          await this._plugin.saveData(this._plugin.settings);
        }),
      );

    new Setting(containerEl)
      .setName('Highlight days of week')
      .setDesc('Days of the week to highlight in the calendar.');

    containerEl.createDiv('setting-day-of-week', (el) => {
      new Setting(el).setDesc('Sunday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.sun === DAY_OF_WEEK.sun)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.sun = value ? DAY_OF_WEEK.sun : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Monday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.mon === DAY_OF_WEEK.mon)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.mon = value ? DAY_OF_WEEK.mon : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Tuesday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.tue === DAY_OF_WEEK.tue)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.tue = value ? DAY_OF_WEEK.tue : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Wednesday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.wed === DAY_OF_WEEK.wed)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.wed = value ? DAY_OF_WEEK.wed : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Thursday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.thu === DAY_OF_WEEK.thu)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.thu = value ? DAY_OF_WEEK.thu : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Friday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.fri === DAY_OF_WEEK.fri)
          .onChange(async (value) => {
            this._plugin.settings.daysOfWeekHighlighted.fri = value ? DAY_OF_WEEK.fri : undefined;
            await this._plugin.saveSettings();
          }),
      );

      new Setting(el).setDesc('Saturday').addToggle((toggle) =>
        toggle
          .setValue(this._plugin.settings.daysOfWeekHighlighted.sat === DAY_OF_WEEK.sat)
          .onChange(async (value) => {
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

    const { format } = this._plugin.settings.dateFormatSpecs[1];
    const formatButtonsHeight = format ? '2.5rem' : '0px';
    createStyles([
      {
        selector: '.modal.date-inserter-modal',
        property: 'height',
        value: `calc(388px + ${formatButtonsHeight})`,
      },
    ]);
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
