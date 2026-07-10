import { InstanceStatusPill as StatusPillBase } from '../../../components/InstanceStatusPill';
import { useLiveRelayQuery } from '../realtime/useLiveRelayQuery';
import { deriveInstanceStatus } from '../../../utils/instanceStatuses';

// Latest deployment (any action/status) for an instance — drives the pill's
// in-flight compound statuses, mirroring the web app's
// useLatestInstanceDeployment. Being a live relay query, it refetches on every
// realtime revision bump, so a running provision flips the pill to
// "provision running" and back without a reload.
const LATEST_INSTANCE_DEPLOYMENT_QUERY = `
  query MassdriverLatestInstanceDeployment(
    $organizationId: ID!
    $instanceId: ID!
  ) {
    deployments(
      organizationId: $organizationId
      filter: { instanceId: { eq: $instanceId } }
      sort: { field: CREATED_AT, order: DESC }
      cursor: { limit: 1 }
    ) {
      items {
        id
        action
        status
      }
    }
  }
`;

interface LatestDeploymentResult {
  deployments: {
    items?: Array<{
      id: string;
      action?: string | null;
      status?: string | null;
    } | null> | null;
  } | null;
}

/**
 * Instance status chip, ported from the web app's InstanceStatusPill.
 *
 * Two modes, mirroring the web app's container:
 * - `instance={{ id, status }}` — fetches the instance's latest deployment and
 *   derives the rendered status (an active deployment shows as a compound like
 *   PROVISION_RUNNING; otherwise the stored status). Degrades silently to the
 *   bare status while the deployment query is loading or errors.
 * - `status="..."` — renders the given static or compound status as-is. Callers
 *   that already hold a deployment's action+status compose it themselves via
 *   `composeInstanceStatus` (the web app's per-deployment mode re-queries by
 *   id, which is free under Apollo's cache but would be one HTTP request per
 *   row through the relay).
 *
 * `onClick` receives the resolved deployment (instance mode's latest
 * deployment; null in status mode — callers there close over their own row).
 * The pill is only clickable while the status is actionable (a deployment in
 * flight or failed), mirroring the web app's click-to-logs affordance.
 */
export interface ResolvedDeployment {
  id: string;
  action?: string | null;
  status?: string | null;
}

const InstanceStatusPill = ({
  instance,
  status,
  onClick,
  size = 'small',
  ...props
}: {
  instance?: { id: string; status?: string | null } | null;
  status?: string | null;
  onClick?: (deployment: ResolvedDeployment | null) => void;
  size?: string;
  [key: string]: unknown;
}) => {
  const { value } = useLiveRelayQuery<LatestDeploymentResult>(
    LATEST_INSTANCE_DEPLOYMENT_QUERY,
    instance?.id ? { instanceId: instance.id } : null,
  );
  const latestDeployment = value?.deployments?.items?.[0] ?? null;

  const resolvedStatus = instance
    ? deriveInstanceStatus({
        instanceStatus: instance.status,
        latestDeploymentAction: latestDeployment?.action,
        latestDeploymentStatus: latestDeployment?.status,
      })
    : status ?? null;

  // The presentational base (components/InstanceStatusPill) owns the rendering
  // and the actionable-only clickability gate; this wrapper resolves the live
  // status and hands the resolved deployment to the click handler.
  return (
    <StatusPillBase
      status={resolvedStatus}
      size={size}
      onClick={
        onClick ? () => onClick(instance ? latestDeployment : null) : undefined
      }
      {...props}
    />
  );
};

export default InstanceStatusPill;
