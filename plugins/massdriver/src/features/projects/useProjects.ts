import { useApi } from '@backstage/frontend-plugin-api';
import useAsync, { AsyncState } from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../api';
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
  /** Preformatted relative time shown in the Updated column. */
  updatedAt: string;
  /** Raw ISO timestamp, used for the Updated tooltip. */
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

interface ProjectsPage {
  projects?: {
    items?: (ProjectListItem | null)[] | null;
    cursor?: { next?: string | null };
  };
}

// Mirrors the web app's `getProjects` field selection.
const PROJECTS_QUERY = `
  query MassdriverProjectsList($organizationId: ID!, $cursor: Cursor) {
    projects(organizationId: $organizationId, cursor: $cursor) {
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
      }
    }
  }
`;

/** Fetch all projects in the org (cursor-paginated) via the relay. */
export const useProjects = (): AsyncState<ProjectListItem[]> => {
  const api = useApi(massdriverApiRef);

  return useAsync(async (): Promise<ProjectListItem[]> => {
    const rows: ProjectListItem[] = [];
    let next: string | null = null;
    do {
      const page = (await api.query(PROJECTS_QUERY, {
        cursor: { limit: 100, next },
      })) as ProjectsPage;
      for (const item of page.projects?.items ?? []) {
        if (item) {
          rows.push(item);
        }
      }
      next = page.projects?.cursor?.next ?? null;
    } while (next);
    return rows;
  }, [api]);
};
