import { useApi } from '@backstage/frontend-plugin-api';
import { repoTabUrl } from '@massdriver/backstage-plugin-common';
import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import { massdriverApiRef } from '../../../api';
import { OpenInMassdriverButton } from '../../../components/OpenInMassdriverButton';
import {
  buildGrantColumns,
  mapGrantToRow,
  Grant,
} from '../../../components/grantColumns';
import { usePaginatedRelayQuery } from '../../../hooks/usePaginatedRelayQuery';
import { RepoTabHeader } from '../RepoTabHeader';
import { RepoTabLayout } from '../RepoTabLayout';
import type { RepoTabProps } from '../RepoDetailsPage';
import { REPO_GRANTS_QUERY } from '../queries';

// Ported from the Massdriver web app. Uses the shared
// tab layout + header, matching the web. The web app's "Add permission" and
// per-row "Remove" both mutate — here they deep-link out to this repo's
// Permissions tab in the Massdriver web app (read-only parity).
export const PermissionsTab = ({ repoId, version }: RepoTabProps) => {
  const api = useApi(massdriverApiRef);
  const { items, loading, error, hasMore, dataListParams } =
    usePaginatedRelayQuery<Grant>(REPO_GRANTS_QUERY, {
      responseKey: ['ociRepo', 'grants'],
      variables: { id: repoId },
      pageSize: 20,
    });

  const manageUrl = repoTabUrl(
    api.appUrl,
    api.organizationId,
    repoId,
    version || 'all',
    'permissions',
  );
  const columns = buildGrantColumns({ manageUrl });
  const rows = items.map(mapGrantToRow);

  return (
    <RepoTabLayout>
      <RepoTabHeader
        title="Permissions"
        description="Share this repository with other projects. Each permission grants repo:pull to recipient projects whose attributes match the recipient conditions."
        actions={
          <OpenInMassdriverButton url={manageUrl}>
            Add permission
          </OpenInMassdriverButton>
        }
      />
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          rows={rows}
          columns={columns}
          loading={loading}
          serverSide
          hasMore={hasMore}
          emptyMessage="No permissions yet. Add one to share this repository with other projects."
          variant="outlined"
          {...dataListParams}
        />
      )}
    </RepoTabLayout>
  );
};
