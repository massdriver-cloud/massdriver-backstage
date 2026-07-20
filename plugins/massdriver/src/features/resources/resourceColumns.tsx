import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import IconTile from '@massdriver/ui/IconTile';
import Typography from '@massdriver/ui/Typography';
import DeleteIcon from '@massdriver/ui/icons/DeleteIcon';
import EditIcon from '@massdriver/ui/icons/EditIcon';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import stylin from '@massdriver/ui/stylin';
import { resourceUrl } from '@massdriver/backstage-plugin-common';
import { buildAttributesColumn, Code } from '../../components/AttributesColumn';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { internalRoutes } from '../../internalRoutes';
import { formatAbsoluteTime } from '../../utils/formatRelativeTime';
import {
  IMPORTED_DELETE_TOOLTIP,
  IMPORTED_EDIT_TOOLTIP,
  PROVISIONED_DELETE_TOOLTIP,
  PROVISIONED_EDIT_TOOLTIP,
} from './resourceConstants';
import type { ResourceRow } from './toResourceRow';

const renderType = (_value: unknown, row: ResourceRow) => (
  <TypeCell>
    <IconTile
      src={row.resourceTypeIcon}
      alt={row.resourceTypeName}
      size="small"
      fallback={<FallbackIcon />}
    />
    <Typography variant="body2" noWrap title={row.resourceTypeName}>
      {row.resourceTypeName}
    </Typography>
  </TypeCell>
);

const renderLocation = (_value: unknown, row: ResourceRow) => {
  const { location } = row;
  if (!location) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  const { projectId, environmentId, projectName, environmentName } = location;
  return (
    <LocationCell title={`${projectName} : ${environmentName}`}>
      <LocationLink
        component={RouterLinkAdapter}
        href={internalRoutes.project(projectId)}
      >
        {projectName}
      </LocationLink>
      <LocationSeparator> : </LocationSeparator>
      {environmentId ? (
        <LocationLink
          component={RouterLinkAdapter}
          href={internalRoutes.environment(projectId, environmentId)}
        >
          {environmentName}
        </LocationLink>
      ) : (
        <span>{environmentName}</span>
      )}
    </LocationCell>
  );
};

const buildActionsColumn = ({
  appUrl,
  organizationId,
}: {
  appUrl: string;
  organizationId: string;
}) =>
  col.actions([
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: (row: ResourceRow) =>
        row.origin === 'PROVISIONED'
          ? PROVISIONED_EDIT_TOOLTIP
          : IMPORTED_EDIT_TOOLTIP,
      href: (row: ResourceRow) => resourceUrl(appUrl, organizationId, row.id),
      target: '_blank',
      rel: 'noopener noreferrer',
      disabled: (row: ResourceRow) => row.origin === 'PROVISIONED',
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: (row: ResourceRow) =>
        row.origin === 'PROVISIONED'
          ? PROVISIONED_DELETE_TOOLTIP
          : IMPORTED_DELETE_TOOLTIP,
      href: (row: ResourceRow) => resourceUrl(appUrl, organizationId, row.id),
      target: '_blank',
      rel: 'noopener noreferrer',
      disabled: (row: ResourceRow) => row.origin === 'PROVISIONED',
      color: 'error',
    },
  ]);

export const buildResourceColumns = ({
  appUrl,
  organizationId,
}: {
  appUrl: string;
  organizationId: string;
}) => [
  col.link(
    'name',
    'Name',
    (row: ResourceRow) => internalRoutes.resourceTab(row.id, 'general'),
    {
      flex: 2,
      minWidth: 180,
      LinkComponent: RouterLinkAdapter,
    },
  ),
  col.custom('resourceTypeName', 'Type', renderType, {
    flex: 1.4,
    minWidth: 160,
    sortable: false,
  }),
  col.custom('location', 'Project : Environment', renderLocation, {
    flex: 1.4,
    minWidth: 160,
    sortable: false,
    searchable: false,
  }),
  buildAttributesColumn({
    directText: 'Key-value attributes assigned directly to this resource.',
    effectiveText: (
      <>
        The full attribute map the authorization system evaluates policies
        against for this resource — the resource's own user attributes plus
        auto-injected <Code>md-*</Code> system attributes.
      </>
    ),
    flex: 1.4,
    minWidth: 180,
  }),
  col.text('originLabel', 'Origin', {
    flex: 0.8,
    minWidth: 124,
    sortable: false,
    searchable: false,
  }),
  col.text('createdAtRelative', 'Created', {
    flex: 1,
    minWidth: 120,
    sortable: false,
    searchable: false,
    tooltip: (_value: unknown, row: ResourceRow) =>
      formatAbsoluteTime(row.createdAt),
  }),
  buildActionsColumn({ appUrl, organizationId }),
];

const TypeCell = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const FallbackIcon = stylin(ExtensionIcon)({
  fontSize: 16,
});

const LocationCell = stylin(Box)({
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-word',
  fontSize: '0.875rem',
  lineHeight: 1.43,
  minWidth: 0,
});

const LocationLink = stylin(Box)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
}));

const LocationSeparator = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  margin: `0 ${theme.spacing(0.5)}`,
}));
