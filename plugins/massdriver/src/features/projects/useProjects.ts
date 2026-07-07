import {
  PaginatedResult,
  usePaginatedRelayQuery,
} from '../../hooks/usePaginatedRelayQuery';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

/** A project as returned by the API. */
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string | null;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** A project row as rendered in the DataList (mirrors the app's transform). */
export interface ProjectRow extends ProjectListItem {
  updatedAt: string;
  updatedAtRaw?: string | null;
}

/** Transform a raw project into a display row (mirrors `toProjectRow`). */
export const toProjectRow = (project: ProjectListItem): ProjectRow => ({
  ...project,
  name: project.name || '',
  description: project.description || '',
  updatedAtRaw: project.updatedAt,
  updatedAt: formatRelativeTime(project.updatedAt),
});

// Mirrors the web app's `getProjects` field selection, with server-side
// sort + cursor pagination.
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

/** Server-side, cursor-paginated projects list (matches the web app). */
export const useProjectsPaginated = (): PaginatedResult<ProjectListItem> =>
  usePaginatedRelayQuery<ProjectListItem>(PROJECTS_QUERY, {
    responseKey: 'projects',
    sortFieldMap: { name: 'NAME', createdAt: 'CREATED_AT' },
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 20,
  });
