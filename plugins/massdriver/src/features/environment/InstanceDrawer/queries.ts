// GraphQL documents for the read-only instance drawer. All are proxied through
// the backend relay, which injects `organizationId`, so callers pass only the
// remaining variables (see api.ts). Every normalizable selection includes `id`.

const MONEY = `{ amount currency }`;

export const PANEL_QUERY = `
  query MassdriverInstancePanel($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      name
      status
      version
      createdAt
      updatedAt
      environment { id name }
      component { id name }
      cost {
        lastDay ${MONEY}
        lastMonth ${MONEY}
        dailyAverage ${MONEY}
        monthlyAverage ${MONEY}
      }
      secretFields { name required title description sha256 }
      alarms(cursor: { limit: 50 }) {
        cursor { next }
        items { id currentState { id status } }
      }
    }
  }
`;

export const OVERVIEW_QUERY = `
  query MassdriverInstanceOverview($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      name
      status
      version
      resolvedVersion
      deployedVersion
      availableUpgrade
      effectiveAttributes
      bundle { id name version description }
      properties { name path value }
      alarms(cursor: { limit: 50 }) {
        cursor { next }
        items {
          id
          displayName
          cloudResourceId
          comparisonOperator
          threshold
          period
          metric {
            namespace
            name
            statistic
            dimensions { name value }
          }
          currentState { id status message occurredAt }
        }
      }
    }
  }
`;

export const RESOURCES_QUERY = `
  query MassdriverInstanceResources($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      status
      bundle {
        id
        resources {
          name
          required
          resourceType { id name icon }
        }
      }
      resources {
        field
        required
        resourceType { id name icon }
        resource {
          id
          name
          origin
          formats
          payload
          createdAt
          updatedAt
          instance { id name }
        }
      }
    }
  }
`;

export const RESOURCE_CONSUMERS_QUERY = `
  query MassdriverResourceConsumers($organizationId: ID!, $id: ID!) {
    resource(organizationId: $organizationId, id: $id) {
      id
      connections(cursor: { limit: 50 }) {
        cursor { next }
        items {
          id
          fromField
          toField
          fromInstance { id name }
          toInstance { id name }
        }
      }
      environmentDefaults(cursor: { limit: 50 }) {
        cursor { next }
        items {
          id
          environment { id name project { id name } }
        }
      }
      remoteReferences(cursor: { limit: 50 }) {
        cursor { next }
        items {
          id
          field
          instance { id name }
        }
      }
      grants(cursor: { limit: 50 }) {
        cursor { next }
        items { id action recipientConditions }
      }
    }
  }
`;

export const DEPENDENCIES_QUERY = `
  query MassdriverInstanceDependencies($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      status
      bundle {
        id
        dependencies {
          name
          required
          resourceType { id name icon connectionOrientation }
        }
      }
      dependencies {
        field
        required
        resource { id name }
        resourceType { id name icon connectionOrientation }
        source {
          __typename
          ... on Connection {
            id
            fromField
            fromInstance {
              id
              name
              status
              environment { id }
            }
            link { id fromComponent { id name } }
          }
          ... on RemoteReference {
            id
            resource { id name resourceType { id name icon } }
          }
          ... on EnvironmentDefault {
            id
            resource { id name resourceType { id name icon } }
          }
        }
      }
    }
  }
`;

export const ALARMS_QUERY = `
  query MassdriverInstanceAlarms($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      alarms(cursor: { limit: 100 }) {
        cursor { next }
        items {
          id
          displayName
          cloudResourceId
          comparisonOperator
          threshold
          period
          metric {
            namespace
            name
            statistic
            dimensions { name value }
          }
          currentState { id status message occurredAt }
        }
      }
    }
  }
`;

// `deployments` is capped at a single page of 50 (cursor.limit) — the web app's
// infinite scroll is dropped as an acceptable read-only simplification, so an
// instance with more than 50 deployments shows only its 50 most-recent. The
// second root field (`instance`) sources the "Initialized" footer row.
export const HISTORY_QUERY = `
  query MassdriverInstanceHistory(
    $organizationId: ID!
    $instanceId: ID!
    $filter: DeploymentsFilter
    $sort: DeploymentsSort
  ) {
    deployments(
      organizationId: $organizationId
      filter: $filter
      sort: $sort
      cursor: { limit: 50 }
    ) {
      cursor { next }
      items {
        id
        status
        action
        version
        message
        createdAt
        updatedAt
        lastTransitionedAt
        elapsedTime
        deployedBy
      }
    }
    instance(organizationId: $organizationId, id: $instanceId) {
      id
      createdAt
      environment { id name }
    }
  }
`

// Full snapshot of a single deployment for the read-only detail panel. `id` is a
// `UUID!` here (the `deployment(id:)` field), unlike the list filter's `ID!`.
export const DEPLOYMENT_QUERY = `
  query MassdriverDeployment($organizationId: ID!, $id: UUID!) {
    deployment(organizationId: $organizationId, id: $id) {
      id
      status
      action
      version
      message
      params
      effectiveAttributes
      createdAt
      lastTransitionedAt
      elapsedTime
      deployedBy
      instance {
        id
        component { id name }
      }
    }
  }
`;

export const GUIDE_QUERY = `
  query MassdriverInstanceGuide($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      operatorGuide
      bundle { id name version }
    }
  }
`;
