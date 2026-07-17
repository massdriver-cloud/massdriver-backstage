export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PROVISIONED', label: 'Provisioned' },
  { value: 'INITIALIZED', label: 'Initialized' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
];

export const DEFAULT_STATUS_VALUE = 'ALL';

export const statusValueToFilter = (value: string): string | null =>
  value === 'ALL' || !value ? null : value;

export const SORT_OPTIONS = [
  { value: 'NAME_ASC', label: 'Name (A–Z)' },
  { value: 'NAME_DESC', label: 'Name (Z–A)' },
  { value: 'CREATED_AT_DESC', label: 'Newest first' },
  { value: 'CREATED_AT_ASC', label: 'Oldest first' },
];

export const DEFAULT_SORT_VALUE = 'NAME_ASC';

export interface SortInput {
  field: string;
  order: 'ASC' | 'DESC';
}

export const sortValueToInput = (value: string): SortInput => {
  switch (value) {
    case 'NAME_DESC':
      return { field: 'NAME', order: 'DESC' };
    case 'CREATED_AT_ASC':
      return { field: 'CREATED_AT', order: 'ASC' };
    case 'CREATED_AT_DESC':
      return { field: 'CREATED_AT', order: 'DESC' };
    case 'NAME_ASC':
    default:
      return { field: 'NAME', order: 'ASC' };
  }
};

export const formatCost = (
  lastMonth: { amount?: number | null; currency?: string } | null | undefined,
  { fallback = '—' }: { fallback?: string | null } = {},
): string | null => {
  if (!lastMonth || lastMonth.amount == null) return fallback;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: lastMonth.currency || 'USD',
      maximumFractionDigits: 2,
    }).format(lastMonth.amount);
  } catch {
    return `${lastMonth.amount}`;
  }
};
