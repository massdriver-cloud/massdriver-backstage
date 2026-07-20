import { parseInstanceId } from '@massdriver/backstage-plugin-common';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { InstanceStatusPill } from '../../../components/InstanceStatusPill';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import VersionBadge from '../../../components/VersionBadge';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { composeInstanceStatus } from '../../../utils/instanceStatuses';
import { internalRoutes } from '../../../internalRoutes';
import {
  formatElapsed,
  parsePlanMessage,
  truncateDeploymentId,
} from '../deploymentHelpers';
import type { RepoDeployment } from '../types';

export const DeploymentRow = ({
  deployment,
  onViewLogs,
  onViewDetails,
}: {
  deployment: RepoDeployment;
  onViewLogs: (deploymentId: string) => void;
  onViewDetails: (deploymentId: string) => void;
}) => {
  const { instance } = deployment;
  const composedStatus = composeInstanceStatus(
    deployment.action,
    deployment.status,
  );

  const parsed = instance?.id ? parseInstanceId(instance.id) : null;
  const instanceHref = parsed
    ? internalRoutes.instance(
        parsed.projectId,
        parsed.scopedEnvironmentId,
        parsed.scopedComponentId,
      )
    : null;

  const planSource =
    deployment.action === 'PLAN' ? parsePlanMessage(deployment.message) : null;

  const elapsed = formatElapsed(deployment.elapsedTime);
  const time = formatRelativeTime(
    deployment.lastTransitionedAt ??
      deployment.updatedAt ??
      deployment.createdAt,
  );
  const truncated = truncateDeploymentId(deployment.id);
  const deployedBy = deployment.deployedBy ?? 'system';
  const projectName = instance?.component?.project?.name ?? '—';
  const environmentName = instance?.environment?.name ?? '—';
  const instanceLabel = instance?.id ?? 'Unknown instance';

  return (
    <Card>
      <Header>
        <InstanceStatusPill
          status={composedStatus}
          onClick={() => onViewLogs(deployment.id)}
        />
        {deployment.version ? (
          <VersionBadge version={deployment.version} />
        ) : null}
        <Spacer />
        <DeploymentIdText title={deployment.id}>{truncated}</DeploymentIdText>
        <RowButton
          variant="text"
          size="small"
          onClick={() => onViewDetails(deployment.id)}
        >
          Details
        </RowButton>
        <RowButton
          variant="text"
          size="small"
          onClick={() => onViewLogs(deployment.id)}
        >
          Logs
        </RowButton>
      </Header>
      <Meta variant="caption">
        {instanceHref ? (
          <InstanceLink component={RouterLinkAdapter} href={instanceHref}>
            {instanceLabel}
          </InstanceLink>
        ) : (
          <InstanceName>{instanceLabel}</InstanceName>
        )}
        <Sep>·</Sep>
        <span>
          {projectName} <Sep>·</Sep> {environmentName}
        </span>
        <Sep>·</Sep>
        <span>
          by <strong>{deployedBy}</strong>
        </span>
        <Sep>·</Sep>
        <span>{time}</span>
        {elapsed ? (
          <>
            <Sep>·</Sep>
            <span>{elapsed}</span>
          </>
        ) : null}
      </Meta>
      {planSource ? (
        <PlanSourceBlock>
          <PlanSourceLink
            variant="text"
            size="small"
            onClick={() => onViewDetails(planSource.sourceId)}
          >
            Planned deployment of {truncateDeploymentId(planSource.sourceId)}
          </PlanSourceLink>
          {planSource.sourceMessage ? (
            <Message title={planSource.sourceMessage}>
              "{planSource.sourceMessage}"
            </Message>
          ) : null}
        </PlanSourceBlock>
      ) : deployment.message ? (
        <Message title={deployment.message}>"{deployment.message}"</Message>
      ) : null}
    </Card>
  );
};

export default DeploymentRow;

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minWidth: 0,
}));

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  minWidth: 0,
}));

const Spacer = stylin(Box)({
  flex: 1,
});

const DeploymentIdText = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: theme.spacing(20),
}));

const RowButton = stylin(Button)(({ theme }: { theme: any }) => ({
  flexShrink: 0,
  padding: theme.spacing(0.25, 1),
}));

const Meta = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const InstanceName = stylin('span')(({ theme }: { theme: any }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const InstanceLink = stylin(Box)(({ theme }: { theme: any }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const Sep = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
}));

const PlanSourceBlock = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  alignItems: 'flex-start',
  marginTop: theme.spacing(0.25),
}));

const PlanSourceLink = stylin(Button)(({ theme }: { theme: any }) => ({
  alignSelf: 'flex-start',
  padding: theme.spacing(0.25, 1),
  marginLeft: theme.spacing(-1),
}));

const Message = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontStyle: 'italic',
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  lineHeight: 1.4,
  wordBreak: 'break-word',
  marginTop: theme.spacing(0.25),
}));
