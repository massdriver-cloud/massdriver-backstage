import {
  InfoCard,
  Progress,
  ResponseErrorPanel,
  StructuredMetadataTable,
} from '@backstage/core-components';
import { useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  environmentUrl,
  instanceUrl,
  projectUrl,
} from '@massdriver/backstage-plugin-common';
import { massdriverApiRef } from '../../api';
import { getMassdriverScope, MassdriverScope } from '../../entity';
import { InstanceRow } from '../../queries';
import { useMassdriverInstances } from '../../useInstances';
import { InstanceStatusIndicator } from '../InstanceStatusIndicator';

const deepLinkFor = (
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

const summaryMetadata = (
  scope: MassdriverScope,
  instances: InstanceRow[],
): Record<string, unknown> => {
  if (scope.kind === 'instance') {
    const instance = instances[0];
    if (!instance) {
      return { Status: 'Not found' };
    }
    return {
      Status: <InstanceStatusIndicator status={instance.status} />,
      'Resolved version': instance.resolvedVersion ?? '—',
      'Deployed version': instance.deployedVersion ?? '—',
    };
  }

  const provisioned = instances.filter(i => i.status === 'PROVISIONED').length;
  const failed = instances.filter(i => i.status === 'FAILED').length;
  return {
    Instances: instances.length,
    Provisioned: provisioned,
    Failed: failed,
  };
};

/**
 * Entity overview card summarizing the entity's Massdriver status with a
 * deep-link into the web app.
 *
 * @public
 */
export const EntityMassdriverOverviewCard = () => {
  const { entity } = useEntity();
  const api = useApi(massdriverApiRef);
  const scope = getMassdriverScope(entity);
  const orgId = scope?.orgId || api.organizationId;
  const { value: instances, loading, error } = useMassdriverInstances(scope);

  if (!scope) {
    return null;
  }

  return (
    <InfoCard
      title="Massdriver"
      deepLink={{
        title: 'Open in Massdriver',
        link: deepLinkFor(scope, api.appUrl, orgId),
      }}
    >
      {loading && <Progress />}
      {error && <ResponseErrorPanel error={error} />}
      {!loading && !error && (
        <StructuredMetadataTable
          metadata={summaryMetadata(scope, instances ?? [])}
        />
      )}
    </InfoCard>
  );
};
