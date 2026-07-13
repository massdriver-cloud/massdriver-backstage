// Ported from apps/web/shared/utils/historyHelpers.js and the web app's
// ViewDeploymentDetailsDialog / DeploymentLogsDrawer components — the pieces the
// deployments list, the in-place details dialog, and the logs drawer need.
import {
  composeInstanceStatus,
  formatInstanceStatus,
} from '../../utils/instanceStatuses';

// Re-exported for the logs drawer, which decides off deployment liveness
// whether to keep the log subscription open.
export { isDeploymentActive } from '../../utils/instanceStatuses';

/** The last hyphen-delimited segment of a deployment id (a short handle). */
export const truncateDeploymentId = (id?: string | null): string => {
  if (!id) return '';
  const parts = id.split('-');
  return parts.length > 1 ? parts[parts.length - 1] : id;
};

const PLAN_SOURCE_REGEX =
  /^Planning deployment ([0-9a-fA-F-]{36})(?:\n([\s\S]*))?$/;

/**
 * Plan deployments encode their source deployment id in the message
 * ("Planning deployment <uuid>\n<source-message>"). Returns the parsed source
 * id + human message, or null when the message isn't a plan precursor.
 */
export const parsePlanMessage = (
  message?: string | null,
): { sourceId: string; sourceMessage: string } | null => {
  if (!message) return null;
  const match = PLAN_SOURCE_REGEX.exec(message);
  if (!match) return null;
  return { sourceId: match[1], sourceMessage: match[2] ?? '' };
};

/**
 * Ported from apps/web/shared/utils/historyHelpers.js — a deployment's elapsed
 * run time as "Xm Ys". Returns null for missing / non-positive durations so the
 * row can omit the segment entirely.
 */
export const formatElapsed = (seconds?: number | null): string | null => {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
};

const ROLLBACK_SOURCE_REGEX =
  /^Rollback to deployment ([0-9a-fA-F-]{36}) \(v([^)]*)\)(?:\n([\s\S]*))?$/;

/**
 * Rollback proposals encode their source deployment + version in the message
 * ("Rollback to deployment <uuid> (v<version>)\n<source-message>"). Returns the
 * parsed source id/version/message, or null when it isn't a rollback precursor.
 */
export const parseRollbackMessage = (
  message?: string | null,
): { sourceId: string; version: string; sourceMessage: string } | null => {
  if (!message) return null;
  const match = ROLLBACK_SOURCE_REGEX.exec(message);
  return match
    ? { sourceId: match[1], version: match[2], sourceMessage: match[3] ?? '' }
    : null;
};

/**
 * Strip the plan/rollback precursor from a message, leaving only the
 * human-authored note. Recurses because a rollback's source can itself be a
 * plan. Ported from the web app's `stripMessageContext`.
 */
export const stripMessageContext = (message?: string | null): string => {
  const current = message ?? '';
  if (!current) return current;
  const plan = parsePlanMessage(current);
  if (plan) return stripMessageContext(plan.sourceMessage);
  const rollback = parseRollbackMessage(current);
  if (rollback) return stripMessageContext(rollback.sourceMessage);
  return current;
};

/**
 * Compound human label for a deployment (action + deployment status), e.g.
 * "Provision Running", "Provisioning Failed", "Provisioned".
 */
export const formatDeploymentStatus = (
  action?: string | null,
  status?: string | null,
): string => formatInstanceStatus(composeInstanceStatus(action, status));

// Statuses that never produce a deployment log stream — everything else has (or
// will have) logs to view in-app. Ported from the web dialog's
// STATUSES_WITHOUT_LOGS.
export const STATUSES_WITHOUT_LOGS = ['PROPOSED', 'APPROVED', 'REJECTED'];

export const deploymentHasLogs = (status?: string | null): boolean =>
  Boolean(status) && !STATUSES_WITHOUT_LOGS.includes(status as string);

/**
 * Join a deployment's log batches into a single string for LogViewer, matching
 * the web app's `composeText`: each batch may already carry its own newlines, so
 * concatenate without inserting separators and guarantee a trailing newline.
 */
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

/** Compact absolute timestamp for the details def-list ("Jul 9, 3:04 PM"). */
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
