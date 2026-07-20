import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMassdriverSubscription } from '../../../hooks/useMassdriverSubscription';
import {
  ENVIRONMENT_EVENTS_SUBSCRIPTION,
  PROJECT_EVENTS_SUBSCRIPTION,
} from './queries';

const RealtimeRevisionContext = createContext(0);

export const useRealtimeRevision = (): number =>
  useContext(RealtimeRevisionContext);

const COALESCE_MS = 250;

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
