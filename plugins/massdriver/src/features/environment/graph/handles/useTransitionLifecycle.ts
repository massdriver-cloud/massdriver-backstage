import { useEffect, useRef } from 'react';

const useTransitionLifecycle = (
  onStart: (event: TransitionEvent) => void,
  onCancel: (event: TransitionEvent) => void,
) => {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    node.addEventListener('transitionstart', onStart as EventListener);
    node.addEventListener('transitioncancel', onCancel as EventListener);
    return () => {
      node.removeEventListener('transitionstart', onStart as EventListener);
      node.removeEventListener('transitioncancel', onCancel as EventListener);
    };
  }, [onStart, onCancel]);
  return ref;
};

export default useTransitionLifecycle;
