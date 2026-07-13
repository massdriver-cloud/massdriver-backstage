import flattenDeploymentComparison from './flattenDeploymentComparison';

describe('flattenDeploymentComparison', () => {
  it('returns [] for null or undefined input', () => {
    expect(flattenDeploymentComparison(null)).toEqual([]);
    expect(flattenDeploymentComparison(undefined)).toEqual([]);
  });

  it('always emits a version row first, then one row per param', () => {
    const rows = flattenDeploymentComparison({
      version: { source: '1.0', target: '2.0', equal: false },
      params: [
        {
          path: '.replicas',
          equal: false,
          source: { present: true, value: '2' },
          target: { present: true, value: '3' },
        },
      ],
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: '__version__',
      kind: 'version',
      path: '__version__',
      sourceValue: '1.0',
      targetValue: '2.0',
      equal: false,
      status: 'different',
    });
    expect(rows[1]).toMatchObject({
      id: '.replicas',
      kind: 'param',
      path: '.replicas',
      sourceValue: '2',
      targetValue: '3',
      status: 'different',
    });
  });

  it('marks equal params with the "equal" status', () => {
    const rows = flattenDeploymentComparison({
      version: { source: '1.0', target: '1.0', equal: true },
      params: [
        {
          path: '.name',
          equal: true,
          source: { present: true, value: 'web' },
          target: { present: true, value: 'web' },
        },
      ],
    });
    expect(rows[0].status).toBe('equal');
    expect(rows[1].status).toBe('equal');
  });

  it('classifies params present on only one side', () => {
    const rows = flattenDeploymentComparison({
      params: [
        {
          path: '.added',
          source: { present: false },
          target: { present: true, value: 't' },
        },
        {
          path: '.removed',
          source: { present: true, value: 's' },
          target: { present: false },
        },
      ],
    });
    const added = rows.find(row => row.path === '.added')!;
    const removed = rows.find(row => row.path === '.removed')!;
    expect(added.status).toBe('targetOnly');
    expect(added.sourceValue).toBeNull();
    expect(added.targetValue).toBe('t');
    expect(removed.status).toBe('sourceOnly');
    expect(removed.sourceValue).toBe('s');
    expect(removed.targetValue).toBeNull();
  });

  it('defaults missing sides to absent and yields null values', () => {
    const rows = flattenDeploymentComparison({ params: [{ path: '.orphan' }] });
    const version = rows[0];
    const param = rows[1];
    expect(version).toMatchObject({
      sourceValue: null,
      targetValue: null,
      status: 'targetOnly',
    });
    expect(param).toMatchObject({
      path: '.orphan',
      sourceValue: null,
      targetValue: null,
      status: 'targetOnly',
    });
  });

  it('serializes object values as JSON and a present-null value as "null"', () => {
    const rows = flattenDeploymentComparison({
      params: [
        {
          path: '.config',
          source: { present: true, value: { a: 1 } },
          target: { present: true, value: null },
        },
      ],
    });
    expect(rows[1].sourceValue).toBe('{"a":1}');
    expect(rows[1].targetValue).toBe('null');
  });

  it('filters out null param entries', () => {
    const rows = flattenDeploymentComparison({
      params: [null, { path: '.keep', source: { present: true, value: 'x' } }],
    });
    expect(rows).toHaveLength(2);
    expect(rows[1].path).toBe('.keep');
  });
});
