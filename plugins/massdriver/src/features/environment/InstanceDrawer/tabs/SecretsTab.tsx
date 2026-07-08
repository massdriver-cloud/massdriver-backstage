import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';
import type { SecretField } from '../types';

/**
 * Read-only Secrets tab: lists declared secret fields with set/unset state.
 * A present `sha256` means the secret has a value. Set/remove mutations from
 * the web app are dropped.
 */
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
            <TitleRow>
              <SecretTitle>{`${field.title || field.name}${field.required ? '*' : ''}`}</SecretTitle>
              <StateChip
                label={isSet ? 'Set' : 'Not set'}
                size="small"
                color={isSet ? 'success' : 'default'}
                variant="outlined"
              />
            </TitleRow>
            {isSet ? <Meta title={field.sha256 ?? ''}>sha256: {field.sha256}</Meta> : null}
            {field.description ? <Description>{field.description}</Description> : null}
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
  gap: theme.spacing(0.5),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const TitleRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
}));

const SecretTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const StateChip = stylin(Chip)(({ theme }: { theme: any }) => ({
  height: 18,
  fontSize: theme.typography.pxToRem(11),
  '& .MuiChip-label': { paddingLeft: '6px', paddingRight: '6px' },
}));

const Meta = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const Description = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
}));

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));
