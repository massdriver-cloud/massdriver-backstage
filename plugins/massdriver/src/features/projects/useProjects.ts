import {
  PaginatedResult,
  usePaginatedRelayQuery,
} from '../../hooks/usePaginatedRelayQuery';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

export interface ProjectListItem {
  id: string;
  name: string;
  description?: string | null;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProjectRow extends ProjectListItem {
  updatedAt: string;
  updatedAtRaw?: string | null;
}

export const toProjectRow = (project: ProjectListItem): ProjectRow => ({
  ...project,
  name: project.name || '',
  description: project.description || '',
  updatedAtRaw: project.updatedAt,
  updatedAt: formatRelativeTime(project.updatedAt),
});

const PROJECTS_QUERY = `
  query MassdriverProjectsList(
    $organizationId: ID!
    $sort: ProjectsSort
    $cursor: Cursor
    $filter: ProjectsFilter
  ) {
    projects(
      organizationId: $organizationId
      sort: $sort
      cursor: $cursor
      filter: $filter
    ) {
      items {
        id
        name
        description
        attributes
        effectiveAttributes
        createdAt
        updatedAt
      }
      cursor {
        next
        previous
      }
    }
  }
`;

export const useProjectsPaginated = (): PaginatedResult<ProjectListItem> =>
  usePaginatedRelayQuery<ProjectListItem>(PROJECTS_QUERY, {
    responseKey: 'projects',
    sortFieldMap: { name: 'NAME', createdAt: 'CREATED_AT' },
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 20,
  });
