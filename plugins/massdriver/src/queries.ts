import {
  InstanceStatus,
  MassdriverProject,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';

/** Instance fields fetched for tables and cards. */
export interface InstanceRow {
  id: string;
  name: string;
  status: InstanceStatus;
  resolvedVersion?: string | null;
  deployedVersion?: string | null;
}

export const INSTANCES_BY_PROJECT = `
  query MassdriverInstancesByProject($organizationId: ID!, $projectId: ID!, $cursor: Cursor) {
    instances(
      organizationId: $organizationId
      filter: { projectId: { eq: $projectId } }
      cursor: $cursor
    ) {
      items {
        id
        name
        status
        resolvedVersion
        deployedVersion
      }
      cursor {
        next
      }
    }
  }
`;

export const INSTANCES_BY_ENVIRONMENT = `
  query MassdriverInstancesByEnvironment($organizationId: ID!, $environmentId: ID!, $cursor: Cursor) {
    instances(
      organizationId: $organizationId
      filter: { environmentId: { eq: $environmentId } }
      cursor: $cursor
    ) {
      items {
        id
        name
        status
        resolvedVersion
        deployedVersion
      }
      cursor {
        next
      }
    }
  }
`;

export const INSTANCE_BY_ID = `
  query MassdriverInstance($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      name
      status
      resolvedVersion
      deployedVersion
    }
  }
`;

export const PROJECTS = `
  query MassdriverProjectsList($organizationId: ID!, $cursor: Cursor) {
    projects(organizationId: $organizationId, cursor: $cursor) {
      items {
        id
        name
        description
      }
      cursor {
        next
      }
    }
  }
`;

export interface InstancesPageResult {
  instances: {
    items: (InstanceRow | null)[] | null;
    cursor: { next: string | null };
  };
}

export interface InstanceResult {
  instance: InstanceRow | null;
}

export interface ProjectsPageResult {
  projects: {
    items: (MassdriverProject | null)[] | null;
    cursor: { next: string | null };
  };
}
