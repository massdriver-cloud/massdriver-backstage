import {
  PaginatedResult,
  usePaginatedRelayQuery,
} from '../../hooks/usePaginatedRelayQuery';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { OCI_REPOS_LIST_QUERY } from './queries';

export interface RepoListItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sourceUrl?: string | null;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
  tags?: { items?: Array<{ tag: string; createdAt?: string } | null> } | null;
}

export interface RepoRow extends RepoListItem {
  name: string;
  description: string | null;
  latestVersion: string | null;
  updatedAt: string;
  updatedAtRaw?: string | null;
}

export const toRepoRow = (repo: RepoListItem): RepoRow => ({
  ...repo,
  name: repo.name || '',
  icon: repo.icon ?? null,
  description: repo.description ?? null,
  latestVersion: repo.tags?.items?.[0]?.tag
    ? `v${repo.tags.items[0].tag}`
    : null,
  updatedAtRaw: repo.updatedAt,
  updatedAt: formatRelativeTime(repo.updatedAt),
});

export const useReposPaginated = (): PaginatedResult<RepoListItem> =>
  usePaginatedRelayQuery<RepoListItem>(OCI_REPOS_LIST_QUERY, {
    responseKey: 'ociRepos',
    sortFieldMap: { name: 'NAME', createdAt: 'CREATED_AT' },
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 20,
  });
