import { useEffect, useRef } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef, type MassdriverSubscriptionError } from '../api';

const MAX_BACKOFF_MS = 10_000;

const backoffDelay = (attempt: number): number =>
  Math.min(1000 * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);

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
    const fatal = { seen: false };

    const handleData = (data: T) => {
      attempt.count = 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, query, variablesKey, skip]);
};

export default useMassdriverSubscription;
