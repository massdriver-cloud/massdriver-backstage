import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import TextField from '@massdriver/ui/TextField';
import FormsMarkdown from '@massdriver/ui/FormsMarkdown';
import stylin from '@massdriver/ui/stylin';
import { DisabledAction } from '../../../../components/DisabledAction';
import type { SecretField } from '../types';

const MASKED_VALUE = '••••••••••••';

export const SecretsTab = ({
  secretFields = [],
}: {
  secretFields?: SecretField[];
}) => (
  <Root>
    {secretFields.length > 0 ? (
      secretFields.map(field => {
        const isSet = Boolean(field.sha256);
        return (
          <Item key={field.name}>
            <SecretTitle>
              {`${field.title || field.name}${field.required ? '*' : ''}`}
            </SecretTitle>
            <ValueRow>
              <MaskedField
                value={isSet ? MASKED_VALUE : ''}
                placeholder={isSet ? '' : 'No value set'}
                size="small"
                fullWidth
                disabled
              />
              <Actions>
                <DisabledAction
                  label="Edit"
                  variant="text"
                  size="small"
                  tooltip="This view is read-only. Open in Massdriver to set this secret."
                />
                {isSet ? (
                  <DisabledAction
                    label="Clear"
                    variant="text"
                    size="small"
                    color="error"
                    tooltip="This view is read-only. Open in Massdriver to clear this secret."
                  />
                ) : null}
              </Actions>
            </ValueRow>
            {isSet && field.sha256 ? (
              <Meta title={field.sha256}>
                sha256: {field.sha256.slice(0, 12)}…
              </Meta>
            ) : null}
            {field.description ? (
              <Description>
                <FormsMarkdown>{field.description}</FormsMarkdown>
              </Description>
            ) : null}
          </Item>
        );
      })
    ) : (
      <EmptyNote>This component doesn't declare any secrets.</EmptyNote>
    )}
  </Root>
);

export default SecretsTab;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(1),
}));

const Item = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SecretTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const ValueRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const MaskedField = stylin(TextField)({
  flex: 1,
  minWidth: 0,
});

const Actions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flexShrink: 0,
}));

const Meta = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const Description = stylin(Box)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));
