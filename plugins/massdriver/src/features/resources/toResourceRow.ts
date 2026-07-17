import { parseInstanceId } from '@massdriver/backstage-plugin-common';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

const ORIGIN_LABELS: Record<string, string> = {
  IMPORTED: 'Imported',
  PROVISIONED: 'Provisioned',
};

export interface ResourceLocation {
  projectId: string;
  environmentId: string | null;
  projectName: string;
  environmentName: string;
}

export interface ResourceListItem {
  id: string;
  name: string;
  origin: string;
  formats?: string[] | null;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
  resourceType?: {
    id: string;
    name?: string | null;
    icon?: string | null;
  } | null;
  instance?: {
    id: string;
    name?: string | null;
    environment?: {
      id: string;
      name?: string | null;
      project?: { id: string; name?: string | null } | null;
    } | null;
  } | null;
}

export interface ResourceRow extends ResourceListItem {
  resourceTypeName: string;
  resourceTypeIcon: string | null;
  originLabel: string;
  location: ResourceLocation | null;
  createdAtRelative: string;
}

const buildLocation = (
  instance: ResourceListItem['instance'],
): ResourceLocation | null => {
  if (!instance?.id) return null;
  const { projectId, scopedEnvironmentId } = parseInstanceId(instance.id);
  if (!projectId || !scopedEnvironmentId) return null;
  return {
    projectId,
    environmentId: instance.environment?.id ?? null,
    projectName: instance.environment?.project?.name ?? projectId,
    environmentName: instance.environment?.name ?? scopedEnvironmentId,
  };
};

export const toResourceRow = (resource: ResourceListItem): ResourceRow => ({
  ...resource,
  resourceTypeName: resource.resourceType?.name ?? '—',
  resourceTypeIcon: resource.resourceType?.icon ?? null,
  originLabel: ORIGIN_LABELS[resource.origin] ?? resource.origin,
  location: buildLocation(resource.instance),
  createdAtRelative: formatRelativeTime(resource.createdAt),
});
