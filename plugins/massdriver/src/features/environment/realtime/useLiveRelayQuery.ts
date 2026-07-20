import { useEffect, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef } from '../../../api';
import { useRealtimeRevision } from './RealtimeProvider';

interface LiveQueryState<T> {
  identity: string;
  value?: T;
  error?: Error;
}

export const useLiveRelayQuery = <T>(
  query: string,
  variables: Record<string, unknown> | null,
): { value?: T; error?: Error; loading: boolean } => {
  const api = useApi(massdriverApiRef);
  const revision = useRealtimeRevision();
  const [state, setState] = useState<LiveQueryState<T>>({ identity: '' });

  const skip = variables === null;
  const identity = `${query}|${JSON.stringify(variables)}`;

  useEffect(() => {
    if (skip) return undefined;
    let cancelled = false;
    api.query(query, variables).then(
      value => {
        if (!cancelled) setState({ identity, value: value as T });
      },
      error => {
        if (!cancelled) setState({ identity, error: error as Error });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, query, identity, revision, skip]);

  const fresh = state.identity === identity;
  return {
    value: !skip && fresh ? state.value : undefined,
    error: !skip && fresh ? state.error : undefined,
    loading: !skip && !fresh,
  };
};

export default useLiveRelayQuery;
