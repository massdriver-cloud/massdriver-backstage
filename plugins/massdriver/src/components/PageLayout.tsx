import Box from '@massdriver/ui/Box';
import Divider from '@massdriver/ui/Divider';
import Stack from '@massdriver/ui/Stack';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';

/**
 * Page frame mirroring the web app's `shared/components/PageLayout` — title +
 * description header, a divider, an optional actions toolbar, and content.
 */
export const PageLayout = ({
  title,
  description,
  headerActions,
  actions,
  maxWidth = 1400,
  flush = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  actions?: ReactNode;
  maxWidth?: number;
  flush?: boolean;
  children: ReactNode;
}) => (
  <Root>
    <PageHeader maxWidth={maxWidth}>
      <HeaderText>
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        {description && <Description variant="body2">{description}</Description>}
      </HeaderText>
      {headerActions && <HeaderActions>{headerActions}</HeaderActions>}
    </PageHeader>
    <ZoneDivider />
    {actions && (
      <Toolbar maxWidth={maxWidth}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {actions}
        </Stack>
      </Toolbar>
    )}
    {flush ? (
      <FlushContent>{children}</FlushContent>
    ) : (
      <Content maxWidth={maxWidth}>{children}</Content>
    )}
  </Root>
);

const Root = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const PageHeader = stylin(Box, ['maxWidth'])(
  ({ theme, maxWidth }: { theme: any; maxWidth: number }) => ({
    maxWidth,
    mx: 'auto',
    width: '100%',
    padding: theme.spacing(3, 4, 3, 4),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(3),
  }),
);

const HeaderText = stylin(Box)({ minWidth: 0, flex: 1 });

const HeaderActions = stylin(Box)({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
});

const Description = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  mt: theme.spacing(0.75),
}));

const Toolbar = stylin(Box, ['maxWidth'])(
  ({ theme, maxWidth }: { theme: any; maxWidth: number }) => ({
    maxWidth,
    mx: 'auto',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(3, 4, 0, 4),
  }),
);

const ZoneDivider = stylin(Divider)(({ theme }: { theme: any }) => ({
  height: '1px',
  backgroundColor: theme.palette.divider,
}));

const Content = stylin(Box, ['maxWidth'])(
  ({ theme, maxWidth }: { theme: any; maxWidth: number }) => ({
    maxWidth,
    mx: 'auto',
    width: '100%',
    padding: theme.spacing(3, 4, 3, 4),
    flex: 1,
  }),
);

const FlushContent = stylin(Box)({
  width: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
});
