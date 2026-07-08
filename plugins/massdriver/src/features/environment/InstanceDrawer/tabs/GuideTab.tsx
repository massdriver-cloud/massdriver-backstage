import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import GuideMarkdown from '@massdriver/ui/GuideMarkdown';
import MenuBookOutlinedIcon from '@massdriver/ui/icons/MenuBookOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import { TabState } from '../TabState';
import { GUIDE_QUERY } from '../queries';
import { useInstanceApiQuery } from '../useInstanceApiQuery';

/** Read-only Guide tab: renders the bundle's operator guide markdown. */
export const GuideTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: { id: string; operatorGuide?: string | null } | null;
  }>(GUIDE_QUERY, instanceId);

  const operatorGuide = value?.instance?.operatorGuide;

  return (
    <TabState loading={loading} error={error}>
      {operatorGuide ? (
        <Body>
          <GuideMarkdown>{operatorGuide}</GuideMarkdown>
        </Body>
      ) : (
        <Empty>
          <IconCircle>
            <MenuBookOutlinedIcon />
          </IconCircle>
          <EmptyTitle variant="body2">No operator guide</EmptyTitle>
          <EmptyDescription variant="caption">
            This bundle's author hasn't published an operator guide yet.
          </EmptyDescription>
        </Empty>
      )}
    </TabState>
  );
};

export default GuideTab;

const Body = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(1),
}));

const Empty = stylin(Box)(({ theme }: { theme: any }) => ({
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

const EmptyTitle = stylin(Typography)({ fontWeight: 600 });

const EmptyDescription = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));
