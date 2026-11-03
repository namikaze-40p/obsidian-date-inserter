import type { App, Editor } from 'obsidian';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateDateFormatSpec } from '../src/dateFormatSpec.js';
import { CalendarModal } from '../src/modal.js';
import { DEFAULT_SETTINGS } from '../src/settings.js';
import { localDate, useFixedToday } from './helpers.js';
import { Notice } from './stubs/obsidian.js';

useFixedToday();

const createEditor = () => ({
  getSelection: () => '',
  getCursor: () => ({ line: 2, ch: 4 }),
  getLine: () => 'foo bar',
  setSelection: vi.fn(),
  replaceRange: vi.fn(),
  setCursor: vi.fn(),
});

const openCalendar = (
  formats: string[],
  language = 'en',
  editor?: ReturnType<typeof createEditor>,
) => {
  const dateFormatSpecs = formats.map((format) => generateDateFormatSpec(format, language));
  const settings = { ...DEFAULT_SETTINGS, dateFormatSpecs, language };
  const modal = new CalendarModal({} as App, settings, editor as unknown as Editor | undefined);
  modal.open();
  return modal;
};

const clickDate = (modal: CalendarModal, date: number): void => {
  const cell = modal.modalEl.querySelector<HTMLElement>(`.datepicker-cell[data-date="${date}"]`);
  if (!cell) {
    throw new Error(`The calendar does not show the date ${date}.`);
  }
  cell.click();
};

const clickFormatButton = (modal: CalendarModal, index: number): void => {
  modal.modalEl.querySelectorAll<HTMLElement>('.format-buttons button')[index].click();
};

/** Selects June 23, 2026 (a Tuesday) in a calendar opened on today's month. */
const insertedText = (formats: string[], language?: string, pressButton?: number) => {
  const editor = createEditor();
  const modal = openCalendar(formats, language, editor);
  if (pressButton !== undefined) {
    clickFormatButton(modal, pressButton);
  }
  clickDate(modal, localDate(2026, 6, 23));
  return editor.replaceRange.mock.calls[0]?.[0];
};

afterEach(() => {
  document.body.replaceChildren();
  Notice.messages = [];
  vi.unstubAllGlobals();
});

describe('selecting a date in the calendar', () => {
  it('replaces the editor selection and moves the cursor behind the text', () => {
    const editor = createEditor();
    const modal = openCalendar(['mm/dd/yyyy'], 'en', editor);
    clickDate(modal, localDate(2026, 6, 23));

    const cursor = { line: 2, ch: 4 };
    expect(editor.replaceRange).toHaveBeenCalledExactlyOnceWith('06/23/2026', cursor, cursor);
    expect(editor.setCursor).toHaveBeenCalledExactlyOnceWith(2, 14);
  });

  it.each([
    ['yyyy-mm-dd', '2026-06-23'],
    ['m/d/yy', '6/23/26'],
    ['DD, MM d, y', 'Tuesday, June 23, 2026'],
    ['yyyy.mm.dd(D)', '2026.06.23(Tue)'],
    ['yyyymmdd', '20260623'],
    ['yyyy年m月d日', '2026年6月23日'],
  ])('inserts the date in the format %s', (format, expected) => {
    expect(insertedText([format])).toBe(expected);
  });

  it.each([
    ['ja', '2026年6月23日(火)', 'yyyy年Md日(D)'],
    ['de', 'Dienstag, 23. Juni', 'DD, d. MM'],
  ])('uses the names of the language %s', (language, expected, format) => {
    expect(insertedText([format], language)).toBe(expected);
  });

  it('falls back to English names for an unknown language', () => {
    expect(insertedText(['MM'], 'xx')).toBe('June');
  });

  it.each(['', 'abc'])('uses the default format when the first format is "%s"', (format) => {
    expect(insertedText([format])).toBe('06/23/2026');
  });
});

describe('format buttons', () => {
  const formats = ['mm/dd/yyyy', 'yyyy-mm-dd'];

  it('uses the first format by default', () => {
    expect(insertedText(formats)).toBe('06/23/2026');
  });

  it.each([
    [0, '06/23/2026'],
    [1, '2026-06-23'],
  ])('uses the format of the clicked button %i', (index, expected) => {
    expect(insertedText(formats, 'en', index)).toBe(expected);
  });

  it('switches back to the first format', () => {
    const editor = createEditor();
    const modal = openCalendar(formats, 'en', editor);
    clickFormatButton(modal, 1);
    clickFormatButton(modal, 0);
    clickDate(modal, localDate(2026, 6, 23));
    expect(editor.replaceRange.mock.calls[0][0]).toBe('06/23/2026');
  });

  it('switches format with the 1 and 2 keys', () => {
    const editor = createEditor();
    const modal = openCalendar(formats, 'en', editor);
    modal.modalEl.dispatchEvent(new KeyboardEvent('keyup', { key: '2' }));
    clickDate(modal, localDate(2026, 6, 23));
    expect(editor.replaceRange.mock.calls[0][0]).toBe('2026-06-23');
  });

  it('keeps the default format for a first format without tokens until a button is pressed', () => {
    expect(insertedText(['abc', 'yyyy-mm-dd'])).toBe('06/23/2026');
  });

  it('inserts nothing when the selected format has no tokens', () => {
    const error = vi.fn();
    window.addEventListener('error', error);
    const editor = createEditor();
    const modal = openCalendar(['mm/dd/yyyy', 'abc'], 'en', editor);
    clickFormatButton(modal, 1);
    try {
      clickDate(modal, localDate(2026, 6, 23));
    } catch {
      // Whether the error reaches here depends on how the DOM reports listener errors.
    }
    window.removeEventListener('error', error);
    expect(editor.replaceRange).not.toHaveBeenCalled();
  });
});

describe('copying to the clipboard', () => {
  it('copies the formatted date when there is no editor', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const modal = openCalendar(['yyyy-mm-dd']);
    clickDate(modal, localDate(2026, 6, 23));

    expect(writeText).toHaveBeenCalledExactlyOnceWith('2026-06-23');
    await vi.waitFor(() => expect(Notice.messages).toEqual(['Date copied to clipboard.']));
  });
});
