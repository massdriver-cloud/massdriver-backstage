import { useMemo } from 'react';
import { usePresence, type PresenceViewer } from './PresenceProvider';

/** Web-app viewers currently focused on the given node (full component id). */
const useNodeViewers = (
  nodeId: string | null | undefined,
): PresenceViewer[] => {
  const { viewers } = usePresence();
  return useMemo(
    () =>
      nodeId
        ? viewers.filter(
            viewer =>
              viewer.focus.kind === 'node' && viewer.focus.nodeId === nodeId,
          )
        : [],
    [viewers, nodeId],
  );
};

export default useNodeViewers;
