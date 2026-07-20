import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import Typography from '@massdriver/ui/Typography';
import stylin from '@massdriver/ui/stylin';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { RouterLinkAdapter } from './RouterLinkAdapter';
import { internalRoutes } from '../internalRoutes';

export const NotFound = ({
  title = 'Not found',
  message = "We couldn't find what you were looking for. It may have been deleted, or the link may be incorrect.",
}: {
  title?: string;
  message?: string;
}) => (
  <Root>
    <Icon />
    <Typography variant="h5">{title}</Typography>
    <Message variant="body2" color="text.secondary">
      {message}
    </Message>
    <Button
      component={RouterLinkAdapter}
      href={internalRoutes.projects()}
      variant="outlined"
    >
      Back to projects
    </Button>
  </Root>
);

export default NotFound;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(8, 4),
  textAlign: 'center',
}));

const Icon = stylin(SearchOffIcon)(({ theme }: { theme: any }) => ({
  fontSize: 48,
  color: theme.palette.text.disabled,
}));

const Message = stylin(Typography)({ maxWidth: 420 });
