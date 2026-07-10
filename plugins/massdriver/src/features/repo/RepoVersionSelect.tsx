import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import Divider from '@massdriver/ui/Divider';
import Menu, { MenuItem } from '@massdriver/ui/Menu';
import Switch from '@massdriver/ui/Switch';
import Typography from '@massdriver/ui/Typography';
import ExpandMoreIcon from '@massdriver/ui/icons/ExpandMoreIcon';
import stylin from '@massdriver/ui/stylin';
import { ALL_VERSIONS } from './resolveVersion';

// Ported from apps/web/features/repos/components/RepoVersionSelect/ (container +
// view merged into one component, matching this plugin's single-file style).
// Selecting a version calls `onChange`; the page navigates.

interface Channel {
  name: string;
  tag: string;
}
interface Tag {
  tag: string;
  createdAt?: string;
}
interface Repo {
  releaseChannels?: { items?: Array<Channel | null> | null } | null;
  tags?: { items?: Array<Tag | null> | null } | null;
}

const isDevTag = (tag: string): boolean => /-dev\./.test(tag);
const isDevChannel = (channel: Channel): boolean =>
  Boolean(channel?.name?.includes('+dev'));

const buildTriggerLabel = (
  currentVersion: string | null | undefined,
  releaseChannels: Channel[],
): string => {
  if (!currentVersion) return '—';
  if (currentVersion === ALL_VERSIONS) return 'All versions';
  const matchingChannel = releaseChannels.find(
    channel => channel.tag === currentVersion,
  );
  return matchingChannel
    ? `${matchingChannel.name} (v${currentVersion})`
    : `v${currentVersion}`;
};

export const RepoVersionSelect = ({
  repo,
  currentVersion,
  onChange,
  disabled = false,
}: {
  repo?: Repo | null;
  currentVersion?: string | null;
  onChange?: (version: string) => void;
  disabled?: boolean;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showDevChannels, setShowDevChannels] = useState(false);
  const [showDevVersions, setShowDevVersions] = useState(false);

  const allChannels = useMemo(
    () =>
      (repo?.releaseChannels?.items ?? []).filter(Boolean) as Channel[],
    [repo],
  );
  const releaseChannels = useMemo(
    () =>
      showDevChannels
        ? allChannels
        : allChannels.filter(channel => !isDevChannel(channel)),
    [allChannels, showDevChannels],
  );
  const allTags = useMemo(
    () => (repo?.tags?.items ?? []).filter(Boolean) as Tag[],
    [repo],
  );
  const tags = useMemo(
    () =>
      showDevVersions ? allTags : allTags.filter(tag => !isDevTag(tag.tag)),
    [allTags, showDevVersions],
  );

  const triggerLabel = buildTriggerLabel(currentVersion, allChannels);
  const open = Boolean(anchorEl);

  const onSelect = (nextVersion: string) => {
    setAnchorEl(null);
    if (nextVersion !== currentVersion) onChange?.(nextVersion);
  };

  return (
    <>
      <TriggerButton
        variant="outlined"
        color="inherit"
        onClick={(event: { currentTarget: HTMLElement }) =>
          setAnchorEl(event.currentTarget)
        }
        endIcon={<ExpandMoreIcon />}
        disabled={disabled || !repo}
        aria-haspopup="menu"
        aria-expanded={open || undefined}
      >
        {triggerLabel}
      </TriggerButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ dense: true }}
      >
        <AllVersionsItem
          selected={currentVersion === ALL_VERSIONS}
          onClick={() => onSelect(ALL_VERSIONS)}
        >
          All versions
        </AllVersionsItem>
        <Divider />

        <SectionHeader variant="caption" color="text.secondary">
          Release Channels
        </SectionHeader>
        <ToggleRow>
          <Typography variant="body2" color="text.secondary">
            Show development channels
          </Typography>
          <Switch
            size="small"
            checked={showDevChannels}
            onChange={(event: { target: { checked: boolean } }) =>
              setShowDevChannels(event.target.checked)
            }
            inputProps={{ 'aria-label': 'Show development channels' }}
          />
        </ToggleRow>
        {releaseChannels.length > 0 ? (
          releaseChannels.map(channel => (
            <IndentedItem
              key={channel.name}
              selected={currentVersion === channel.tag}
              onClick={() => onSelect(channel.tag)}
            >
              {channel.name} (v{channel.tag})
            </IndentedItem>
          ))
        ) : (
          <EmptyTag variant="body2" color="text.secondary">
            No release channels to show
          </EmptyTag>
        )}
        <Divider />

        <SectionHeader variant="caption" color="text.secondary">
          Versions
        </SectionHeader>
        <ToggleRow>
          <Typography variant="body2" color="text.secondary">
            Show development versions
          </Typography>
          <Switch
            size="small"
            checked={showDevVersions}
            onChange={(event: { target: { checked: boolean } }) =>
              setShowDevVersions(event.target.checked)
            }
            inputProps={{ 'aria-label': 'Show development versions' }}
          />
        </ToggleRow>
        {tags.length > 0 ? (
          tags.map(tag => (
            <IndentedItem
              key={tag.tag}
              selected={currentVersion === tag.tag}
              onClick={() => onSelect(tag.tag)}
            >
              v{tag.tag}
            </IndentedItem>
          ))
        ) : (
          <EmptyTag variant="body2" color="text.secondary">
            No versions to show
          </EmptyTag>
        )}
      </Menu>
    </>
  );
};

export default RepoVersionSelect;

const TriggerButton = stylin(Button)(({ theme }: { theme: any }) => ({
  textTransform: 'none',
  borderColor: theme.palette.divider,
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightMedium,
  minWidth: theme.spacing(20),
}));

const AllVersionsItem = stylin(MenuItem)({
  fontWeight: 500,
});

const IndentedItem = stylin(MenuItem)(({ theme }: { theme: any }) => ({
  paddingLeft: theme.spacing(3),
}));

const SectionHeader = stylin(Typography)(({ theme }: { theme: any }) => ({
  display: 'block',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontWeight: theme.typography.fontWeightBold,
}));

const ToggleRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(0.5)} ${theme.spacing(2)} ${theme.spacing(
    0.5,
  )} ${theme.spacing(3)}`,
}));

const EmptyTag = stylin(Typography)(({ theme }: { theme: any }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
}));
