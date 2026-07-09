import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { massdriverApiRef, type MassdriverPresenceViewers } from '../../../api';
import { useRelayStream } from './useRelayStream';

/**
 * One web-app user currently viewing the environment, shaped like the web
 * app's `usePresence` viewer (mirrors apps/web features/environments/realtime).
 */
export interface PresenceViewer {
  accountId: string;
  firstName: string;
  email: string;
  avatarUrl: string | null;
  cursor: {
    x: number | null;
    y: number | null;
    packageIdentifier: string | null;
  } | null;
  focus: { kind: 'node'; nodeId: string } | { kind: 'floating' };
}

const PresenceContext = createContext<{ viewers: PresenceViewer[] }>({
  viewers: [],
});

/** Web-app users currently viewing the surrounding environment. */
export const usePresence = () => useContext(PresenceContext);

const toViewer = (
  accountId: string,
  meta: MassdriverPresenceViewers[string],
): PresenceViewer => {
  const cursor = meta.cursor
    ? {
        x: meta.cursor.x,
        y: meta.cursor.y,
        packageIdentifier: meta.cursor.package_identifier ?? null,
      }
    : null;
  return {
    accountId,
    firstName: meta.first_name || '',
    email: meta.email || '',
    avatarUrl: meta.avatar?.url || null,
    cursor,
    focus: cursor?.packageIdentifier
      ? { kind: 'node', nodeId: cursor.packageIdentifier }
      : { kind: 'floating' },
  };
};

/**
 * Streams the environment's live presence (who's viewing in the web app, with
 * cursor positions) through the backend spectator relay and exposes it to
 * descendants. Read-only by design: the Backstage viewer is never tracked or
 * broadcast, so there is no "own presence" here — only web-app viewers.
 *
 * Degrades gracefully: if the relay can't join (e.g. a platform without
 * spectator support), the viewer list just stays empty.
 */
export const PresenceProvider = ({
  environmentId,
  children,
}: {
  environmentId: string;
  children: ReactNode;
}) => {
  const api = useApi(massdriverApiRef);
  const [viewers, setViewers] = useState<PresenceViewer[]>([]);

  // Never show one environment's viewers over another's graph.
  useEffect(() => setViewers([]), [environmentId]);

  useRelayStream<MassdriverPresenceViewers>(
    (handlers, signal) =>
      api.subscribePresence(environmentId, handlers, signal),
    `presence|${environmentId}`,
    {
      skip: !environmentId,
      onData: snapshot =>
        setViewers(
          Object.entries(snapshot).map(([accountId, meta]) =>
            toViewer(accountId, meta),
          ),
        ),
      // A dropped or rejected stream must not leave ghost cursors behind.
      onError: () => setViewers([]),
    },
  );

  const value = useMemo(() => ({ viewers }), [viewers]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export default PresenceProvider;
