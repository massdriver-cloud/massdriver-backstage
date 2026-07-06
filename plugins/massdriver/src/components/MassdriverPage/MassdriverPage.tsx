import {
  Content,
  ContentHeader,
  Header,
  Link,
  Page,
  Progress,
  ResponseErrorPanel,
  SupportButton,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/frontend-plugin-api';
import {
  MassdriverProject,
  projectUrl,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../api';
import { PROJECTS, ProjectsPageResult } from '../../queries';

const columns = (appUrl: string, orgId: string): TableColumn<MassdriverProject>[] => [
  {
    title: 'Project',
    field: 'name',
    render: row => (
      <Link to={projectUrl(appUrl, orgId, row.id)}>{row.name}</Link>
    ),
  },
  { title: 'ID', field: 'id' },
  { title: 'Description', field: 'description' },
];

/**
 * Full-page Massdriver view listing the organization's projects with
 * deep-links into the web app.
 *
 * @public
 */
export const MassdriverPage = () => {
  const api = useApi(massdriverApiRef);

  const {
    value: projects,
    loading,
    error,
  } = useAsync(async (): Promise<MassdriverProject[]> => {
    const rows: MassdriverProject[] = [];
    let next: string | null = null;
    do {
      const page = (await api.query(PROJECTS, {
        cursor: { limit: 100, next },
      })) as ProjectsPageResult;
      for (const item of page.projects.items ?? []) {
        if (item) {
          rows.push(item);
        }
      }
      next = page.projects.cursor?.next ?? null;
    } while (next);
    return rows;
  }, [api]);

  return (
    <Page themeId="tool">
      <Header title="Massdriver" subtitle="Projects" />
      <Content>
        <ContentHeader title="Projects">
          <SupportButton>
            Massdriver projects synced from your organization.
          </SupportButton>
        </ContentHeader>
        {loading && <Progress />}
        {error && <ResponseErrorPanel error={error} />}
        {!loading && !error && (
          <Table<MassdriverProject>
            title="Projects"
            options={{ search: true, paging: (projects?.length ?? 0) > 20 }}
            columns={columns(api.appUrl, api.organizationId)}
            data={projects ?? []}
          />
        )}
      </Content>
    </Page>
  );
};
