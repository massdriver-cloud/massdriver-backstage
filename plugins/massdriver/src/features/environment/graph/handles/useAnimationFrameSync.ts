import { useEffect } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';

const useAnimationFrameSync = (nodeId: string, isActive: boolean) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (!isActive || !nodeId) return undefined;
    let frame: number;
    const tick = () => {
      updateNodeInternals(nodeId);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [nodeId, isActive, updateNodeInternals]);
};

export default useAnimationFrameSync;
