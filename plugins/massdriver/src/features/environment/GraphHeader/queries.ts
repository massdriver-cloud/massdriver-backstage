// Queries backing the read-only environment graph header. `organizationId` is
// injected by the backend relay, so callers pass only the other variables.

export const HEADER_PROJECTS_QUERY = `
  query MassdriverHeaderProjects($organizationId: ID!) {
    projects(organizationId: $organizationId) {
      items {
        id
        name
      }
    }
  }
`;

export const HEADER_ENVIRONMENTS_QUERY = `
  query MassdriverHeaderEnvironments(
    $organizationId: ID!
    $filter: EnvironmentsFilter
  ) {
    environments(organizationId: $organizationId, filter: $filter) {
      items {
        id
        name
        createdAt
        parent {
          id
          name
          createdAt
        }
      }
    }
  }
`;

export const ENVIRONMENT_DEFAULTS_QUERY = `
  query MassdriverEnvironmentDefaults(
    $organizationId: ID!
    $environmentId: ID!
  ) {
    environment(organizationId: $organizationId, id: $environmentId) {
      id
      defaults(cursor: { limit: 100 }) {
        items {
          id
          resource {
            id
            name
            resourceType {
              id
              name
              icon
            }
          }
        }
      }
    }
  }
`;

export interface HeaderProject {
  id: string;
  name: string;
}

export interface HeaderEnvironment {
  id: string;
  name: string;
  createdAt?: string | null;
  parent?: { id: string; name?: string; createdAt?: string } | null;
}

export interface HeaderProjectsResult {
  projects: { items?: (HeaderProject | null)[] | null } | null;
}

export interface HeaderEnvironmentsResult {
  environments: { items?: (HeaderEnvironment | null)[] | null } | null;
}

export interface ResourceType {
  id: string;
  name: string;
  icon?: string | null;
}

export interface EnvironmentDefaultItem {
  id: string;
  resource: {
    id: string;
    name: string;
    resourceType: ResourceType;
  };
}

export interface EnvironmentDefaultsResult {
  environment: {
    id: string;
    defaults?: { items?: (EnvironmentDefaultItem | null)[] | null } | null;
  } | null;
}
