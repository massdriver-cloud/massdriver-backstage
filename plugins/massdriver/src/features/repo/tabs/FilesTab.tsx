import { useCallback, useMemo } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { useSearchParams } from 'react-router-dom';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import HistoryIcon from '@massdriver/ui/icons/HistoryIcon';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import { RepoEmptyState } from '../RepoEmptyState';
import { RepoNoVersionsState } from '../RepoNoVersionsState';
import { FileTree } from '../FileTree';
import { FileViewer } from '../FileViewer';
import { REPO_TAG_FILES_QUERY } from '../queries';
import { resolveSelectedVersion } from '../resolveVersion';
import type { RepoTabProps } from '../RepoDetailsPage';
import type { RepoFile } from '../types';

const MAX_PAGES = 100;
const PAGE_LIMIT = 100;

interface FilesQueryResult {
  ociRepo: {
    tags?: {
      items?: Array<{
        tag: string;
        files?: {
          cursor?: { next?: string | null } | null;
          items?: Array<RepoFile | null> | null;
        } | null;
      } | null> | null;
    } | null;
  } | null;
}

// Ported from apps/web/features/repos/sections/FilesTab/ + components/FileViewer.
//
// DIVERGENCE: the web app stores the selected file path in a URL catch-all
// segment (`/files/<path>`). This plugin's route is
// `repositories/:repoId/:version/:tab` with no catch-all, so the selected file
// lives in a `?file=` search param instead — deep-linking still works. File
// contents are fetched through the backend content proxy (see FileViewer), so
// the real in-app viewer is fully functional here.
export const FilesTab = ({
  repoId,
  version,
  hasNoVersions,
  repo,
}: RepoTabProps) => {
  const api = useApi(massdriverApiRef);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPath = searchParams.get('file') ?? '';

  const onSelectPath = useCallback(
    (nextPath: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (nextPath) next.set('file', nextPath);
          else next.delete('file');
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const resolvedVersion = resolveSelectedVersion(version, repo);
  const isResolutionMissing =
    Boolean(repo) && !resolvedVersion && !hasNoVersions;

  const { value, loading, error } = useAsync(async () => {
    if (hasNoVersions || isResolutionMissing || !repoId || !resolvedVersion) {
      return [] as RepoFile[];
    }
    const files: RepoFile[] = [];
    let cursor: { limit: number; next?: string } = { limit: PAGE_LIMIT };
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = (await api.query(REPO_TAG_FILES_QUERY, {
        repoId,
        version: resolvedVersion,
        cursor,
      })) as FilesQueryResult;
      const filesPage = data?.ociRepo?.tags?.items?.[0]?.files;
      files.push(...((filesPage?.items ?? []).filter(Boolean) as RepoFile[]));
      const next = filesPage?.cursor?.next;
      if (!next) break;
      cursor = { limit: PAGE_LIMIT, next };
    }
    return files;
  }, [api, repoId, resolvedVersion, hasNoVersions, isResolutionMissing]);

  const files = useMemo(() => value ?? [], [value]);
  const selectedFile = useMemo(
    () => files.find(file => file.name === selectedPath) ?? null,
    [files, selectedPath],
  );

  if (hasNoVersions) {
    return <RepoNoVersionsState tabLabel="files" />;
  }

  if (isResolutionMissing) {
    return (
      <RepoEmptyState
        icon={<HistoryIcon />}
        title="Files unavailable"
        description="We couldn't resolve a version to load files for. Pick a different version above."
      />
    );
  }

  if (loading) {
    return (
      <Centered>
        <LoadingIndicator />
      </Centered>
    );
  }

  if (error) {
    return (
      <Padded>
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      </Padded>
    );
  }

  return (
    <Layout>
      <TreePane>
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onSelectPath={onSelectPath}
        />
      </TreePane>
      <ViewerPane>
        <FileViewer file={selectedFile} />
      </ViewerPane>
    </Layout>
  );
};

const Layout = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  height: 'calc(100vh - 220px)',
  minHeight: 400,
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'minmax(180px, 30vh) 1fr',
    height: 'auto',
  },
}));

const TreePane = stylin(Box)(({ theme }: { theme: any }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  [theme.breakpoints.down('md')]: {
    borderRight: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const ViewerPane = stylin(Box)({
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
}));
