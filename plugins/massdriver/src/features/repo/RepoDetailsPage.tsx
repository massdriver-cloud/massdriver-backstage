import { useApi } from '@backstage/frontend-plugin-api';
import { repoTabUrl } from '@massdriver/backstage-plugin-common';
import Box from '@massdriver/ui/Box';
import PageTabs from '@massdriver/ui/PageTabs';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { useNavigate, useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { NotFound } from '../../components/NotFound';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { internalRoutes } from '../../internalRoutes';
import { OCI_REPO_HEADER_QUERY } from './queries';
import { REPO_TABS, resolveActiveRepoTab } from './repoTabs';
import { ALL_VERSIONS } from './resolveVersion';
import { RepoVersionSelect } from './RepoVersionSelect';
import { ViewDeploymentDetailsDialog } from './ViewDeploymentDetailsDialog';
import { DeploymentLogsDrawer } from './DeploymentLogsDrawer';
import { RepoHeader } from './types';
import { OverviewTab } from './tabs/OverviewTab';
import { InstancesTab } from './tabs/InstancesTab';
import { DeploymentsTab } from './tabs/DeploymentsTab';
import { FilesTab } from './tabs/FilesTab';
import { VersionsTab } from './tabs/VersionsTab';
import { PermissionsTab } from './tabs/PermissionsTab';

export interface RepoTabProps {
  repoId: string;
  version: string;
  repo: RepoHeader | null;
  hasNoVersions: boolean;
}

const PANELS: Record<string, (props: RepoTabProps) => JSX.Element> = {
  overview: OverviewTab,
  instances: InstancesTab,
  deployments: DeploymentsTab,
  files: FilesTab,
  versions: VersionsTab,
  permissions: PermissionsTab,
};

const buildTitle = (
  repo: RepoHeader | null,
  repoId: string,
  version: string,
): string => {
  const name = repo?.name ?? repoId ?? '';
  if (!name) return '';
  return version && version !== ALL_VERSIONS ? `${name}@${version}` : name;
};

// Ported from apps/web/features/repos/pages/RepoDetailsPage.js. repoId/version
// arrive percent-encoded in the URL — decode before using as API values.
export const RepoDetailsPage = () => {
  const api = useApi(massdriverApiRef);
  const navigate = useNavigate();
  const params = useParams();
  const repoId = decodeURIComponent(params.repoId ?? '');
  const version = decodeURIComponent(params.version ?? ALL_VERSIONS);
  const activeTab = resolveActiveRepoTab(params.tab);

  const {
    value: repo,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(OCI_REPO_HEADER_QUERY, { id: repoId })) as {
      ociRepo: RepoHeader | null;
    };
    return data.ociRepo;
  }, [api, repoId]);

  if (!loading && !error && !repo) {
    return (
      <NotFound
        title="Repository not found"
        message="This repository doesn't exist or you don't have access to it."
      />
    );
  }

  const hasNoVersions = Boolean(repo) && (repo?.tags?.items?.length ?? 0) === 0;

  const tabs = REPO_TABS.map(tab => ({
    ...tab,
    href: internalRoutes.repositoryTab(repoId, version, tab.id),
  }));

  const onVersionChange = (nextVersion: string) =>
    navigate(internalRoutes.repositoryTab(repoId, nextVersion, activeTab));

  return (
    <PageLayout
      title={buildTitle(repo ?? null, repoId, version)}
      description={repo?.description}
      headerActions={
        <HeaderActions>
          <RepoVersionSelect
            repo={repo}
            currentVersion={version}
            onChange={onVersionChange}
            disabled={!repo && !error}
          />
          <OpenInMassdriverButton
            url={repoTabUrl(
              api.appUrl,
              api.organizationId,
              repoId,
              version,
              activeTab,
            )}
            variant="outlined"
          >
            Open in Massdriver
          </OpenInMassdriverButton>
        </HeaderActions>
      }
      flush
    >
      <PageTabs
        orientation="vertical"
        tabs={tabs}
        panels={PANELS}
        activeTab={activeTab}
        panelProps={{ repoId, version, repo: repo ?? null, hasNoVersions }}
        LinkComponent={RouterLinkAdapter}
      />
      <ViewDeploymentDetailsDialog />
      <DeploymentLogsDrawer />
    </PageLayout>
  );
};

const HeaderActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));
