import { useApi } from '@backstage/frontend-plugin-api';
import {
  parseInstanceId,
  resourceUrl,
} from '@massdriver/backstage-plugin-common';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import CodeBlock from '@massdriver/ui/CodeBlock';
import CopyButton from '@massdriver/ui/CopyButton';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import Typography from '@massdriver/ui/Typography';
import DownloadIcon from '@massdriver/ui/icons/DownloadIcon';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { OriginChip } from '../OriginChip';
import { RESOURCE_HEADER_QUERY } from '../queries';
import { GeneralTabLoading } from './GeneralTab.loading';

const PAYLOAD_EXPORT_TOOLTIP = 'Download in Massdriver';

interface GeneralResource {
  id: string;
  name: string;
  origin?: string | null;
  payload?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
  resourceType?: { id: string; name?: string | null } | null;
  instance?: { id: string } | null;
}

const parseMap = (value: unknown): any => {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value as string);
  } catch {
    return null;
  }
};

const buildLocation = (
  instance: GeneralResource['instance'],
): string | null => {
  if (!instance?.id) return null;
  const { projectId, scopedEnvironmentId } = parseInstanceId(instance.id);
  if (!projectId || !scopedEnvironmentId) return null;
  return `${projectId} : ${scopedEnvironmentId}`;
};

export const GeneralTab = ({ resourceId }: { resourceId: string }) => {
  const api = useApi(massdriverApiRef);
  const {
    value: resource,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(RESOURCE_HEADER_QUERY, {
      id: resourceId,
    })) as { resource: GeneralResource | null };
    return data.resource;
  }, [api, resourceId]);

  if (loading) {
    return (
      <Body>
        <GeneralTabLoading />
      </Body>
    );
  }
  if (error) {
    return (
      <Body>
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      </Body>
    );
  }
  if (!resource) return null;

  const location = buildLocation(resource.instance);
  const parsedPayload = parseMap(resource.payload);

  return (
    <Body>
      <MetaGrid>
        <Card>
          <CardTitle>Identifiers</CardTitle>
          <KeyValueList>
            <KeyValueRow
              label="ID"
              value={resource.id}
              mono
              copyTooltip="Copy ID"
            />
            <KeyValueRow label="Type" value={resource.resourceType?.id} mono />
          </KeyValueList>
        </Card>

        <Card>
          <CardTitle>Origin</CardTitle>
          <KeyValueList>
            <KeyValueRow
              label="Status"
              value={<OriginChip origin={resource.origin} />}
            />
            {resource.instance?.id ? (
              <KeyValueRow label="Instance" value={resource.instance.id} mono />
            ) : null}
            {location ? (
              <KeyValueRow label="Location" value={location} />
            ) : null}
          </KeyValueList>
        </Card>

        <Card>
          <CardTitle>Timeline</CardTitle>
          <KeyValueList>
            <KeyValueRow
              label="Created"
              value={formatRelativeTime(resource.createdAt)}
            />
            <KeyValueRow
              label="Updated"
              value={formatRelativeTime(resource.updatedAt)}
            />
          </KeyValueList>
        </Card>
      </MetaGrid>

      {parsedPayload ? (
        <Card>
          <PayloadHeader>
            <CardTitle>Payload</CardTitle>
            <Tooltip title={PAYLOAD_EXPORT_TOOLTIP} placement="top">
              <ButtonWrap>
                <IconButton
                  size="small"
                  aria-label="Download payload in Massdriver"
                  href={resourceUrl(api.appUrl, api.organizationId, resourceId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </ButtonWrap>
            </Tooltip>
          </PayloadHeader>
          <CodeBlock>{JSON.stringify(parsedPayload, null, 2)}</CodeBlock>
        </Card>
      ) : null}
    </Body>
  );
};

const KeyValueRow = ({
  label,
  value,
  mono,
  copyTooltip,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
  copyTooltip?: string;
}) => {
  if (value == null || value === '') return null;
  const isTextValue = typeof value === 'string' || typeof value === 'number';
  return (
    <KeyValueRowBox>
      <KeyLabel>{label}</KeyLabel>
      <ValueWrap>
        <ValueText
          mono={mono}
          truncate={isTextValue}
          title={isTextValue ? String(value) : undefined}
        >
          {value}
        </ValueText>
        {isTextValue && copyTooltip ? (
          <CopyButton
            text={String(value)}
            tooltip={copyTooltip}
            size="small"
            ariaLabel={copyTooltip}
          />
        ) : null}
      </ValueWrap>
    </KeyValueRowBox>
  );
};

const Body = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: theme.spacing(4),
  gap: theme.spacing(3),
  maxWidth: theme.spacing(160),
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
}));

const MetaGrid = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: theme.spacing(2),
  alignItems: 'stretch',
}));

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
}));

const CardTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: theme.palette.text.secondary,
}));

const PayloadHeader = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
}));

const ButtonWrap = stylin('span')({
  display: 'inline-flex',
});

const KeyValueList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
}));

const KeyValueRowBox = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: `${theme.spacing(10)} 1fr`,
  gap: theme.spacing(1.5),
  alignItems: 'center',
}));

const KeyLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
}));

const ValueWrap = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const ValueText = stylin(Box, ['mono', 'truncate'])(
  ({
    theme,
    mono,
    truncate,
  }: {
    theme: any;
    mono?: boolean;
    truncate?: boolean;
  }) => ({
    fontSize: '0.875rem',
    color: theme.palette.text.primary,
    flex: 1,
    minWidth: 0,
    ...(truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    ...(mono && {
      fontFamily: theme.typography.fontFamilyMono,
      fontSize: '0.8125rem',
    }),
  }),
);
