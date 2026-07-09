import { useEffect, useMemo, useRef } from 'react';
import { useViewport } from '@xyflow/react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { usePresence } from '../realtime/PresenceProvider';
import userColor from '../realtime/userColor';

// Ported from apps/web features/environments/components/RemoteCursors. Cursor
// positions arrive in flow coordinates (the web app broadcasts
// screenToFlowPosition), so each is projected through the local viewport and
// lerped toward its target outside React for smooth 60fps motion.
const CURSOR_PATH = 'M3 2 L3 18 L8 14 L11 21 L13 20 L10 13 L17 13 Z';
const LERP_FACTOR = 0.35;

interface CursorEntry {
  el: HTMLElement | null;
  displayed: { x: number; y: number };
  target: { x: number; y: number };
}

/** Live cursors of web-app users viewing this environment. Read-only overlay. */
const RemoteCursors = () => {
  const { viewers } = usePresence();
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const cursorsRef = useRef(new Map<string, CursorEntry>());

  const visible = useMemo(
    () =>
      viewers.filter(
        viewer =>
          viewer.cursor && viewer.cursor.x != null && viewer.cursor.y != null,
      ),
    [viewers],
  );

  visible.forEach(viewer => {
    const screenX = (viewer.cursor!.x as number) * zoom + viewportX;
    const screenY = (viewer.cursor!.y as number) * zoom + viewportY;
    const existing = cursorsRef.current.get(viewer.accountId);
    if (existing) {
      existing.target.x = screenX;
      existing.target.y = screenY;
    } else {
      cursorsRef.current.set(viewer.accountId, {
        el: null,
        displayed: { x: screenX, y: screenY },
        target: { x: screenX, y: screenY },
      });
    }
  });

  const visibleIds = new Set(visible.map(viewer => viewer.accountId));
  cursorsRef.current.forEach((_value, key) => {
    if (!visibleIds.has(key)) cursorsRef.current.delete(key);
  });

  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      cursorsRef.current.forEach(entry => {
        if (!entry.el) return;
        const dx = entry.target.x - entry.displayed.x;
        const dy = entry.target.y - entry.displayed.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          entry.displayed.x = entry.target.x;
          entry.displayed.y = entry.target.y;
        } else {
          entry.displayed.x += dx * LERP_FACTOR;
          entry.displayed.y += dy * LERP_FACTOR;
        }
        entry.el.style.transform = `translate3d(${entry.displayed.x}px, ${entry.displayed.y}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  const attachRef = (accountId: string) => (element: HTMLElement | null) => {
    const entry = cursorsRef.current.get(accountId);
    if (!entry) return;
    entry.el = element;
    if (element) {
      element.style.transform = `translate3d(${entry.displayed.x}px, ${entry.displayed.y}px, 0)`;
    }
  };

  return (
    <Layer>
      {visible.map(viewer => {
        const color = userColor(viewer.accountId);
        const label = viewer.firstName || viewer.email;
        return (
          <CursorWrapper
            key={viewer.accountId}
            ref={attachRef(viewer.accountId)}
          >
            <CursorSvg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d={CURSOR_PATH}
                fill={color}
                stroke="#fff"
                strokeWidth="1"
              />
            </CursorSvg>
            <Label sx={{ backgroundColor: color }}>{label}</Label>
          </CursorWrapper>
        );
      })}
    </Layer>
  );
};

export default RemoteCursors;

const Layer = stylin(Box)({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  zIndex: 4,
});

const CursorWrapper = stylin(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  willChange: 'transform',
});

const CursorSvg = stylin('svg')({
  display: 'block',
  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
});

const Label = stylin(Typography)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: 18,
  left: 14,
  padding: theme.spacing(0.25, 0.75),
  borderRadius: theme.custom.general.borderRadiusSm,
  color: '#fff',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
}));
