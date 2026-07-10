import flattenParams from './flattenParams';

describe('flattenParams', () => {
  it('returns an empty array for null/undefined at the root', () => {
    expect(flattenParams(null)).toEqual([]);
    expect(flattenParams(undefined)).toEqual([]);
  });

  it('yields jq-style paths for nested objects', () => {
    expect(flattenParams({ database: { port: 5432 } })).toEqual([
      { id: '.database.port', path: '.database.port', value: 5432 },
    ]);
  });

  it('indexes array members', () => {
    expect(flattenParams({ containers: [{ image: 'nginx' }] })).toEqual([
      {
        id: '.containers[0].image',
        path: '.containers[0].image',
        value: 'nginx',
      },
    ]);
  });

  it('keeps empty objects and arrays as leaf rows', () => {
    expect(flattenParams({ tags: [], meta: {} })).toEqual([
      { id: '.tags', path: '.tags', value: [] },
      { id: '.meta', path: '.meta', value: {} },
    ]);
  });

  it('represents a scalar root as `$`', () => {
    expect(flattenParams('hello')).toEqual([
      { id: '$', path: '$', value: 'hello' },
    ]);
  });
});
