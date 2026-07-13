import { useApi } from '@backstage/frontend-plugin-api';
import {
  parseEnvironmentId,
  projectUrl,
} from '@massdriver/backstage-plugin-common';
import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import DataList from '@massdriver/ui/DataList';
import { HelpIconButton } from '@massdriver/ui/IconButton';
import Stack from '@massdriver/ui/Stack';
import Typography from '@massdriver/ui/Typography';
import CheckIcon from '@massdriver/ui/icons/CheckIcon';
import CloseIcon from '@massdriver/ui/icons/CloseIcon';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../../api';
import {
  buildAttributesColumn,
  Code,
} from '../../../components/AttributesColumn';
import { ForkPill } from '../../../components/ForkPill';
import { OpenInMassdriverButton } from '../../../components/OpenInMassdriverButton';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import { usePaginatedRelayQuery } from '../../../hooks/usePaginatedRelayQuery';
import { internalRoutes } from '../../../internalRoutes';

interface EnvRow {
  id: string;
  name: string;
  description?: string | null;
  decommissionProtection?: boolean;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  parent?: { id: string; name?: string; createdAt?: string } | null;
  scopedEnvironmentId?: string;
}

const ENVIRONMENTS_QUERY = `
  query MassdriverProjectEnvironments(
    $organizationId: ID!
    $sort: EnvironmentsSort
    $cursor: Cursor
    $filter: EnvironmentsFilter
  ) {
    environments(
      organizationId: $organizationId
      sort: $sort
      cursor: $cursor
      filter: $filter
    ) {
      items {
        id
        name
        description
        decommissionProtection
        attributes
        effectiveAttributes
        createdAt
        parent { id name createdAt }
      }
      cursor { next previous }
    }
  }
`;

/** Read-only Environments tab: server-paginated list scoped to the project. */
export const EnvironmentsTab = ({ projectId }: { projectId: string }) => {
  const api = useApi(massdriverApiRef);
  const { items, loading, error, hasMore, dataListParams } =
    usePaginatedRelayQuery<EnvRow>(ENVIRONMENTS_QUERY, {
      responseKey: 'environments',
      sortFieldMap: { name: 'NAME', createdAt: 'CREATED_AT' },
      defaultSort: { field: 'name', direction: 'asc' },
      pageSize: 20,
      baseFilter: { projectId: { eq: projectId } },
    });

  const rows: EnvRow[] = items.map(env => ({
    ...env,
    scopedEnvironmentId: parseEnvironmentId(env.id).scopedEnvironmentId,
  }));

  const columns = [
    col.custom(
      'name',
      'Name',
      (value: string, row: EnvRow) => (
        <NameCell>
          <NameLink
            component={RouterLinkAdapter}
            href={internalRoutes.environment(projectId, row.id)}
          >
            {value || '--'}
          </NameLink>
          <ForkPill parent={row.parent} createdAt={row.createdAt} />
        </NameCell>
      ),
      { flex: 2, minWidth: 180, sortable: true, searchable: true },
    ),
    col.text('scopedEnvironmentId', 'Identifier', {
      flex: 1,
      minWidth: 120,
      sortable: false,
    }),
    col.text('description', 'Description', {
      flex: 3,
      minWidth: 150,
      sortable: false,
    }),
    col.custom(
      'decommissionProtection',
      <ProtectedColumnHeader />,
      (_value: unknown, row: EnvRow) =>
        row.decommissionProtection ? (
          <ProtectedYes aria-label="Protected">
            <CheckIcon fontSize="small" />
          </ProtectedYes>
        ) : (
          <ProtectedNo aria-label="Not protected">
            <CloseIcon fontSize="small" />
          </ProtectedNo>
        ),
      { flex: 1, minWidth: 120, sortable: false, searchable: false },
    ),
    buildAttributesColumn({
      directText:
        'Key-value attributes assigned directly to this environment. Attributes cascade to instances within the environment.',
      effectiveText: (
        <>
          The full attribute map the authorization system evaluates policies
          against for this environment — the environment's own user attributes
          plus auto-injected <Code>md-*</Code> system attributes.
        </>
      ),
    }),
  ];

  const createUrl = `${projectUrl(
    api.appUrl,
    api.organizationId,
    projectId,
  )}/environments?createEnvironment=true`;

  return (
    <Wrapper>
      <Header>
        <Typography variant="h6">Environments</Typography>
        <OpenInMassdriverButton url={createUrl}>
          Create Environment
        </OpenInMassdriverButton>
      </Header>
      <DataList
        rows={rows}
        columns={columns}
        loading={loading}
        serverSide
        hasMore={hasMore}
        emptyMessage="This project doesn't have any environments yet."
        variant="outlined"
        {...dataListParams}
      />
      {error && <ErrorNote>{String(error.message ?? error)}</ErrorNote>}
    </Wrapper>
  );
};

const ProtectedColumnHeader = () => (
  <HeaderRow>
    Protected
    <SmallHelpButton
      tooltip={
        <HelpText>
          When enabled, this environment cannot be decommissioned or deleted
          without first turning protection off in environment settings.
        </HelpText>
      }
      size="small"
    />
  </HeaderRow>
);

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  maxWidth: 1400,
  mx: 'auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Header = stylin(Stack)({
  justifyContent: 'space-between',
  alignItems: 'center',
  flexDirection: 'row',
});

const NameCell = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const NameLink = stylin(Box)({
  color: 'inherit',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: 0,
  '&:hover': { textDecoration: 'underline' },
});

const HeaderRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const SmallHelpButton = stylin(HelpIconButton)({
  padding: '2px',
  '& svg': { fontSize: 14 },
});

const HelpText = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'block',
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.5,
  maxWidth: 260,
  color: 'inherit',
}));

const ProtectedYes = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.success.main,
}));

const ProtectedNo = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.text.disabled,
}));

const ErrorNote = stylin('div')(({ theme }: { theme: any }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.body2.fontSize,
}));
