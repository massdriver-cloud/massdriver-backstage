import { useApi } from '@backstage/frontend-plugin-api';
import { projectUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import PageTabs from '@massdriver/ui/PageTabs';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { internalRoutes } from '../../internalRoutes';
import { OverviewTab } from './tabs/OverviewTab';

// Placeholders — replaced by the real tabs in the next chunk of Slice 2.
const ComponentsTab = () => <Placeholder>Components — coming soon</Placeholder>;
const EnvironmentsTab = () => (
  <Placeholder>Environments — coming soon</Placeholder>
);

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

/** Read-only project details: vertical side-tabs mirroring the web app. */
export const ProjectDetailsPage = () => {
  const api = useApi(massdriverApiRef);
  const { projectId = '', tab } = useParams();
  const activeTab = TABS.some(entry => entry.id === tab) ? tab! : 'overview';

  const { value: project } = useAsync(async () => {
    const data = (await api.query(HEADER_QUERY, { id: projectId })) as {
      project: { id: string; name?: string; description?: string } | null;
    };
    return data.project;
  }, [api, projectId]);

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

const Placeholder = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
}));
