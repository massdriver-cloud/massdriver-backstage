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
