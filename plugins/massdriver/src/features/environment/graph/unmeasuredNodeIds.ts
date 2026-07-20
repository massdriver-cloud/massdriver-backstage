interface MeasurableNode {
  id: string;
  internals: { handleBounds?: unknown };
}

export const unmeasuredNodeIds = (
  nodeLookup: Map<string, MeasurableNode>,
): string[] =>
  [...nodeLookup.values()]
    .filter(node => !node.internals.handleBounds)
    .map(node => node.id);

export default unmeasuredNodeIds;
