import { afterEach, beforeEach, vi } from 'vitest';

/** Local midnight in epoch ms. Unlike `new Date(y, m, d)`, keeps years 0-99 as they are. */
export const localDate = (year: number, month: number, day: number): number => {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  return date.setHours(0, 0, 0, 0);
};

export const TODAY = localDate(2026, 6, 15);

/** Date parts missing from the parsed text are filled in from today, so today has to be fixed. */
export const useFixedToday = (): void => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 15, 12, 30));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
};
