import { buildRepoColumns } from './repoColumns';
import type { RepoRow } from './useRepos';

const APP_URL = 'https://app.massdriver.cloud';
const ORG_ID = 'org1';

const buildColumns = () =>
  buildRepoColumns({ appUrl: APP_URL, organizationId: ORG_ID });

const findColumn = (field: string) =>
  buildColumns().find((column: any) => column.field === field);

const actionsColumn = () =>
  buildColumns().find((column: any) => column.type === 'actions') as any;

describe('buildRepoColumns', () => {
  it('links the name cell to the internal repository route', () => {
    const nameColumn = findColumn('name') as any;
    const rendered = nameColumn.render('aws-s3', {
      id: 'aws-s3',
    } as RepoRow) as any;
    // The IconTile + link live in a NameCell; the second child is the link.
    const link = rendered.props.children[1];
    expect(link.props.href).toBe('/massdriver/repositories/aws-s3/all');
    expect(link.props.children).toBe('aws-s3');
  });

  it('enables the source-code action only when a sourceUrl exists', () => {
    const [sourceAction] = actionsColumn().typeProps.actions;
    expect(sourceAction.disabled({ sourceUrl: null } as RepoRow)).toBe(true);
    expect(sourceAction.disabled({ sourceUrl: 'https://x' } as RepoRow)).toBe(
      false,
    );
    expect(sourceAction.href({ sourceUrl: 'https://x' } as RepoRow)).toBe(
      'https://x',
    );
  });

  it('varies the source-code tooltip by disabled state', () => {
    const [sourceAction] = actionsColumn().typeProps.actions;
    expect(sourceAction.tooltip({} as RepoRow, { disabled: true })).toBe(
      'Source code not available',
    );
    expect(sourceAction.tooltip({} as RepoRow, { disabled: false })).toBe(
      'View source code',
    );
  });

  it('deep-links edit and delete to the web app dialog params', () => {
    const actions = actionsColumn().typeProps.actions;
    const edit = actions[1];
    const remove = actions[2];
    expect(edit.tooltip).toBe('Edit in Massdriver');
    expect(edit.href({ id: 'aws-s3' } as RepoRow)).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos?editOciRepo=aws-s3',
    );
    expect(edit.target).toBe('_blank');
    expect(remove.tooltip).toBe('Delete in Massdriver');
    expect(remove.href({ id: 'aws-s3' } as RepoRow)).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos?deleteOciRepo=aws-s3',
    );
    expect(remove.color).toBe('error');
  });
});
