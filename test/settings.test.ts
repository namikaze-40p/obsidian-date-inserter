import type { App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type DateInserter from '../src/main.js';
import { LANGUAGES } from '../src/locales.js';
import { DEFAULT_SETTINGS, SettingTab, Settings } from '../src/settings.js';
import { Setting } from './stubs/obsidian.js';

const DEFAULT_DATE_OPTIONS = { today: 'Today', selectedDate: 'Selected date' };
const WEEK_START_OPTIONS = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
const WEEK_NUMBERS_OPTIONS = {
  0: 'Off',
  1: 'ISO 8601',
  2: 'Western traditional',
  3: 'Middle Eastern',
  4: 'Auto (based on week start)',
};
const ANOTHER_FORMAT_DESC =
  'Another date format to be inserted. If set, display buttons to select a format at the bottom of the calendar. Buttons can be selected by clicking or by “1" or “2" shortcut keys.';

const HIGHLIGHT_CONTROLS = [
  ['highlightSun', 'sun', 0, 'Sunday'],
  ['highlightMon', 'mon', 1, 'Monday'],
  ['highlightTue', 'tue', 2, 'Tuesday'],
  ['highlightWed', 'wed', 3, 'Wednesday'],
  ['highlightThu', 'thu', 4, 'Thursday'],
  ['highlightFri', 'fri', 5, 'Friday'],
  ['highlightSat', 'sat', 6, 'Saturday'],
] as const;

const emptySpec = (format: string) => ({ format, regex: '', minLength: 0, maxLength: 0 });

const createTab = (overrides: Partial<Settings> = {}) => {
  const plugin = {
    settings: {
      ...structuredClone(DEFAULT_SETTINGS),
      dateFormatSpecs: [emptySpec('yyyy-mm-dd'), emptySpec('')],
      ...overrides,
    },
    saveSettings: vi.fn().mockResolvedValue(undefined),
    updateDateFormatSpecs: vi.fn().mockResolvedValue(undefined),
  };
  const tab = new SettingTab({} as App, plugin as unknown as DateInserter);
  return { tab, plugin, settings: plugin.settings };
};

beforeEach(() => {
  Setting.instances = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getControlValue', () => {
  it.each([
    ['defaultDate', { defaultDate: 'selectedDate' }, 'selectedDate'],
    ['language', { language: 'ja' }, 'ja'],
    ['weekStart', { weekStart: 1 }, '1'],
    ['weekNumbers', { weekNumbers: 2 }, '2'],
    ['todayHighlight', { todayHighlight: false }, false],
  ] as [string, Partial<Settings>, unknown][])('reads %s', (key, overrides, expected) => {
    expect(createTab(overrides).tab.getControlValue(key)).toBe(expected);
  });

  it('falls back to today for an empty default date', () => {
    const { tab } = createTab({ defaultDate: '' as Settings['defaultDate'] });
    expect(tab.getControlValue('defaultDate')).toBe('today');
  });

  it('returns undefined for an unknown key', () => {
    expect(createTab().tab.getControlValue('unknown')).toBeUndefined();
  });

  it.each(HIGHLIGHT_CONTROLS)('reads %s from the day %s', (key, day, value) => {
    const { tab } = createTab();
    expect(tab.getControlValue(key)).toBe(false);

    const { tab: highlighted } = createTab({
      daysOfWeekHighlighted: { ...DEFAULT_SETTINGS.daysOfWeekHighlighted, [day]: value },
    });
    expect(highlighted.getControlValue(key)).toBe(true);
  });
});

describe('setControlValue', () => {
  it.each([
    ['defaultDate', 'selectedDate', { defaultDate: 'selectedDate' }],
    ['weekStart', '3', { weekStart: 3 }],
    ['weekStart', 'invalid', { weekStart: 0 }],
    ['weekNumbers', '4', { weekNumbers: 4 }],
    ['todayHighlight', false, { todayHighlight: false }],
  ])('saves %s = %s', async (key, value, expected) => {
    const { tab, plugin, settings } = createTab({ weekStart: 6 });
    await tab.setControlValue(key, value);

    expect(settings).toMatchObject(expected);
    expect(plugin.saveSettings).toHaveBeenCalledOnce();
    expect(plugin.updateDateFormatSpecs).not.toHaveBeenCalled();
  });

  it('regenerates the date format specs when the language changes', async () => {
    const { tab, plugin, settings } = createTab();
    await tab.setControlValue('language', 'ja');

    expect(settings.language).toBe('ja');
    expect(plugin.updateDateFormatSpecs).toHaveBeenCalledOnce();
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it('does nothing for an unknown key', async () => {
    const { tab, plugin, settings } = createTab();
    const before = structuredClone(settings);
    await tab.setControlValue('unknown', 'value');

    expect(settings).toEqual(before);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
    expect(plugin.updateDateFormatSpecs).not.toHaveBeenCalled();
  });

  it.each(HIGHLIGHT_CONTROLS)('saves %s to the day %s only', async (key, day, value) => {
    const { tab, plugin, settings } = createTab();

    await tab.setControlValue(key, true);
    expect(settings.daysOfWeekHighlighted).toEqual({
      ...DEFAULT_SETTINGS.daysOfWeekHighlighted,
      [day]: value,
    });
    expect(plugin.saveSettings).toHaveBeenCalledOnce();

    await tab.setControlValue(key, false);
    expect(settings.daysOfWeekHighlighted).toEqual(DEFAULT_SETTINGS.daysOfWeekHighlighted);
    expect(plugin.saveSettings).toHaveBeenCalledTimes(2);
  });
});

describe('getSettingDefinitions', () => {
  it('defines every setting', () => {
    expect(createTab().tab.getSettingDefinitions()).toEqual([
      {
        name: 'Date format',
        desc: 'Date format to be inserted.',
        render: expect.any(Function),
      },
      {
        name: 'Another date format (Optional)',
        desc: ANOTHER_FORMAT_DESC,
        render: expect.any(Function),
      },
      {
        name: 'Default date on calendar open',
        desc: 'Choose which date is selected when opening the calendar.',
        control: { type: 'dropdown', key: 'defaultDate', options: DEFAULT_DATE_OPTIONS },
      },
      {
        name: 'Language',
        desc: 'Set calendar and date-related languages.',
        control: { type: 'dropdown', key: 'language', options: LANGUAGES },
      },
      {
        name: 'Week start',
        desc: 'Start day of the week.',
        control: { type: 'dropdown', key: 'weekStart', options: WEEK_START_OPTIONS },
      },
      {
        name: 'Week numbers',
        desc: 'Show week numbers in the calendar.',
        control: { type: 'dropdown', key: 'weekNumbers', options: WEEK_NUMBERS_OPTIONS },
      },
      {
        name: 'Highlight the today',
        desc: 'Whether to highlight the today.',
        control: { type: 'toggle', key: 'todayHighlight' },
      },
      {
        type: 'group',
        heading: 'Highlight days of week',
        items: HIGHLIGHT_CONTROLS.map(([key, , , name]) => ({
          name,
          control: { type: 'toggle', key },
        })),
      },
    ]);
  });

  it('renders the date formats with the same control as display', () => {
    const { tab } = createTab();
    const definitions = tab.getSettingDefinitions() as unknown as {
      render: (setting: Setting) => void;
    }[];

    [0, 1].forEach((index) => {
      const setting = new Setting(document.createElement('div'));
      definitions[index].render(setting);
      expect(setting.control?.type).toBe('text');
    });
    expect(Setting.instances[0].control?.value).toBe('yyyy-mm-dd');
    expect(Setting.instances[1].control?.value).toBe('');
  });
});

describe('display', () => {
  const open = (overrides: Partial<Settings> = {}) => {
    const result = createTab(overrides);
    result.tab.display();
    return result;
  };

  const settingNamed = (name: string): Setting => {
    const setting = Setting.instances.find((instance) => instance.name === name);
    if (!setting) {
      throw new Error(`There is no setting named ${name}.`);
    }
    return setting;
  };

  it('shows the settings in order', () => {
    open();
    expect(Setting.instances.slice(0, 8).map(({ name }) => name)).toEqual([
      'Date format',
      'Another date format (Optional)',
      'Default date on calendar open',
      'Language',
      'Week start',
      'Week numbers',
      'Highlight the today',
      'Highlight days of week',
    ]);
  });

  it('clears the previous content when displayed again', () => {
    const { tab } = open();
    const count = tab.containerEl.children.length;
    tab.display();
    expect(tab.containerEl.children.length).toBe(count);
  });

  it.each([
    [
      'Default date on calendar open',
      'Choose which date is selected when opening the calendar.',
      DEFAULT_DATE_OPTIONS,
      'today',
    ],
    ['Language', 'Set calendar and date-related languages.', LANGUAGES, 'en'],
    ['Week start', 'Start day of the week.', WEEK_START_OPTIONS, '0'],
    ['Week numbers', 'Show week numbers in the calendar.', WEEK_NUMBERS_OPTIONS, '0'],
  ])('shows the dropdown %s', (name, desc, options, value) => {
    open();
    const setting = settingNamed(name);
    expect(setting.desc).toBe(desc);
    expect(setting.control).toMatchObject({ type: 'dropdown', options, value });
  });

  it('shows the toggle for highlighting today', () => {
    open({ todayHighlight: false });
    const setting = settingNamed('Highlight the today');
    expect(setting.desc).toBe('Whether to highlight the today.');
    expect(setting.control).toMatchObject({ type: 'toggle', value: false });
  });

  it.each([
    ['Default date on calendar open', 'selectedDate', { defaultDate: 'selectedDate' }],
    ['Week start', '2', { weekStart: 2 }],
    ['Week numbers', '1', { weekNumbers: 1 }],
    ['Highlight the today', false, { todayHighlight: false }],
  ])('saves a change of %s', async (name, value, expected) => {
    const { plugin, settings } = open();
    await settingNamed(name).control?.change(value as never);

    expect(settings).toMatchObject(expected);
    expect(plugin.saveSettings).toHaveBeenCalledOnce();
  });

  it('regenerates the date format specs on a language change', async () => {
    const { plugin, settings } = open();
    await settingNamed('Language').control?.change('de' as never);

    expect(settings.language).toBe('de');
    expect(plugin.updateDateFormatSpecs).toHaveBeenCalledOnce();
  });

  describe('highlighted days of the week', () => {
    it('shows a toggle per day after the heading setting', () => {
      const { tab } = open({
        daysOfWeekHighlighted: { ...DEFAULT_SETTINGS.daysOfWeekHighlighted, sat: 6 },
      });
      const heading = settingNamed('Highlight days of week');
      expect(heading.desc).toBe('Days of the week to highlight in the calendar.');
      expect(heading.control).toBeUndefined();

      const days = Setting.instances.slice(8);
      expect(days.map(({ desc }) => desc)).toEqual(
        HIGHLIGHT_CONTROLS.map(([, , , label]) => label),
      );
      expect(days.map(({ control }) => control?.value)).toEqual([
        false,
        false,
        false,
        false,
        false,
        false,
        true,
      ]);

      const group = tab.containerEl.querySelector('.setting-day-of-week');
      expect(heading.settingEl.nextSibling).toBe(group);
      expect(group?.children.length).toBe(7);
    });

    it('saves a change of a day', async () => {
      const { plugin, settings } = open();
      await Setting.instances[9].control?.change(true as never);

      expect(settings.daysOfWeekHighlighted.mon).toBe(1);
      expect(plugin.saveSettings).toHaveBeenCalledOnce();
    });
  });

  describe('date formats', () => {
    it('shows the current formats with a placeholder', () => {
      open();
      expect(settingNamed('Date format').control).toMatchObject({
        type: 'text',
        value: 'yyyy-mm-dd',
        placeholder: 'mm/dd/yyyy',
      });
      expect(settingNamed('Another date format (Optional)').control).toMatchObject({
        type: 'text',
        value: '',
        placeholder: 'mm/dd/yyyy',
      });
    });

    it('falls back to the default format only for the first format', () => {
      open({ dateFormatSpecs: [emptySpec(''), emptySpec('')] });
      expect(settingNamed('Date format').control?.value).toBe('mm/dd/yyyy');
      expect(settingNamed('Another date format (Optional)').control?.value).toBe('');
    });

    it('describes the first format with examples and a link', () => {
      open();
      const desc = settingNamed('Date format').desc as HTMLElement;
      expect(desc.textContent).toContain('Date format to be inserted.');
      expect(desc.textContent).toContain('ex1) mm/dd/yyyy => 01/23/2024');
      expect(desc.querySelector('a')?.getAttribute('href')).toBe(
        'https://mymth.github.io/vanillajs-datepicker/#/date-string+format',
      );
      expect(settingNamed('Another date format (Optional)').desc).toBe(ANOTHER_FORMAT_DESC);
    });

    it('updates the format at once and saves it after the debounce', () => {
      const { tab, plugin, settings } = open();
      settingNamed('Another date format (Optional)').control?.change('m/d' as never);

      expect(settings.dateFormatSpecs[1].format).toBe('m/d');
      expect(plugin.updateDateFormatSpecs).not.toHaveBeenCalled();

      tab.hide();
      expect(plugin.updateDateFormatSpecs).toHaveBeenCalledOnce();
    });

    it('saves a pending change when the input loses focus', () => {
      const { plugin } = open();
      const control = settingNamed('Date format').control;
      control?.change('m/d' as never);
      control?.inputEl.dispatchEvent(new Event('blur'));

      expect(plugin.updateDateFormatSpecs).toHaveBeenCalledOnce();
    });

    it('saves nothing on hide without a change', () => {
      const { tab, plugin } = open();
      tab.hide();
      expect(plugin.updateDateFormatSpecs).not.toHaveBeenCalled();
    });

    it('logs a failure to save', async () => {
      const error = new Error('failed');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { tab, plugin } = open();
      plugin.updateDateFormatSpecs.mockRejectedValue(error);

      settingNamed('Date format').control?.change('m/d' as never);
      tab.hide();

      await vi.waitFor(() => expect(consoleError).toHaveBeenCalledWith(error));
    });
  });
});
