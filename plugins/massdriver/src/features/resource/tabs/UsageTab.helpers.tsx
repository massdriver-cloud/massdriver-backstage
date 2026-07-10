import {
  parseEnvironmentId,
  parseInstanceId,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import { InstanceStatusPill } from '../../../components/InstanceStatusPill';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import { internalRoutes } from '../../../internalRoutes';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../../../utils/formatRelativeTime';
import {
  RESOURCE_CONNECTIONS_QUERY,
  RESOURCE_ENVIRONMENT_DEFAULTS_QUERY,
  RESOURCE_REMOTE_REFERENCES_QUERY,
} from '../queries';

// Ported from apps/web/features/resources/sections/UsageTab/UsageTab.helpers.js.
// Instance/project/environment links are internal (react-router). The status
// column uses InstanceStatusPill — the faithful equivalent of the web helper's
// tinted lowercase StatusChip (renderInstanceStatus).

export type UsageType = 'connection' | 'reference' | 'default';

interface UsageRow {
  id: string;
  instance?: string;
  instanceHref?: string | null;
  field?: string;
  instanceType?: string;
  status?: string | null;
  environment?: string;
  environmentHref?: string | null;
  project: string;
  projectHref: string | null;
  when: string;
  whenAbsolute: string;
}

interface InstanceLeaf {
  id?: string;
  status?: string | null;
  bundle?: { id: string; name?: string | null } | null;
  environment?: {
    id: string;
    project?: { id: string; name?: string | null } | null;
  } | null;
}

const buildInstanceHref = (instance?: InstanceLeaf | null): string | null => {
  if (!instance?.id) return null;
  const { projectId, scopedEnvironmentId, scopedComponentId } = parseInstanceId(
    instance.id,
  );
  if (!projectId || !scopedEnvironmentId || !scopedComponentId) return null;
  return internalRoutes.instance(
    projectId,
    scopedEnvironmentId,
    scopedComponentId,
  );
};

const buildEnvironmentHref = (
  environment?: { id?: string } | null,
): string | null => {
  if (!environment?.id) return null;
  const { projectId, scopedEnvironmentId } = parseEnvironmentId(environment.id);
  if (!projectId || !scopedEnvironmentId) return null;
  return internalRoutes.environment(projectId, environment.id);
};

const buildProjectHref = (project?: { id?: string } | null): string | null =>
  project?.id ? internalRoutes.project(project.id) : null;

const since = (iso?: string | null) => ({
  when: formatRelativeTime(iso),
  whenAbsolute: formatAbsoluteTime(iso),
});

interface ConnectionItem {
  id: string;
  toField?: string | null;
  createdAt?: string | null;
  toInstance?: InstanceLeaf | null;
}

interface ReferenceItem {
  id: string;
  field?: string | null;
  createdAt?: string | null;
  instance?: InstanceLeaf | null;
}

interface EnvironmentDefaultItem {
  id: string;
  createdAt?: string | null;
  environment?: {
    id: string;
    name?: string | null;
    project?: { id: string; name?: string | null } | null;
  } | null;
}

const mapConnectionRow = (connection: ConnectionItem): UsageRow => {
  const target = connection.toInstance;
  const project = target?.environment?.project;
  return {
    id: connection.id,
    instance: target?.id ?? '--',
    instanceHref: buildInstanceHref(target),
    field: connection.toField || '--',
    instanceType: target?.bundle?.name ?? '--',
    status: target?.status ?? null,
    project: project?.name ?? '--',
    projectHref: buildProjectHref(project),
    ...since(connection.createdAt),
  };
};

const mapRemoteReferenceRow = (reference: ReferenceItem): UsageRow => {
  const target = reference.instance;
  const project = target?.environment?.project;
  return {
    id: reference.id,
    instance: target?.id ?? '--',
    instanceHref: buildInstanceHref(target),
    field: reference.field || '--',
    instanceType: target?.bundle?.name ?? '--',
    status: target?.status ?? null,
    project: project?.name ?? '--',
    projectHref: buildProjectHref(project),
    ...since(reference.createdAt),
  };
};

const mapEnvironmentDefaultRow = (
  envDefault: EnvironmentDefaultItem,
): UsageRow => {
  const target = envDefault.environment;
  return {
    id: envDefault.id,
    environment: target?.name ?? '--',
    environmentHref: buildEnvironmentHref(target),
    project: target?.project?.name ?? '--',
    projectHref: buildProjectHref(target?.project),
    ...since(envDefault.createdAt),
  };
};

const renderLink =
  (hrefField: keyof UsageRow, nameField: keyof UsageRow) =>
  (_value: unknown, row: UsageRow): ReactNode => {
    const name = row[nameField] as ReactNode;
    const href = row[hrefField] as string | null | undefined;
    return href ? (
      <CellLink component={RouterLinkAdapter} href={href}>
        {name}
      </CellLink>
    ) : (
      name
    );
  };

const renderStatus = (value: unknown): ReactNode =>
  value ? <InstanceStatusPill status={value as string} /> : '--';

const staticCol = (
  field: string,
  header: string,
  options: Record<string, unknown> = {},
) =>
  col.text(field, header, { sortable: false, searchable: false, ...options });

const whenColumn = (header: string) =>
  staticCol('when', header, {
    flex: 1,
    minWidth: 130,
    emptyFallback: '—',
    tooltip: (_value: unknown, row: UsageRow) => row.whenAbsolute,
  });

const projectColumn = () =>
  col.custom('project', 'Project', renderLink('projectHref', 'project'), {
    flex: 1,
    minWidth: 150,
    sortable: false,
    searchable: false,
  });

// Connections and remote references describe the same thing — an instance
// consuming this resource through a field — so they share a column layout and
// differ only in the date header ("Connected" vs "Configured").
const buildInstanceUsageColumns = (dateHeader: string) => [
  col.custom('instance', 'Instance', renderLink('instanceHref', 'instance'), {
    flex: 2,
    minWidth: 200,
    sortable: false,
    searchable: false,
  }),
  staticCol('field', 'Field', { flex: 1, minWidth: 140 }),
  staticCol('instanceType', 'Instance type', { flex: 1, minWidth: 150 }),
  col.custom('status', 'Status', renderStatus, {
    width: 150,
    sortable: false,
    searchable: false,
  }),
  projectColumn(),
  whenColumn(dateHeader),
];

const buildEnvironmentDefaultColumns = () => [
  col.custom(
    'environment',
    'Environment',
    renderLink('environmentHref', 'environment'),
    {
      flex: 2,
      minWidth: 200,
      sortable: false,
      searchable: false,
    },
  ),
  projectColumn(),
  whenColumn('Configured'),
];

export const USAGE_TYPE_ORDER: UsageType[] = [
  'connection',
  'reference',
  'default',
];

export interface UsageTypeConfig {
  label: string;
  info: string;
  query: string;
  responseKey: string[];
  mapRow: (item: any) => UsageRow;
  buildColumns: () => ReturnType<typeof col.custom>[];
  emptyMessage: string;
}

export const USAGE_TYPE_CONFIG: Record<UsageType, UsageTypeConfig> = {
  connection: {
    label: 'Connections',
    info: 'Other instances in your environments that consume this resource at runtime through a blueprint link.',
    query: RESOURCE_CONNECTIONS_QUERY,
    responseKey: ['resource', 'connections'],
    mapRow: mapConnectionRow,
    buildColumns: () => buildInstanceUsageColumns('Connected'),
    emptyMessage: 'No instances consume this resource through a connection.',
  },
  reference: {
    label: 'Remote references',
    info: "Per-instance overrides where an instance's connection slot has been explicitly pointed at this resource instead of resolving automatically.",
    query: RESOURCE_REMOTE_REFERENCES_QUERY,
    responseKey: ['resource', 'remoteReferences'],
    mapRow: mapRemoteReferenceRow,
    buildColumns: () => buildInstanceUsageColumns('Configured'),
    emptyMessage: 'No remote references point at this resource.',
  },
  default: {
    label: 'Environment defaults',
    info: 'Environments where this resource is set as the default for its resource type, used by any new instance that needs this type.',
    query: RESOURCE_ENVIRONMENT_DEFAULTS_QUERY,
    responseKey: ['resource', 'environmentDefaults'],
    mapRow: mapEnvironmentDefaultRow,
    buildColumns: buildEnvironmentDefaultColumns,
    emptyMessage: 'This resource is not the default in any environment.',
  },
};

const CellLink = stylin(Box)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
}));
