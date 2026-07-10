import { toResourceRow } from './toResourceRow';

describe('toResourceRow', () => {
  it('maps resource type name/icon with fallbacks', () => {
    const row = toResourceRow({
      id: 'r1',
      name: 'my-bucket',
      origin: 'IMPORTED',
    });
    expect(row.resourceTypeName).toBe('—');
    expect(row.resourceTypeIcon).toBeNull();
    expect(row.originLabel).toBe('Imported');
    expect(row.location).toBeNull();
  });

  it('labels a provisioned origin and resolves its location', () => {
    const row = toResourceRow({
      id: 'r2',
      name: 'cache',
      origin: 'PROVISIONED',
      resourceType: { id: 'aws-sns', name: 'SNS Topic', icon: 'https://x/i.svg' },
      instance: {
        id: 'proj-env-cache',
        name: 'cache',
        environment: {
          id: 'proj-env',
          name: 'production',
          project: { id: 'proj', name: 'Payments' },
        },
      },
    });
    expect(row.originLabel).toBe('Provisioned');
    expect(row.resourceTypeName).toBe('SNS Topic');
    expect(row.resourceTypeIcon).toBe('https://x/i.svg');
    expect(row.location).toEqual({
      projectId: 'proj',
      environmentId: 'proj-env',
      projectName: 'Payments',
      environmentName: 'production',
    });
  });

  it('falls back to id segments when environment names are missing', () => {
    const row = toResourceRow({
      id: 'r3',
      name: 'thing',
      origin: 'PROVISIONED',
      instance: { id: 'proj-env-thing' },
    });
    expect(row.location).toEqual({
      projectId: 'proj',
      environmentId: null,
      projectName: 'proj',
      environmentName: 'env',
    });
  });

  it('passes an unknown origin through as its own label', () => {
    const row = toResourceRow({ id: 'r4', name: 'x', origin: 'WEIRD' });
    expect(row.originLabel).toBe('WEIRD');
  });
});
