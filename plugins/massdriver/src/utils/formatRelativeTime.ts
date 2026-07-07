const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/** Format an ISO timestamp as a relative time, e.g. "3 days ago". */
export const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) {
    return '--';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return '--';
};

/** Absolute, human-readable timestamp for tooltips. */
export const formatAbsoluteTime = (iso: string | null | undefined): string => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};
