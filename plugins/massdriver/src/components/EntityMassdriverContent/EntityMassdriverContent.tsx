import {
  EmptyState,
  Link,
  Progress,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  environmentUrl,
  instanceUrl,
  projectUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import { massdriverApiRef } from '../../api';
import { getMassdriverScope, MassdriverScope } from '../../entity';
import { InstanceRow } from '../../queries';
import { useMassdriverInstances } from '../../useInstances';
import { InstanceStatusIndicator } from '../InstanceStatusIndicator';

const columns = (
  appUrl: string,
  orgId: string,
): TableColumn<InstanceRow>[] => [
  {
    title: 'Instance',
    field: 'id',
    render: row => (
      <Link to={instanceUrl(appUrl, orgId, row.id)}>{row.id}</Link>
    ),
  },
  {
    title: 'Status',
    field: 'status',
    render: row => <InstanceStatusIndicator status={row.status} />,
  },
  { title: 'Resolved version', field: 'resolvedVersion' },
  { title: 'Deployed version', field: 'deployedVersion' },
];

const scopeDeepLink = (
  scope: MassdriverScope,
  appUrl: string,
  orgId: string,
): string => {
  switch (scope.kind) {
    case 'project':
      return projectUrl(appUrl, orgId, scope.projectId);
    case 'environment':
      return environmentUrl(appUrl, orgId, scope.environmentId);
    case 'instance':
      return instanceUrl(appUrl, orgId, scope.instanceId);
    default:
      return appUrl;
  }
};

/**
 * Entity content tab that lists the Massdriver instances for the entity's
 * scope (project or environment) or the details of a single instance.
 *
 * @public
 */
export const EntityMassdriverContent = () => {
  const { entity } = useEntity();
  const api = useApi(massdriverApiRef);
  const scope = getMassdriverScope(entity);
  const orgId = scope?.orgId || api.organizationId;
  const { value: instances, loading, error } = useMassdriverInstances(scope);

  if (!scope) {
    return (
      <EmptyState
        missing="info"
        title="Not a Massdriver entity"
        description="This entity has no Massdriver annotations."
      />
    );
  }

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Table<InstanceRow>
      title="Massdriver instances"
      options={{ search: true, paging: (instances?.length ?? 0) > 20 }}
      columns={columns(api.appUrl, orgId)}
      data={instances ?? []}
      emptyContent={
        <EmptyState
          missing="data"
          title="No instances"
          description="No Massdriver instances were found for this entity."
          action={
            <Link to={scopeDeepLink(scope, api.appUrl, orgId)}>
              Open in Massdriver
            </Link>
          }
        />
      }
    />
  );
};
