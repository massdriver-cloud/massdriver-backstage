// Status taxonomy for instances and deployments — a faithful port of the web
// app's `shared/constants/deploymentStatuses.js`.
//
// 1. INSTANCE_STATUS (static) — what the API stores on an instance once it
//    settles: INITIALIZED, EXTERNAL, PROVISIONED, DECOMMISSIONED, FAILED.
// 2. Compound statuses — what we render while a deployment is actively in
//    flight. composeInstanceStatus(action, status) builds these
//    (e.g. PROVISION_RUNNING); deriveInstanceStatus applies them only while
//    the latest deployment is active (PENDING / RUNNING).
// 3. formatInstanceStatus maps either kind to a human label ("Provisioned",
//    "Provision Running", "Provisioning Failed"). The `instanceStatusColors`
//    theme map is keyed by these same status strings, static and compound.
//
// All helpers take primitives — instance status, deployment action/status —
// never full objects. The caller owns the data shape.

export const INSTANCE_STATUS = {
  INITIALIZED: 'INITIALIZED',
  EXTERNAL: 'EXTERNAL',
  PROVISIONED: 'PROVISIONED',
  DECOMMISSIONED: 'DECOMMISSIONED',
  FAILED: 'FAILED',
} as const;

const STATIC_LABELS: Record<string, string> = {
  [INSTANCE_STATUS.INITIALIZED]: 'Initialized',
  [INSTANCE_STATUS.PROVISIONED]: 'Provisioned',
  [INSTANCE_STATUS.DECOMMISSIONED]: 'Decommissioned',
  [INSTANCE_STATUS.EXTERNAL]: 'Remote Reference',
  [INSTANCE_STATUS.FAILED]: 'Deployment Failed',
};

const ACTION_LABELS: Record<string, string> = {
  PLAN: 'Plan',
  PROVISION: 'Provision',
  DECOMMISSION: 'Decommission',
};

// Two morphological forms per action:
//   gerund — "Provisioning" → used for "<gerund> Failed" (mid-action crash)
//   past   — "Provisioned"  → used for COMPLETED, matching the static label so
//            PROVISION_COMPLETED reads the same as PROVISIONED.
const ACTION_PARTICIPLES: Record<string, { gerund: string; past: string }> = {
  PLAN: { gerund: 'Planning', past: 'Planned' },
  PROVISION: { gerund: 'Provisioning', past: 'Provisioned' },
  DECOMMISSION: { gerund: 'Decommissioning', past: 'Decommissioned' },
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

// "Active" means actually executing or queued for immediate execution —
// PENDING is waiting to start, RUNNING is mid-flight. PROPOSED and APPROVED
// sit around waiting for human action and do not change what the pill shows.
export const isDeploymentActive = (status?: string | null): boolean =>
  status === 'PENDING' || status === 'RUNNING';

// Pure combinator: action + deployment-status → compound string. Returns null
// when either piece is missing — the caller decides on a fallback.
export const composeInstanceStatus = (
  action?: string | null,
  status?: string | null,
): string | null => (action && status ? `${action}_${status}` : null);

// Resolve the instance status to render from the three primitives at hand:
// the instance's stored status plus the latest deployment's action and status.
// Active latest deployment → compound (e.g. PROVISION_RUNNING); otherwise the
// stored status as-is.
export const deriveInstanceStatus = ({
  instanceStatus,
  latestDeploymentAction,
  latestDeploymentStatus,
}: {
  instanceStatus?: string | null;
  latestDeploymentAction?: string | null;
  latestDeploymentStatus?: string | null;
} = {}): string | null => {
  if (isDeploymentActive(latestDeploymentStatus) && latestDeploymentAction) {
    return composeInstanceStatus(
      latestDeploymentAction,
      latestDeploymentStatus,
    );
  }
  return instanceStatus ?? null;
};

// Compound label rules:
//   *_FAILED    → "<gerund> Failed"  ("Provisioning Failed")
//   *_COMPLETED → "<past>"           ("Provisioned")
//   everything else → "<action> <status>" ("Provision Running")
export const formatInstanceStatus = (status?: string | null): string => {
  if (!status) return '—';
  if (STATIC_LABELS[status]) return STATIC_LABELS[status];
  const [action, deploymentStatus] = status.split('_');
  if (!action || !deploymentStatus) return '—';
  const participles = ACTION_PARTICIPLES[action];
  if (deploymentStatus === 'FAILED' && participles) {
    return `${participles.gerund} Failed`;
  }
  if (deploymentStatus === 'COMPLETED' && participles) {
    return participles.past;
  }
  const actionLabel = ACTION_LABELS[action] ?? action;
  const statusLabel = STATUS_TITLES[deploymentStatus] ?? deploymentStatus;
  return `${actionLabel} ${statusLabel}`;
};
