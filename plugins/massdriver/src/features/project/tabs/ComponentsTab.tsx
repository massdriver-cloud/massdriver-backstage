import { useApi } from '@backstage/frontend-plugin-api';
import { parseInstanceId } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import DataList from '@massdriver/ui/DataList';
import IconTile from '@massdriver/ui/IconTile';
import Stack from '@massdriver/ui/Stack';
import Typography from '@massdriver/ui/Typography';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import { buildAttributesColumn, Code } from '../../../components/AttributesColumn';
import { internalRoutes } from '../../../internalRoutes';
import { EnvInstance, EnvStatusStrip } from './EnvStatus';

interface ComponentRow {
  id: string;
  name: string;
  description?: string | null;
  attributes?: unknown;
  effectiveAttributes?: unknown;
  ociRepo?: { id: string; name?: string; icon?: string } | null;
  typeName?: string;
  instances: EnvInstance[];
}

const COMPONENTS_QUERY = `
  query MassdriverProjectComponents($organizationId: ID!, $id: ID!) {
    project(organizationId: $organizationId, id: $id) {
      id
      components {
        id
        name
        description
        attributes
        effectiveAttributes
        ociRepo { id name icon }
        instances(cursor: { limit: 100 }) {
          items {
            id
            status
            deployedVersion
            resolvedVersion
            availableUpgrade
            environment { id name }
          }
        }
      }
    }
  }
`;

/** Read-only Components tab: components with status across environments. */
export const ComponentsTab = ({ projectId }: { projectId: string }) => {
  const api = useApi(massdriverApiRef);
  const { value, loading, error } = useAsync(async () => {
    const data = (await api.query(COMPONENTS_QUERY, { id: projectId })) as {
      project: {
        components?: Array<{
          id: string;
          name: string;
          description?: string | null;
          attributes?: unknown;
          effectiveAttributes?: unknown;
          ociRepo?: { id: string; name?: string; icon?: string } | null;
          instances?: { items?: (EnvInstance | null)[] | null };
        }> | null;
      } | null;
    };
    return data.project?.components ?? [];
  }, [api, projectId]);

  const rows: ComponentRow[] = (value ?? []).map(component => ({
    ...component,
    typeName: component.ociRepo?.name,
    instances: (component.instances?.items ?? []).filter(
      Boolean,
    ) as EnvInstance[],
  }));

  const getInstanceUrl = (instance: EnvInstance): string | null => {
    if (!instance.environment?.id || !instance.id) {
      return null;
    }
    const { scopedComponentId } = parseInstanceId(instance.id);
    return `${internalRoutes.environment(
      projectId,
      instance.environment.id,
    )}?instance=${scopedComponentId}`;
  };

  const columns = [
    col.custom(
      'name',
      'Name',
      (_value: unknown, row: ComponentRow) => (
        <NameCell>
          <IconTile
            src={row.ociRepo?.icon}
            alt={row.ociRepo?.name}
            size="small"
            fallback={<ExtensionIcon />}
          />
          <Typography variant="body2">{row.name}</Typography>
        </NameCell>
      ),
      { flex: 2, minWidth: 220, searchable: true },
    ),
    col.text('description', 'Description', {
      flex: 2,
      minWidth: 200,
      sortable: false,
      searchable: true,
    }),
    col.text('typeName', 'Bundle Type', {
      flex: 1,
      minWidth: 160,
      sortable: false,
    }),
    buildAttributesColumn({
      directText:
        'Key-value attributes assigned directly to this component. Attributes cascade to instances of the component across all environments.',
      effectiveText: (
        <>
          The full attribute map the authorization system evaluates policies
          against for this component — the component's own user attributes plus
          auto-injected <Code>md-*</Code> system attributes.
        </>
      ),
    }),
    col.custom(
      'status',
      'Status across environments',
      (_value: unknown, row: ComponentRow) => (
        <EnvStatusStrip instances={row.instances} getInstanceUrl={getInstanceUrl} />
      ),
      { flex: 3, minWidth: 280, sortable: false, searchable: false },
    ),
  ];

  return (
    <Wrapper>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Components</Typography>
      </Stack>
      {error ? (
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      ) : (
        <DataList
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage="No components in this project yet."
          variant="outlined"
        />
      )}
    </Wrapper>
  );
};

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  maxWidth: 1400,
  mx: 'auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const NameCell = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));
