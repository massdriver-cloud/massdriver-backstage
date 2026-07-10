// Ported from apps/web/features/repos/hooks/useOciReposQuery.js (OCI_REPOS_QUERY).
// Operation renamed to MassdriverOciReposList; $organizationId is declared but
// never passed — the relay injects it.
export const OCI_REPOS_LIST_QUERY = `
  query MassdriverOciReposList(
    $organizationId: ID!
    $filter: OciReposFilter
    $sort: OciReposSort
    $cursor: Cursor
  ) {
    ociRepos(
      organizationId: $organizationId
      filter: $filter
      sort: $sort
      cursor: $cursor
    ) {
      cursor {
        next
        previous
      }
      items {
        id
        name
        createdAt
        updatedAt
        description
        icon
        sourceUrl
        attributes
        effectiveAttributes
        tags(sort: { field: VERSION, order: DESC }, cursor: { limit: 1 }) {
          items {
            tag
            createdAt
          }
        }
      }
    }
  }
`;
