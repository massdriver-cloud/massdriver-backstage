import type { Edge, Node } from '@xyflow/react';
import {
  parseComponentId,
  parseInstanceId,
} from '@massdriver/backstage-plugin-common';
import { NODE_WIDTH, NODE_HEIGHT } from './DiagramNode.constants';

// Ported from the Massdriver web app. Read-only:
// edges use the default React Flow edge type (the app's `deletable` edge type
// is dropped since links cannot be removed here).

const BASE_EDGE_STYLE = {
  strokeWidth: '3',
  stroke: '#b7b7b7',
};

const DISCONNECTED_EDGE_STYLE = {
  ...BASE_EDGE_STYLE,
  strokeDasharray: '6 4',
};

export interface ResourceType {
  id: string;
  connectionOrientation?: string | null;
}

export interface Slot {
  name: string;
  required?: boolean | null;
  resourceType?: ResourceType | null;
}

export interface Bundle {
  id?: string;
  name?: string | null;
  version?: string | null;
  icon?: string | null;
  dependencies?: Slot[] | null;
  resources?: Slot[] | null;
}

export interface Instance {
  id: string;
  name?: string | null;
  status?: string | null;
  version?: string | null;
  bundle?: Bundle | null;
}

export interface Component {
  id: string;
  name: string;
  position?: { x: number; y: number } | null;
  ociRepo?: { id: string; name?: string | null } | null;
}

export interface Link {
  id: string;
  fromField: string;
  toField: string;
  fromComponent?: { id: string } | null;
  toComponent?: { id: string } | null;
}

export interface Connection {
  id: string;
  fromField: string;
  toField: string;
  fromInstance?: { id: string } | null;
  toInstance?: { id: string } | null;
  link?: { id: string } | null;
}

export interface DiagramHandle {
  id: string;
  name: string;
  required?: boolean | null;
  resourceTypeId: string | null;
  hasConnection: boolean;
  handleType: string;
  showFieldStatus: boolean;
}

export interface DiagramNodeData {
  id: string;
  instanceId: string;
  fullInstanceId: string;
  name: string;
  ociRepoName: string | null;
  icon: string | null;
  version: string | null;
  status: string | null;
  isSelected: boolean;
  dependencyHandles: DiagramHandle[];
  resourceHandles: DiagramHandle[];
  [key: string]: unknown;
}

export type DiagramNodeType = Node<DiagramNodeData>;

interface BuildDiagramArgs {
  components?: Component[];
  links?: Link[];
  instances?: Instance[];
  connections?: Connection[];
  selectedComponentId?: string | null;
}

const deriveHandleType = (
  { resourceType, required }: Slot,
  showFieldStatus: boolean,
): string => {
  if (!resourceType) return 'error';
  if (showFieldStatus && required) return 'required';
  return 'default';
};

const buildHandles = (
  slots: Slot[] = [],
  connectedNames: Set<string>,
  { showFieldStatus = true }: { showFieldStatus?: boolean } = {},
): DiagramHandle[] =>
  slots
    .filter(
      slot =>
        !slot.resourceType ||
        slot.resourceType.connectionOrientation === 'LINK',
    )
    .map(slot => ({
      id: slot.name,
      name: slot.name,
      required: slot.required,
      resourceTypeId: slot.resourceType?.id ?? null,
      hasConnection: connectedNames.has(slot.name),
      handleType: deriveHandleType(slot, showFieldStatus),
      showFieldStatus,
    }));

const buildDiagram = ({
  components = [],
  links = [],
  instances = [],
  connections = [],
  selectedComponentId = null,
}: BuildDiagramArgs = {}): { nodes: DiagramNodeType[]; edges: Edge[] } => {
  const instancesByScopedComponentId = new Map(
    instances.map(inst => [parseInstanceId(inst.id).scopedComponentId, inst]),
  );

  const connectionsByLinkId = new Map(
    connections
      .map(conn => [conn.link?.id, conn] as const)
      .filter(([id]) => id != null),
  );

  const outgoingByInstanceId = new Map<string, Set<string>>();
  const incomingByInstanceId = new Map<string, Set<string>>();
  connections.forEach(conn => {
    const fromId = conn.fromInstance?.id;
    const toId = conn.toInstance?.id;
    if (fromId) {
      if (!outgoingByInstanceId.has(fromId))
        outgoingByInstanceId.set(fromId, new Set());
      outgoingByInstanceId.get(fromId)!.add(conn.fromField);
    }
    if (toId) {
      if (!incomingByInstanceId.has(toId))
        incomingByInstanceId.set(toId, new Set());
      incomingByInstanceId.get(toId)!.add(conn.toField);
    }
  });

  const componentsWithInstance = components
    .map(component => ({
      component,
      instance:
        instancesByScopedComponentId.get(
          parseComponentId(component.id).scopedComponentId,
        ) ?? null,
    }))
    .filter(
      (entry): entry is { component: Component; instance: Instance } =>
        entry.instance !== null,
    );

  const instanceByComponentId = new Map(
    componentsWithInstance.map(({ component, instance }) => [
      component.id,
      instance,
    ]),
  );

  const resourceFieldsByComponentId = new Map(
    componentsWithInstance.map(({ component, instance }) => [
      component.id,
      new Set((instance.bundle?.resources ?? []).map(slot => slot.name)),
    ]),
  );

  const dependencyFieldsByComponentId = new Map(
    componentsWithInstance.map(({ component, instance }) => [
      component.id,
      new Set((instance.bundle?.dependencies ?? []).map(slot => slot.name)),
    ]),
  );

  const nodes: DiagramNodeType[] = componentsWithInstance.map(
    ({ component, instance }) => {
      const incoming = incomingByInstanceId.get(instance.id) ?? new Set();
      const outgoing = outgoingByInstanceId.get(instance.id) ?? new Set();
      const { scopedComponentId } = parseComponentId(component.id);

      return {
        id: component.id,
        position: component.position ?? { x: 0, y: 0 },
        type: 'DiagramNode',
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          id: scopedComponentId,
          instanceId: scopedComponentId,
          fullInstanceId: instance.id,
          name: component.name,
          ociRepoName: component.ociRepo?.name ?? null,
          icon: instance.bundle?.icon ?? null,
          version: instance.version ?? null,
          status: instance.status ?? null,
          isSelected: scopedComponentId === selectedComponentId,
          dependencyHandles: buildHandles(
            instance.bundle?.dependencies ?? [],
            incoming,
          ),
          resourceHandles: buildHandles(
            instance.bundle?.resources ?? [],
            outgoing,
            {
              showFieldStatus: false,
            },
          ),
        },
      };
    },
  );

  const edges: Edge[] = links
    .map(link => ({
      link,
      connection: connectionsByLinkId.get(link.id) ?? null,
    }))
    .filter(({ link }) => {
      const fromInstance = instanceByComponentId.get(link.fromComponent?.id!);
      const toInstance = instanceByComponentId.get(link.toComponent?.id!);
      if (!fromInstance || !toInstance) return false;
      const resourceFields = resourceFieldsByComponentId.get(
        link.fromComponent!.id,
      );
      const dependencyFields = dependencyFieldsByComponentId.get(
        link.toComponent!.id,
      );
      return Boolean(
        resourceFields?.has(link.fromField) &&
          dependencyFields?.has(link.toField),
      );
    })
    .map(({ link, connection }) => {
      const isConnection = connection !== null;
      return {
        id: link.id,
        source: link.fromComponent!.id,
        sourceHandle: link.fromField,
        target: link.toComponent!.id,
        targetHandle: link.toField,
        style: isConnection ? BASE_EDGE_STYLE : DISCONNECTED_EDGE_STYLE,
        data: { isConnection },
      };
    });

  return { nodes, edges };
};

export { buildDiagram, BASE_EDGE_STYLE, DISCONNECTED_EDGE_STYLE };
