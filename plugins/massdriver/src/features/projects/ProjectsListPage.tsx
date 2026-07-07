import { useApi } from '@backstage/frontend-plugin-api';
import { projectsUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import Button from '@massdriver/ui/Button';
import DataList from '@massdriver/ui/DataList';
import { massdriverApiRef } from '../../api';
import { PageLayout } from '../../components/PageLayout';
import { buildProjectColumns } from './projectColumns';
import { toProjectRow, useProjects } from './useProjects';

const openInMassdriver = (url: string) =>
  window.open(url, '_blank', 'noopener,noreferrer');

/** Read-only projects list, rebuilt with `@massdriver/ui` to match the app. */
export const ProjectsListPage = () => {
  const api = useApi(massdriverApiRef);
  const { value: projects, loading, error } = useProjects();
  const columns = buildProjectColumns();
  const rows = (projects ?? []).map(toProjectRow);

  return (
    <PageLayout
      title="Projects"
      description="Projects are the top-level organizational unit in the platform. Each project can contain multiple environments, which are used to deploy and manage your infrastructure."
      actions={
        <Button
          onClick={() =>
            openInMassdriver(
              `${projectsUrl(api.appUrl, api.organizationId)}?createProject=true`,
            )
          }
        >
          Create Project
        </Button>
      }
    >
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          rows={rows}
          columns={columns}
          loading={loading}
          variant="outlined"
          emptyMessage="You haven't created any projects yet, or don't have access to them."
        />
      )}
    </PageLayout>
  );
};
