import { useEffect, useRef } from 'react';
import { type MassdriverSubscriptionError } from '../../../api';

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

export interface RelayStreamHandlers<T> {
  onData: (data: T) => void;
  onError?: (error: Error) => void;
}

/** Opens one relay SSE stream; resolves when the stream ends. */
export type RelayStreamOpen<T> = (
  handlers: RelayStreamHandlers<T>,
  signal: AbortSignal,
) => Promise<void>;

/**
 * Reconnecting relay-stream loop shared by the GraphQL subscription and
 * presence hooks. Opens one stream per `key` and re-opens when it changes.
 * `open`/`onData`/`onError` are held in refs so fresh inline closures each
 * render do not tear the stream down. If the stream ends (server close or
 * transport error) it reconnects with exponential backoff — a healthy message
 * resets the backoff. Fatal errors (see MassdriverSubscriptionError) stop the
 * loop. Aborted on unmount / when `skip` flips true.
 */
export const useRelayStream = <T = unknown>(
  open: RelayStreamOpen<T>,
  key: string,
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
  const openRef = useRef(open);
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  openRef.current = open;
  onDataRef.current = onData;
  onErrorRef.current = onError;

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
        await openRef.current(
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
  }, [key, skip]);
};

export default useRelayStream;
