import {
  buildDiagram,
  BASE_EDGE_STYLE,
  DISCONNECTED_EDGE_STYLE,
} from './diagramFactory';
import { NODE_WIDTH, NODE_HEIGHT } from './DiagramNode.constants';

const componentA = {
  id: 'proj-a',
  name: 'Alpha',
  position: { x: 10, y: 20 },
  ociRepo: { id: 'repo-a', name: 'alpha-repo' },
};
const componentB = {
  id: 'proj-b',
  name: 'Beta',
  position: { x: 300, y: 20 },
  ociRepo: { id: 'repo-b', name: 'beta-repo' },
};

const instanceA = {
  id: 'proj-env-a',
  name: 'Alpha',
  status: 'RUNNING',
  version: '1.0.0',
  bundle: {
    icon: '<svg>a</svg>',
    dependencies: [],
    resources: [
      {
        name: 'bucket',
        resourceType: { id: 'rt-bucket', connectionOrientation: 'LINK' },
      },
    ],
  },
};
const instanceB = {
  id: 'proj-env-b',
  name: 'Beta',
  status: 'PENDING',
  version: '2.0.0',
  bundle: {
    icon: null,
    dependencies: [
      {
        name: 'storage',
        required: true,
        resourceType: { id: 'rt-bucket', connectionOrientation: 'LINK' },
      },
    ],
    resources: [],
  },
};

describe('buildDiagram', () => {
  it('returns empty nodes and edges for empty/no input', () => {
    expect(buildDiagram()).toEqual({ nodes: [], edges: [] });
    expect(buildDiagram({})).toEqual({ nodes: [], edges: [] });
  });

  it('drops components that have no matching instance', () => {
    const { nodes } = buildDiagram({
      components: [componentA],
      instances: [],
    });
    expect(nodes).toEqual([]);
  });

  it('builds a node per component-with-instance with position, size, and meta', () => {
    const { nodes } = buildDiagram({
      components: [componentA],
      instances: [instanceA],
      selectedComponentId: 'a',
    });
    expect(nodes).toHaveLength(1);
    const node = nodes[0];
    expect(node.id).toBe('proj-a');
    expect(node.position).toEqual({ x: 10, y: 20 });
    expect(node.type).toBe('DiagramNode');
    expect(node.width).toBe(NODE_WIDTH);
    expect(node.height).toBe(NODE_HEIGHT);
    expect(node.data).toMatchObject({
      id: 'a',
      instanceId: 'a',
      fullInstanceId: 'proj-env-a',
      name: 'Alpha',
      ociRepoName: 'alpha-repo',
      icon: '<svg>a</svg>',
      version: '1.0.0',
      status: 'RUNNING',
      isSelected: true,
    });
  });

  it('defaults position to the origin when absent', () => {
    const { nodes } = buildDiagram({
      components: [{ id: 'proj-a', name: 'Alpha' }],
      instances: [instanceA],
    });
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it('builds dependency handles with required status and resource handles without it', () => {
    const { nodes } = buildDiagram({
      components: [componentB],
      instances: [instanceB],
    });
    const { dependencyHandles, resourceHandles } = nodes[0].data;
    expect(dependencyHandles).toEqual([
      {
        id: 'storage',
        name: 'storage',
        required: true,
        resourceTypeId: 'rt-bucket',
        hasConnection: false,
        handleType: 'required',
        showFieldStatus: true,
      },
    ]);
    expect(resourceHandles).toEqual([]);
  });

  it('marks a slot without a resource type as an error handle', () => {
    const { nodes } = buildDiagram({
      components: [componentB],
      instances: [
        {
          ...instanceB,
          bundle: {
            ...instanceB.bundle,
            dependencies: [{ name: 'mystery', required: false }],
          },
        },
      ],
    });
    expect(nodes[0].data.dependencyHandles[0]).toMatchObject({
      handleType: 'error',
      resourceTypeId: null,
    });
  });

  it('excludes slots whose orientation is not LINK', () => {
    const { nodes } = buildDiagram({
      components: [componentB],
      instances: [
        {
          ...instanceB,
          bundle: {
            ...instanceB.bundle,
            dependencies: [
              {
                name: 'env-default',
                resourceType: {
                  id: 'rt',
                  connectionOrientation: 'ENVIRONMENT_DEFAULT',
                },
              },
              {
                name: 'linked',
                resourceType: { id: 'rt2', connectionOrientation: 'LINK' },
              },
            ],
          },
        },
      ],
    });
    expect(nodes[0].data.dependencyHandles.map(handle => handle.name)).toEqual([
      'linked',
    ]);
  });

  it('builds a connected (solid) edge for a link that has a connection', () => {
    const { edges } = buildDiagram({
      components: [componentA, componentB],
      instances: [instanceA, instanceB],
      links: [
        {
          id: 'link-1',
          fromField: 'bucket',
          toField: 'storage',
          fromComponent: { id: 'proj-a' },
          toComponent: { id: 'proj-b' },
        },
      ],
      connections: [
        {
          id: 'conn-1',
          fromField: 'bucket',
          toField: 'storage',
          fromInstance: { id: 'proj-env-a' },
          toInstance: { id: 'proj-env-b' },
          link: { id: 'link-1' },
        },
      ],
    });
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: 'link-1',
      source: 'proj-a',
      sourceHandle: 'bucket',
      target: 'proj-b',
      targetHandle: 'storage',
      style: BASE_EDGE_STYLE,
      data: { isConnection: true },
    });
  });

  it('builds a disconnected (dashed) edge for a link with no connection', () => {
    const { edges } = buildDiagram({
      components: [componentA, componentB],
      instances: [instanceA, instanceB],
      links: [
        {
          id: 'link-1',
          fromField: 'bucket',
          toField: 'storage',
          fromComponent: { id: 'proj-a' },
          toComponent: { id: 'proj-b' },
        },
      ],
      connections: [],
    });
    expect(edges[0].style).toBe(DISCONNECTED_EDGE_STYLE);
    expect(edges[0].data).toEqual({ isConnection: false });
  });

  it('marks handles connected via matching connections', () => {
    const { nodes } = buildDiagram({
      components: [componentA, componentB],
      instances: [instanceA, instanceB],
      connections: [
        {
          id: 'conn-1',
          fromField: 'bucket',
          toField: 'storage',
          fromInstance: { id: 'proj-env-a' },
          toInstance: { id: 'proj-env-b' },
          link: { id: 'link-1' },
        },
      ],
    });
    const alpha = nodes.find(node => node.id === 'proj-a')!;
    const beta = nodes.find(node => node.id === 'proj-b')!;
    expect(alpha.data.resourceHandles[0].hasConnection).toBe(true);
    expect(beta.data.dependencyHandles[0].hasConnection).toBe(true);
  });

  it('drops a link whose endpoints do not resolve to real slot fields', () => {
    const { edges } = buildDiagram({
      components: [componentA, componentB],
      instances: [instanceA, instanceB],
      links: [
        {
          id: 'bogus',
          fromField: 'nonexistent',
          toField: 'storage',
          fromComponent: { id: 'proj-a' },
          toComponent: { id: 'proj-b' },
        },
      ],
    });
    expect(edges).toEqual([]);
  });
});
