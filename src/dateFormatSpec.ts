import { LOCALES } from './locales.js';

export type DateFormatSpec = {
  format: string;
  regex: string;
  minLength: number;
  maxLength: number;
};

type RegexPattern = { regex: string; min: number; max: number };

const TOKEN_TYPES = [
  ['yyyy', 'yy', 'y'],
  ['mm', 'm'],
  ['MM', 'M'],
  ['dd', 'd'],
  ['DD', 'D'],
];

export const generateDateFormatSpec = (format: string, language: string): DateFormatSpec => {
  const formatTokens = generateTokens(format);
  const { regex, min: minLength, max: maxLength } = generateRegex(format, formatTokens, language);
  return { format, regex, minLength, maxLength };
};

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateTokens = (format: string, tokens: string[] = []): string[] => {
  const token = TOKEN_TYPES.reduce(
    (acc, tokenType) => {
      const token = findFirstToken(format, tokenType);
      if (token && token.index < acc.index) {
        return token;
      }
      return acc;
    },
    { format: '', index: Infinity },
  );

  if (token.format) {
    const nextFormat = format.slice(token.index + token.format.length);
    return generateTokens(nextFormat, [...tokens, token.format]);
  }
  return tokens;
};

const generateRegex = (
  format: string,
  formatTokens: string[],
  language: string,
  result: RegexPattern = { regex: '', min: 0, max: 0 },
): RegexPattern => {
  const [currentToken, ...restTokens] = formatTokens;
  const token = currentToken ? findFirstToken(format, [currentToken]) : null;
  if (token) {
    const { regex, min, max } = formatToRegexPattern(token.format, language);
    const prefix = format.slice(0, token.index);
    return generateRegex(format.slice(token.index + token.format.length), restTokens, language, {
      regex: result.regex + escapeRegex(prefix) + regex,
      min: result.min + prefix.length + min,
      max: result.max + prefix.length + max,
    });
  }
  return {
    regex: result.regex + escapeRegex(format),
    min: result.min + format.length,
    max: result.max + format.length,
  };
};

const namesToRegexPattern = (names: string[]): RegexPattern => {
  const regex = `(?:${names.join('|')})`;
  const min = Math.min(...names.map((name) => name.length));
  const max = Math.max(...names.map((name) => name.length));
  return { regex, min, max };
};

const formatToRegexPattern = (format: string, language: string): RegexPattern => {
  const locale = LOCALES[language];
  switch (format) {
    case 'dd': {
      const regex = '(?:0[1-9]|[12][0-9]|3[01])'; // ex: 01, 02, ..., 31
      return { regex, min: 2, max: 2 };
    }
    case 'd': {
      const regex = '(?:[1-9]|[12][0-9]|3[01])'; // ex: 1, 2, ..., 31
      return { regex, min: 1, max: 2 };
    }
    case 'DD':
      return namesToRegexPattern(locale.days); // ex: Sunday, Monday, ..., Saturday
    case 'D':
      return namesToRegexPattern(locale.daysShort); // ex: Sun, Mon, ..., Sat
    case 'mm': {
      const regex = '(?:0[1-9]|1[0-2])'; // ex: 01, 02, ..., 12
      return { regex, min: 2, max: 2 };
    }
    case 'm': {
      const regex = '(?:[1-9]|1[0-2])'; // ex: 1, 2, ..., 12
      return { regex, min: 1, max: 2 };
    }
    case 'MM':
      return namesToRegexPattern(locale.months); // ex: January, February, ..., December
    case 'M':
      return namesToRegexPattern(locale.monthsShort); // ex: Jan, Feb, ..., Dec
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
};

const findFirstToken = (
  format: string,
  formatTokens: string[],
): { format: string; index: number } | null => {
  for (const token of formatTokens) {
    const index = format.indexOf(token);
    if (index >= 0) {
      return { format: token, index };
    }
  }
  return null;
};
