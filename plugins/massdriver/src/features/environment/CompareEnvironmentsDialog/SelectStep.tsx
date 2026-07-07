import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import Button from '@massdriver/ui/Button';
import Select, { MenuItem } from '@massdriver/ui/Select';
import stylin from '@massdriver/ui/stylin';
import CompareArrowsIcon from '@massdriver/ui/icons/CompareArrowsIcon';
import SwapHorizIcon from '@massdriver/ui/icons/SwapHorizIcon';
import type { HeaderEnvironment } from '../GraphHeader/queries';

/**
 * Step 1 of the compare flow: pick two environments. Simplified from the web
 * app's infinite-scroll autocompletes to plain Selects — the dialog already has
 * the project's full environment list in memory.
 */
export const SelectStep = ({
  source,
  target,
  environments,
  projectName,
  onSourceChange,
  onTargetChange,
  onSwap,
  onCompare,
}: {
  source: HeaderEnvironment | null;
  target: HeaderEnvironment | null;
  environments: HeaderEnvironment[];
  projectName?: string;
  onSourceChange: (environment: HeaderEnvironment | null) => void;
  onTargetChange: (environment: HeaderEnvironment | null) => void;
  onSwap: () => void;
  onCompare: () => void;
}) => {
  const sameSelected = Boolean(source && target && source.id === target.id);
  const canCompare = Boolean(source && target && !sameSelected);
  const canSwap = Boolean(source) && Boolean(target);

  const findEnv = (id: string) =>
    environments.find(environment => environment.id === id) ?? null;

  return (
    <Root>
      <Center>
        <IconBadge>
          <CompareArrowsIcon />
        </IconBadge>

        <Heading>
          <Typography variant="h4" component="h2">
            Compare Environments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pick two environments
            {projectName ? (
              <>
                {' in '}
                <strong>{projectName}</strong>
              </>
            ) : null}{' '}
            to see how their components and parameters differ.
          </Typography>
        </Heading>

        <PickerRow>
          <PickerSlot>
            <Select
              fullWidth
              displayEmpty
              value={source?.id ?? ''}
              onChange={(event: any) =>
                onSourceChange(findEnv(event.target.value))
              }
              renderValue={(value: string) =>
                value ? findEnv(value)?.name : 'Pick an environment…'
              }
            >
              {environments.map(environment => (
                <MenuItem
                  key={environment.id}
                  value={environment.id}
                  disabled={target?.id === environment.id}
                >
                  {environment.name}
                </MenuItem>
              ))}
            </Select>
          </PickerSlot>

          <Tooltip title={canSwap ? 'Swap environments' : 'Pick both first'} arrow>
            <span>
              <SwapButton
                size="medium"
                onClick={onSwap}
                disabled={!canSwap}
                aria-label="Swap environments"
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
              onChange={(event: any) =>
                onTargetChange(findEnv(event.target.value))
              }
              renderValue={(value: string) =>
                value ? findEnv(value)?.name : 'Pick an environment…'
              }
            >
              {environments.map(environment => (
                <MenuItem
                  key={environment.id}
                  value={environment.id}
                  disabled={source?.id === environment.id}
                >
                  {environment.name}
                </MenuItem>
              ))}
            </Select>
          </PickerSlot>
        </PickerRow>

        {sameSelected ? (
          <WarnLine variant="caption">
            Pick two different environments to compare.
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
