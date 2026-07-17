import { useApi } from '@backstage/frontend-plugin-api';
import { projectsUrl } from '@massdriver/backstage-plugin-common';
import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { buildProjectColumns } from './projectColumns';
import { toProjectRow, useProjectsPaginated } from './useProjects';

export const ProjectsListPage = () => {
  const api = useApi(massdriverApiRef);
  const { items, loading, error, hasMore, dataListParams } =
    useProjectsPaginated();
  const columns = buildProjectColumns();
  const rows = items.map(toProjectRow);

  return (
    <PageLayout
      title="Projects"
      description="Projects are the top-level organizational unit in the platform. Each project can contain multiple environments, which are used to deploy and manage your infrastructure."
      actions={
        <OpenInMassdriverButton
          url={`${projectsUrl(
            api.appUrl,
            api.organizationId,
          )}?createProject=true`}
        >
          Create Project
        </OpenInMassdriverButton>
      }
    >
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          rows={rows}
          columns={columns}
          loading={loading}
          serverSide
          hasMore={hasMore}
          variant="outlined"
          emptyMessage="You haven't created any projects yet, or don't have access to them."
          {...dataListParams}
        />
      )}
    </PageLayout>
  );
};
