import {
  socketUrl,
  graphqlUrl,
  parseEnvironmentId,
  composeEnvironmentId,
  parseInstanceId,
  parseComponentId,
  composeInstanceId,
  projectsUrl,
  projectUrl,
  environmentUrl,
  instanceUrl,
  instanceTabUrl,
  instanceActionUrl,
  reposUrl,
  repoUrl,
  repoTabUrl,
  resourcesUrl,
  resourceTabUrl,
  resourceUrl,
  repoVersionOverviewUrl,
} from './urls';

const APP_URL = 'https://app.massdriver.cloud';
const ORG_ID = 'org1';

describe('socketUrl', () => {
  it('defaults to the SaaS origin as a wss socket endpoint', () => {
    expect(socketUrl()).toBe('wss://api.massdriver.cloud/api/socket');
  });

  it('swaps https for wss', () => {
    expect(socketUrl('https://api.example.com')).toBe(
      'wss://api.example.com/api/socket',
    );
  });

  it('swaps http for ws (self-hosted / local)', () => {
    expect(socketUrl('http://localhost:4000')).toBe(
      'ws://localhost:4000/api/socket',
    );
  });

  it('trims a trailing slash on the base url', () => {
    expect(socketUrl('https://api.example.com/')).toBe(
      'wss://api.example.com/api/socket',
    );
  });
});

describe('graphqlUrl', () => {
  it('defaults to the SaaS API origin', () => {
    expect(graphqlUrl()).toBe('https://api.massdriver.cloud/api/v2/graphql');
  });

  it('uses a custom API origin', () => {
    expect(graphqlUrl('https://api.example.com')).toBe(
      'https://api.example.com/api/v2/graphql',
    );
  });

  it('trims a trailing slash on the base url', () => {
    expect(graphqlUrl('https://api.example.com/')).toBe(
      'https://api.example.com/api/v2/graphql',
    );
  });
});

describe('composite id parse/compose', () => {
  it('parses an environment id into project + scoped environment', () => {
    expect(parseEnvironmentId('proj-env')).toEqual({
      projectId: 'proj',
      scopedEnvironmentId: 'env',
    });
  });

  it('composes an environment id from its parts', () => {
    expect(composeEnvironmentId('proj', 'env')).toBe('proj-env');
  });

  it('round-trips an environment id', () => {
    const composed = composeEnvironmentId('proj', 'env');
    expect(parseEnvironmentId(composed)).toEqual({
      projectId: 'proj',
      scopedEnvironmentId: 'env',
    });
  });

  it('parses an instance id into all three scoped segments', () => {
    expect(parseInstanceId('proj-env-comp')).toEqual({
      projectId: 'proj',
      scopedEnvironmentId: 'env',
      scopedComponentId: 'comp',
    });
  });

  it('composes an instance id from its parts', () => {
    expect(composeInstanceId('proj', 'env', 'comp')).toBe('proj-env-comp');
  });

  it('round-trips an instance id', () => {
    const composed = composeInstanceId('proj', 'env', 'comp');
    expect(parseInstanceId(composed)).toEqual({
      projectId: 'proj',
      scopedEnvironmentId: 'env',
      scopedComponentId: 'comp',
    });
  });

  it('parses a project-scoped component id', () => {
    expect(parseComponentId('proj-comp')).toEqual({
      projectId: 'proj',
      scopedComponentId: 'comp',
    });
  });
});

describe('deep-link builders', () => {
  it('builds the projects list url', () => {
    expect(projectsUrl(APP_URL, ORG_ID)).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects',
    );
  });

  it('builds a project url', () => {
    expect(projectUrl(APP_URL, ORG_ID, 'proj')).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj',
    );
  });

  it('builds an environment url from a composite environment id', () => {
    expect(environmentUrl(APP_URL, ORG_ID, 'proj-env')).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj/environments/env',
    );
  });

  it('builds an instance url from a composite instance id', () => {
    expect(instanceUrl(APP_URL, ORG_ID, 'proj-env-comp')).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj/environments/env/instances/comp',
    );
  });

  it('builds an instance tab url', () => {
    expect(instanceTabUrl(APP_URL, ORG_ID, 'proj-env-comp', 'overview')).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj/environments/env/instances/comp?tab=overview',
    );
  });

  it('builds an instance action url', () => {
    expect(
      instanceActionUrl(APP_URL, ORG_ID, 'proj-env-comp', 'decommission'),
    ).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj/environments/env/instances/comp?action=decommission',
    );
  });

  it('builds a resource url and percent-encodes the resource id', () => {
    expect(resourceUrl(APP_URL, ORG_ID, 'aws/bucket 1')).toBe(
      'https://app.massdriver.cloud/orgs/org1/resources/aws%2Fbucket%201/general',
    );
  });

  it('builds a repos list url', () => {
    expect(reposUrl(APP_URL, ORG_ID)).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos',
    );
  });

  it('builds a repo url pointing at the all-versions view', () => {
    expect(repoUrl(APP_URL, ORG_ID, 'my-repo')).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos/my-repo/all',
    );
  });

  it('builds a resources list url', () => {
    expect(resourcesUrl(APP_URL, ORG_ID)).toBe(
      'https://app.massdriver.cloud/orgs/org1/resources',
    );
  });

  it('builds a repo tab url', () => {
    expect(repoTabUrl(APP_URL, ORG_ID, 'my-repo', '1.2.3', 'permissions')).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos/my-repo/1.2.3/permissions',
    );
  });

  it('builds a resource tab url and percent-encodes the resource id', () => {
    expect(resourceTabUrl(APP_URL, ORG_ID, 'aws/bucket', 'usage')).toBe(
      'https://app.massdriver.cloud/orgs/org1/resources/aws%2Fbucket/usage',
    );
  });

  it('builds a repo version overview url', () => {
    expect(repoVersionOverviewUrl(APP_URL, ORG_ID, 'my-repo', '1.2.3')).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos/my-repo/1.2.3/overview',
    );
  });

  it('trims a trailing slash on the app url before appending the path', () => {
    expect(projectsUrl('https://app.massdriver.cloud/', ORG_ID)).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects',
    );
    expect(
      instanceUrl('https://app.massdriver.cloud/', ORG_ID, 'proj-env-comp'),
    ).toBe(
      'https://app.massdriver.cloud/orgs/org1/projects/proj/environments/env/instances/comp',
    );
  });
});
