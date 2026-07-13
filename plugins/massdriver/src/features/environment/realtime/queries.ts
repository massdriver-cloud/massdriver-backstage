// Subscription documents for the environment graph's live updates. Proxied
// through the backend SSE relay, which injects `organizationId` (callers pass
// only the remaining variables). Every normalizable selection includes `id`.

// Fires whenever anything in the environment changes — an instance's status or
// version, a deployment's lifecycle, a connection, an alarm's firing state, or
// an environment default. The drawer/graph don't keep an Apollo cache, so the
// payload is only used to trigger a refetch; we still select id-bearing fields
// so the document is valid and future consumers can read from it.
export const ENVIRONMENT_EVENTS_SUBSCRIPTION = `
  subscription MassdriverEnvironmentEvents(
    $organizationId: ID!
    $environmentId: ID!
  ) {
    environmentEvents(
      organizationId: $organizationId
      environmentId: $environmentId
    ) {
      ... on Event {
        action
        timestamp
      }
      ... on InstanceEvent {
        instance { id status version }
      }
      ... on DeploymentEvent {
        deployment { id status }
      }
      ... on ConnectionEvent {
        connection { id }
      }
      ... on AlarmEvent {
        alarm { id currentState { id status } }
      }
      ... on EnvironmentDefaultEvent {
        environmentDefault { id }
      }
    }
  }
`;

// Blueprint-side changes — component adds/removes/moves (position), links, and
// environment metadata — are project-scoped and flow through `projectEvents`,
// NOT `environmentEvents`. Without this the graph never refetches when someone
// rearranges or rewires the design in the web app. Same refetch-only contract
// as above: the payload just bumps the revision.
export const PROJECT_EVENTS_SUBSCRIPTION = `
  subscription MassdriverProjectEvents(
    $organizationId: ID!
    $projectId: ID!
  ) {
    projectEvents(
      organizationId: $organizationId
      projectId: $projectId
    ) {
      ... on Event {
        action
        timestamp
      }
      ... on ProjectEvent {
        project { id }
      }
      ... on EnvironmentEvent {
        environment { id }
      }
      ... on ComponentEvent {
        component { id position { x y } }
      }
      ... on LinkEvent {
        link { id }
      }
    }
  }
`;

// Streams one batch of appended log lines per worker flush for a single
// deployment. Unlike the query backfill, it sends only the new lines.
export const DEPLOYMENT_LOGS_SUBSCRIPTION = `
  subscription MassdriverDeploymentLogs(
    $organizationId: ID!
    $deploymentId: ID!
  ) {
    deploymentLogs(
      organizationId: $organizationId
      deploymentId: $deploymentId
    ) {
      timestamp
      message
    }
  }
`;
