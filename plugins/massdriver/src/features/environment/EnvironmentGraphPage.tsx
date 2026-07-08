import { useMemo } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { composeEnvironmentId } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactFlowProvider } from '@xyflow/react';
import useAsync from 'react-use/esm/useAsync';
import { useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { NotFound } from '../../components/NotFound';
import { GraphHeader } from './GraphHeader';
import Diagram from './graph/Diagram';
import { buildDiagram } from './graph/diagramFactory';
import {
  ENVIRONMENT_BLUEPRINT_QUERY,
  PROJECT_BLUEPRINT_QUERY,
  type EnvironmentBlueprintResult,
  type ProjectBlueprintResult,
} from './graph/queries';

/** Read-only environment graph: instances as nodes, connections/links as edges. */
export const EnvironmentGraphPage = () => {
  const api = useApi(massdriverApiRef);
  const { projectId = '', scopedEnvironmentId = '' } = useParams();
  const environmentId = composeEnvironmentId(projectId, scopedEnvironmentId);

  const { value, loading, error } = useAsync(async () => {
    const [projectData, environmentData] = await Promise.all([
      api.query(PROJECT_BLUEPRINT_QUERY, {
        projectId,
      }) as Promise<ProjectBlueprintResult>,
      api.query(ENVIRONMENT_BLUEPRINT_QUERY, {
        environmentId,
      }) as Promise<EnvironmentBlueprintResult>,
    ]);
    return {
      project: projectData.project,
      environment: environmentData.environment,
    };
  }, [api, projectId, environmentId]);

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
            />
          </ReactFlowProvider>
        )}
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
