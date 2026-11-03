import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';

import DateInserter from './main.js';
import { DateFormatSpec } from './dateFormatSpec.js';
import { LANGUAGES } from './locales.js';

export type { DateFormatSpec };

export const DEFAULT_DATE_OPTIONS = { today: 'Today', selectedDate: 'Selected date' } as const;

/** Fields from versions before `dateFormatSpecs` was introduced. Only read during migration. */
export type LegacySettings = {
  format?: string;
  format2?: string;
};

export interface Settings {
  dateFormatSpecs: DateFormatSpec[];
  defaultDate: keyof typeof DEFAULT_DATE_OPTIONS;
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

  private static readonly DAY_OF_WEEK_CONTROLS: {
    key: string;
    day: keyof typeof DAY_OF_WEEK;
    label: string;
  }[] = [
    { key: 'highlightSun', day: 'sun', label: 'Sunday' },
    { key: 'highlightMon', day: 'mon', label: 'Monday' },
    { key: 'highlightTue', day: 'tue', label: 'Tuesday' },
    { key: 'highlightWed', day: 'wed', label: 'Wednesday' },
    { key: 'highlightThu', day: 'thu', label: 'Thursday' },
    { key: 'highlightFri', day: 'fri', label: 'Friday' },
    { key: 'highlightSat', day: 'sat', label: 'Saturday' },
  ];

  private _updateDateFormatSpecs = debounce(
    () => {
      this._plugin.updateDateFormatSpecs().catch(console.error);
    },
    500,
    true,
  );

  constructor(
    app: App,
    private _plugin: DateInserter,
  ) {
    super(app, _plugin);
  }

  hide(): void {
    this._updateDateFormatSpecs.run();
    super.hide();
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
    const { settings } = this._plugin;
    switch (key) {
      case 'defaultDate':
        return settings.defaultDate || 'today';
      case 'language':
        return settings.language;
      case 'weekStart':
        return `${settings.weekStart}`;
      case 'weekNumbers':
        return `${settings.weekNumbers}`;
      case 'todayHighlight':
        return settings.todayHighlight;
      default: {
        const day = this.findHighlightedDay(key);
        return day && settings.daysOfWeekHighlighted[day] === DAY_OF_WEEK[day];
      }
    }
  }

  /**
   * Persists a value for one of the keys used by {@link getSettingDefinitions}.
   * @since Obsidian 1.13.0
   */
  async setControlValue(key: string, value: unknown): Promise<void> {
    const { settings } = this._plugin;
    switch (key) {
      case 'defaultDate':
        settings.defaultDate = value as Settings['defaultDate'];
        break;
      case 'language':
        settings.language = value as string;
        await this._plugin.updateDateFormatSpecs();
        return;
      case 'weekStart':
        settings.weekStart = parseInt(value as string, 10) || DAY_OF_WEEK.sun;
        break;
      case 'weekNumbers':
        settings.weekNumbers = parseInt(value as string, 10);
        break;
      case 'todayHighlight':
        settings.todayHighlight = value as boolean;
        break;
      default: {
        const day = this.findHighlightedDay(key);
        if (!day) {
          return;
        }
        Object.assign(settings.daysOfWeekHighlighted, {
          [day]: value ? DAY_OF_WEEK[day] : undefined,
        });
      }
    }
    await this._plugin.saveSettings();
  }

  private findHighlightedDay(key: string): keyof typeof DAY_OF_WEEK | undefined {
    return SettingTab.DAY_OF_WEEK_CONTROLS.find((control) => control.key === key)?.day;
  }

  private buildDateFormatSetting(setting: Setting, index: 0 | 1): void {
    const { name, shortDesc } = SettingTab.DATE_FORMAT_META[index];
    const fallback = index === 0 ? DEFAULT_SETTINGS.dateFormatSpecs[0].format : '';

    setting.setName(name).setDesc(this.buildDateFormatDesc(index, shortDesc));
    setting.addText((text) => {
      text
        .setPlaceholder('mm/dd/yyyy')
        .setValue(this._plugin.settings.dateFormatSpecs[index].format || fallback)
        .onChange((value) => {
          this._plugin.settings.dateFormatSpecs[index].format = value;
          this._updateDateFormatSpecs();
        });
      text.inputEl.addEventListener('blur', () => this._updateDateFormatSpecs.run());
    });
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
}
