import { useApi } from '@backstage/frontend-plugin-api';
import { projectsUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { buildProjectColumns } from './projectColumns';
import { useProjects } from './useProjects';

/** Read-only projects list, rebuilt with `@massdriver/ui` to match the app. */
export const ProjectsListPage = () => {
  const api = useApi(massdriverApiRef);
  const { value: projects, loading, error } = useProjects();
  const columns = buildProjectColumns();

  return (
    <PageLayout
      title="Projects"
      description="Projects you have access to in this organization."
      actions={
        <OpenInMassdriverButton
          url={`${projectsUrl(api.appUrl, api.organizationId)}?createProject=true`}
        >
          Create Project
        </OpenInMassdriverButton>
      }
    >
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          variant="outlined"
          searchable
          searchPlaceholder="Search projects..."
          columns={columns}
          rows={projects ?? []}
          loading={loading}
          emptyMessage="You haven't created any projects yet, or don't have access to them."
        />
      )}
    </PageLayout>
  );
};
