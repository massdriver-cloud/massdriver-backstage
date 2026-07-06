import { useApi } from '@backstage/frontend-plugin-api';
import useAsync, { AsyncState } from 'react-use/esm/useAsync';
import { massdriverApiRef } from './api';
import { MassdriverScope } from './entity';
import {
  INSTANCE_BY_ID,
  INSTANCES_BY_ENVIRONMENT,
  INSTANCES_BY_PROJECT,
  InstanceResult,
  InstanceRow,
  InstancesPageResult,
} from './queries';

/**
 * Fetch the Massdriver instances for a scope. Projects and environments return
 * a full (cursor-paginated) list; an instance scope returns just that instance.
 */
export const useMassdriverInstances = (
  scope: MassdriverScope | undefined,
): AsyncState<InstanceRow[]> => {
  const api = useApi(massdriverApiRef);

  return useAsync(async (): Promise<InstanceRow[]> => {
    if (!scope) {
      return [];
    }

    if (scope.kind === 'instance') {
      const result = (await api.query(INSTANCE_BY_ID, {
        id: scope.instanceId,
      })) as InstanceResult;
      return result.instance ? [result.instance] : [];
    }

    const query =
      scope.kind === 'project'
        ? INSTANCES_BY_PROJECT
        : INSTANCES_BY_ENVIRONMENT;
    const variables =
      scope.kind === 'project'
        ? { projectId: scope.projectId }
        : { environmentId: scope.environmentId };

    const rows: InstanceRow[] = [];
    let next: string | null = null;
    do {
      const page = (await api.query(query, {
        ...variables,
        cursor: { limit: 100, next },
      })) as InstancesPageResult;
      for (const item of page.instances.items ?? []) {
        if (item) {
          rows.push(item);
        }
      }
      next = page.instances.cursor?.next ?? null;
    } while (next);
    return rows;
  }, [api, scope?.kind, JSON.stringify(scope)]);
};
