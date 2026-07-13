import { useEffect, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef } from '../../../api';
import { useRealtimeRevision } from './RealtimeProvider';

interface LiveQueryState<T> {
  identity: string;
  value?: T;
  error?: Error;
}

/**
 * Relay query that stays live via the environment's realtime revision, with two
 * distinct refetch behaviors:
 *
 * - **Identity change** (query/variables): the previous result is dropped and
 *   `loading` goes true — a different entity is being loaded, show a loader.
 * - **Revision bump** (realtime event): the previous result stays rendered and
 *   swaps atomically when fresh data lands — never a loading flash. This is the
 *   plugin's analogue of the web app's "no skeleton flicker on subscription
 *   refetch" rule (see .claude/rules/realtime.md).
 *
 * Pass `variables: null` to skip (returns `{ loading: false }` with no value).
 */
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
    // `variables` participates by value through `identity`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, query, identity, revision, skip]);

  // A result only counts once it matches the current identity; until then the
  // hook is loading and stale state is hidden. Revision bumps keep the identity
  // (and therefore the rendered value) intact while the refetch is in flight.
  const fresh = state.identity === identity;
  return {
    value: !skip && fresh ? state.value : undefined,
    error: !skip && fresh ? state.error : undefined,
    loading: !skip && !fresh,
  };
};

export default useLiveRelayQuery;
