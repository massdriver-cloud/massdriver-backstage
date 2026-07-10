import { USAGE_TYPE_CONFIG, USAGE_TYPE_ORDER } from './UsageTab.helpers';

describe('UsageTab.helpers', () => {
  it('orders usage types connection, reference, default', () => {
    expect(USAGE_TYPE_ORDER).toEqual(['connection', 'reference', 'default']);
  });

  it('maps a connection row with an internal instance link', () => {
    const row = USAGE_TYPE_CONFIG.connection.mapRow({
      id: 'c1',
      toField: 'topic',
      createdAt: '2020-01-01T00:00:00Z',
      toInstance: {
        id: 'proj-env-cache',
        status: 'PROVISIONED',
        bundle: { id: 'b1', name: 'aws-sns' },
        environment: { id: 'proj-env', project: { id: 'proj', name: 'Payments' } },
      },
    });
    expect(row).toMatchObject({
      id: 'c1',
      instance: 'proj-env-cache',
      instanceHref:
        '/massdriver/projects/proj/environments/env/instances/cache',
      field: 'topic',
      instanceType: 'aws-sns',
      status: 'PROVISIONED',
      project: 'Payments',
      projectHref: '/massdriver/projects/proj',
    });
    expect(typeof row.when).toBe('string');
  });

  it('maps a remote reference row from the `instance`/`field` shape', () => {
    const row = USAGE_TYPE_CONFIG.reference.mapRow({
      id: 'ref1',
      field: 'db',
      createdAt: '2020-01-01T00:00:00Z',
      instance: {
        id: 'proj-env-api',
        status: 'FAILED',
        bundle: { id: 'b2', name: 'postgres' },
        environment: { id: 'proj-env', project: { id: 'proj', name: 'Payments' } },
      },
    });
    expect(row).toMatchObject({
      id: 'ref1',
      instance: 'proj-env-api',
      field: 'db',
      instanceType: 'postgres',
      status: 'FAILED',
    });
  });

  it('maps an environment default row with an internal environment link', () => {
    const row = USAGE_TYPE_CONFIG.default.mapRow({
      id: 'd1',
      createdAt: '2020-01-01T00:00:00Z',
      environment: {
        id: 'proj-staging',
        name: 'staging',
        project: { id: 'proj', name: 'Payments' },
      },
    });
    expect(row).toMatchObject({
      id: 'd1',
      environment: 'staging',
      environmentHref: '/massdriver/projects/proj/environments/staging',
      project: 'Payments',
      projectHref: '/massdriver/projects/proj',
    });
  });

  it('falls back to -- and null hrefs when targets are missing', () => {
    const row = USAGE_TYPE_CONFIG.connection.mapRow({ id: 'c2' });
    expect(row.instance).toBe('--');
    expect(row.instanceHref).toBeNull();
    expect(row.project).toBe('--');
    expect(row.projectHref).toBeNull();
  });
});
