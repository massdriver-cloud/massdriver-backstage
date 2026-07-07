import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { DiagramNodeType } from './diagramFactory';

// Ported LAYOUT_OPTIONS from apps/web/.../hooks/utilities/useDiagramLayout.js.
// Read-only: the layout is applied in-memory only — positions are NOT persisted
// back to the API.
const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.spacing.nodeNode': '80',
  'elk.direction': 'RIGHT',
  'elk.separateConnectedComponents': 'false',
};

const useDiagramLayout = ({
  setNodes,
}: {
  setNodes: Dispatch<SetStateAction<DiagramNodeType[]>>;
}) => {
  const reactFlowInstance = useReactFlow();
  const [isLayingOut, setIsLayingOut] = useState(false);

  const onLayoutClick = useCallback(async () => {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    const elk = new ELK();

    const { nodes, edges } = reactFlowInstance.toObject() || {};
    if (!nodes?.length) return;

    setIsLayingOut(true);
    try {
      const laidOut = await elk.layout({
        id: 'root',
        layoutOptions: LAYOUT_OPTIONS,
        children: nodes as any,
        edges: edges as any,
      });

      const nextPositions = new Map(
        (laidOut.children ?? []).map(child => [
          child.id,
          { x: Math.round(child.x ?? 0), y: Math.round(child.y ?? 0) },
        ]),
      );

      setNodes(current =>
        current.map(node => {
          const next = nextPositions.get(node.id);
          return next ? { ...node, position: next } : node;
        }),
      );
    } finally {
      setIsLayingOut(false);
    }
  }, [reactFlowInstance, setNodes]);

  return { onLayoutClick, isLayingOut };
};

export default useDiagramLayout;
