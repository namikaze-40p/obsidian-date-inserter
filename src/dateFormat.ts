import { LOCALES } from './locales.js';

type Locale = (typeof LOCALES)[string];

const TOKEN_REGEX = /dd?|DD?|mm?|MM?|yy?(?:yy)?/g;
// Printable ASCII other than letters and digits, whitespace, and 年月日.
const SEPARATOR_REGEX = /[\s!-/:-@[-`{-~年月日]+/;

const padZero = (value: number, length: number): string => String(value).padStart(length, '0');

const FORMATTERS: { [token: string]: (date: Date, locale: Locale) => string } = {
  d: (date) => String(date.getDate()),
  dd: (date) => padZero(date.getDate(), 2),
  D: (date, locale) => locale.daysShort[date.getDay()],
  DD: (date, locale) => locale.days[date.getDay()],
  m: (date) => String(date.getMonth() + 1),
  mm: (date) => padZero(date.getMonth() + 1, 2),
  M: (date, locale) => locale.monthsShort[date.getMonth()],
  MM: (date, locale) => locale.months[date.getMonth()],
  y: (date) => String(date.getFullYear()),
  yy: (date) => padZero(date.getFullYear(), 2).slice(-2),
  yyyy: (date) => padZero(date.getFullYear(), 4),
};

const findMonthIndex = (name: string, locale: Locale): number => {
  const startsWithName = (monthName: string) =>
    monthName.toLowerCase().startsWith(name.toLowerCase());
  // Short names can have periods, so they are not always the first letters of full names.
  const index = locale.monthsShort.findIndex(startsWithName);
  return index >= 0 ? index : locale.months.findIndex(startsWithName);
};

const applyMonth = (time: number, month: string, locale: Locale): number => {
  const number = parseInt(month, 10);
  const monthIndex = isNaN(number) ? findMonthIndex(month, locale) : number - 1;
  if (isNaN(number) && monthIndex < 0) {
    return NaN;
  }
  const date = new Date(time);
  date.setMonth(monthIndex);
  // Today's day may not exist in the month (ex: February 31), which overflows into the next month.
  const expectedMonth = ((monthIndex % 12) + 12) % 12;
  return date.getMonth() === expectedMonth ? date.getTime() : date.setDate(0);
};

const getLocale = (language: string): Locale => LOCALES[language] ?? LOCALES.en;

const getTokens = (format: string): string[] => {
  const tokens = format.match(TOKEN_REGEX);
  if (!tokens) {
    throw new Error('Invalid date format.');
  }
  return tokens;
};

export const hasDateToken = (format: string): boolean => format.search(TOKEN_REGEX) >= 0;

/** @throws if the format has no date tokens. */
export const formatDate = (time: number, format: string, language: string): string => {
  getTokens(format);
  const date = new Date(time);
  const locale = getLocale(language);
  return format.replace(TOKEN_REGEX, (token) => FORMATTERS[token](date, locale));
};

/**
 * Parts missing from the text are filled in from today, and out-of-range parts roll over (ex: 02/31
 * becomes March 3), so compare the result with `formatDate` to tell whether the text is valid.
 * @throws if the text is not empty and the format has no date tokens.
 */
export const parseDate = (text: string, format: string, language: string): number | undefined => {
  if (!text) {
    return undefined;
  }

  const tokens = getTokens(format);
  const parts: { y?: string; m?: string; d?: string } = {};
  text.split(SEPARATOR_REGEX).forEach((part, index) => {
    const kind = tokens[index]?.[0];
    if (part && kind && kind !== 'D') {
      parts[kind.toLowerCase() as keyof typeof parts] = part;
    }
  });

  const locale = getLocale(language);
  const today = new Date().setHours(0, 0, 0, 0);
  // Apply in the order of year, month and day so that the day is not corrected by the month's length.
  const withYear = new Date(today).setFullYear(parseInt(parts.y ?? '', 10));
  const year = isNaN(withYear) ? today : withYear;
  const withMonth = parts.m ? applyMonth(year, parts.m, locale) : NaN;
  const month = isNaN(withMonth) ? year : withMonth;
  const withDay = new Date(month).setDate(parseInt(parts.d ?? '', 10));
  return isNaN(withDay) ? month : withDay;
};
