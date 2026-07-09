import type { DeploymentComparison } from './flattenDeploymentComparison';

// Field-by-field diff of two deployments. `organizationId` is injected by the
// relay; callers pass sourceId + targetId only. NOTE: `compareDeployments` takes
// `UUID!` ids (unlike the deployments-list filter, which takes `ID!`) — the
// relay rejects the query if this is mismatched.
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

// Feeds the two deployment pickers. Filtered by instance only (unaffected by the
// History tab's action filter) and capped at a single page of 50 — the web app's
// infinite-scroll picker is dropped as an acceptable read-only simplification.
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
