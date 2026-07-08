import { ReactNode, useMemo } from 'react';
import {
  composeEnvironmentId,
  parseInstanceId,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Chip from '@massdriver/ui/Chip';
import Tooltip from '@massdriver/ui/Tooltip';
import HelpOutlineIcon from '@massdriver/ui/icons/HelpOutlineIcon';
import stylin from '@massdriver/ui/stylin';
import InstanceStatusPill from '../../../../components/InstanceStatusPill';
import { RouterLinkAdapter } from '../../../../components/RouterLinkAdapter';
import { internalRoutes } from '../../../../internalRoutes';
import { TabState } from '../TabState';
import { DEPENDENCIES_QUERY } from '../queries';
import { useInstanceApiQuery } from '../useInstanceApiQuery';
import {
  buildDependencyRows,
  DEPENDENCY_STATE,
  groupDependenciesBySection,
  type DependencyRow,
} from '../helpers';
import type { ResourceType } from '../types';

/** Read-only Dependencies tab: fulfilled + unfulfilled dependency cards. */
export const DependenciesTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: {
      id: string;
      bundle?: { id: string; dependencies?: any[] | null } | null;
      dependencies?: any[] | null;
    } | null;
  }>(DEPENDENCIES_QUERY, instanceId);

  const rows = useMemo(
    () =>
      buildDependencyRows(
        value?.instance?.bundle?.dependencies,
        value?.instance?.dependencies,
      ),
    [value?.instance],
  );
  const sections = useMemo(() => groupDependenciesBySection(rows), [rows]);

  return (
    <TabState loading={loading} error={error}>
      <Root>
        {rows.length === 0 ? (
          <EmptyNote>This instance does not require any dependencies.</EmptyNote>
        ) : (
          <>
            <Section>
              <SectionHeader>Fulfilled dependencies</SectionHeader>
              {sections.fulfilled.length === 0 ? (
                <EmptyNote>No dependencies are currently fulfilled.</EmptyNote>
              ) : (
                <CardList>
                  {sections.fulfilled.map(row => (
                    <DependencyCard key={row.field} row={row} />
                  ))}
                </CardList>
              )}
            </Section>
            <Section>
              <SectionHeader>Unfulfilled dependencies</SectionHeader>
              {sections.unfulfilled.length === 0 ? (
                <EmptyNote>All dependencies are fulfilled.</EmptyNote>
              ) : (
                <CardList>
                  {sections.unfulfilled.map(row => (
                    <DependencyCard key={row.field} row={row} />
                  ))}
                </CardList>
              )}
            </Section>
          </>
        )}
      </Root>
    </TabState>
  );
};

export default DependenciesTab;

const originHref = (id?: string | null): string | null => {
  if (!id) return null;
  const { projectId, scopedEnvironmentId, scopedComponentId } = parseInstanceId(id);
  if (!projectId || !scopedEnvironmentId || !scopedComponentId) return null;
  return `${internalRoutes.environment(
    projectId,
    composeEnvironmentId(projectId, scopedEnvironmentId),
  )}?instance=${scopedComponentId}`;
};

const TypeRow = ({ resourceType }: { resourceType?: ResourceType | null }) => (
  <DetailRow>
    <Label>Type:</Label>
    <Detail title={resourceType?.name || '—'}>{resourceType?.name || '—'}</Detail>
  </DetailRow>
);

const HelpTip = ({ children }: { children: ReactNode }) => (
  <Tooltip placement="top" arrow title={<TooltipBody>{children}</TooltipBody>}>
    <HelpIcon />
  </Tooltip>
);

const DependencyCard = ({ row }: { row: DependencyRow }) => {
  if (row.state === DEPENDENCY_STATE.CONNECTION) {
    const origin = row.source?.fromInstance ?? null;
    const fromComponentName =
      row.source?.link?.fromComponent?.name ?? origin?.name ?? null;
    const fromField = row.source?.fromField ?? null;
    const isProvisioned =
      origin?.status === 'PROVISIONED' || origin?.status === 'EXTERNAL';
    const fulfilledText = `${origin?.name || fromComponentName || '—'} :: ${fromField || '—'}`;
    const href = originHref(origin?.id);

    return (
      <Card pending={!isProvisioned}>
        {row.required ? <RequiredChip label="Req" color="success" size="small" /> : null}
        <HeaderRow>
          <TitleRow>
            <CardTitle title={row.field}>{row.field}</CardTitle>
            <HelpTip>
              <div>
                <strong>Fulfilled by:</strong> The instance whose resource is
                fulfilling this connection.
              </div>
            </HelpTip>
          </TitleRow>
          {origin?.status ? (
            <StyledStatusPill status={origin.status} />
          ) : null}
        </HeaderRow>
        <DetailColumn>
          <TypeRow resourceType={row.resourceType} />
          <DetailRow>
            <Label>Fulfilled by:</Label>
            {href ? (
              <FulfilledLink href={href} title={fulfilledText}>
                {fulfilledText}
              </FulfilledLink>
            ) : (
              <Detail title={fulfilledText}>{fulfilledText}</Detail>
            )}
          </DetailRow>
        </DetailColumn>
      </Card>
    );
  }

  if (row.state === DEPENDENCY_STATE.ENV_DEFAULT) {
    const resourceName = row.source?.resource?.name ?? '—';
    return (
      <Card>
        {row.required ? <RequiredChip label="Req" color="success" size="small" /> : null}
        <FulfilledNote>
          * This connection is being fulfilled by the environment's default
          resource.
        </FulfilledNote>
        <HeaderRow>
          <TitleRow>
            <CardTitle title={row.field}>{row.field}</CardTitle>
            <HelpTip>
              <div>
                <strong>Fulfilled by:</strong> The environment-default resource
                currently satisfying this connection.
              </div>
            </HelpTip>
          </TitleRow>
        </HeaderRow>
        <DetailColumn>
          <TypeRow resourceType={row.resourceType} />
          <DetailRow>
            <Label>Fulfilled by:</Label>
            <Detail title={resourceName}>{resourceName}</Detail>
          </DetailRow>
        </DetailColumn>
      </Card>
    );
  }

  if (row.state === DEPENDENCY_STATE.REMOTE_REFERENCE) {
    const resourceName = row.source?.resource?.name ?? '—';
    return (
      <Card>
        {row.required ? <RequiredChip label="Req" color="success" size="small" /> : null}
        <FulfilledNote>
          * This connection is overridden by a remote reference to a resource
          from another project or an imported resource.
        </FulfilledNote>
        <HeaderRow>
          <TitleRow>
            <CardTitle title={row.field}>{row.field}</CardTitle>
            <HelpTip>
              <div>
                <strong>Fulfilled by:</strong> The remote-reference resource
                currently overriding this connection.
              </div>
            </HelpTip>
          </TitleRow>
        </HeaderRow>
        <DetailColumn>
          <TypeRow resourceType={row.resourceType} />
          <DetailRow>
            <Label>Fulfilled by:</Label>
            <Detail title={resourceName}>{resourceName}</Detail>
          </DetailRow>
        </DetailColumn>
      </Card>
    );
  }

  return (
    <Card>
      {row.required ? <RequiredChip label="Req" color="error" size="small" /> : null}
      <HeaderRow>
        <TitleRow>
          <CardTitle title={row.field}>{row.field}</CardTitle>
          <HelpTip>
            <div>
              <strong>Req (Required):</strong> Whether this connection is
              required to successfully deploy.
            </div>
            <div>
              <strong>Type:</strong> The artifact type this connection expects.
            </div>
          </HelpTip>
        </TitleRow>
      </HeaderRow>
      <DetailColumn>
        <TypeRow resourceType={row.resourceType} />
      </DetailColumn>
    </Card>
  );
};

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
  padding: theme.spacing(1),
}));

const Section = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const SectionHeader = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
}));

const CardList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

const Card = stylin(
  Box,
  ['pending'],
)(({ theme, pending }: { theme: any; pending?: boolean }) => ({
  position: 'relative',
  border: `1px ${pending ? 'dashed' : 'solid'} ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '4px',
  padding: theme.spacing(1, 1.75),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const RequiredChip = stylin(Chip)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: '-10px',
  right: '-10px',
  height: 16,
  fontSize: theme.typography.pxToRem(11),
  pointerEvents: 'none',
  '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' },
}));

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

const FulfilledLink = stylin(RouterLinkAdapter)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.primary.main,
  textDecoration: 'underline',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  display: 'block',
  '&:hover': { color: theme.palette.primary.dark },
}));

const FulfilledNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const TooltipBody = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.4,
  maxWidth: 320,
}));

const StyledStatusPill = stylin(InstanceStatusPill)(({ theme }: { theme: any }) => ({
  height: 18,
  fontSize: theme.typography.pxToRem(11),
  flexShrink: 0,
}));
