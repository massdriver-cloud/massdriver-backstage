import Box from '@massdriver/ui/Box';
import Stack from '@massdriver/ui/Stack';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import { ReactNode } from 'react';

// Ported from the Massdriver web app — a tab's title, optional
// description, and optional trailing actions row.
export const RepoTabHeader = ({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) => (
  <Wrapper>
    <Heading>
      <Typography variant="h6">{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Heading>
    {actions ? (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {actions}
      </Stack>
    ) : null}
  </Wrapper>
);

export default RepoTabHeader;

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Heading = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));
