import {
  composeInstanceStatus,
  formatInstanceStatus,
} from '../../utils/instanceStatuses';

export { isDeploymentActive } from '../../utils/instanceStatuses';

export const truncateDeploymentId = (id?: string | null): string => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 1 ? parts[parts.length - 1] : id;
};

const PLAN_SOURCE_REGEX =
  /^Planning deployment ([0-9a-fA-F-]{36})(?:\n([\s\S]*))?$/;

export const parsePlanMessage = (
  message?: string | null,
): { sourceId: string; sourceMessage: string } | null => {
  if (!message) return null;
  const match = PLAN_SOURCE_REGEX.exec(message);
  if (!match) return null;
  return { sourceId: match[1], sourceMessage: match[2] ?? '' };
};

export const formatElapsed = (seconds?: number | null): string | null => {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
};

const ROLLBACK_SOURCE_REGEX =
  /^Rollback to deployment ([0-9a-fA-F-]{36}) \(v([^)]*)\)(?:\n([\s\S]*))?$/;

export const parseRollbackMessage = (
  message?: string | null,
): { sourceId: string; version: string; sourceMessage: string } | null => {
  if (!message) return null;
  const match = ROLLBACK_SOURCE_REGEX.exec(message);
  return match
    ? { sourceId: match[1], version: match[2], sourceMessage: match[3] ?? '' }
    : null;
};

export const stripMessageContext = (message?: string | null): string => {
  const current = message ?? '';
  if (!current) return current;
  const plan = parsePlanMessage(current);
  if (plan) return stripMessageContext(plan.sourceMessage);
  const rollback = parseRollbackMessage(current);
  if (rollback) return stripMessageContext(rollback.sourceMessage);
  return current;
};

export const formatDeploymentStatus = (
  action?: string | null,
  status?: string | null,
): string => formatInstanceStatus(composeInstanceStatus(action, status));

export const STATUSES_WITHOUT_LOGS = ['PROPOSED', 'APPROVED', 'REJECTED'];

export const deploymentHasLogs = (status?: string | null): boolean =>
  Boolean(status) && !STATUSES_WITHOUT_LOGS.includes(status as string);

export const composeLogsText = (
  logs?: ({ message?: string | null } | null)[] | null,
): string => {
  if (!Array.isArray(logs) || logs.length === 0) return '';
  const joined = logs.map(line => line?.message ?? '').join('');
  return `\n${joined}${joined.endsWith('\n') ? '' : '\n'}`;
};

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
  if (Array.isArray(value))
    return value.length === 0 ? 'any' : value.join(', ');
  return String(value);
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
  return Number.isNaN(date.getTime())
    ? fallback
    : ABSOLUTE_FORMATTER.format(date);
};
