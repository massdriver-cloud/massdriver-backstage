export const RESOURCE_HEADER_QUERY = `
  query MassdriverResourceHeader($organizationId: ID!, $id: ID!) {
    resource(organizationId: $organizationId, id: $id) {
      id
      name
      origin
      formats
      payload
      createdAt
      updatedAt
      resourceType {
        id
        name
        icon
      }
      instance {
        id
        name
      }
    }
  }
`;

export const RESOURCE_GRANTS_QUERY = `
  query MassdriverResourceGrants($organizationId: ID!, $id: ID!) {
    resource(organizationId: $organizationId, id: $id) {
      id
      name
      grants {
        items {
          id
          action
          recipientConditions
          createdAt
        }
      }
    }
  }
`;

export const RESOURCE_CONNECTIONS_QUERY = `
  query MassdriverResourceUsageConnections(
    $organizationId: ID!
    $id: ID!
    $cursor: Cursor
  ) {
    resource(organizationId: $organizationId, id: $id) {
      id
      connections(cursor: $cursor) {
        cursor {
          next
        }
        items {
          id
          toField
          createdAt
          toInstance {
            id
            status
            bundle {
              id
              name
            }
            environment {
              id
              project {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const RESOURCE_REMOTE_REFERENCES_QUERY = `
  query MassdriverResourceUsageRemoteReferences(
    $organizationId: ID!
    $id: ID!
    $cursor: Cursor
  ) {
    resource(organizationId: $organizationId, id: $id) {
      id
      remoteReferences(cursor: $cursor) {
        cursor {
          next
        }
        items {
          id
          field
          createdAt
          instance {
            id
            status
            bundle {
              id
              name
            }
            environment {
              id
              project {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const RESOURCE_ENVIRONMENT_DEFAULTS_QUERY = `
  query MassdriverResourceUsageEnvironmentDefaults(
    $organizationId: ID!
    $id: ID!
    $cursor: Cursor
  ) {
    resource(organizationId: $organizationId, id: $id) {
      id
      environmentDefaults(cursor: $cursor) {
        cursor {
          next
        }
        items {
          id
          createdAt
          environment {
            id
            name
            project {
              id
              name
            }
          }
        }
      }
    }
  }
`;
