import { InstanceStatusPill as StatusPillBase } from '../../../components/InstanceStatusPill';
import { useLiveRelayQuery } from '../realtime/useLiveRelayQuery';
import { deriveInstanceStatus } from '../../../utils/instanceStatuses';

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
