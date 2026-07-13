import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';

// Ported from apps/web/shared/components/EmptyState.js — the shared repo-feature
// empty state (a disabled-tint icon circle + title + description + optional
// action). `inline` renders just an italic caption for compact contexts.
export const RepoEmptyState = ({
  variant = 'prominent',
  icon,
  title,
  description,
  action,
}: {
  variant?: 'prominent' | 'inline';
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) => {
  if (variant === 'inline') {
    return <InlineMessage>{description ?? title}</InlineMessage>;
  }

  return (
    <ProminentRoot>
      {icon ? <IconCircle>{icon}</IconCircle> : null}
      {title ? <Title variant="body2">{title}</Title> : null}
      {description ? (
        <Description variant="caption">{description}</Description>
      ) : null}
      {action ? <ActionRow>{action}</ActionRow> : null}
    </ProminentRoot>
  );
};

export default RepoEmptyState;

const ProminentRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(6, 2),
  textAlign: 'center',
}));

const IconCircle = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: theme.spacing(6),
  height: theme.spacing(6),
  borderRadius: '50%',
  backgroundColor: theme.palette.action.hover,
  color: theme.palette.text.disabled,
  '& svg': { width: theme.spacing(3), height: theme.spacing(3) },
}));

const Title = stylin(Typography)({
  fontWeight: 600,
});

const Description = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const ActionRow = stylin(Box)(({ theme }: { theme: any }) => ({
  marginTop: theme.spacing(0.5),
}));

const InlineMessage = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));
