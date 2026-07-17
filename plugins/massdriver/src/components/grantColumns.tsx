import { col } from '@massdriver/ui/DataList';
import DeleteOutlineIcon from '@massdriver/ui/icons/DeleteOutlineIcon';
import { ConditionsCell } from './ConditionsCell';

// Ported from the Massdriver web app. The web app's
// Remove action mutates, so here it deep-links out to the entity's Permissions
// tab in the Massdriver web app instead (read-only parity: clear mutation
// buttons link out rather than rendering disabled).

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export const formatGrantCreatedAt = (value: string | null | undefined) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : dateFormatter.format(date);
};

/** A grant as returned by the API's `grants { items }` selections. */
export interface Grant {
  id: string;
  action: string;
  recipientConditions?: unknown;
  createdAt?: string | null;
}

export interface GrantRow {
  id: string;
  action: string;
  recipientConditions?: unknown;
  createdAt: string;
}

export const mapGrantToRow = (grant: Grant): GrantRow => ({
  id: grant.id,
  action: grant.action,
  recipientConditions: grant.recipientConditions,
  createdAt: formatGrantCreatedAt(grant.createdAt),
});

const renderRecipientsCell = (_value: unknown, row: GrantRow) => (
  <ConditionsCell conditions={row.recipientConditions} />
);

export const buildGrantColumns = ({
  manageUrl,
}: {
  /** Web-app URL of the entity's Permissions tab, where grants are removed. */
  manageUrl: string;
}) => [
  col.text('action', 'Action', {
    flex: 1,
    minWidth: 140,
    sortable: false,
  }),
  col.custom('recipientConditions', 'Recipients', renderRecipientsCell, {
    flex: 3,
    minWidth: 240,
    sortable: false,
    searchable: false,
  }),
  col.text('createdAt', 'Created', {
    flex: 1,
    minWidth: 140,
    sortable: false,
  }),
  col.actions([
    {
      icon: <DeleteOutlineIcon fontSize="small" />,
      tooltip: 'Remove in Massdriver',
      href: () => manageUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      color: 'error',
    },
  ]),
];
