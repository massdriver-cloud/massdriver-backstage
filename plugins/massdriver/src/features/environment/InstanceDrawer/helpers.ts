// Pure helpers ported from the web app's InstancePanel. Kept read-only and
// dependency-free so the drawer can render every tab without app internals.
import type {
  Alarm,
  BundleResourceEntry,
  InstanceProperty,
  InstanceResourceEntry,
  ResourceType,
} from './types';

// --- Attributes --------------------------------------------------------------

export const parseMap = (value: unknown): Record<string, unknown> | null => {
  if (value == null) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
};

export const formatAttributeValue = (value: unknown): string => {
  if (value === '*') return 'any';
  if (Array.isArray(value)) return value.length === 0 ? 'any' : value.join(', ');
  return String(value);
};

// --- Overview: version + properties ------------------------------------------

export const getReleaseChannel = (
  version?: string | null,
  resolvedVersion?: string | null,
): { channel: string } | null =>
  !version || version === resolvedVersion ? null : { channel: version };

export const getFiringAlerts = (items?: (Alarm | null)[] | null): Alarm[] =>
  (items ?? []).filter(
    (alarm): alarm is Alarm => alarm?.currentState?.status === 'ALARM',
  );

export const formatPropertyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const PROPERTY_PAGE_SIZE = 5;

export interface PropertiesView {
  items: InstanceProperty[];
  totalPages: number;
  page: number;
}

export const filterAndPaginateProperties = (
  properties: InstanceProperty[] = [],
  { search = '', page = 1 }: { search?: string; page?: number } = {},
): PropertiesView => {
  const normalized = search.trim().toLowerCase();
  const filtered = normalized
    ? properties.filter(property => {
        const name = property?.name?.toLowerCase() ?? '';
        const path = property?.path?.toLowerCase() ?? '';
        const value = String(property?.value ?? '').toLowerCase();
        return (
          name.includes(normalized) ||
          path.includes(normalized) ||
          value.includes(normalized)
        );
      })
    : properties;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PROPERTY_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PROPERTY_PAGE_SIZE;
  return {
    items: filtered.slice(start, start + PROPERTY_PAGE_SIZE),
    totalPages,
    page: safePage,
  };
};

// --- Alarms ------------------------------------------------------------------

export const ALARMS_DOCS_URL =
  'https://docs.massdriver.cloud/platform-operations/monitoring-and-alarms';

const OPERATOR_PHRASES: Record<string, string> = {
  GREATER_THAN: 'above',
  GREATER_THAN_OR_EQUAL_TO: 'at or above',
  LESS_THAN: 'below',
  LESS_THAN_OR_EQUAL_TO: 'at or below',
};

const describeOperator = (operator?: string | null): string =>
  (operator && OPERATOR_PHRASES[operator]) ?? operator ?? '';

const formatPeriod = (period?: number | null): string => {
  if (!period) return '';
  if (period >= 60 && period % 60 === 0) {
    const minutes = period / 60;
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${period} seconds`;
};

export const describeThreshold = (alarm: Alarm): string | null => {
  const hasComparison =
    alarm.comparisonOperator &&
    alarm.threshold !== null &&
    alarm.threshold !== undefined;
  if (!hasComparison && !alarm.period) return null;
  const parts: string[] = [];
  if (hasComparison) {
    parts.push(`${describeOperator(alarm.comparisonOperator)} ${alarm.threshold}`);
  }
  if (alarm.period) parts.push(`for ${formatPeriod(alarm.period)}`);
  return parts.join(' ');
};

export const isFiring = (alarm?: Alarm | null): boolean =>
  alarm?.currentState?.status === 'ALARM';

const STATUS_LABEL: Record<string, string> = { ALARM: 'Firing', OK: 'OK' };

export const getStatusLabel = (
  currentState?: Alarm['currentState'],
): string => {
  if (!currentState) return 'No data';
  return (currentState.status && STATUS_LABEL[currentState.status]) ??
    currentState.status ??
    'No data';
};

export const getSeverity = (alarm: Alarm): 'firing' | 'ok' | 'unknown' =>
  isFiring(alarm) ? 'firing' : alarm.currentState ? 'ok' : 'unknown';

export const formatMetricLine = (
  metric?: Alarm['metric'],
): string | null => {
  if (!metric) return null;
  const path = [metric.namespace, metric.name].filter(Boolean).join(' / ');
  if (!path && !metric.statistic) return null;
  if (!path) return metric.statistic ?? null;
  if (!metric.statistic) return path;
  return `${path} (${metric.statistic})`;
};

export const formatAlarmDimensions = (
  dimensions?: ({ name?: string | null; value?: string | null } | null)[] | null,
): string =>
  (dimensions ?? [])
    .filter(Boolean)
    .map(dimension => `${dimension!.name}=${dimension!.value}`)
    .join(', ');

export interface AlarmBuckets {
  firing: Alarm[];
  configured: Alarm[];
  total: number;
}

export const bucketAlarms = (items?: (Alarm | null)[] | null): AlarmBuckets => {
  const sorted = [...(items ?? [])]
    .filter((alarm): alarm is Alarm => Boolean(alarm))
    .sort((left, right) =>
      (left.displayName ?? '').localeCompare(right.displayName ?? ''),
    );
  return {
    firing: sorted.filter(isFiring),
    configured: sorted.filter(alarm => !isFiring(alarm)),
    total: sorted.length,
  };
};

// --- Resources ---------------------------------------------------------------

export const RESOURCE_STATE = { CREATED: 'CREATED', UNCREATED: 'UNCREATED' } as const;

export interface ResourceRow {
  field: string;
  required: boolean;
  resource: InstanceResourceEntry['resource'] | null;
  resourceType?: ResourceType | null;
  state: 'CREATED' | 'UNCREATED';
}

export const buildResourceRows = (
  bundleResources?: (BundleResourceEntry | null)[] | null,
  instanceResources?: (InstanceResourceEntry | null)[] | null,
): ResourceRow[] => {
  const producedByField = new Map(
    (instanceResources ?? [])
      .filter((produced): produced is InstanceResourceEntry => Boolean(produced?.field))
      .map(produced => [produced.field, produced] as const),
  );

  const fromBundle: ResourceRow[] = (bundleResources ?? [])
    .filter((bundleResource): bundleResource is BundleResourceEntry =>
      Boolean(bundleResource?.name),
    )
    .map(bundleResource => {
      const produced = producedByField.get(bundleResource.name) ?? null;
      return {
        field: bundleResource.name,
        required: produced
          ? Boolean(produced.required)
          : Boolean(bundleResource.required),
        resource: produced?.resource ?? null,
        resourceType: produced?.resourceType ?? bundleResource.resourceType,
        state: produced ? RESOURCE_STATE.CREATED : RESOURCE_STATE.UNCREATED,
      };
    });

  const bundleFields = new Set(fromBundle.map(row => row.field));
  const orphanProduced: ResourceRow[] = (instanceResources ?? [])
    .filter(
      (produced): produced is InstanceResourceEntry =>
        Boolean(produced?.field) && !bundleFields.has(produced!.field),
    )
    .map(produced => ({
      field: produced.field,
      required: Boolean(produced.required),
      resource: produced.resource ?? null,
      resourceType: produced.resourceType,
      state: RESOURCE_STATE.CREATED,
    }));

  return [...fromBundle, ...orphanProduced].sort((rowA, rowB) =>
    rowA.field.localeCompare(rowB.field),
  );
};

export const formatGrantConditions = (recipientConditions: unknown): string => {
  if (recipientConditions === '*' || recipientConditions === null) {
    return 'every recipient in the organization';
  }
  if (typeof recipientConditions === 'string') {
    try {
      return formatGrantConditions(JSON.parse(recipientConditions));
    } catch {
      return recipientConditions;
    }
  }
  if (typeof recipientConditions === 'object') {
    const entries = Object.entries(recipientConditions as Record<string, unknown>);
    if (entries.length === 0) return 'no conditions';
    return entries
      .map(([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`,
      )
      .join(' · ');
  }
  return String(recipientConditions);
};

export const formatPayload = (payload: unknown): string => {
  if (payload == null) return '';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

// --- Dependencies ------------------------------------------------------------

export const DEPENDENCY_STATE = {
  REMOTE_REFERENCE: 'REMOTE_REFERENCE',
  CONNECTION: 'CONNECTION',
  ENV_DEFAULT: 'ENV_DEFAULT',
  UNFULFILLED: 'UNFULFILLED',
} as const;

type DependencyState =
  (typeof DEPENDENCY_STATE)[keyof typeof DEPENDENCY_STATE];

const FULFILLED_STATES = new Set<DependencyState>([
  DEPENDENCY_STATE.REMOTE_REFERENCE,
  DEPENDENCY_STATE.CONNECTION,
  DEPENDENCY_STATE.ENV_DEFAULT,
]);

export interface DependencyRow {
  field: string;
  required: boolean;
  resourceType?: ResourceType | null;
  state: DependencyState;
  source: any;
}

// The web app overlays a second `inbound links` query to distinguish
// pending/link-and-default states; that overlay is dropped here (read-only,
// single fetch), so state is derived purely from the dependency source type.
export const buildDependencyRows = (
  bundleDependencies?: any[] | null,
  instanceDependencies?: any[] | null,
): DependencyRow[] => {
  const byField = new Map(
    (instanceDependencies ?? [])
      .filter(dep => dep?.field)
      .map(dep => [dep.field, dep] as const),
  );

  return (bundleDependencies ?? [])
    .filter(
      dep => dep?.resourceType?.connectionOrientation !== 'ENVIRONMENT_DEFAULT',
    )
    .map(bundleDep => {
      const instanceDep = byField.get(bundleDep.name) ?? null;
      const source = instanceDep?.source ?? null;
      const sourceType = source?.__typename;
      const state: DependencyState =
        sourceType === 'RemoteReference'
          ? DEPENDENCY_STATE.REMOTE_REFERENCE
          : sourceType === 'Connection'
            ? DEPENDENCY_STATE.CONNECTION
            : sourceType === 'EnvironmentDefault'
              ? DEPENDENCY_STATE.ENV_DEFAULT
              : DEPENDENCY_STATE.UNFULFILLED;

      return {
        field: bundleDep.name,
        required: instanceDep
          ? Boolean(instanceDep.required)
          : Boolean(bundleDep.required),
        resourceType: instanceDep?.resourceType ?? bundleDep.resourceType,
        state,
        source,
      };
    });
};

export const groupDependenciesBySection = (rows: DependencyRow[]) => ({
  fulfilled: rows.filter(row => FULFILLED_STATES.has(row.state)),
  unfulfilled: rows.filter(row => !FULFILLED_STATES.has(row.state)),
});

// --- History / deployment status ---------------------------------------------

export const formatElapsed = (seconds?: number | null): string | null => {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};

export const truncateDeploymentId = (id?: string | null): string => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 1 ? parts[parts.length - 1] : id;
};

const PLAN_SOURCE_REGEX = /^Planning deployment ([0-9a-fA-F-]{36})(?:\n([\s\S]*))?$/;
const ROLLBACK_SOURCE_REGEX =
  /^Rollback to deployment ([0-9a-fA-F-]{36}) \(v([^)]*)\)(?:\n([\s\S]*))?$/;

// Plan proposals encode their source deployment in the message ("Planning
// deployment <uuid>\n<source-message>"). Keep `sourceId` so the History tab can
// link the plan back to the deployment it previews (mirrors the web app's
// historyHelpers.js).
export const parsePlanMessage = (message?: string | null) => {
  if (!message) return null;
  const match = PLAN_SOURCE_REGEX.exec(message);
  return match ? { sourceId: match[1], sourceMessage: match[2] ?? '' } : null;
};

// Rollback proposals encode their source deployment + version in the message
// ("Rollback to deployment <uuid> (v<version>)\n<source-message>"). Keep
// `sourceId`/`version` so the row can link back to the restored deployment.
export const parseRollbackMessage = (message?: string | null) => {
  if (!message) return null;
  const match = ROLLBACK_SOURCE_REGEX.exec(message);
  return match
    ? { sourceId: match[1], version: match[2], sourceMessage: match[3] ?? '' }
    : null;
};

export const isRollback = (message?: string | null): boolean =>
  parseRollbackMessage(message) !== null;

export const stripMessageContext = (message?: string | null): string => {
  const current = message ?? '';
  if (!current) return current;
  const plan = parsePlanMessage(current);
  if (plan) return stripMessageContext(plan.sourceMessage);
  const rollback = parseRollbackMessage(current);
  if (rollback) return stripMessageContext(rollback.sourceMessage);
  return current;
};

const ACTION_PARTICIPLES: Record<string, { gerund: string; past: string }> = {
  PLAN: { gerund: 'Planning', past: 'Planned' },
  PROVISION: { gerund: 'Provisioning', past: 'Provisioned' },
  DECOMMISSION: { gerund: 'Decommissioning', past: 'Decommissioned' },
};
const ACTION_LABELS: Record<string, string> = {
  PLAN: 'Plan',
  PROVISION: 'Provision',
  DECOMMISSION: 'Decommission',
};
const STATUS_TITLES: Record<string, string> = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REJECTED: 'Rejected',
};

// Compound label for a single deployment row (action + deployment status),
// mirroring the web app's formatInstanceStatus for the compound case.
export const formatDeploymentStatus = (
  action?: string | null,
  status?: string | null,
): string => {
  if (!action || !status) return '—';
  const participles = ACTION_PARTICIPLES[action];
  if (status === 'FAILED' && participles) return `${participles.gerund} Failed`;
  if (status === 'COMPLETED' && participles) return participles.past;
  return `${ACTION_LABELS[action] ?? action} ${STATUS_TITLES[status] ?? status}`;
};

// --- Relative / absolute time (local, avoids app util) -----------------------

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatRelativeTime = (
  isoString?: string | null,
  fallback = '—',
): string => {
  if (!isoString) return fallback;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return fallback;
  const diff = (date.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diff);
  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (absDiff >= seconds || unit === 'second') {
      return RELATIVE_FORMATTER.format(Math.round(diff / seconds), unit);
    }
  }
  return fallback;
};

const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const formatAbsoluteDateTime = (
  isoString?: string | null,
  fallback = '',
): string => {
  if (!isoString) return fallback;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? fallback : ABSOLUTE_FORMATTER.format(date);
};
