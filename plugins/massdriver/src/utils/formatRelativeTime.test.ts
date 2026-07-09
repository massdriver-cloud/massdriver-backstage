import {
  formatRelativeTime,
  formatCurrency,
  formatAbsoluteTime,
} from './formatRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-09T12:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a placeholder for empty or invalid input', () => {
    expect(formatRelativeTime(null)).toBe('--');
    expect(formatRelativeTime(undefined)).toBe('--');
    expect(formatRelativeTime('not a date')).toBe('--');
  });

  it('formats seconds in the past (numeric always)', () => {
    expect(formatRelativeTime('2026-07-09T11:59:30Z')).toBe('30 seconds ago');
  });

  it('crosses into the minutes division', () => {
    expect(formatRelativeTime('2026-07-09T11:58:00Z')).toBe('2 minutes ago');
  });

  it('formats hours and days in the past', () => {
    expect(formatRelativeTime('2026-07-09T10:00:00Z')).toBe('2 hours ago');
    expect(formatRelativeTime('2026-07-06T12:00:00Z')).toBe('3 days ago');
  });

  it('formats times in the future', () => {
    expect(formatRelativeTime('2026-07-09T12:00:45Z')).toBe('in 45 seconds');
  });
});

describe('formatCurrency', () => {
  it('returns the fallback for null/undefined', () => {
    expect(formatCurrency(null)).toBe('--');
    expect(formatCurrency(undefined)).toBe('--');
    expect(formatCurrency(null, 'USD', 'n/a')).toBe('n/a');
  });

  it('formats a USD amount by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero (not treated as missing)', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('honors a custom currency', () => {
    expect(formatCurrency(10, 'EUR')).toBe('€10.00');
  });
});

describe('formatAbsoluteTime', () => {
  it('returns an empty string for empty or invalid input', () => {
    expect(formatAbsoluteTime(null)).toBe('');
    expect(formatAbsoluteTime(undefined)).toBe('');
    expect(formatAbsoluteTime('not a date')).toBe('');
  });

  it('formats a valid ISO timestamp with the locale string form', () => {
    const iso = '2026-07-09T12:34:00Z';
    expect(formatAbsoluteTime(iso)).toBe(new Date(iso).toLocaleString());
  });
});
