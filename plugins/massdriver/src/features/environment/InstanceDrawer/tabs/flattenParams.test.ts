import flattenParams from './flattenParams';

describe('flattenParams', () => {
  it('returns [] for null or undefined top-level input', () => {
    expect(flattenParams(null)).toEqual([]);
    expect(flattenParams(undefined)).toEqual([]);
  });

  it('wraps a top-level primitive under the "$" root path', () => {
    expect(flattenParams(42)).toEqual([{ id: '$', path: '$', value: 42 }]);
    expect(flattenParams('hello')).toEqual([
      { id: '$', path: '$', value: 'hello' },
    ]);
  });

  it('emits a single row for an empty object or array', () => {
    expect(flattenParams({})).toEqual([{ id: '$', path: '$', value: {} }]);
    expect(flattenParams([])).toEqual([{ id: '$', path: '$', value: [] }]);
  });

  it('emits jq-style paths for nested objects', () => {
    expect(flattenParams({ database: { port: 5432 } })).toEqual([
      { id: '.database.port', path: '.database.port', value: 5432 },
    ]);
  });

  it('indexes array elements in the path', () => {
    expect(flattenParams({ list: [1, 2] })).toEqual([
      { id: '.list[0]', path: '.list[0]', value: 1 },
      { id: '.list[1]', path: '.list[1]', value: 2 },
    ]);
  });

  it('combines object and array segments for deep leaves', () => {
    expect(flattenParams({ containers: [{ image: 'nginx' }] })).toEqual([
      {
        id: '.containers[0].image',
        path: '.containers[0].image',
        value: 'nginx',
      },
    ]);
  });

  it('treats a nested null as a leaf value', () => {
    expect(flattenParams({ optional: null })).toEqual([
      { id: '.optional', path: '.optional', value: null },
    ]);
  });

  it('indexes a top-level array against the empty base path', () => {
    expect(flattenParams([10, 20])).toEqual([
      { id: '[0]', path: '[0]', value: 10 },
      { id: '[1]', path: '[1]', value: 20 },
    ]);
  });
});
