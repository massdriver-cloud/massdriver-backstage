import { Fragment, useMemo, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import {
  composeEnvironmentId,
  parseEnvironmentId,
  parseInstanceId,
  resourceUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import Collapse from '@massdriver/ui/Collapse';
import CodeBlock from '@massdriver/ui/CodeBlock';
import CopyButton from '@massdriver/ui/CopyButton';
import Chip from '@massdriver/ui/Chip';
import IconButton from '@massdriver/ui/IconButton';
import HelpOutlineIcon from '@massdriver/ui/icons/HelpOutlineIcon';
import ExpandMoreIcon from '@massdriver/ui/icons/ExpandMoreIcon';
import ExpandLessIcon from '@massdriver/ui/icons/ExpandLessIcon';
import DownloadIcon from '@massdriver/ui/icons/DownloadIcon';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../../../api';
import { RouterLinkAdapter } from '../../../../components/RouterLinkAdapter';
import { internalRoutes } from '../../../../internalRoutes';
import { useLiveRelayQuery } from '../../realtime/useLiveRelayQuery';
import { TabState } from '../TabState';
import { RESOURCES_QUERY, RESOURCE_CONSUMERS_QUERY } from '../queries';
import { useInstanceApiQuery } from '../useInstanceApiQuery';
import {
  buildResourceRows,
  formatGrantConditions,
  formatPayload,
  RESOURCE_STATE,
  type ResourceRow,
} from '../helpers';
import type {
  BundleResourceEntry,
  InstanceResourceEntry,
  ProducedResource,
} from '../types';

/** Read-only Resources tab: produced/pending resources with consumers + grants. */
export const ResourcesTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: {
      id: string;
      bundle?: {
        id: string;
        resources?: (BundleResourceEntry | null)[] | null;
      } | null;
      resources?: (InstanceResourceEntry | null)[] | null;
    } | null;
  }>(RESOURCES_QUERY, instanceId);

  const rows = useMemo(
    () =>
      buildResourceRows(
        value?.instance?.bundle?.resources,
        value?.instance?.resources,
      ),
    [value?.instance],
  );

  return (
    <TabState loading={loading} error={error}>
      <Root>
        {rows.length === 0 ? (
          <EmptyNote>This instance does not produce any resources.</EmptyNote>
        ) : (
          <List>
            {rows.map(row =>
              row.state === RESOURCE_STATE.CREATED ? (
                <CreatedResourceCard key={row.field} row={row} />
              ) : (
                <UncreatedResourceCard key={row.field} row={row} />
              ),
            )}
          </List>
        )}
      </Root>
    </TabState>
  );
};

export default ResourcesTab;

interface Grant {
  id: string;
  action?: string | null;
  recipientConditions?: unknown;
}
interface Connection {
  id: string;
  toField?: string | null;
  toInstance?: { id: string; name?: string | null } | null;
}
interface RemoteReference {
  id: string;
  field?: string | null;
  instance?: { id: string; name?: string | null } | null;
}
interface EnvironmentDefault {
  id: string;
  environment?: {
    id: string;
    name?: string | null;
    project?: { id: string; name?: string | null } | null;
  } | null;
}

const instanceHref = (id?: string | null): string | null => {
  if (!id) return null;
  const { projectId, scopedEnvironmentId, scopedComponentId } =
    parseInstanceId(id);
  if (!projectId || !scopedEnvironmentId || !scopedComponentId) return null;
  return internalRoutes.instance(
    projectId,
    scopedEnvironmentId,
    scopedComponentId,
  );
};

const environmentHref = (id?: string | null): string | null => {
  if (!id) return null;
  const { projectId, scopedEnvironmentId } = parseEnvironmentId(id);
  if (!projectId || !scopedEnvironmentId) return null;
  return internalRoutes.environment(
    projectId,
    composeEnvironmentId(projectId, scopedEnvironmentId),
  );
};

const CreatedResourceCard = ({ row }: { row: ResourceRow }) => {
  const api = useApi(massdriverApiRef);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const resource = row.resource as ProducedResource | null;

  // Live query: consumers (connections/remote refs/env defaults/grants) track
  // realtime events instead of going stale after the first render.
  const { value: consumersResult, error: consumersError } = useLiveRelayQuery<{
    resource: {
      connections?: { items?: (Connection | null)[] | null };
      environmentDefaults?: { items?: (EnvironmentDefault | null)[] | null };
      remoteReferences?: { items?: (RemoteReference | null)[] | null };
      grants?: { items?: (Grant | null)[] | null };
    } | null;
  }>(RESOURCE_CONSUMERS_QUERY, resource?.id ? { id: resource.id } : null);
  const consumers = consumersResult?.resource ?? null;

  const grants = (consumers?.grants?.items ?? []).filter(Boolean) as Grant[];
  const connectionItems = (consumers?.connections?.items ?? []).filter(
    Boolean,
  ) as Connection[];
  const remoteReferenceItems = (
    consumers?.remoteReferences?.items ?? []
  ).filter(Boolean) as RemoteReference[];
  const environmentDefaultItems = (
    consumers?.environmentDefaults?.items ?? []
  ).filter(Boolean) as EnvironmentDefault[];

  const payloadString = formatPayload(resource?.payload);
  const resourceName = resource?.name || '—';
  const resHref =
    resource?.id && api.appUrl
      ? resourceUrl(api.appUrl, api.organizationId, resource.id)
      : '';

  return (
    <Card>
      <HeaderRow>
        <TitleRow>
          <CardTitle title={row.field}>{row.field}</CardTitle>
          <Tooltip
            placement="top"
            arrow
            title={
              <TooltipBody>
                <div>
                  <strong>Type:</strong> The resource type produced by this
                  instance output.
                </div>
                <div>
                  <strong>Resource:</strong> The name of the produced resource.
                </div>
                <div>
                  <strong>Connections / Remote refs / Env defaults:</strong>{' '}
                  Other instances or environments that consume this resource.
                </div>
                <div>
                  <strong>Resource data:</strong> The redacted payload.
                </div>
              </TooltipBody>
            }
          >
            <HelpIcon />
          </Tooltip>
        </TitleRow>
        <HeaderActions>
          <ResourceGrantsChip grants={grants} />
          {resource?.id ? (
            <CopyButton
              text={resource.id}
              tooltip="Copy resource ID"
              size="small"
            />
          ) : null}
          <Tooltip
            title="This view is read-only. Open in Massdriver to download resource data."
            placement="top"
          >
            <DownloadWrap>
              <IconButton
                size="small"
                disabled
                aria-label="Download resource data"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </DownloadWrap>
          </Tooltip>
        </HeaderActions>
      </HeaderRow>
      <DetailColumn>
        <DetailRow>
          <Label>Type:</Label>
          <Detail title={row.resourceType?.name || '—'}>
            {row.resourceType?.name || '—'}
          </Detail>
        </DetailRow>
        <DetailRow>
          <Label>Resource:</Label>
          {resHref ? (
            <ResourceLink
              href={resHref}
              target="_blank"
              rel="noopener noreferrer"
              title={resourceName}
            >
              {resourceName}
            </ResourceLink>
          ) : (
            <Detail title={resourceName}>{resourceName}</Detail>
          )}
        </DetailRow>
        {connectionItems.length > 0 ? (
          <DetailRow>
            <Label>Connections:</Label>
            <ListValue>
              <ConsumerList
                items={connectionItems.map(connection => ({
                  key: connection.id,
                  label: connection.toInstance?.name ?? 'instance',
                  href: instanceHref(connection.toInstance?.id),
                }))}
              />
            </ListValue>
          </DetailRow>
        ) : null}
        {remoteReferenceItems.length > 0 ? (
          <DetailRow>
            <Label>Remote refs:</Label>
            <ListValue>
              <ConsumerList
                items={remoteReferenceItems.map(reference => ({
                  key: reference.id,
                  label: reference.instance?.name ?? 'instance',
                  href: instanceHref(reference.instance?.id),
                }))}
              />
            </ListValue>
          </DetailRow>
        ) : null}
        {environmentDefaultItems.length > 0 ? (
          <DetailRow>
            <Label>Env defaults:</Label>
            <ListValue>
              <ConsumerList
                items={environmentDefaultItems.map(envDefault => {
                  const projectName = envDefault.environment?.project?.name;
                  const envName = envDefault.environment?.name ?? 'environment';
                  return {
                    key: envDefault.id,
                    label: projectName
                      ? `${projectName} / ${envName}`
                      : envName,
                    href: environmentHref(envDefault.environment?.id),
                  };
                })}
              />
            </ListValue>
          </DetailRow>
        ) : null}
        {consumersError ? (
          <DetailRow>
            <Label>Consumers:</Label>
            <Detail title={consumersError.message}>
              Couldn't load consumers
            </Detail>
          </DetailRow>
        ) : null}
      </DetailColumn>
      <PayloadSection>
        <PayloadToggle
          type="button"
          onClick={() => setPayloadOpen(open => !open)}
          aria-expanded={payloadOpen}
        >
          <PayloadToggleLabel>Resource data</PayloadToggleLabel>
          {payloadOpen ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </PayloadToggle>
        <Collapse in={payloadOpen} unmountOnExit>
          <PayloadInner>
            {payloadString ? (
              <PayloadCodeBlock>{payloadString}</PayloadCodeBlock>
            ) : (
              <EmptyPayload>No payload available.</EmptyPayload>
            )}
          </PayloadInner>
        </Collapse>
      </PayloadSection>
    </Card>
  );
};

const UncreatedResourceCard = ({ row }: { row: ResourceRow }) => (
  <Card pending>
    <HeaderRow>
      <TitleRow>
        <CardTitle title={row.field}>{row.field}</CardTitle>
        <Tooltip
          placement="top"
          arrow
          title={
            <TooltipBody>
              <div>
                This resource has not been produced yet. Once the instance is
                deployed successfully, it will be created and details will
                appear here.
              </div>
            </TooltipBody>
          }
        >
          <HelpIcon />
        </Tooltip>
      </TitleRow>
    </HeaderRow>
    <DetailColumn>
      <DetailRow>
        <Label>Type:</Label>
        <Detail title={row.resourceType?.name || '—'}>
          {row.resourceType?.name || '—'}
        </Detail>
      </DetailRow>
    </DetailColumn>
  </Card>
);

const ConsumerList = ({
  items,
}: {
  items: Array<{ key: string; label: string; href: string | null }>;
}) => (
  <>
    {items.map((item, index) => (
      <Fragment key={item.key}>
        {index > 0 ? <Comma>, </Comma> : null}
        {item.href ? (
          <ConsumerAnchor href={item.href} title={item.label}>
            {item.label}
          </ConsumerAnchor>
        ) : (
          <ConsumerText title={item.label}>{item.label}</ConsumerText>
        )}
      </Fragment>
    ))}
  </>
);

const ResourceGrantsChip = ({ grants }: { grants: Grant[] }) => {
  if (!grants || grants.length === 0) return null;
  return (
    <Tooltip
      placement="top"
      arrow
      title={
        <TooltipBody>
          <TooltipTitle>
            Shared with {grants.length} grant{grants.length === 1 ? '' : 's'}
          </TooltipTitle>
          {grants.map(grant => (
            <GrantRow key={grant.id}>
              <GrantAction>{grant.action}</GrantAction>
              <GrantConditions>
                {formatGrantConditions(grant.recipientConditions)}
              </GrantConditions>
            </GrantRow>
          ))}
        </TooltipBody>
      }
    >
      <SharedChip label="Shared" size="small" color="info" variant="outlined" />
    </Tooltip>
  );
};

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  padding: theme.spacing(1),
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

const Card = stylin(Box, ['pending'])(
  ({ theme, pending }: { theme: any; pending?: boolean }) => ({
    position: 'relative',
    border: `1px ${pending ? 'dashed' : 'solid'} ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    borderRadius: '4px',
    padding: theme.spacing(1, 1.75),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
);

const HeaderRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const TitleRow = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  minWidth: 0,
  flex: 1,
});

const CardTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(14),
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
}));

const HeaderActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.25),
  flexShrink: 0,
}));

const DownloadWrap = stylin('span')({
  display: 'inline-flex',
});

const ResourceLink = stylin('a')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.primary.main,
  textDecoration: 'underline',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  '&:hover': { color: theme.palette.primary.dark },
}));

const HelpIcon = stylin(HelpOutlineIcon)(({ theme }: { theme: any }) => ({
  width: 15,
  height: 15,
  color: theme.palette.text.secondary,
  flexShrink: 0,
  '&:hover': { color: theme.palette.primary.main },
}));

const DetailColumn = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginLeft: theme.spacing(1.5),
}));

const DetailRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const Label = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontWeight: theme.typography.fontWeightMedium,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}));

const Detail = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const ListValue = stylin(Box)({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  minWidth: 0,
});

const Comma = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.primary,
  marginRight: '2px',
}));

const ConsumerAnchor = stylin(RouterLinkAdapter)(
  ({ theme }: { theme: any }) => ({
    fontSize: theme.typography.pxToRem(11),
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    whiteSpace: 'nowrap',
    '&:hover': { color: theme.palette.primary.dark },
  }),
);

const ConsumerText = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
}));

const TooltipBody = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.4,
  maxWidth: 320,
}));

const TooltipTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontWeight: theme.typography.fontWeightBold,
}));

const GrantRow = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

const GrantAction = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: 'monospace',
  fontSize: theme.typography.pxToRem(11),
}));

const GrantConditions = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  opacity: 0.9,
}));

const SharedChip = stylin(Chip)(({ theme }: { theme: any }) => ({
  height: 18,
  fontSize: theme.typography.pxToRem(11),
  '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' },
}));

const PayloadSection = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginTop: theme.spacing(1),
  marginLeft: `-${theme.spacing(1.75)}`,
  marginRight: `-${theme.spacing(1.75)}`,
  marginBottom: `-${theme.spacing(1)}`,
}));

const PayloadToggle = stylin('button')(({ theme }: { theme: any }) => ({
  border: 'none',
  borderTop: `1px solid ${theme.palette.divider}`,
  background: 'transparent',
  padding: theme.spacing(0.75, 1.75),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  color: theme.palette.text.secondary,
  fontFamily: 'inherit',
  borderRadius: 0,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
}));

const PayloadToggleLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontWeight: theme.typography.fontWeightMedium,
  color: 'inherit',
}));

const PayloadInner = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(1.75),
}));

const PayloadCodeBlock = stylin(CodeBlock)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  padding: theme.spacing(1),
}));

const EmptyPayload = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));
