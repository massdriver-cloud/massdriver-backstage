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

export const isDeploymentActive = (status?: string | null): boolean =>
  status === 'PENDING' || status === 'RUNNING';

const isDeploymentFailure = (status?: string | null): boolean =>
  status === 'FAILED' || status === 'REJECTED';

const isStaticInstanceStatus = (status?: string | null): boolean =>
  Boolean(status && STATIC_LABELS[status as string]);

export const isInstanceStatusActionable = (status?: string | null): boolean => {
  if (!status || isStaticInstanceStatus(status)) return false;
  const [, deploymentStatus] = status.split('_');
  return (
    isDeploymentActive(deploymentStatus) ||
    isDeploymentFailure(deploymentStatus)
  );
};

export const composeInstanceStatus = (
  action?: string | null,
  status?: string | null,
): string | null => (action && status ? `${action}_${status}` : null);

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
