import { useMemo } from 'react';
import { composeEnvironmentId } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactFlowProvider } from '@xyflow/react';
import { useNavigate, useParams } from 'react-router-dom';
import { NotFound } from '../../components/NotFound';
import { internalRoutes } from '../../internalRoutes';
import { GraphHeader } from './GraphHeader';
import { InstanceDrawer } from './InstanceDrawer';
import { RealtimeProvider } from './realtime/RealtimeProvider';
import { PresenceProvider } from './realtime/PresenceProvider';
import { useLiveRelayQuery } from './realtime/useLiveRelayQuery';
import Diagram from './graph/Diagram';
import ViewersPanel from './graph/ViewersPanel';
import { buildDiagram } from './graph/diagramFactory';
import {
  ENVIRONMENT_BLUEPRINT_QUERY,
  PROJECT_BLUEPRINT_QUERY,
  type EnvironmentBlueprintResult,
  type ProjectBlueprintResult,
} from './graph/queries';

/**
 * Read-only environment graph. Wraps the content in `RealtimeProvider` (data
 * refetch on deploys, status changes, blueprint edits) and `PresenceProvider`
 * (live web-app viewers and cursors, mirrored read-only through the backend
 * spectator relay).
 */
export const EnvironmentGraphPage = () => {
  const { projectId = '', scopedEnvironmentId = '' } = useParams();
  const environmentId = composeEnvironmentId(projectId, scopedEnvironmentId);
  return (
    <RealtimeProvider projectId={projectId} environmentId={environmentId}>
      <PresenceProvider environmentId={environmentId}>
        <EnvironmentGraphContent />
      </PresenceProvider>
    </RealtimeProvider>
  );
};

/** Instances as nodes, connections/links as edges. */
const EnvironmentGraphContent = () => {
  const navigate = useNavigate();
  const {
    projectId = '',
    scopedEnvironmentId = '',
    scopedComponentId,
  } = useParams();
  const environmentId = composeEnvironmentId(projectId, scopedEnvironmentId);

  const openInstance = (id: string) =>
    navigate(internalRoutes.instance(projectId, scopedEnvironmentId, id));
  const closeInstance = () =>
    navigate(internalRoutes.environment(projectId, environmentId));

  // Two live queries (blueprint + environment). Revision refetches keep the
  // rendered diagram mounted — see useLiveRelayQuery for the no-flash contract.
  const projectQuery = useLiveRelayQuery<ProjectBlueprintResult>(
    PROJECT_BLUEPRINT_QUERY,
    projectId ? { projectId } : null,
  );
  const environmentQuery = useLiveRelayQuery<EnvironmentBlueprintResult>(
    ENVIRONMENT_BLUEPRINT_QUERY,
    projectId && scopedEnvironmentId ? { environmentId } : null,
  );

  const loading = projectQuery.loading || environmentQuery.loading;
  const error = projectQuery.error ?? environmentQuery.error;
  const value = useMemo(
    () =>
      projectQuery.value && environmentQuery.value
        ? {
            project: projectQuery.value.project,
            environment: environmentQuery.value.environment,
          }
        : undefined,
    [projectQuery.value, environmentQuery.value],
  );

  const { nodes, edges } = useMemo(
    () =>
      buildDiagram({
        components: value?.project?.components ?? [],
        links: value?.project?.links ?? [],
        instances: value?.environment?.instances ?? [],
        connections: value?.environment?.connections ?? [],
      }),
    [value],
  );

  // "Viewing <name>" labels for the viewers panel — presence focus carries the
  // full component id (mirrors the web app's useFocusLabel).
  const resolveLabel = useMemo(() => {
    const labels = new Map<string, string>();
    value?.project?.components?.forEach(component => {
      if (component?.id && component?.name)
        labels.set(component.id, component.name);
    });
    value?.environment?.instances?.forEach(instance => {
      if (instance?.id) labels.set(instance.id, instance.id);
    });
    return (nodeId: string) => labels.get(nodeId) ?? null;
  }, [value]);

  const environmentName = value?.environment?.name ?? 'Environment';

  if (!loading && !error && (!value?.project || !value?.environment)) {
    return (
      <NotFound
        title="Environment not found"
        message="This environment doesn't exist or you don't have access to it."
      />
    );
  }

  return (
    <Root>
      <GraphHeader projectId={projectId} environmentId={environmentId} />
      <GraphArea>
        {loading ? (
          <Centered>
            <LoadingIndicator />
          </Centered>
        ) : error ? (
          <Centered>
            <Alert severity="error">{String(error.message ?? error)}</Alert>
          </Centered>
        ) : nodes.length === 0 ? (
          <Centered>
            <Typography variant="body2" color="text.secondary">
              No deployed instances in this environment yet.
            </Typography>
          </Centered>
        ) : (
          <ReactFlowProvider>
            <Diagram
              nodes={nodes}
              edges={edges}
              snapshotName={environmentId || environmentName}
              onNodeClick={openInstance}
              onPaneClick={scopedComponentId ? closeInstance : undefined}
              selectedComponentId={scopedComponentId}
            />
          </ReactFlowProvider>
        )}
        <ViewersPanel resolveLabel={resolveLabel} />
        <InstanceDrawer
          projectId={projectId}
          environmentId={environmentId}
          scopedComponentId={scopedComponentId}
          onClose={closeInstance}
        />
      </GraphArea>
    </Root>
  );
};

export default EnvironmentGraphPage;

const Root = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
});

const GraphArea = stylin(Box)({
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  position: 'relative',
  display: 'flex',
});

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));
