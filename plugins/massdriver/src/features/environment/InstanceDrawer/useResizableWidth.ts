import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export const useResizableWidth = ({
  defaultWidth = 720,
  minWidth = 575,
}: {
  defaultWidth?: number;
  minWidth?: number;
} = {}) => {
  const [width, setWidth] = useState(defaultWidth);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseMove = useCallback(
    (event: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      const parent = panelRef.current?.parentElement;
      const rect = parent?.getBoundingClientRect();
      const max = rect ? rect.width : window.innerWidth;
      const next = rect
        ? rect.right - event.clientX
        : window.innerWidth - event.clientX;
      setWidth(Math.min(max, Math.max(minWidth, next)));
    },
    [minWidth],
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onResizeStart = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return { width, panelRef, onResizeStart };
};

export default useResizableWidth;
