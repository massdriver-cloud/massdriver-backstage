import { useApi } from '@backstage/frontend-plugin-api';
import { reposUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { buildRepoColumns } from './repoColumns';
import { toRepoRow, useReposPaginated } from './useRepos';

// Ported from apps/web/features/repos/pages/ReposPage.js +
// sections/ReposList/. The web app's "New repository" button opens a dialog
// driven by the `createOciRepo` URL param; here it deep-links out to Massdriver
// with that param set (read-only parity).
export const ReposListPage = () => {
  const api = useApi(massdriverApiRef);
  const { items, loading, error, hasMore, dataListParams } =
    useReposPaginated();
  const columns = buildRepoColumns({
    appUrl: api.appUrl,
    organizationId: api.organizationId,
  });
  const rows = items.map(toRepoRow);
  const hasSearch = Boolean(dataListParams.state?.search);
  const emptyMessage = hasSearch
    ? 'No repositories match your search.'
    : 'This organization has no repositories.';

  return (
    <PageLayout
      title="Repositories"
      description="Repositories are the basic building blocks of infrastructure, applications, and architectures in Massdriver."
      actions={
        <OpenInMassdriverButton
          url={`${reposUrl(
            api.appUrl,
            api.organizationId,
          )}?createOciRepo=true`}
        >
          New Repository
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
          searchable
          hasMore={hasMore}
          variant="outlined"
          emptyMessage={emptyMessage}
          {...dataListParams}
        />
      )}
    </PageLayout>
  );
};
