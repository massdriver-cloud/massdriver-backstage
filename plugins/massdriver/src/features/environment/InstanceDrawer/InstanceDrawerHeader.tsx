import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import Tooltip from '@massdriver/ui/Tooltip';
import { CloseIconButton } from '@massdriver/ui/IconButton';
import NotificationsIcon from '@massdriver/ui/icons/NotificationsIcon';
import AttachMoneyIcon from '@massdriver/ui/icons/AttachMoneyIcon';
import EditIcon from '@massdriver/ui/icons/EditIcon';
import ArrowUpwardIcon from '@massdriver/ui/icons/ArrowUpwardIcon';
import ArrowDownwardIcon from '@massdriver/ui/icons/ArrowDownwardIcon';
import stylin from '@massdriver/ui/stylin';
import VersionBadge from '../../../components/VersionBadge';
import InstanceStatusPill from '../components/InstanceStatusPill';
import { OpenInMassdriverButton } from '../../../components/OpenInMassdriverButton';
import { formatCurrency } from '../../../utils/formatRelativeTime';
import { formatRelativeTime } from './helpers';
import type { Money, PanelInstance } from './types';

const countActiveAlarms = (instance?: PanelInstance | null): number =>
  (instance?.alarms?.items ?? []).filter(
    alarm => alarm?.currentState?.status === 'ALARM',
  ).length;

export const InstanceDrawerHeader = ({
  instance,
  appUrl,
  onClose,
}: {
  instance?: PanelInstance | null;
  appUrl: string;
  onClose: () => void;
}) => {
  const title = instance?.component?.name;

  return (
    <HeaderRoot>
      <TopRow>
        <TitleArea>
          {title ? (
            <Title variant="h6" title={title}>
              {title}
            </Title>
          ) : null}
          {instance?.version ? (
            <VersionBadge version={instance.version} showPinnedWarning />
          ) : null}
          {instance?.id ? (
            <InstanceStatusPill
              instance={{ id: instance.id, status: instance.status }}
            />
          ) : null}
        </TitleArea>
        <Actions>
          {appUrl ? (
            <OpenInMassdriverButton
              url={appUrl}
              variant="outlined"
              size="small"
            />
          ) : null}
          <CloseIconButton onClick={onClose} tooltip="Close panel" />
        </Actions>
      </TopRow>
      {instance ? <InstanceMeta instance={instance} /> : null}
    </HeaderRoot>
  );
};

export default InstanceDrawerHeader;

const InstanceMeta = ({ instance }: { instance: PanelInstance }) => {
  const numAlerts = countActiveAlarms(instance);
  const cost = instance.cost;
  return (
    <MetaGrid>
      <AlertsRow numAlerts={numAlerts} />
      <CostRow
        label="yesterday"
        sample={cost?.lastDay}
        average={cost?.dailyAverage}
      />
      <EditedRow updatedAt={instance.updatedAt} />
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
    <MetaRow title={label}>
      <AlertsIcon hasAlerts={hasAlerts} />
      <RowText hasAlerts={hasAlerts}>{label}</RowText>
    </MetaRow>
  );
};

const EditedRow = ({ updatedAt }: { updatedAt?: string | null }) => {
  const label = `last edited ${formatRelativeTime(updatedAt)}`;
  return (
    <MetaRow title={label}>
      <StyledEditIcon />
      <RowText>{label}</RowText>
    </MetaRow>
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
    <MetaRow title={`${label}: ${formatted}`}>
      <MoneyIcon active={hasValue} />
      <RowText>
        {label}:&nbsp;
        {hasValue ? (
          <CostInline>
            <CostNumber>{formatted}</CostNumber>
            {averageAmount != null && amount !== averageAmount ? (
              <Tooltip
                title={formattedAverage ? `${formattedAverage} average` : ''}
                arrow
                placement="right"
              >
                <TrendWrap>
                  {(amount as number) > (averageAmount as number) ? (
                    <TrendUp />
                  ) : (
                    <TrendDown />
                  )}
                </TrendWrap>
              </Tooltip>
            ) : null}
          </CostInline>
        ) : (
          '---'
        )}
      </RowText>
    </MetaRow>
  );
};

const HeaderRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const TopRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  minHeight: 32,
  minWidth: 0,
}));

const TitleArea = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flex: 1,
  minWidth: 0,
}));

const Title = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  lineHeight: 1.2,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}));

const Actions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexShrink: 0,
}));

const MetaGrid = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  rowGap: theme.spacing(0.5),
  columnGap: theme.spacing(2),
  marginTop: theme.spacing(0.5),
  minWidth: 0,
}));

const MetaRow = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  overflow: 'hidden',
});

const RowText = stylin(Typography, ['hasAlerts'])(
  ({ theme, hasAlerts }: { theme: any; hasAlerts?: boolean }) => ({
    fontSize: '14px',
    fontWeight: 400,
    color: hasAlerts ? theme.palette.error.main : theme.palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  }),
);

const StyledEditIcon = stylin(EditIcon)(({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  flexShrink: 0,
  color: theme.palette.text.secondary,
}));

const AlertsIcon = stylin(NotificationsIcon, ['hasAlerts'])(
  ({ theme, hasAlerts }: { theme: any; hasAlerts?: boolean }) => ({
    width: 16,
    height: 16,
    flexShrink: 0,
    color: hasAlerts ? theme.palette.error.main : theme.palette.text.secondary,
  }),
);

const MoneyIcon = stylin(AttachMoneyIcon, ['active'])(
  ({ theme, active }: { theme: any; active?: boolean }) => ({
    width: 16,
    height: 16,
    flexShrink: 0,
    color: active ? theme.palette.success.main : theme.palette.text.secondary,
  }),
);

const TrendUp = stylin(ArrowUpwardIcon)(({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  color: theme.palette.error.main,
}));

const TrendDown = stylin(ArrowDownwardIcon)(({ theme }: { theme: any }) => ({
  width: 16,
  height: 16,
  color: theme.palette.success.main,
}));

const CostInline = stylin('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
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
