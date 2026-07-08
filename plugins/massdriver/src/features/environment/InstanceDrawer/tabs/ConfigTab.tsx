import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import CodeBlock from '@massdriver/ui/CodeBlock';
import TextField from '@massdriver/ui/TextField';
import ToggleButton from '@massdriver/ui/ToggleButton';
import ToggleButtonGroup from '@massdriver/ui/ToggleButtonGroup';
import Tooltip from '@massdriver/ui/Tooltip';
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

const FORM_VIEW_TOOLTIP = 'Show the config as a form.';
const JSON_VIEW_TOOLTIP = 'Show the raw JSON params.';
const PROPOSE_TOOLTIP =
  'This view is read-only. Open in Massdriver to propose or deploy changes.';

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
 * Read-only instance config. Mirrors the web app's ConfigTab: a Form/JSON view
 * toggle, the schema-driven RJSF `Form` (rendered `readonly`, submit suppressed
 * via `<></>` children), the raw-params `CodeBlock`, and a disabled Propose
 * button. Everything is read-only — the drawer header's "Open in Massdriver"
 * deep-links here to actually edit/propose/deploy. Data-fetching fields resolve
 * through the relay via the injected `formsDataSource`.
 */
export const ConfigTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: ConfigInstance | null;
  }>(CONFIG_QUERY, instanceId);
  const instance = value?.instance;

  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');

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
        <Root>
          <Header>
            <ViewToggle
              value={viewMode}
              exclusive
              size="small"
              onChange={(_event: unknown, next: 'form' | 'json' | null) =>
                next && setViewMode(next)
              }
              aria-label="Config view mode"
            >
              <Tooltip title={FORM_VIEW_TOOLTIP} placement="top" arrow>
                <ToggleButton value="form" aria-label="Form view">
                  Form
                </ToggleButton>
              </Tooltip>
              <Tooltip title={JSON_VIEW_TOOLTIP} placement="top" arrow>
                <ToggleButton value="json" aria-label="JSON view">
                  JSON
                </ToggleButton>
              </Tooltip>
            </ViewToggle>
          </Header>

          {viewMode === 'json' ? (
            <JsonViewSection>
              <JsonViewCaption variant="caption">
                Read-only view of the raw JSON params.
              </JsonViewCaption>
              <JsonCodeBlock>
                {JSON.stringify(formData ?? {}, null, 2)}
              </JsonCodeBlock>
            </JsonViewSection>
          ) : (
            <FormSection>
              <DataSourceProvider value={formsDataSource}>
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
              </DataSourceProvider>

              <MessageRow>
                <TextField
                  label="Deployment message"
                  helperText="Optional. Shown in the deployment history."
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  value=""
                  disabled
                />
              </MessageRow>

              <Footer>
                <Tooltip title={PROPOSE_TOOLTIP} placement="top">
                  <ButtonWrap>
                    <Button variant="outlined" disabled>
                      Propose
                    </Button>
                  </ButtonWrap>
                </Tooltip>
              </Footer>
            </FormSection>
          )}
        </Root>
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

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Header = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: theme.spacing(5.5),
}));

const ViewToggle = stylin(ToggleButtonGroup)(({ theme }: { theme: any }) => ({
  width: theme.spacing(16),
  height: theme.spacing(3.5),
  '& .MuiToggleButton-root': {
    flex: 1,
    height: '100%',
    fontWeight: 400,
    fontSize: theme.typography.pxToRem(13),
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

const FormSection = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const JsonViewSection = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const JsonCodeBlock = stylin(CodeBlock)(({ theme }: { theme: any }) => ({
  maxHeight: theme.spacing(50),
}));

const JsonViewCaption = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const MessageRow = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const Footer = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const ButtonWrap = stylin('span')({
  display: 'inline-flex',
});

const Empty = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));
