import { useMemo } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { Form, DataSourceProvider } from '@massdriver/forms';
import { useInstanceApiQuery } from '../useInstanceApiQuery';
import { TabState } from '../TabState';
import { formsDataSource } from '../formsDataSource';

const CONFIG_QUERY = `
  query MassdriverInstanceConfig($organizationId: ID!, $id: ID!) {
    instance(organizationId: $organizationId, id: $id) {
      id
      name
      params
      paramsSchema
      uiSchema
    }
  }
`;

interface ConfigInstance {
  id: string;
  params?: string | null;
  paramsSchema?: string | null;
  uiSchema?: string | null;
}

// paramsSchema / uiSchema / params come back as JSON-encoded strings; parse to
// objects the way the web app's `parseMap` does for the same fields.
const parseMap = (value: unknown): any => {
  if (value == null) return undefined;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value as string);
  } catch {
    return undefined;
  }
};

const noop = () => {};

/**
 * Read-only instance config: the deployment params rendered through the same
 * RJSF `Form` the web app uses (schema-driven), but with RJSF `readonly` so no
 * field is editable and the submit button is suppressed (`<></>` children).
 * Editing happens in Massdriver — the drawer header's "Open in Massdriver"
 * deep-links to this tab. Data-fetching fields resolve through the relay via
 * the injected `formsDataSource`.
 */
export const ConfigTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: ConfigInstance | null;
  }>(CONFIG_QUERY, instanceId);
  const instance = value?.instance;

  const schema = useMemo(
    () => parseMap(instance?.paramsSchema),
    [instance?.paramsSchema],
  );
  const uiSchema = useMemo(
    () => parseMap(instance?.uiSchema) || {},
    [instance?.uiSchema],
  );
  const formData = useMemo(
    () => parseMap(instance?.params) ?? {},
    [instance?.params],
  );

  return (
    <TabState loading={loading} error={error}>
      {schema ? (
        <DataSourceProvider value={formsDataSource}>
          <FormRoot>
            <Form
              id="instance-config"
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              readonly
              onChange={noop}
            >
              <></>
            </Form>
          </FormRoot>
        </DataSourceProvider>
      ) : (
        <Empty>
          <Typography variant="body2" color="text.secondary">
            This instance has no configuration schema.
          </Typography>
        </Empty>
      )}
    </TabState>
  );
};

export default ConfigTab;

const FormRoot = stylin(Box)({
  // RJSF renders its own field spacing; keep the tab body flush.
  display: 'flex',
  flexDirection: 'column',
});

const Empty = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));
