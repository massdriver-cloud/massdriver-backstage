import { useApi } from '@backstage/frontend-plugin-api';
import { projectUrl } from '@massdriver/backstage-plugin-common';
import Box from '@massdriver/ui/Box';
import PageTabs from '@massdriver/ui/PageTabs';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { NotFound } from '../../components/NotFound';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { internalRoutes } from '../../internalRoutes';
import { ComponentsTab } from './tabs/ComponentsTab';
import { EnvironmentsTab } from './tabs/EnvironmentsTab';
import { OverviewTab } from './tabs/OverviewTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'components', label: 'Components' },
  { id: 'environments', label: 'Environments' },
];

const PANELS: Record<string, (props: { projectId: string }) => JSX.Element> = {
  overview: OverviewTab,
  components: ComponentsTab,
  environments: EnvironmentsTab,
};

const HEADER_QUERY = `
  query MassdriverProjectHeader($organizationId: ID!, $id: ID!) {
    project(organizationId: $organizationId, id: $id) {
      id
      name
      description
    }
  }
`;

export const ProjectDetailsPage = () => {
  const api = useApi(massdriverApiRef);
  const { projectId = '', tab } = useParams();
  const activeTab = TABS.some(entry => entry.id === tab) ? tab! : 'overview';

  const {
    value: project,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(HEADER_QUERY, { id: projectId })) as {
      project: { id: string; name?: string; description?: string } | null;
    };
    return data.project;
  }, [api, projectId]);

  if (!loading && !error && !project) {
    return (
      <NotFound
        title="Project not found"
        message="This project doesn't exist or you don't have access to it."
      />
    );
  }

  const tabs = TABS.map(entry => ({
    ...entry,
    href: internalRoutes.projectTab(projectId, entry.id),
  }));

  const appProjectUrl = projectUrl(api.appUrl, api.organizationId, projectId);

  return (
    <PageLayout
      title={project?.name ?? ''}
      description={project?.description}
      headerActions={
        <HeaderActions>
          <OpenInMassdriverButton url={appProjectUrl} variant="outlined">
            Open in Massdriver
          </OpenInMassdriverButton>
          <OpenInMassdriverButton
            url={`${appProjectUrl}?cloneProject=true`}
            variant="outlined"
          >
            Clone Project
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
        panelProps={{ projectId }}
        LinkComponent={RouterLinkAdapter}
      />
    </PageLayout>
  );
};

const HeaderActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
}));
