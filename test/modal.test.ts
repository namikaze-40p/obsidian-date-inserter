import type { App, Editor } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';

import { generateDateFormatSpec } from '../src/dateFormatSpec.js';
import { CalendarModal } from '../src/modal.js';
import { DEFAULT_SETTINGS } from '../src/settings.js';
import { localDate, useFixedToday } from './helpers.js';

useFixedToday();

type DetectOptions = {
  formats: string[];
  language?: string;
  isDefaultToday?: boolean;
  selection?: string;
};

/**
 * Runs the date detection done when the calendar opens.
 * `line` is the editor line with `|` marking the cursor position.
 */
const detect = (
  line: string,
  { formats, language = 'en', isDefaultToday = false, selection = '' }: DetectOptions,
) => {
  const ch = line.indexOf('|');
  const text = line.replace('|', '');
  const setSelection = vi.fn();
  const editor = {
    getSelection: () => selection,
    getCursor: () => ({ line: 0, ch }),
    getLine: () => text,
    setSelection,
  } as unknown as Editor;

  const dateFormatSpecs = formats.map((format) => generateDateFormatSpec(format, language));
  const settings = { ...DEFAULT_SETTINGS, dateFormatSpecs, language };
  const modal = new CalendarModal({} as App, settings, editor);
  const startDate = modal['getStartDate'](dateFormatSpecs, isDefaultToday);

  const selected = setSelection.mock.calls[0];
  return { startDate, selectedText: selected && text.slice(selected[0].ch, selected[1].ch) };
};

const NOT_DETECTED = { startDate: undefined, selectedText: undefined };

describe('date detection at the cursor', () => {
  const formats = ['mm/dd/yyyy'];
  const JAN_5_2026 = { startDate: localDate(2026, 1, 5), selectedText: '01/05/2026' };

  it.each([
    ['inside', 'foo 01/0|5/2026 bar'],
    ['at the start of', 'foo |01/05/2026 bar'],
    ['at the end of', 'foo 01/05/2026| bar'],
  ])('detects the date when the cursor is %s it', (_, line) => {
    expect(detect(line, { formats })).toEqual(JAN_5_2026);
  });

  it.each([
    ['before', 'foo| 01/05/2026 bar'],
    ['after', 'foo 01/05/2026 b|ar'],
  ])('ignores a date when the cursor is %s it', (_, line) => {
    expect(detect(line, { formats })).toEqual(NOT_DETECTED);
  });

  it('picks the date under the cursor when the line has several', () => {
    expect(detect('01/05/2026 02/0|6/2027', { formats })).toEqual({
      startDate: localDate(2027, 2, 6),
      selectedText: '02/06/2027',
    });
  });

  it('picks the earlier date when the cursor touches two', () => {
    expect(detect('01/05/2026|02/06/2027', { formats })).toEqual(JAN_5_2026);
  });

  it('ignores a line shorter than the format', () => {
    expect(detect('01/|05', { formats })).toEqual(NOT_DETECTED);
    expect(detect('|', { formats })).toEqual(NOT_DETECTED);
  });

  it('selects the date but starts from today when the default date is today', () => {
    expect(detect('01/0|5/2026', { formats, isDefaultToday: true })).toEqual({
      startDate: undefined,
      selectedText: '01/05/2026',
    });
  });

  it.each([
    ['02/3|1/2026', 'the day does not exist in the month'],
    ['02/2|9/2026', 'the year is not a leap year'],
    ['13/0|1/2026', 'the month does not match the format'],
  ])('rejects %s because %s', (line) => {
    expect(detect(line, { formats })).toEqual(NOT_DETECTED);
  });

  it('accepts February 29 in a leap year', () => {
    expect(detect('02/2|9/2024', { formats })).toEqual({
      startDate: localDate(2024, 2, 29),
      selectedText: '02/29/2024',
    });
  });

  it.each([
    ['foo 2026-0|1-05 bar', 'yyyy-mm-dd', localDate(2026, 1, 5), '2026-01-05'],
    ['foo 1/|5/2026 bar', 'm/d/yyyy', localDate(2026, 1, 5), '1/5/2026'],
    ['foo 11/2|3/2026 bar', 'm/d/yyyy', localDate(2026, 11, 23), '11/23/2026'],
    ['foo January |5, 2026 bar', 'MM d, yyyy', localDate(2026, 1, 5), 'January 5, 2026'],
    ['foo Jan |5, 2026 bar', 'M d, yyyy', localDate(2026, 1, 5), 'Jan 5, 2026'],
    ['Mon|day, 2026-01-05', 'DD, yyyy-mm-dd', localDate(2026, 1, 5), 'Monday, 2026-01-05'],
    ['2026年1|月5日', 'yyyy年m月d日', localDate(2026, 1, 5), '2026年1月5日'],
  ])('detects %s with the format %s', (line, format, startDate, selectedText) => {
    expect(detect(line, { formats: [format] })).toEqual({ startDate, selectedText });
  });

  it.each([
    ['Sun|day, 2026-01-05', 'DD, yyyy-mm-dd', 'the day name is wrong for the date'],
    ['01/0|5/2026', 'm/d/yyyy', 'the digits are not padded the way the format is'],
    ['january |5, 2026', 'MM d, yyyy', 'the case of the name differs'],
  ])('rejects %s with the format %s because %s', (line, format) => {
    expect(detect(line, { formats: [format] })).toEqual(NOT_DETECTED);
  });

  it.each(['abc', ''])('does not throw on the format "%s" without tokens', (format) => {
    expect(detect('foo a|bc bar', { formats: [format] })).toEqual(NOT_DETECTED);
  });

  describe('languages', () => {
    it.each([
      ['de', 'Monta|g, Januar 5, 2026', 'DD, MM d, yyyy'],
      ['es', 'Lune|s, Enero 5, 2026', 'DD, MM d, yyyy'],
      ['fr', 'lun|. janv. 5, 2026', 'D M d, yyyy'],
      ['it', 'Luned|ì, Gennaio 5, 2026', 'DD, MM d, yyyy'],
      ['ja', '2026年1|月5日(月)', 'yyyy年Md日(D)'],
      ['ko', '2026-1|월-5', 'yyyy-M-d'],
      ['th', '5 มกร|าคม 2026', 'd MM yyyy'],
      ['vi', '5 Th|1 2026', 'd M yyyy'],
      ['zh-CN', '一|月 5, 2026', 'MM d, yyyy'],
      ['zh-TW', '一|月 5, 2026', 'MM d, yyyy'],
    ])('detects a date in %s', (language, line, format) => {
      expect(detect(line, { formats: [format], language })).toEqual({
        startDate: localDate(2026, 1, 5),
        selectedText: line.replace('|', ''),
      });
    });

    it.each(['xx', ''])('falls back to English for the language "%s"', (language) => {
      expect(detect('Janu|ary 5, 2026', { formats: ['MM d, yyyy'], language })).toEqual({
        startDate: localDate(2026, 1, 5),
        selectedText: 'January 5, 2026',
      });
    });
  });

  // Current limitations, kept as they are so that replacing the library doesn't change them
  // silently. Change these expectations only when deliberately changing the behaviour.
  describe('known limitations', () => {
    it('reads a two-digit year as the year itself, not as 20xx', () => {
      expect(detect('26-0|1-05', { formats: ['yy-mm-dd'] })).toEqual({
        startDate: localDate(26, 1, 5),
        selectedText: '26-01-05',
      });
    });

    it.each(['yyyymmdd', 'mmddyyyy'])(
      'does not detect the format %s without separators',
      (format) => {
        const line = format === 'yyyymmdd' ? '2026|0105' : '0105|2026';
        expect(detect(line, { formats: [format] })).toEqual(NOT_DETECTED);
      },
    );

    it('does not detect a Vietnamese full month name, which contains a space', () => {
      expect(detect('5 Thán|g 1 2026', { formats: ['d MM yyyy'], language: 'vi' })).toEqual(
        NOT_DETECTED,
      );
    });

    it('does not detect a Thai short month name sharing a prefix with an earlier month', () => {
      expect(detect('5 ก.|ค. 2026', { formats: ['d M yyyy'], language: 'th' })).toEqual(
        NOT_DETECTED,
      );
    });

    it('does not detect a Japanese day name starting with a separator character', () => {
      expect(detect('日|曜, 2026-02-15', { formats: ['DD, yyyy-mm-dd'], language: 'ja' })).toEqual(
        NOT_DETECTED,
      );
    });
  });
});

describe('date detection in a selection', () => {
  it('parses a date inside the selection regardless of the cursor', () => {
    const { startDate, selectedText } = detect('|foo 01/05/2026 bar', {
      formats: ['mm/dd/yyyy'],
      selection: 'foo 01/05/2026 bar',
    });
    expect(startDate).toBe(localDate(2026, 1, 5));
    expect(selectedText).toBeUndefined();
  });

  it('uses the first date in the selection', () => {
    const { startDate } = detect('|', {
      formats: ['mm/dd/yyyy'],
      selection: '01/05/2026 02/06/2027',
    });
    expect(startDate).toBe(localDate(2026, 1, 5));
  });

  it('finds nothing in a selection without a date', () => {
    const { startDate } = detect('|', { formats: ['mm/dd/yyyy'], selection: 'foo bar baz' });
    expect(startDate).toBeUndefined();
  });
});

describe('date detection with two formats', () => {
  it('prefers the widest match regardless of the format order', () => {
    const expected = { startDate: localDate(2026, 1, 5), selectedText: '2026-01-05' };
    expect(detect('2026-0|1-05', { formats: ['yyyy-mm-dd', 'mm-dd'] })).toEqual(expected);
    expect(detect('2026-0|1-05', { formats: ['mm-dd', 'yyyy-mm-dd'] })).toEqual(expected);
  });

  it('keeps the first format when both matches are equally wide', () => {
    expect(detect('01/0|2/2026', { formats: ['mm/dd/yyyy', 'dd/mm/yyyy'] })).toEqual({
      startDate: localDate(2026, 1, 2),
      selectedText: '01/02/2026',
    });
  });

  it('uses the other format when the first one is invalid for the text', () => {
    expect(detect('31/0|1/2026', { formats: ['mm/dd/yyyy', 'dd/mm/yyyy'] })).toEqual({
      startDate: localDate(2026, 1, 31),
      selectedText: '31/01/2026',
    });
  });

  it('works with an empty second format', () => {
    expect(detect('01/0|5/2026', { formats: ['mm/dd/yyyy', ''] })).toEqual({
      startDate: localDate(2026, 1, 5),
      selectedText: '01/05/2026',
    });
  });
});
