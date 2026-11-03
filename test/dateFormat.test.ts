import { describe, expect, it } from 'vitest';

// The only reference to the library in the tests: swap these lines when format/parse is replaced.
import { Datepicker } from 'vanillajs-datepicker';
import { LOCALES } from '../src/locales';

Object.assign(Datepicker.locales, LOCALES);
const { formatDate, parseDate } = Datepicker;

import { TODAY, localDate, useFixedToday } from './helpers';

useFixedToday();

// Monday
const JAN_5_2026 = localDate(2026, 1, 5);

describe('formatDate', () => {
  it.each([
    ['d', '5'],
    ['dd', '05'],
    ['D', 'Mon'],
    ['DD', 'Monday'],
    ['m', '1'],
    ['mm', '01'],
    ['M', 'Jan'],
    ['MM', 'January'],
    ['y', '2026'],
    ['yy', '26'],
    ['yyyy', '2026'],
  ])('formats token %s as %s', (format, expected) => {
    expect(formatDate(JAN_5_2026, format, 'en')).toBe(expected);
  });

  it('does not pad two-digit days and months for d and m', () => {
    const date = localDate(2026, 11, 23);
    expect(formatDate(date, 'd', 'en')).toBe('23');
    expect(formatDate(date, 'dd', 'en')).toBe('23');
    expect(formatDate(date, 'm', 'en')).toBe('11');
    expect(formatDate(date, 'mm', 'en')).toBe('11');
  });

  it.each([
    [645, 'y', '645'],
    [645, 'yy', '45'],
    [645, 'yyyy', '0645'],
    [5, 'y', '5'],
    [5, 'yy', '05'],
    [5, 'yyyy', '0005'],
  ])('formats year %i with %s as %s', (year, format, expected) => {
    expect(formatDate(localDate(year, 1, 1), format, 'en')).toBe(expected);
  });

  it.each([
    ['mm/dd/yyyy', '01/05/2026'],
    ['yyyy-mm-dd', '2026-01-05'],
    ['dd.mm.yy', '05.01.26'],
    ['yyyymmdd', '20260105'],
    ['DD, MM d, yyyy', 'Monday, January 5, 2026'],
    ['yyyy年m月d日', '2026年1月5日'],
  ])('combines tokens and literals in %s', (format, expected) => {
    expect(formatDate(JAN_5_2026, format, 'en')).toBe(expected);
  });

  it.each([
    ['yyy', '262026'],
    ['mmm', '011'],
    ['ddd', '055'],
    ['MMM', 'JanuaryJan'],
    ['DDD', 'MondayMon'],
  ])('splits the over-long token %s greedily', (format, expected) => {
    expect(formatDate(JAN_5_2026, format, 'en')).toBe(expected);
  });

  it('treats token letters inside literal text as tokens', () => {
    expect(formatDate(JAN_5_2026, 'Date: yyyy', 'en')).toBe('Monate: 2026');
    expect(formatDate(JAN_5_2026, 'abc-yyyy', 'en')).toBe('abc-2026');
  });

  it.each(['abc', ''])('throws on the format "%s" without tokens', (format) => {
    expect(() => formatDate(JAN_5_2026, format, 'en')).toThrow();
  });

  it.each([
    ['de', 'Montag', 'Mo', 'Januar', 'Jan'],
    ['en', 'Monday', 'Mon', 'January', 'Jan'],
    ['es', 'Lunes', 'Lun', 'Enero', 'Ene'],
    ['fr', 'lundi', 'lun.', 'janvier', 'janv.'],
    ['it', 'Lunedì', 'Lun', 'Gennaio', 'Gen'],
    ['ja', '月曜', '月', '1月', '1月'],
    ['ko', '월요일', '월', '1월', '1월'],
    ['th', 'จันทร์', 'จ', 'มกราคม', 'ม.ค.'],
    ['vi', 'Thứ hai', 'Thứ 2', 'Tháng 1', 'Th1'],
    ['zh-CN', '星期一', '周一', '一月', '1月'],
    ['zh-TW', '星期一', '週一', '一月', '1月'],
  ])('uses the %s names', (language, days, daysShort, months, monthsShort) => {
    expect(formatDate(JAN_5_2026, 'DD', language)).toBe(days);
    expect(formatDate(JAN_5_2026, 'D', language)).toBe(daysShort);
    expect(formatDate(JAN_5_2026, 'MM', language)).toBe(months);
    expect(formatDate(JAN_5_2026, 'M', language)).toBe(monthsShort);
  });

  it('falls back to English for an unknown language', () => {
    expect(formatDate(JAN_5_2026, 'MM', 'xx')).toBe('January');
  });
});

describe('parseDate', () => {
  it.each([
    ['01/05/2026', 'mm/dd/yyyy'],
    ['1/5/2026', 'm/d/yyyy'],
    ['2026-01-05', 'yyyy-mm-dd'],
    ['05.01.2026', 'dd.mm.yyyy'],
    ['2026年1月5日', 'yyyy年m月d日'],
    ['2026年01月05日', 'yyyy年mm月dd日'],
  ])('parses %s with %s', (text, format) => {
    expect(parseDate(text, format, 'en')).toBe(JAN_5_2026);
  });

  it.each([
    ['January 5, 2026', 'MM d, yyyy'],
    ['Jan 5, 2026', 'M d, yyyy'],
    ['january 5, 2026', 'MM d, yyyy'],
    ['JAN 5, 2026', 'M d, yyyy'],
    ['Ja 5, 2026', 'M d, yyyy'],
    ['January 5, 2026', 'M d, yyyy'],
    ['Jan 5, 2026', 'MM d, yyyy'],
  ])('matches month names by case-insensitive prefix: %s with %s', (text, format) => {
    expect(parseDate(text, format, 'en')).toBe(JAN_5_2026);
  });

  it.each([
    ['Monday, 2026-01-05', 'DD, yyyy-mm-dd'],
    ['Sunday, 2026-01-05', 'DD, yyyy-mm-dd'],
    ['Mon 2026-01-05', 'D yyyy-mm-dd'],
  ])('ignores the day name: %s with %s', (text, format) => {
    expect(parseDate(text, format, 'en')).toBe(JAN_5_2026);
  });

  it.each([
    ['2026/01/05', 'yyyy-mm-dd'],
    ['2026 01 05', 'yyyy-mm-dd'],
    ['2026-01-05-99', 'yyyy-mm-dd'],
  ])('does not compare separators or trailing parts: %s with %s', (text, format) => {
    expect(parseDate(text, format, 'en')).toBe(JAN_5_2026);
  });

  it.each([
    ['2026', 'yyyy', localDate(2026, 6, 15)],
    ['03', 'mm', localDate(2026, 3, 15)],
    ['20', 'dd', localDate(2026, 6, 20)],
    ['03-20', 'mm-dd', localDate(2026, 3, 20)],
    ['2026-03', 'yyyy-mm', localDate(2026, 3, 15)],
    ['2026-01', 'yyyy-mm-dd', localDate(2026, 1, 15)],
    ['Xyz 5, 2026', 'M d, yyyy', localDate(2026, 6, 5)],
  ])('fills parts missing from %s (%s) from today', (text, format, expected) => {
    expect(parseDate(text, format, 'en')).toBe(expected);
  });

  it.each([
    ['02/29/2024', localDate(2024, 2, 29)],
    ['02/29/2026', localDate(2026, 3, 1)],
    ['02/31/2026', localDate(2026, 3, 3)],
    ['04/31/2026', localDate(2026, 5, 1)],
    ['04/00/2026', localDate(2026, 3, 31)],
    ['13/01/2026', localDate(2027, 1, 1)],
    ['00/10/2026', localDate(2025, 12, 10)],
  ])('rolls the out-of-range date %s over', (text, expected) => {
    expect(parseDate(text, 'mm/dd/yyyy', 'en')).toBe(expected);
  });

  it.each([
    ['26-01-05', 'yy-mm-dd', localDate(26, 1, 5)],
    ['99-01-05', 'yy-mm-dd', localDate(99, 1, 5)],
    ['0645-03-01', 'yyyy-mm-dd', localDate(645, 3, 1)],
    ['645-03-01', 'y-mm-dd', localDate(645, 3, 1)],
  ])('takes the year in %s (%s) literally', (text, format, expected) => {
    expect(parseDate(text, format, 'en')).toBe(expected);
  });

  it.each([
    ['20260105', 'yyyymmdd', localDate(2026, 6, 15)],
    ['01052026', 'mmddyyyy', localDate(89694, 10, 15)],
  ])('reads %s (%s) as one number because it has no separators', (text, format, expected) => {
    expect(parseDate(text, format, 'en')).toBe(expected);
  });

  it('returns undefined for an empty string', () => {
    expect(parseDate('', 'yyyy-mm-dd', 'en')).toBeUndefined();
  });

  it('returns today for text without date parts', () => {
    expect(parseDate('abc', 'yyyy-mm-dd', 'en')).toBe(TODAY);
    expect(parseDate('today', 'yyyy-mm-dd', 'en')).toBe(TODAY);
  });

  it.each(['abc', ''])('throws on the format "%s" without tokens', (format) => {
    expect(() => parseDate('2026-01-05', format, 'en')).toThrow();
  });

  it.each([
    ['Januar 5', 'MM d', 'de', localDate(2026, 1, 5)],
    ['März 5', 'MM d', 'de', localDate(2026, 3, 5)],
    ['1月 5', 'M d', 'ja', localDate(2026, 1, 5)],
    ['1월 5', 'M d', 'ko', localDate(2026, 1, 5)],
    ['Jan', 'M', 'xx', localDate(2026, 1, 15)],
  ])('parses %s (%s) in the language %s', (text, format, language, expected) => {
    expect(parseDate(text, format, language)).toBe(expected);
  });
});

describe('round trip through formatDate and parseDate', () => {
  const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'th', 'vi', 'zh-CN', 'zh-TW'];
  const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // January 4, 2026 is a Sunday, so these are the days Sunday to Saturday.
  const ALL_DAYS_OF_WEEK = [4, 5, 6, 7, 8, 9, 10];

  const failingMonths = (format: string, language: string): number[] =>
    ALL_MONTHS.filter((month) => {
      const date = localDate(2026, month, 15);
      return parseDate(formatDate(date, format, language), format, language) !== date;
    });

  const failingDays = (format: string, language: string): number[] =>
    ALL_DAYS_OF_WEEK.filter((day) => {
      const date = localDate(2026, 1, day);
      return parseDate(formatDate(date, format, language), format, language) !== date;
    });

  // Names containing a separator (space, period, 年月日) shift the parts that follow them, and
  // month names are matched by prefix. Dates in these formats are not detected at the cursor.
  const KNOWN_MONTH_FAILURES: Record<string, Record<string, number[]>> = {
    'd MM yyyy': { vi: ALL_MONTHS },
    'yyyy-MM-dd': { vi: ALL_MONTHS },
    'd M yyyy': { th: [7, 9, 11] },
    'yyyy-M-dd': { th: [7, 9, 11] },
  };
  const KNOWN_DAY_FAILURES: Record<string, Record<string, number[]>> = {
    'DD, yyyy-mm-dd': { ja: [4, 5], vi: ALL_DAYS_OF_WEEK },
    'D, yyyy-mm-dd': { vi: [5, 6, 7, 8, 9, 10] },
    'yyyy-mm-dd DD': {},
  };

  describe.each(Object.keys(KNOWN_MONTH_FAILURES))('month names in %s', (format) => {
    it.each(LANGUAGES)('%s', (language) => {
      expect(failingMonths(format, language)).toEqual(KNOWN_MONTH_FAILURES[format][language] ?? []);
    });
  });

  describe.each(Object.keys(KNOWN_DAY_FAILURES))('day names in %s', (format) => {
    it.each(LANGUAGES)('%s', (language) => {
      expect(failingDays(format, language)).toEqual(KNOWN_DAY_FAILURES[format][language] ?? []);
    });
  });
});
