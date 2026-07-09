import { useCallback, useEffect, useState } from 'react';
import { Position, useConnection } from '@xyflow/react';
import Box from '@massdriver/ui/Box';
import ExpandCircleDownOutlinedIcon from '@massdriver/ui/icons/ExpandCircleDownOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import NodeHandle from './NodeHandle';
import useRadialPositions from './useRadialPositions';
import useAnimationFrameSync from './useAnimationFrameSync';
import useTransitionLifecycle from './useTransitionLifecycle';
import type { DiagramHandle } from '../diagramFactory';
import { NODE_HEIGHT } from '../DiagramNode.constants';

const HOTSPOT_WIDTH = 200;
const HOTSPOT_HEIGHT = 200;
const RADIUS = 70;
const START_ANGLE = 70;
const END_ANGLE = -70;
const TRANSITION_STAGGER_MS = 10;
const OPEN_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
const CLOSE_EASING = 'cubic-bezier(0.0, 0.0, 0.2, 1)';

const ORIGIN_X = HOTSPOT_WIDTH / 2;
const ORIGIN_Y = (HOTSPOT_HEIGHT - NODE_HEIGHT) / 2 + NODE_HEIGHT / 2;
const CLOSED_POSITION = { xPos: ORIGIN_X, yPos: ORIGIN_Y };

const connectionSelector = ({ inProgress }: { inProgress: boolean }) =>
  inProgress;

const transitionStyle = (isOpen: boolean, index: number) => ({
  transition: isOpen
    ? `top 250ms ${OPEN_EASING} ${
        index * TRANSITION_STAGGER_MS
      }ms, left 250ms ${OPEN_EASING} ${
        index * TRANSITION_STAGGER_MS
      }ms, right 250ms ${OPEN_EASING} ${index * TRANSITION_STAGGER_MS}ms`
    : `top 200ms ${CLOSE_EASING}, left 200ms ${CLOSE_EASING}, right 200ms ${CLOSE_EASING}`,
  willChange: isOpen ? 'top, left, right' : 'auto',
});

const ANIMATING_SAFETY_TIMEOUT_MS = 500;

const ExpandableHandleWrapper = ({
  type,
  placement,
  handles = [],
  nodeId,
  isOpen: isOpenProp,
}: {
  type: 'source' | 'target';
  placement: 'left' | 'right';
  handles?: DiagramHandle[];
  nodeId: string;
  isOpen?: boolean;
}) => {
  const inProgress = useConnection(connectionSelector);
  const isOpen = Boolean(isOpenProp) || inProgress;

  const showFan = handles.length > 1;

  const openPositions = useRadialPositions(
    {
      startAngle: START_ANGLE,
      endAngle: END_ANGLE,
      radius: RADIUS,
      numItems: handles.length,
      originX: ORIGIN_X,
      originY: ORIGIN_Y,
    },
    { skip: !showFan },
  );

  const [isAnimating, setIsAnimating] = useState(false);

  const onTransitionStart = useCallback((event: TransitionEvent) => {
    if (event.propertyName !== 'top') return;
    setIsAnimating(prev => (prev ? prev : true));
  }, []);

  const onTransitionEnd = useCallback((event: any) => {
    if (event.propertyName !== 'top') return;
    setIsAnimating(prev => (!prev ? prev : false));
  }, []);

  const onTransitionCancel = useCallback(() => {
    setIsAnimating(prev => (!prev ? prev : false));
  }, []);

  const containerRef = useTransitionLifecycle(
    onTransitionStart,
    onTransitionCancel,
  );

  useEffect(() => {
    if (!isAnimating) return undefined;
    const safety = setTimeout(
      () => setIsAnimating(false),
      ANIMATING_SAFETY_TIMEOUT_MS,
    );
    return () => clearTimeout(safety);
  }, [isAnimating]);

  useAnimationFrameSync(nodeId, isAnimating);

  if (handles.length === 0) return null;

  const reactFlowPosition =
    placement === 'left' ? Position.Left : Position.Right;

  if (!showFan) {
    const handle = handles[0];
    return (
      <NodeHandle
        key={handle.id}
        id={handle.id}
        type={type}
        position={reactFlowPosition}
        placement={placement}
        handleType={handle.handleType}
        hasConnection={handle.hasConnection}
        resourceTypeId={handle.resourceTypeId}
        fieldName={handle.name}
        required={handle.required}
        showFieldStatus={handle.showFieldStatus}
        xPos={0}
        yPos={Math.round(NODE_HEIGHT / 2)}
      />
    );
  }

  return (
    <>
      <HandleContainer
        className="node-handle nodrag"
        ref={containerRef}
        placement={placement}
      >
        {handles.map((handle, index) => {
          const { xPos, yPos } = isOpen
            ? openPositions?.[index] ?? CLOSED_POSITION
            : CLOSED_POSITION;

          return (
            <NodeHandle
              key={handle.id}
              id={handle.id}
              type={type}
              position={reactFlowPosition}
              placement={placement}
              handleType={handle.handleType}
              hasConnection={handle.hasConnection}
              resourceTypeId={handle.resourceTypeId}
              fieldName={handle.name}
              required={handle.required}
              showFieldStatus={handle.showFieldStatus}
              xPos={xPos}
              yPos={yPos}
              onTransitionEnd={onTransitionEnd}
              sx={transitionStyle(isOpen, index)}
            />
          );
        })}
      </HandleContainer>
      <NestedIcon
        className="node-handle"
        placement={placement}
        onClick={(event: any) => event.stopPropagation()}
      />
    </>
  );
};

const HandleContainer = stylin(Box, ['placement'])(
  ({ placement }: { placement: 'left' | 'right' }) => ({
    position: 'absolute',
    width: `${HOTSPOT_WIDTH}px`,
    height: `${HOTSPOT_HEIGHT}px`,
    top: `calc(50% - ${HOTSPOT_HEIGHT / 2}px)`,
    borderRadius: '50%',
    ...(placement === 'left'
      ? {
          left: `-${HOTSPOT_WIDTH / 2}px`,
          clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
        }
      : {
          right: `-${HOTSPOT_WIDTH / 2}px`,
          clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
        }),
  }),
);

const NestedIcon = stylin(ExpandCircleDownOutlinedIcon, ['placement'])(
  ({ theme, placement }: { theme: any; placement: 'left' | 'right' }) => ({
    zIndex: 10,
    position: 'absolute',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50%',
    fontSize: '18px',
    width: '27px',
    height: '27px',
    top: '50%',
    left: placement === 'left' ? '0%' : '100%',
    transform: `translate(-50%, -50%) rotate(${
      placement === 'left' ? 90 : 270
    }deg)`,
    color: theme.palette.grey[600],
  }),
);

export default ExpandableHandleWrapper;
