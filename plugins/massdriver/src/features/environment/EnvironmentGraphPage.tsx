import { useMemo } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { environmentUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactFlowProvider } from '@xyflow/react';
import useAsync from 'react-use/esm/useAsync';
import { useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
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
  const { projectId = '', environmentId = '' } = useParams();

  const { value, loading, error } = useAsync(async () => {
    const [projectData, environmentData] = await Promise.all([
      api.query(PROJECT_BLUEPRINT_QUERY, {
        projectId,
      }) as Promise<ProjectBlueprintResult>,
      api.query(ENVIRONMENT_BLUEPRINT_QUERY, {
        environmentId,
      }) as Promise<EnvironmentBlueprintResult>,
    ]);
    return { project: projectData.project, environment: environmentData.environment };
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
  const appUrl =
    projectId && environmentId
      ? environmentUrl(api.appUrl, api.organizationId, environmentId)
      : null;

  return (
    <PageLayout
      title={environmentName}
      description="Environment graph"
      headerActions={
        appUrl ? (
          <OpenInMassdriverButton url={appUrl} variant="outlined">
            Open in Massdriver
          </OpenInMassdriverButton>
        ) : undefined
      }
      flush
    >
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
            <Diagram nodes={nodes} edges={edges} />
          </ReactFlowProvider>
        )}
      </GraphArea>
    </PageLayout>
  );
};

export default EnvironmentGraphPage;

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
