import { ReactNode } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import Chip from '@massdriver/ui/Chip';
import stylin from '@massdriver/ui/stylin';

// Read-only port of NodeHandleTooltip. The web app fetches the resource type
// (for its icon) lazily on hover; that query is dropped here — the tooltip
// shows the field name, resource-type id, and required/optional status only.

const TOOLTIP_BG = 'rgba(34, 51, 84, 0.95)';
const TOOLTIP_BORDER = 'rgba(255, 255, 255, 0.1)';
const TOOLTIP_TEXT_MUTED = 'rgba(255, 255, 255, 0.7)';
const TOOLTIP_TEXT_SUBTLE = 'rgba(255, 255, 255, 0.6)';

const NodeHandleTooltip = ({
  resourceTypeId,
  errorMessage,
  fieldName,
  required,
  isRemoteReference = false,
  showFieldStatus = true,
  placement,
  children,
}: {
  resourceTypeId?: string | null;
  errorMessage?: string | null;
  fieldName?: string;
  required?: boolean | null;
  isRemoteReference?: boolean;
  showFieldStatus?: boolean;
  placement?: string;
  children: ReactNode;
}) => {
  const title = errorMessage ? (
    <TooltipContent>
      <ErrorText>{errorMessage}</ErrorText>
      <FieldName as="span">{fieldName}</FieldName>
    </TooltipContent>
  ) : (
    <TooltipContent>
      <HeaderSection>
        <ContentSection>
          <FieldName>{fieldName}</FieldName>
          <TypeText>{resourceTypeId}</TypeText>
        </ContentSection>
      </HeaderSection>
      {showFieldStatus ? (
        <MetaSection>
          <FieldStatusLabel variant="caption">Field Status</FieldStatusLabel>
          <RequiredChip
            label={required ? 'Required' : 'Optional'}
            color={required ? (isRemoteReference ? 'success' : 'error') : 'info'}
            variant="filled"
            size="small"
          />
        </MetaSection>
      ) : null}
      {isRemoteReference ? (
        <RemoteReferenceNote variant="caption">
          Fulfilled by a remote reference.
        </RemoteReferenceNote>
      ) : null}
    </TooltipContent>
  );

  return (
    <Tooltip
      title={title}
      arrow
      enterDelay={600}
      placement={placement}
      componentsProps={TOOLTIP_COMPONENTS_PROPS}
    >
      {children}
    </Tooltip>
  );
};

export default NodeHandleTooltip;

const TOOLTIP_COMPONENTS_PROPS = {
  tooltip: {
    className: 'node-handle',
    sx: {
      bgcolor: TOOLTIP_BG,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${TOOLTIP_BORDER}`,
      boxShadow: (theme: any) => theme.shadows[8],
    },
  },
  arrow: { sx: { color: TOOLTIP_BG } },
};

const TooltipContent = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  minWidth: 200,
  maxWidth: 300,
});

const HeaderSection = stylin(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1.5,
});

const ContentSection = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  flex: 1,
  minWidth: 0,
});

const MetaSection = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(0.5),
  borderTop: `1px solid ${TOOLTIP_BORDER}`,
}));

const FieldStatusLabel = stylin(Typography)({
  color: TOOLTIP_TEXT_SUBTLE,
});

const RemoteReferenceNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.success.light,
  fontSize: '0.7rem',
  fontStyle: 'italic',
  textAlign: 'center',
}));

const FieldName = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  color: theme.palette.common.white,
  lineHeight: 1.2,
}));

const TypeText = stylin(Typography)({
  fontSize: '0.75rem',
  color: TOOLTIP_TEXT_MUTED,
  fontFamily: 'monospace',
  lineHeight: 1.2,
});

const ErrorText = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.error.light,
  fontWeight: 600,
  fontSize: '0.875rem',
}));

const RequiredChip = stylin(Chip)({
  height: 18,
  fontSize: '0.625rem',
  fontWeight: 600,
  '& .MuiChip-label': { px: 0.75 },
});
