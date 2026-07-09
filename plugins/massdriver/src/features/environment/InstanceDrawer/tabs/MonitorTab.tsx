import { useMemo } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import { HelpIconButton } from '@massdriver/ui/IconButton';
import NotificationsIcon from '@massdriver/ui/icons/NotificationsIcon';
import stylin from '@massdriver/ui/stylin';
import { TabState } from '../TabState';
import AlarmCard from '../AlarmCard';
import { ALARMS_QUERY } from '../queries';
import { useInstanceApiQuery } from '../useInstanceApiQuery';
import { ALARMS_DOCS_URL, bucketAlarms } from '../helpers';
import type { Alarm } from '../types';

/** Read-only Monitor tab: firing + configured alarms. */
export const MonitorTab = ({ instanceId }: { instanceId: string | null }) => {
  const { value, loading, error } = useInstanceApiQuery<{
    instance: { id: string; alarms?: { items?: (Alarm | null)[] | null } } | null;
  }>(ALARMS_QUERY, instanceId);

  const buckets = useMemo(
    () => bucketAlarms(value?.instance?.alarms?.items),
    [value?.instance?.alarms],
  );
  const alarms = [...buckets.firing, ...buckets.configured];

  return (
    <TabState loading={loading} error={error}>
      <Root>
        <HeaderRow>
          <TitleRow>
            <Title>Alarms</Title>
            <AlarmsHelp
              href={ALARMS_DOCS_URL}
              tooltip="Learn about alarms"
              size="small"
            />
          </TitleRow>
          {buckets.total > 0 ? (
            <CountChip>
              {buckets.firing.length > 0 ? (
                <>
                  <FiringCount>{buckets.firing.length} firing</FiringCount>
                  <Separator>•</Separator>
                </>
              ) : null}
              <TotalCount>{buckets.total} total</TotalCount>
            </CountChip>
          ) : null}
        </HeaderRow>
        {buckets.total === 0 ? (
          <Empty>
            <IconCircle>
              <NotificationsIcon />
            </IconCircle>
            <EmptyTitle variant="body2">No alarms configured</EmptyTitle>
            <EmptyDescription variant="caption">
              Alarms appear here once your bundle provisions monitoring resources.
            </EmptyDescription>
            <DocsLink href={ALARMS_DOCS_URL} target="_blank" rel="noopener noreferrer">
              Learn about alarms
            </DocsLink>
          </Empty>
        ) : (
          <List>
            {alarms.map(alarm => (
              <AlarmCard key={alarm.id} alarm={alarm} />
            ))}
          </List>
        )}
      </Root>
    </TabState>
  );
};

export default MonitorTab;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
}));

const HeaderRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3),
}));

const TitleRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const Title = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
}));

const AlarmsHelp = stylin(HelpIconButton)({
  padding: '2px',
  '& svg': { fontSize: 16 },
});

const CountChip = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: theme.typography.pxToRem(11),
  padding: theme.spacing(0.25, 1),
  borderRadius: '999px',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const FiringCount = stylin(Box)(({ theme }: { theme: any }) => ({
  color: theme.palette.error.dark,
  fontWeight: 600,
}));

const TotalCount = stylin(Box)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const Separator = stylin(Box)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
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

const DocsLink = stylin('a')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
}));
