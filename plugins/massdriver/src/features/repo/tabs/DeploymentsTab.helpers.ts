// Ported from the Massdriver web app

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ABORTED', label: 'Aborted' },
];

export const DEFAULT_STATUS_VALUE = 'ALL';

export const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All actions' },
  { value: 'PROVISION', label: 'Provision' },
  { value: 'DECOMMISSION', label: 'Decommission' },
  { value: 'PLAN', label: 'Plan' },
];

export const DEFAULT_ACTION_VALUE = 'ALL';

export const filterValue = (value: string): string | null =>
  value === 'ALL' || !value ? null : value;

// UPDATED_AT tracks the most recent change to a deployment record (status
// transitions, log compaction); CREATED_AT is when the deployment was enqueued.
export const SORT_OPTIONS = [
  { value: 'UPDATED_AT_DESC', label: 'Last activity (newest)' },
  { value: 'UPDATED_AT_ASC', label: 'Last activity (oldest)' },
  { value: 'CREATED_AT_DESC', label: 'Created (newest)' },
  { value: 'CREATED_AT_ASC', label: 'Created (oldest)' },
  { value: 'STATUS_ASC', label: 'Status (A–Z)' },
];

export const DEFAULT_SORT_VALUE = 'UPDATED_AT_DESC';

export interface SortInput {
  field: string;
  order: 'ASC' | 'DESC';
}

export const sortValueToInput = (value: string): SortInput => {
  switch (value) {
    case 'UPDATED_AT_ASC':
      return { field: 'UPDATED_AT', order: 'ASC' };
    case 'CREATED_AT_DESC':
      return { field: 'CREATED_AT', order: 'DESC' };
    case 'CREATED_AT_ASC':
      return { field: 'CREATED_AT', order: 'ASC' };
    case 'STATUS_ASC':
      return { field: 'STATUS', order: 'ASC' };
    case 'UPDATED_AT_DESC':
    default:
      return { field: 'UPDATED_AT', order: 'DESC' };
  }
};
