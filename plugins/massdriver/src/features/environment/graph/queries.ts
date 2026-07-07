import type {
  Component,
  Connection,
  Instance,
  Link,
} from './diagramFactory';

// Blueprint of a project's components + links (the graph's static topology).
export const PROJECT_BLUEPRINT_QUERY = `
  query MassdriverProjectBlueprint($organizationId: ID!, $projectId: ID!) {
    project(organizationId: $organizationId, id: $projectId) {
      id
      components {
        id
        name
        position { x y }
        ociRepo { id name }
      }
      links {
        id
        fromField
        toField
        fromComponent { id }
        toComponent { id }
      }
    }
  }
`;

export interface ProjectBlueprintResult {
  project: {
    id: string;
    components?: Component[] | null;
    links?: Link[] | null;
  } | null;
}

// Deployed instances + live connections in an environment.
export const ENVIRONMENT_BLUEPRINT_QUERY = `
  query MassdriverEnvironmentBlueprint(
    $organizationId: ID!
    $environmentId: ID!
  ) {
    environment(organizationId: $organizationId, id: $environmentId) {
      id
      name
      instances {
        id
        name
        status
        version
        bundle {
          id
          name
          version
          icon
          dependencies {
            name
            required
            resourceType { id connectionOrientation }
          }
          resources {
            name
            required
            resourceType { id connectionOrientation }
          }
        }
      }
      connections {
        id
        fromField
        toField
        fromInstance { id }
        toInstance { id }
        link { id }
      }
    }
  }
`;

export interface EnvironmentBlueprintResult {
  environment: {
    id: string;
    name?: string | null;
    instances?: Instance[] | null;
    connections?: Connection[] | null;
  } | null;
}

// Per-node metadata (cost, alarms, versions, last-edited, undeployed plan).
export const NODE_META_QUERY = `
  query MassdriverNodeInstanceMeta($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      updatedAt
      resolvedVersion
      deployedVersion
      availableUpgrade
      params
      cost {
        lastDay { amount currency }
        lastMonth { amount currency }
        dailyAverage { amount currency }
        monthlyAverage { amount currency }
      }
      alarms(cursor: { limit: 50 }) {
        items {
          id
          currentState { status }
        }
      }
    }
    latestProvision: deployments(
      organizationId: $organizationId
      filter: {
        instanceId: { eq: $id }
        action: { eq: PROVISION }
        status: { eq: COMPLETED }
      }
      sort: { field: CREATED_AT, order: DESC }
      cursor: { limit: 1 }
    ) {
      items {
        id
        params
      }
    }
  }
`;

export interface Money {
  amount?: number | null;
  currency?: string | null;
}

export interface NodeCost {
  lastDay?: Money | null;
  lastMonth?: Money | null;
  dailyAverage?: Money | null;
  monthlyAverage?: Money | null;
}

export interface AlarmItem {
  id: string;
  currentState?: { status?: string | null } | null;
}

export interface NodeMetaResult {
  instance: {
    id: string;
    updatedAt?: string | null;
    resolvedVersion?: string | null;
    deployedVersion?: string | null;
    availableUpgrade?: string | null;
    params?: unknown;
    cost?: NodeCost | null;
    alarms?: { items?: (AlarmItem | null)[] | null } | null;
  } | null;
  latestProvision?: {
    items?: Array<{ id: string; params?: unknown } | null> | null;
  } | null;
}
