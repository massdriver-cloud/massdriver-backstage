import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMassdriverSubscription } from './useMassdriverSubscription';
import {
  ENVIRONMENT_EVENTS_SUBSCRIPTION,
  PROJECT_EVENTS_SUBSCRIPTION,
} from './queries';

// A monotonically-increasing revision that bumps whenever the environment emits
// an event. Data hooks (graph snapshot, drawer tabs) include it in their
// `useAsync` deps to refetch on change — the plugin has no Apollo cache to merge
// live payloads into, so "refetch on event" is how the read-only views stay
// live. Default 0 outside a provider (hooks simply never refetch from realtime).
const RealtimeRevisionContext = createContext(0);

/** Latest realtime revision for the surrounding environment. */
export const useRealtimeRevision = (): number =>
  useContext(RealtimeRevisionContext);

// Coalesce bursts of events (a deployment can emit many in a tick) into a single
// refetch on the trailing edge.
const COALESCE_MS = 250;

/**
 * Mounts the environment-events and project-events subscriptions and exposes a
 * debounced revision to descendants. Wrap the environment graph page so the
 * graph and instance drawer refetch when the environment changes in the web
 * app. Both scopes are required: instances/deployments/connections/alarms are
 * environment events, but the blueprint half of the graph — components, their
 * positions, and links — only emits project events.
 */
export const RealtimeProvider = ({
  projectId,
  environmentId,
  children,
}: {
  projectId: string;
  environmentId: string;
  children: ReactNode;
}) => {
  const [revision, setRevision] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Shared across both subscriptions so a burst spanning scopes (a deploy
  // emits project and environment events) still coalesces into one refetch.
  const bumpRevision = () => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      setRevision(current => current + 1);
    }, COALESCE_MS);
  };

  useMassdriverSubscription(
    ENVIRONMENT_EVENTS_SUBSCRIPTION,
    { environmentId },
    { skip: !environmentId, onData: bumpRevision },
  );

  useMassdriverSubscription(
    PROJECT_EVENTS_SUBSCRIPTION,
    { projectId },
    { skip: !projectId, onData: bumpRevision },
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <RealtimeRevisionContext.Provider value={revision}>
      {children}
    </RealtimeRevisionContext.Provider>
  );
};

export default RealtimeProvider;
