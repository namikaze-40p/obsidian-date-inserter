import { describe, expect, it } from 'vitest';

import { generateDateFormatSpec } from '../src/dateFormatSpec.js';

const matchesWhole = (format: string, text: string, language = 'en'): boolean =>
  new RegExp(`^${generateDateFormatSpec(format, language).regex}$`).test(text);

describe('generateDateFormatSpec', () => {
  it('keeps the format and generates the regex of the default format', () => {
    expect(generateDateFormatSpec('mm/dd/yyyy', 'en')).toEqual({
      format: 'mm/dd/yyyy',
      regex: '(?:0[1-9]|1[0-2])/(?:0[1-9]|[12][0-9]|3[01])/(?:\\d{4})',
      minLength: 10,
      maxLength: 10,
    });
  });

  it.each([
    ['d', '(?:[1-9]|[12][0-9]|3[01])', 1, 2],
    ['dd', '(?:0[1-9]|[12][0-9]|3[01])', 2, 2],
    ['m', '(?:[1-9]|1[0-2])', 1, 2],
    ['mm', '(?:0[1-9]|1[0-2])', 2, 2],
    ['y', '(?:\\d+)', 1, 4],
    ['yy', '(?:\\d{2})', 2, 2],
    ['yyyy', '(?:\\d{4})', 4, 4],
  ])('generates the numeric token %s', (format, regex, minLength, maxLength) => {
    expect(generateDateFormatSpec(format, 'en')).toEqual({ format, regex, minLength, maxLength });
  });

  it.each([
    ['DD', 6, 9],
    ['D', 3, 3],
    ['MM', 3, 9],
    ['M', 3, 3],
  ])('takes the length of the name token %s from the locale', (format, minLength, maxLength) => {
    expect(generateDateFormatSpec(format, 'en')).toMatchObject({ minLength, maxLength });
  });

  it('sums the lengths of tokens and literals', () => {
    expect(generateDateFormatSpec('DD, MM d, yyyy', 'en')).toMatchObject({
      minLength: 6 + 2 + 3 + 1 + 1 + 2 + 4,
      maxLength: 9 + 2 + 9 + 1 + 2 + 2 + 4,
    });
  });

  it('uses the names of the given language', () => {
    expect(generateDateFormatSpec('MM', 'ja')).toMatchObject({ minLength: 2, maxLength: 3 });
    expect(matchesWhole('MM', 'Januar', 'de')).toBe(true);
    expect(matchesWhole('MM', 'January', 'de')).toBe(false);
  });

  it('falls back to English for an unknown language', () => {
    expect(generateDateFormatSpec('MM', 'xx').regex).toBe(generateDateFormatSpec('MM', 'en').regex);
  });

  it('escapes regex characters in literals', () => {
    expect(generateDateFormatSpec('(yyyy.mm)', 'en').regex).toBe(
      '\\((?:\\d{4})\\.(?:0[1-9]|1[0-2])\\)',
    );
    expect(matchesWhole('yyyy.mm', '2026.01')).toBe(true);
    expect(matchesWhole('yyyy.mm', '2026-01')).toBe(false);
  });

  it('escapes regex characters in locale names', () => {
    expect(matchesWhole('M', 'janv.', 'fr')).toBe(true);
    expect(matchesWhole('M', 'janvx', 'fr')).toBe(false);
  });

  it('generates literal-only specs for formats without tokens', () => {
    expect(generateDateFormatSpec('abc', 'en')).toEqual({
      format: 'abc',
      regex: 'abc',
      minLength: 3,
      maxLength: 3,
    });
    expect(generateDateFormatSpec('', 'en')).toEqual({
      format: '',
      regex: '',
      minLength: 0,
      maxLength: 0,
    });
  });

  it('splits over-long tokens the same way as formatting does', () => {
    expect(generateDateFormatSpec('yyy', 'en').regex).toBe('(?:\\d{2})(?:\\d+)');
    expect(generateDateFormatSpec('mmm', 'en').regex).toBe('(?:0[1-9]|1[0-2])(?:[1-9]|1[0-2])');
  });

  it('treats token letters inside literal text as tokens', () => {
    expect(matchesWhole('Date: yyyy', 'Monate: 2026')).toBe(true);
  });

  it('prefers the long token of a kind even when the short one comes first', () => {
    // Formatting outputs "2026-2026", which this regex does not match.
    expect(generateDateFormatSpec('y-yyyy', 'en').regex).toBe('y-(?:\\d{4})');
  });

  describe('numeric ranges', () => {
    it.each([
      ['dd', ['01', '09', '10', '29', '31'], ['00', '1', '32', '99']],
      ['d', ['1', '9', '10', '31'], ['0', '01', '32']],
      ['mm', ['01', '09', '10', '12'], ['00', '1', '13']],
      ['m', ['1', '9', '10', '12'], ['0', '01', '13']],
      ['yyyy', ['0001', '2026'], ['26', '20260']],
      ['yy', ['00', '26'], ['2', '026']],
      ['y', ['1', '645', '2026', '20260'], ['']],
    ])('%s', (format, valid, invalid) => {
      valid.forEach((text) => expect(matchesWhole(format, text)).toBe(true));
      invalid.forEach((text) => expect(matchesWhole(format, text)).toBe(false));
    });
  });
});
