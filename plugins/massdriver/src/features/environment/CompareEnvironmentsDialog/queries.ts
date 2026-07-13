import type { Comparison } from './flattenComparison';

// Field-by-field diff of two environments. `organizationId` is injected by the
// relay; callers pass sourceId + targetId only.
export const COMPARE_ENVIRONMENTS_QUERY = `
  query MassdriverCompareEnvironments(
    $organizationId: ID!
    $sourceId: ID!
    $targetId: ID!
  ) {
    compareEnvironments(
      organizationId: $organizationId
      sourceId: $sourceId
      targetId: $targetId
    ) {
      source { id name }
      target { id name }
      instances {
        component { id name }
        source { id }
        target { id }
        version { source target equal }
        params {
          path
          equal
          source { present value }
          target { present value }
        }
        equal
      }
    }
  }
`;

export interface CompareEnvironmentsResult {
  compareEnvironments: Comparison | null;
}
