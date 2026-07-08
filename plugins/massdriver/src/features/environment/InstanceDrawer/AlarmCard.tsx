import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import ErrorOutlineIcon from '@massdriver/ui/icons/ErrorOutlineIcon';
import CheckCircleOutlineIcon from '@massdriver/ui/icons/CheckCircleOutlineIcon';
import stylin from '@massdriver/ui/stylin';
import {
  describeThreshold,
  formatAbsoluteDateTime,
  formatAlarmDimensions,
  formatMetricLine,
  getSeverity,
  getStatusLabel,
  isFiring,
} from './helpers';
import type { Alarm } from './types';

/** Read-only alarm card, faithful port of the web app's AlarmCard. */
export const AlarmCard = ({ alarm }: { alarm: Alarm }) => {
  const firing = isFiring(alarm);
  const severity = getSeverity(alarm);
  const metricLine = formatMetricLine(alarm.metric);
  const dimensions = alarm.metric?.dimensions ?? [];
  const threshold = describeThreshold(alarm);
  const occurredAt = alarm.currentState?.occurredAt;
  const message = alarm.currentState?.message;
  const displayName = alarm.displayName || 'Unnamed alarm';

  return (
    <Card>
      <Header severity={severity}>
        <HeaderLeft>
          {firing ? (
            <ErrorOutlineIcon fontSize="inherit" />
          ) : alarm.currentState ? (
            <CheckCircleOutlineIcon fontSize="inherit" />
          ) : null}
          <HeaderLabel>{getStatusLabel(alarm.currentState)}</HeaderLabel>
        </HeaderLeft>
        {occurredAt ? (
          <HeaderTime>
            {firing ? 'Triggered' : 'Last cleared'}{' '}
            {formatAbsoluteDateTime(occurredAt)}
          </HeaderTime>
        ) : null}
      </Header>
      <Body>
        <Title title={displayName}>{displayName}</Title>
        {metricLine ? <MetricLine title={metricLine}>{metricLine}</MetricLine> : null}
        {threshold ? (
          <ThresholdBlock>
            <ThresholdLabel>Triggers when</ThresholdLabel>{' '}
            <ThresholdValue>{threshold}</ThresholdValue>
          </ThresholdBlock>
        ) : null}
        {message ? <Message>{message}</Message> : null}
        {dimensions.length ? (
          <DimensionsFooter title={formatAlarmDimensions(dimensions)}>
            {formatAlarmDimensions(dimensions)}
          </DimensionsFooter>
        ) : null}
      </Body>
    </Card>
  );
};

export default AlarmCard;

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 1,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

const Header = stylin(
  Box,
  ['severity'],
)(({ theme, severity }: { theme: any; severity: string }) => {
  const palette: Record<string, { color: string; backgroundColor: string }> = {
    firing: {
      color: theme.palette.error.contrastText,
      backgroundColor: theme.palette.error.main,
    },
    ok: {
      color: theme.palette.success.dark,
      backgroundColor: theme.palette.success.lighter ?? theme.palette.success.light,
    },
    unknown: {
      color: theme.palette.text.secondary,
      backgroundColor: theme.palette.action.hover,
    },
  };
  const tone = palette[severity] ?? palette.unknown;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1.25),
    color: tone.color,
    backgroundColor: tone.backgroundColor,
    fontSize: theme.typography.pxToRem(11),
  };
});

const HeaderLeft = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: 14,
}));

const HeaderLabel = stylin(Box)(({ theme }: { theme: any }) => ({
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontSize: theme.typography.pxToRem(10),
}));

const HeaderTime = stylin(Box)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  opacity: 0.95,
}));

const Body = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
  padding: theme.spacing(1.25),
}));

const Title = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: 600,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const MetricLine = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ThresholdBlock = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(0.75, 1),
  borderRadius: 1,
  backgroundColor: theme.palette.action.hover,
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.4,
}));

const ThresholdLabel = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const ThresholdValue = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
}));

const Message = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}));

const DimensionsFooter = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.disabled,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: 1.4,
  wordBreak: 'break-all',
}));
