import { useApi } from '@backstage/frontend-plugin-api';
import useAsync, { AsyncState } from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../api';

/** A project row as rendered in the list. */
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
  effectiveAttributes?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

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
