import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef } from '../../../api';
import { useRelayStream } from './useRelayStream';

/**
 * Subscribe to a Massdriver GraphQL subscription through the backend SSE relay.
 *
 * Opens one SSE stream per (query, variables) and re-subscribes when they
 * change. Reconnect/backoff/fatal-stop semantics live in `useRelayStream`.
 */
export const useMassdriverSubscription = <T = unknown>(
  query: string,
  variables: Record<string, unknown> | undefined,
  {
    onData,
    onError,
    skip,
  }: {
    onData: (data: T) => void;
    onError?: (error: Error) => void;
    skip?: boolean;
  },
) => {
  const api = useApi(massdriverApiRef);
  // `variables` is compared by value so fresh object literals don't resubscribe.
  const variablesKey = JSON.stringify(variables ?? {});

  useRelayStream<T>(
    (handlers, signal) => api.subscribe<T>(query, variables, handlers, signal),
    `subscribe|${query}|${variablesKey}`,
    { onData, onError, skip },
  );
};

export default useMassdriverSubscription;
