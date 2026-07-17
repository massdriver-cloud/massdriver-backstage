import Box from '@massdriver/ui/Box';
import { col } from '@massdriver/ui/DataList';
import { HelpIconButton } from '@massdriver/ui/IconButton';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';
import { AttributesSummaryCell } from './AttributesSummaryCell';

export const Code = stylin('code')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono ?? 'monospace',
  fontSize: '0.85em',
  padding: '0 3px',
  borderRadius: 3,
  backgroundColor: 'rgba(255,255,255,0.12)',
}));

const AttributesColumnHeader = ({
  directText,
  effectiveText,
}: {
  directText: ReactNode;
  effectiveText: ReactNode;
}) => (
  <HeaderRow>
    Attributes
    <SmallHelpButton
      tooltip={
        <HelpBody>
          <HelpSection>
            <HelpHeading>Direct</HelpHeading>
            <HelpText>{directText}</HelpText>
          </HelpSection>
          <HelpSection>
            <HelpHeading>Effective</HelpHeading>
            <HelpText>{effectiveText}</HelpText>
          </HelpSection>
        </HelpBody>
      }
      size="small"
    />
  </HeaderRow>
);

export const buildAttributesColumn = ({
  directText,
  effectiveText,
  ...options
}: {
  directText: ReactNode;
  effectiveText: ReactNode;
  [key: string]: unknown;
}) =>
  col.custom(
    'attributes',
    <AttributesColumnHeader
      directText={directText}
      effectiveText={effectiveText}
    />,
    (
      _value: unknown,
      row: { attributes?: unknown; effectiveAttributes?: unknown },
    ) => (
      <AttributesSummaryCell
        direct={row.attributes}
        effective={row.effectiveAttributes}
      />
    ),
    { flex: 2, minWidth: 200, sortable: false, searchable: false, ...options },
  );

const HeaderRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const SmallHelpButton = stylin(HelpIconButton)({
  padding: '2px',
  '& svg': { fontSize: 14 },
});

const HelpBody = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  maxWidth: 280,
  color: 'inherit',
}));

const HelpSection = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  color: 'inherit',
}));

const HelpHeading = stylin('div')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontWeight: theme.typography.fontWeightBold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  opacity: 0.7,
}));

const HelpText = stylin('div')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.5,
  opacity: 0.9,
}));
