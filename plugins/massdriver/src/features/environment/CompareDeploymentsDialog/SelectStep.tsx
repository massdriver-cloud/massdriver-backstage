import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import Button from '@massdriver/ui/Button';
import Select, { MenuItem } from '@massdriver/ui/Select';
import stylin from '@massdriver/ui/stylin';
import CompareArrowsIcon from '@massdriver/ui/icons/CompareArrowsIcon';
import SwapHorizIcon from '@massdriver/ui/icons/SwapHorizIcon';
import VersionBadge from '../../../components/VersionBadge';
import {
  formatDeploymentStatus,
  truncateDeploymentId,
} from '../InstanceDrawer/helpers';
import type { Deployment } from '../InstanceDrawer/types';

const optionLabel = (deployment: Deployment, position?: number): string => {
  const short = truncateDeploymentId(deployment.id);
  return position != null ? `#${position} · ${short}` : short;
};

/**
 * Step 1 of the deployment compare flow: pick two deployments. Simplified from
 * the web app's infinite-scroll pickers to plain Selects — the dialog already
 * fetches the instance's (capped) deployment list into memory.
 */
export const SelectStep = ({
  source,
  target,
  deployments,
  positionMap,
  onSourceChange,
  onTargetChange,
  onSwap,
  onCompare,
}: {
  source: Deployment | null;
  target: Deployment | null;
  deployments: Deployment[];
  positionMap: Map<string, number>;
  onSourceChange: (deployment: Deployment | null) => void;
  onTargetChange: (deployment: Deployment | null) => void;
  onSwap: () => void;
  onCompare: () => void;
}) => {
  const sameSelected = Boolean(source && target && source.id === target.id);
  const canCompare = Boolean(source && target && !sameSelected);
  const canSwap = Boolean(source) && Boolean(target);

  const find = (id: string) =>
    deployments.find(deployment => deployment.id === id) ?? null;

  const renderOptions = (excludeId?: string) =>
    deployments.map(deployment => (
      <MenuItem
        key={deployment.id}
        value={deployment.id}
        disabled={deployment.id === excludeId}
      >
        <OptionRow>
          <OptionMain>
            <Position>{positionMap.get(deployment.id) ?? ''}</Position>
            <OptionId title={deployment.id}>
              {truncateDeploymentId(deployment.id)}
            </OptionId>
            {deployment.version ? (
              <VersionBadge version={deployment.version} />
            ) : null}
          </OptionMain>
          <OptionStatus>
            {formatDeploymentStatus(deployment.action, deployment.status)}
          </OptionStatus>
        </OptionRow>
      </MenuItem>
    ));

  return (
    <Root>
      <Center>
        <IconBadge>
          <CompareArrowsIcon />
        </IconBadge>

        <Heading>
          <Typography variant="h4" component="h2">
            Compare Deployments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pick two deployments to see how their parameters and version differ.
          </Typography>
        </Heading>

        <PickerRow>
          <PickerSlot>
            <Select
              fullWidth
              displayEmpty
              value={source?.id ?? ''}
              onChange={(event: any) => onSourceChange(find(event.target.value))}
              renderValue={(value: string) =>
                value
                  ? optionLabel(find(value) as Deployment, positionMap.get(value))
                  : 'Pick a deployment…'
              }
            >
              {renderOptions(target?.id)}
            </Select>
          </PickerSlot>

          <Tooltip title={canSwap ? 'Swap deployments' : 'Pick both first'} arrow>
            <span>
              <SwapButton
                size="medium"
                onClick={onSwap}
                disabled={!canSwap}
                aria-label="Swap deployments"
              >
                <SwapHorizIcon />
              </SwapButton>
            </span>
          </Tooltip>

          <PickerSlot>
            <Select
              fullWidth
              displayEmpty
              value={target?.id ?? ''}
              onChange={(event: any) => onTargetChange(find(event.target.value))}
              renderValue={(value: string) =>
                value
                  ? optionLabel(find(value) as Deployment, positionMap.get(value))
                  : 'Pick a deployment…'
              }
            >
              {renderOptions(source?.id)}
            </Select>
          </PickerSlot>
        </PickerRow>

        {sameSelected ? (
          <WarnLine variant="caption">
            Pick two different deployments to compare.
          </WarnLine>
        ) : (
          <Spacer />
        )}

        <CompareButton
          variant="contained"
          size="large"
          onClick={onCompare}
          disabled={!canCompare}
        >
          Compare
        </CompareButton>
      </Center>
    </Root>
  );
};

export default SelectStep;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
}));

const Center = stylin(Box)(({ theme }: { theme: any }) => ({
  width: '100%',
  maxWidth: theme.spacing(90),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
}));

const IconBadge = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: theme.spacing(7),
  height: theme.spacing(7),
  borderRadius: '50%',
  backgroundColor: theme.palette.action.selected,
  color: theme.palette.primary.main,
  '& > svg': { fontSize: 32 },
}));

const Heading = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(1),
  maxWidth: theme.spacing(75),
}));

const PickerRow = stylin(Box)(({ theme }: { theme: any }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const PickerSlot = stylin(Box)({
  flex: 1,
  minWidth: 0,
  width: '100%',
});

const OptionRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  width: '100%',
  minWidth: 0,
}));

const OptionMain = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const Position = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.secondary,
}));

const OptionId = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const OptionStatus = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}));

const SwapButton = stylin(IconButton)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  flexShrink: 0,
  '&:hover': {
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
  },
}));

const WarnLine = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.warning.main,
  marginTop: theme.spacing(0.5),
}));

const Spacer = stylin(Box)(({ theme }: { theme: any }) => ({
  height: theme.spacing(2),
}));

const CompareButton = stylin(Button)(({ theme }: { theme: any }) => ({
  minWidth: theme.spacing(24),
  marginTop: theme.spacing(1),
}));
