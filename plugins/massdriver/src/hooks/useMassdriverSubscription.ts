import { useEffect, useRef } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef, type MassdriverSubscriptionError } from '../api';

const MAX_BACKOFF_MS = 10_000;

const backoffDelay = (attempt: number): number =>
  Math.min(1000 * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);

// Abortable sleep — resolves after `ms`, or immediately if the signal aborts.
const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise<void>(resolve => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

/**
 * Subscribe to a Massdriver GraphQL subscription through the backend SSE relay.
 *
 * Opens one SSE stream per (query, variables) and re-subscribes when they
 * change. `onData` / `onError` are held in refs so passing fresh inline
 * callbacks each render does not tear the stream down. If the stream ends
 * (server close or transport error) it reconnects with exponential backoff
 * — a healthy message resets the backoff. Aborted on unmount / when `skip`
 * flips true.
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
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  onDataRef.current = onData;
  onErrorRef.current = onError;

  const variablesKey = JSON.stringify(variables ?? {});

  useEffect(() => {
    if (skip) return undefined;
    const controller = new AbortController();
    const attempt = { count: 0 };
    // Fatal errors (auth/validation — see MassdriverSubscriptionError) can't
    // heal on retry; stop the loop instead of reconnecting forever.
    const fatal = { seen: false };

    const handleData = (data: T) => {
      attempt.count = 0; // healthy stream → reset backoff
      onDataRef.current(data);
    };
    const handleError = (error: MassdriverSubscriptionError) => {
      if (error.fatal) fatal.seen = true;
      onErrorRef.current?.(error);
    };

    const run = async () => {
      while (!controller.signal.aborted) {
        await api.subscribe<T>(
          query,
          variables,
          { onData: handleData, onError: handleError },
          controller.signal,
        );
        if (controller.signal.aborted || fatal.seen) break;
        attempt.count += 1;
        await sleep(backoffDelay(attempt.count), controller.signal);
      }
    };

    void run();
    return () => controller.abort();
    // `variables` is compared by value via `variablesKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, query, variablesKey, skip]);
};

export default useMassdriverSubscription;
