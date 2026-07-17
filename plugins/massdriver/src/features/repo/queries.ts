export const OCI_REPO_HEADER_QUERY = `
  query MassdriverOciRepoHeader($organizationId: ID!, $id: ID!) {
    ociRepo(organizationId: $organizationId, id: $id) {
      id
      name
      description
      icon
      sourceUrl
      readme
      changelog
      reference
      attributes
      createdAt
      updatedAt
      releaseChannels {
        items {
          name
          tag
        }
      }
      tags(sort: { field: VERSION, order: DESC }) {
        items {
          tag
          createdAt
        }
      }
    }
  }
`;

export const BUNDLE_QUERY = `
  query MassdriverBundle($organizationId: ID!, $id: BundleId!) {
    bundle(organizationId: $organizationId, id: $id) {
      id
      name
      version
      description
      sourceUrl
      readme
      changelog
      createdAt
      updatedAt
    }
  }
`;

export const REPO_INSTANCES_QUERY = `
  query MassdriverRepoInstances(
    $organizationId: ID!
    $filter: InstancesFilter
    $sort: InstancesSort
    $cursor: Cursor
  ) {
    instances(
      organizationId: $organizationId
      filter: $filter
      sort: $sort
      cursor: $cursor
    ) {
      cursor {
        next
      }
      items {
        id
        status
        version
        resolvedVersion
        deployedVersion
        createdAt
        updatedAt
        cost {
          lastMonth {
            amount
            currency
          }
        }
        environment {
          id
          name
        }
        component {
          id
          project {
            id
            name
          }
        }
      }
    }
  }
`;

export const REPO_DEPLOYMENTS_QUERY = `
  query MassdriverRepoDeployments(
    $organizationId: ID!
    $filter: DeploymentsFilter
    $sort: DeploymentsSort
    $cursor: Cursor
  ) {
    deployments(
      organizationId: $organizationId
      filter: $filter
      sort: $sort
      cursor: $cursor
    ) {
      cursor {
        next
      }
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
        instance {
          id
          environment {
            id
            name
          }
          component {
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
`;

export const DEPLOYMENT_DETAIL_QUERY = `
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

export const DEPLOYMENT_LOGS_QUERY = `
  query MassdriverDeploymentLogs($organizationId: ID!, $id: UUID!) {
    deployment(organizationId: $organizationId, id: $id) {
      id
      status
      action
      version
      instance {
        id
        component { id name }
      }
      logs {
        timestamp
        message
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

export const REPO_TAG_FILES_QUERY = `
  query MassdriverRepoTagFiles(
    $organizationId: ID!
    $repoId: ID!
    $version: Semver!
    $cursor: Cursor
  ) {
    ociRepo(organizationId: $organizationId, id: $repoId) {
      id
      tags(filter: { version: $version }) {
        items {
          tag
          files(sort: { field: NAME, order: ASC }, cursor: $cursor) {
            cursor {
              next
              previous
            }
            items {
              name
              mediaType
              size
              digest
              url
            }
          }
        }
      }
    }
  }
`;

export const REPO_GRANTS_QUERY = `
  query MassdriverRepoGrants($organizationId: ID!, $id: ID!, $cursor: Cursor) {
    ociRepo(organizationId: $organizationId, id: $id) {
      id
      grants(cursor: $cursor) {
        cursor {
          next
          previous
        }
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
