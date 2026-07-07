import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Box from '@massdriver/ui/Box';
import DownloadIcon from '@massdriver/ui/icons/DownloadIcon';
import stylin from '@massdriver/ui/stylin';
import DiagramNode from './DiagramNode';
import useDiagramSnapshot from './useDiagramSnapshot';
import type { DiagramNodeType } from './diagramFactory';

const NODE_TYPES = { DiagramNode };

const FIT_VIEW_OPTIONS = {
  padding: 1,
  minZoom: 0.3,
  maxZoom: 1,
};

/** Read-only React Flow canvas for an environment's instances and links. */
const Diagram = ({
  nodes: initialNodes,
  edges: initialEdges,
  snapshotName = 'environment',
}: {
  nodes: DiagramNodeType[];
  edges: Edge[];
  snapshotName?: string;
}) => {
  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [, setSearchParams] = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Reseed when the fetched blueprint changes.
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const { onSnapshotClick, isSnapshotting } = useDiagramSnapshot({
    wrapperRef,
    fileNameBase: snapshotName,
  });

  const handleNodeClick = (_event: unknown, node: { data?: { id?: string } }) => {
    const scopedComponentId = node?.data?.id;
    if (!scopedComponentId) return;
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('instance', scopedComponentId);
      return next;
    });
  };

  return (
    <DiagramWrapper ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        multiSelectionKeyCode={null}
        selectionKeyCode={null}
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
      >
        <Background color="#aaa" gap={16} />
        <StyledMiniMap pannable zoomable />
        <StyledControls showInteractive={false}>
          <ControlButton
            onClick={onSnapshotClick}
            disabled={isSnapshotting}
            title="Download snapshot"
            aria-label="Download diagram snapshot"
          >
            <DownloadIcon />
          </ControlButton>
        </StyledControls>
      </ReactFlow>
    </DiagramWrapper>
  );
};

export default Diagram;

const DiagramWrapper = stylin(Box)({
  width: '100%',
  height: '100%',
  position: 'relative',
});

const StyledControls = stylin(Controls)(({ theme }: { theme: any }) => ({
  '&.react-flow__controls': {
    boxShadow: theme.custom.shadows.cardSm,
    borderRadius: theme.custom.general.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',

    '.react-flow__controls-button': {
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      width: theme.spacing(3.5),
      height: theme.spacing(3.5),
      padding: 0,

      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },

      '&:last-child': {
        borderBottom: 'none',
      },

      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },

      svg: {
        fill: theme.palette.text.secondary,
        maxWidth: theme.spacing(1.75),
        maxHeight: theme.spacing(1.75),
      },
    },
  },
}));

const StyledMiniMap = stylin(MiniMap)(({ theme }: { theme: any }) => ({
  '&.react-flow__minimap': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.custom.shadows.cardSm,
    borderRadius: theme.custom.general.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',

    '.react-flow__minimap-mask': {
      fill:
        theme.palette.mode === 'dark'
          ? 'rgba(0, 0, 0, 0.5)'
          : 'rgba(240, 240, 240, 0.6)',
    },

    '.react-flow__minimap-node': {
      fill: theme.palette.text.secondary,
      stroke: 'none',
    },
  },
}));
