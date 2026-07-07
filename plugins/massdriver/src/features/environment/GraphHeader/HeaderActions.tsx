import { useState } from 'react';
import { environmentUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import Divider from '@massdriver/ui/Divider';
import stylin from '@massdriver/ui/stylin';
import CompareArrowsIcon from '@massdriver/ui/icons/CompareArrowsIcon';
import ForkRightIcon from '@massdriver/ui/icons/ForkRightIcon';
import SettingsIcon from '@massdriver/ui/icons/SettingsIcon';
import CompareEnvironmentsDialog from '../CompareEnvironmentsDialog';
import type { HeaderEnvironment } from './queries';

/**
 * Right-hand header actions. Fork + Settings deep-link out to the web app (this
 * plugin is read-only); Compare opens the local read-only comparison dialog.
 */
export const HeaderActions = ({
  appUrl,
  organizationId,
  environment,
  environments,
  projectName,
}: {
  appUrl: string;
  organizationId: string;
  environment: HeaderEnvironment | null;
  environments: HeaderEnvironment[];
  projectName?: string;
}) => {
  const [compareOpen, setCompareOpen] = useState(false);

  const canCompare = environments.length >= 2;
  const envBaseUrl = environment
    ? environmentUrl(appUrl, organizationId, environment.id)
    : null;
  const forkUrl = envBaseUrl ? `${envBaseUrl}?forkEnvironment=true` : undefined;
  const settingsUrl = envBaseUrl ? `${envBaseUrl}/settings` : undefined;

  return (
    <Root>
      <Tooltip title="Fork this environment" arrow enterDelay={400}>
        <span>
          <Action
            variant="text"
            href={forkUrl}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!environment}
          >
            <ForkRightIcon />
            <Label>Fork</Label>
          </Action>
        </span>
      </Tooltip>

      <Tooltip
        title={
          canCompare ? 'Compare' : 'Need at least two environments to compare'
        }
        arrow
        enterDelay={400}
      >
        <span>
          <Action
            variant="text"
            disabled={!canCompare}
            onClick={() => setCompareOpen(true)}
          >
            <CompareArrowsIcon />
            <Label>Compare</Label>
          </Action>
        </span>
      </Tooltip>

      <StyledDivider orientation="vertical" flexItem />

      <Tooltip title="Environment settings" arrow enterDelay={400}>
        <span>
          <GearButton
            size="small"
            href={settingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!environment}
            aria-label="Environment settings"
          >
            <SettingsIcon />
          </GearButton>
        </span>
      </Tooltip>

      <CompareEnvironmentsDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        projectName={projectName}
        environments={environments}
        defaultSourceEnvironment={environment}
      />
    </Root>
  );
};

export default HeaderActions;

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.25),
}));

const Action = stylin(Button)(({ theme }: { theme: any }) => ({
  alignItems: 'center',
  minWidth: theme.spacing(2.5),
  gap: theme.spacing(0.5),
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  color: theme.palette.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 500,
  fontFamily: theme.typography.fontFamily,
  whiteSpace: 'nowrap',
  transition: 'color 120ms ease, background-color 120ms ease',
  '& > svg': { fontSize: 18 },
  '&:hover': {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.action.hover,
  },
}));

const Label = stylin('span')(({ theme }: { theme: any }) => ({
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const GearButton = stylin(IconButton)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  '& > svg': { fontSize: 18 },
  '&:hover': {
    color: theme.palette.text.primary,
  },
}));

const StyledDivider = stylin(Divider)(({ theme }: { theme: any }) => ({
  marginLeft: theme.spacing(0.5),
  marginRight: theme.spacing(0.5),
}));
