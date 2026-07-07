import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import EditIcon from '@massdriver/ui/icons/EditIcon';
import AttachMoneyIcon from '@massdriver/ui/icons/AttachMoneyIcon';
import ArrowUpwardIcon from '@massdriver/ui/icons/ArrowUpwardIcon';
import ArrowDownwardIcon from '@massdriver/ui/icons/ArrowDownwardIcon';
import NotificationsIcon from '@massdriver/ui/icons/NotificationsIcon';
import stylin from '@massdriver/ui/stylin';
import {
  formatCurrency,
  formatRelativeTime,
} from '../../../utils/formatRelativeTime';
import type { AlarmItem, Money, NodeCost } from './queries';

const ALARM_STATUS = 'ALARM';

export const countActiveAlarms = (
  alarms?: { items?: (AlarmItem | null)[] | null } | null,
): number =>
  (alarms?.items ?? []).filter(
    alarm => alarm?.currentState?.status === ALARM_STATUS,
  ).length;

/** The 2×2 meta grid on a diagram node: alarms / cost / last-edited. */
const NodeMeta = ({
  alarms,
  cost,
  updatedAt,
}: {
  alarms?: { items?: (AlarmItem | null)[] | null } | null;
  cost?: NodeCost | null;
  updatedAt?: string | null;
}) => {
  const numAlerts = countActiveAlarms(alarms);

  return (
    <MetaGrid>
      <AlertsRow numAlerts={numAlerts} />
      <CostRow
        label="yesterday"
        sample={cost?.lastDay}
        average={cost?.dailyAverage}
      />
      <EditedRow updatedAt={updatedAt} />
      <CostRow
        label="last month"
        sample={cost?.lastMonth}
        average={cost?.monthlyAverage}
      />
    </MetaGrid>
  );
};

const AlertsRow = ({ numAlerts }: { numAlerts: number }) => {
  const hasAlerts = numAlerts > 0;
  const label = hasAlerts
    ? `${numAlerts} active alert${numAlerts === 1 ? '' : 's'}`
    : 'no active alerts';

  return (
    <Row title={label}>
      <AlertsIcon hasAlerts={hasAlerts} />
      <RowText hasAlerts={hasAlerts}>{label}</RowText>
    </Row>
  );
};

const EditedRow = ({ updatedAt }: { updatedAt?: string | null }) => {
  const label = `last edited ${formatRelativeTime(updatedAt)}`;
  return (
    <Row title={label}>
      <EditedIcon />
      <RowText>{label}</RowText>
    </Row>
  );
};

const CostRow = ({
  label,
  sample,
  average,
}: {
  label: string;
  sample?: Money | null;
  average?: Money | null;
}) => {
  const amount = sample?.amount;
  const averageAmount = average?.amount;
  const currency = sample?.currency || average?.currency || 'USD';
  const hasValue = amount != null;
  const formatted = formatCurrency(amount, currency, '---');
  const formattedAverage =
    averageAmount != null
      ? formatCurrency(averageAmount, currency, '---')
      : null;

  return (
    <Row title={`${label}: ${formatted}`}>
      <MoneyIcon active={hasValue} />
      <RowText>
        {label}:&nbsp;
        {hasValue ? (
          <CostValue
            formatted={formatted}
            amount={amount!}
            average={averageAmount}
            formattedAverage={formattedAverage}
          />
        ) : (
          '---'
        )}
      </RowText>
    </Row>
  );
};

const CostValue = ({
  formatted,
  amount,
  average,
  formattedAverage,
}: {
  formatted: string;
  amount: number;
  average?: number | null;
  formattedAverage?: string | null;
}) => (
  <CostInline>
    <CostNumber>{formatted}</CostNumber>
    {average != null && amount !== average && (
      <Tooltip
        title={formattedAverage ? `${formattedAverage} average` : ''}
        arrow
        placement="right"
      >
        <TrendWrap>
          {amount > average ? (
            <TrendUp data-testid="cost-trend-up" />
          ) : (
            <TrendDown data-testid="cost-trend-down" />
          )}
        </TrendWrap>
      </Tooltip>
    )}
  </CostInline>
);

export default NodeMeta;

const MetaGrid = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  columnGap: theme.spacing(2),
  alignContent: 'space-evenly',
  flex: 1,
  minWidth: 0,
}));

const Row = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  minWidth: 0,
  overflow: 'hidden',
});

const RowText = stylin(
  Typography,
  ['hasAlerts'],
)(({ theme, hasAlerts }: { theme: any; hasAlerts?: boolean }) => ({
  fontSize: '13px',
  fontWeight: 400,
  color: hasAlerts ? theme.palette.error.main : theme.palette.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

const EditedIcon = stylin(EditIcon)(({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  flexShrink: 0,
  color: theme.palette.text.secondary,
}));

const AlertsIcon = stylin(
  NotificationsIcon,
  ['hasAlerts'],
)(({ theme, hasAlerts }: { theme: any; hasAlerts?: boolean }) => ({
  width: 16,
  height: 16,
  flexShrink: 0,
  color: hasAlerts ? theme.palette.error.main : theme.palette.text.secondary,
}));

const MoneyIcon = stylin(
  AttachMoneyIcon,
  ['active'],
)(({ theme, active }: { theme: any; active?: boolean }) => ({
  width: 16,
  height: 16,
  flexShrink: 0,
  color: active ? theme.palette.success.main : theme.palette.text.secondary,
}));

const TrendUp = stylin(ArrowUpwardIcon)(({ theme }: { theme: any }) => ({
  width: 14,
  height: 14,
  color: theme.palette.error.main,
}));

const TrendDown = stylin(ArrowDownwardIcon)(({ theme }: { theme: any }) => ({
  width: 14,
  height: 14,
  color: theme.palette.success.main,
}));

const CostInline = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.25,
  minWidth: 0,
});

const CostNumber = stylin('span')({
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

const TrendWrap = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
});
