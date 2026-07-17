import { useApi } from '@backstage/frontend-plugin-api';
import { resourceTabUrl } from '@massdriver/backstage-plugin-common';
import Alert from '@massdriver/ui/Alert';
import DataList from '@massdriver/ui/DataList';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import { OpenInMassdriverButton } from '../../../components/OpenInMassdriverButton';
import {
  buildGrantColumns,
  Grant,
  mapGrantToRow,
} from '../../../components/grantColumns';
import { RESOURCE_GRANTS_QUERY } from '../queries';
import { SettingsTabLayout } from './SettingsTabLayout';
import { TabHeader } from './TabHeader';

interface GrantsResource {
  id: string;
  name?: string | null;
  grants?: { items?: (Grant | null)[] | null } | null;
}

export const PermissionsTab = ({ resourceId }: { resourceId: string }) => {
  const api = useApi(massdriverApiRef);
  const {
    value: resource,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(RESOURCE_GRANTS_QUERY, {
      id: resourceId,
    })) as { resource: GrantsResource | null };
    return data.resource;
  }, [api, resourceId]);

  const manageUrl = resourceTabUrl(
    api.appUrl,
    api.organizationId,
    resourceId,
    'permissions',
  );
  const rows = (resource?.grants?.items ?? [])
    .filter(Boolean)
    .map(grant => mapGrantToRow(grant as Grant));
  const columns = buildGrantColumns({ manageUrl });

  return (
    <SettingsTabLayout>
      <TabHeader
        title="Permissions"
        description="Share this resource with other environments. Each permission grants resource:export to recipient environments whose attributes match the conditions."
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
          emptyMessage="No permissions yet. Add one to share this resource with other environments."
          variant="outlined"
        />
      )}
    </SettingsTabLayout>
  );
};
