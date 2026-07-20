import { alpha } from '@massdriver/ui/theme';
import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import Typography from '@massdriver/ui/Typography';
import ArrowUpwardIcon from '@massdriver/ui/icons/ArrowUpwardIcon';
import RefreshIcon from '@massdriver/ui/icons/RefreshIcon';
import stylin from '@massdriver/ui/stylin';

const NodeVersionBadges = ({
  availableUpgrade,
  deployedVersion,
  resolvedVersion,
  hasUndeployedPlan,
}: {
  availableUpgrade?: string | null;
  deployedVersion?: string | null;
  resolvedVersion?: string | null;
  hasUndeployedPlan?: boolean;
}) => {
  const showUpgrade = Boolean(availableUpgrade);
  const versionDrift = Boolean(
    deployedVersion && resolvedVersion && deployedVersion !== resolvedVersion,
  );
  const showRedeploy = versionDrift || Boolean(hasUndeployedPlan);

  return !showUpgrade && !showRedeploy ? null : (
    <Row>
      {showUpgrade && <UpgradeBadge availableUpgrade={availableUpgrade} />}
      {showRedeploy && (
        <RedeployBadge
          deployedVersion={deployedVersion}
          resolvedVersion={resolvedVersion}
          hasUndeployedPlan={hasUndeployedPlan}
        />
      )}
    </Row>
  );
};

export default NodeVersionBadges;

const UpgradeBadge = ({
  availableUpgrade,
}: {
  availableUpgrade?: string | null;
}) =>
  !availableUpgrade ? null : (
    <Tooltip
      arrow
      enterDelay={400}
      title={`A version upgrade to v${availableUpgrade} is available.`}
    >
      <UpgradeRoot>
        <UpArrow />
        <VersionText>v{availableUpgrade}</VersionText>
      </UpgradeRoot>
    </Tooltip>
  );

const RedeployBadge = ({
  deployedVersion,
  resolvedVersion,
  hasUndeployedPlan,
}: {
  deployedVersion?: string | null;
  resolvedVersion?: string | null;
  hasUndeployedPlan?: boolean;
}) => {
  const versionDrift = Boolean(
    deployedVersion && resolvedVersion && deployedVersion !== resolvedVersion,
  );

  return !versionDrift && !hasUndeployedPlan ? null : (
    <Tooltip
      arrow
      enterDelay={400}
      title={
        <TooltipBody>
          <TooltipTitle>Redeploy needed</TooltipTitle>
          <BulletList>
            {versionDrift && (
              <BulletItem>
                Bundle version is out of date (currently{' '}
                <Mono>v{deployedVersion}</Mono>)
              </BulletItem>
            )}
            {hasUndeployedPlan && (
              <BulletItem>Planned changes have not been deployed</BulletItem>
            )}
          </BulletList>
        </TooltipBody>
      }
    >
      <RedeployRoot>
        <RefreshGlyph />
      </RedeployRoot>
    </Tooltip>
  );
};

const Row = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flexShrink: 0,
}));

const UpgradeRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.25, 0.75),
  borderRadius: 1,
  lineHeight: 1,
  backgroundColor: alpha(theme.palette.info.light, 0.2),
  color: theme.palette.info.dark,
  border: `1px solid ${theme.palette.info.main}`,
}));

const UpArrow = stylin(ArrowUpwardIcon)({
  fontSize: 12,
});

const VersionText = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: 12,
  fontWeight: 500,
  color: 'inherit',
  lineHeight: 1,
  fontFamily: theme.typography.fontFamilyMono,
}));

const RedeployRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.warning.main, 0.12),
  color: theme.palette.warning.main,
  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
}));

const RefreshGlyph = stylin(RefreshIcon)({
  fontSize: 14,
});

const TooltipBody = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
});

const TooltipTitle = stylin(Typography)({
  fontSize: 12,
  fontWeight: 600,
  color: 'inherit',
});

const BulletList = stylin('ul')(({ theme }: { theme: any }) => ({
  margin: 0,
  paddingLeft: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
}));

const BulletItem = stylin('li')({
  fontSize: 11,
  lineHeight: 1.4,
  color: 'inherit',
});

const Mono = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
}));
