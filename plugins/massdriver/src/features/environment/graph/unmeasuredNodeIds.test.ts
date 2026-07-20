import { unmeasuredNodeIds } from './unmeasuredNodeIds';

describe('unmeasuredNodeIds', () => {
  it('returns ids of nodes without handleBounds', () => {
    const nodeLookup = new Map([
      ['a', { id: 'a', internals: { handleBounds: { source: [] } } }],
      ['b', { id: 'b', internals: {} }],
      ['c', { id: 'c', internals: { handleBounds: undefined } }],
    ]);
    expect(unmeasuredNodeIds(nodeLookup)).toEqual(['b', 'c']);
  });

  it('returns an empty array when every node is measured', () => {
    const nodeLookup = new Map([
      ['a', { id: 'a', internals: { handleBounds: { source: [] } } }],
    ]);
    expect(unmeasuredNodeIds(nodeLookup)).toEqual([]);
  });
});
