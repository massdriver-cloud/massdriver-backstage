// Ported from the Massdriver web app

/** Paginated resources list. `$organizationId` is injected by the relay. */
export const RESOURCES_QUERY = `
  query MassdriverResourcesList(
    $organizationId: ID!
    $filter: ResourcesFilter
    $sort: ResourcesSort
    $cursor: Cursor
  ) {
    resources(
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
        origin
        formats
        attributes
        effectiveAttributes
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
