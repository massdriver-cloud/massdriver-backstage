import type { DeploymentComparison } from './flattenDeploymentComparison';

export const COMPARE_DEPLOYMENTS_QUERY = `
  query MassdriverCompareDeployments(
    $organizationId: ID!
    $sourceId: UUID!
    $targetId: UUID!
  ) {
    compareDeployments(
      organizationId: $organizationId
      sourceId: $sourceId
      targetId: $targetId
    ) {
      source { id status action version createdAt deployedBy message }
      target { id status action version createdAt deployedBy message }
      version { source target equal }
      params {
        path
        equal
        source { present value }
        target { present value }
      }
    }
  }
`;

export interface CompareDeploymentsResult {
  compareDeployments: DeploymentComparison | null;
}

export const DEPLOYMENTS_BY_INSTANCE_QUERY = `
  query MassdriverDeploymentsByInstance(
    $organizationId: ID!
    $filter: DeploymentsFilter
  ) {
    deployments(
      organizationId: $organizationId
      filter: $filter
      sort: { field: UPDATED_AT, order: DESC }
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
  }
`;
