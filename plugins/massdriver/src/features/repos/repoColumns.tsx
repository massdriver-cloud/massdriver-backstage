import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import DeleteOutlineIcon from '@massdriver/ui/icons/DeleteOutlineIcon';
import EditIcon from '@massdriver/ui/icons/EditIcon';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import OpenInNewIcon from '@massdriver/ui/icons/OpenInNewIcon';
import { reposUrl } from '@massdriver/backstage-plugin-common';
import AuthedIcon from '../../components/AuthedIcon';
import { buildAttributesColumn, Code } from '../../components/AttributesColumn';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { formatAbsoluteTime } from '../../utils/formatRelativeTime';
import { internalRoutes } from '../../internalRoutes';
import type { RepoRow } from './useRepos';

// Ported from apps/web/features/repos/utils/repoColumns.js (buildRepoColumns).
// The repo's brand icon (`repo.icon`, an auth-guarded SVG URL) is fetched
// through the backend content proxy by AuthedIcon, exactly like the web app.
// Edit/Delete mutate, so they deep-link into the web app's dialogs via the
// same `?editOciRepo=` / `?deleteOciRepo=` URL params the app's list uses.
export const buildRepoColumns = ({
  appUrl,
  organizationId,
}: {
  appUrl: string;
  organizationId: string;
}) => [
  col.custom(
    'name',
    'Name',
    (value: string, row: RepoRow) => (
      <NameCell>
        <AuthedIcon
          url={row.icon}
          alt={value}
          size="small"
          fallback={<FallbackIcon />}
        />
        <NameLink
          component={RouterLinkAdapter}
          href={internalRoutes.repository(row.id)}
        >
          {value || '--'}
        </NameLink>
      </NameCell>
    ),
    { flex: 2, minWidth: 200, sortable: true, searchable: true },
  ),
  col.text('description', 'Description', {
    flex: 3,
    minWidth: 150,
    sortable: false,
  }),
  buildAttributesColumn({
    directText:
      'Key-value attributes assigned directly to this repository. Attributes cascade to bundles published from this repo.',
    effectiveText: (
      <>
        The full attribute map the authorization system evaluates policies
        against for this repository — the repo's own user attributes plus
        auto-injected <Code>md-*</Code> system attributes.
      </>
    ),
  }),
  col.text('latestVersion', 'Latest Version', {
    flex: 1,
    minWidth: 120,
    sortable: false,
    searchable: false,
  }),
  col.text('updatedAt', 'Updated', {
    flex: 1,
    minWidth: 150,
    sortable: false,
    searchable: false,
    tooltip: (_value: unknown, row: RepoRow) =>
      formatAbsoluteTime(row.updatedAtRaw),
  }),
  col.actions([
    {
      // "View source code" is a read link — allowed under read-only parity.
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: (_row: RepoRow, { disabled }: { disabled: boolean }) =>
        disabled ? 'Source code not available' : 'View source code',
      href: (row: RepoRow) => row.sourceUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      disabled: (row: RepoRow) => !row.sourceUrl,
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit in Massdriver',
      href: (row: RepoRow) =>
        `${reposUrl(appUrl, organizationId)}?editOciRepo=${encodeURIComponent(
          row.id,
        )}`,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      icon: <DeleteOutlineIcon fontSize="small" />,
      tooltip: 'Delete in Massdriver',
      href: (row: RepoRow) =>
        `${reposUrl(appUrl, organizationId)}?deleteOciRepo=${encodeURIComponent(
          row.id,
        )}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      color: 'error',
    },
  ]),
];

const NameCell = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const FallbackIcon = stylin(ExtensionIcon)({
  fontSize: 18,
});

const NameLink = stylin(Box)({
  color: 'inherit',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  '&:hover': { textDecoration: 'underline' },
});
