import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import { col } from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import { Link } from 'react-router-dom';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../../utils/formatRelativeTime';
import type { ProjectListItem } from './useProjects';

const MAX_ATTRIBUTE_CHIPS = 6;

const AttributeChips = ({
  attributes,
}: {
  attributes?: Record<string, unknown> | null;
}) => {
  const entries = Object.entries(attributes ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );
  if (!entries.length) {
    return <Muted>--</Muted>;
  }
  return (
    <ChipRow>
      {entries.slice(0, MAX_ATTRIBUTE_CHIPS).map(([key, value]) => (
        <Chip key={key} size="small" label={`${key}: ${String(value)}`} />
      ))}
      {entries.length > MAX_ATTRIBUTE_CHIPS && (
        <Muted>+{entries.length - MAX_ATTRIBUTE_CHIPS}</Muted>
      )}
    </ChipRow>
  );
};

/** Columns for the projects list — name links internally to project details. */
export const buildProjectColumns = () => [
  col.custom(
    'name',
    'Name',
    (_value: unknown, row: ProjectListItem) => (
      <ProjectLink to={`projects/${row.id}`}>{row.name}</ProjectLink>
    ),
    { sortable: true, searchable: true },
  ),
  col.text('id', 'Identifier', { sortable: false, searchable: true }),
  col.text('description', 'Description', {
    sortable: false,
    searchable: false,
  }),
  col.custom(
    'effectiveAttributes',
    'Attributes',
    (_value: unknown, row: ProjectListItem) => (
      <AttributeChips
        attributes={row.effectiveAttributes ?? row.attributes}
      />
    ),
    { sortable: false, searchable: false },
  ),
  col.custom(
    'updatedAt',
    'Updated',
    (value: string) => (
      <span title={formatAbsoluteTime(value)}>{formatRelativeTime(value)}</span>
    ),
    { sortable: true },
  ),
];

const ProjectLink = stylin(Link)(({ theme }: { theme: any }) => ({
  color: theme.palette.primary.main,
  fontWeight: theme.typography.fontWeightMedium,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
}));

const ChipRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  alignItems: 'center',
}));

const Muted = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));
