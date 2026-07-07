import { alpha } from '@massdriver/ui/theme';
import Box from '@massdriver/ui/Box';
import Tooltip from '@massdriver/ui/Tooltip';
import LockIcon from '@massdriver/ui/icons/LockIcon';
import stylin from '@massdriver/ui/stylin';

// A pinned version is a concrete semver (e.g. "1.2.3"); release-channel names
// (e.g. "latest", "stable") are not. Inlined to avoid a `semver` dependency.
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+].+)?$/;
const isPinnedVersion = (version?: string | null): boolean =>
  Boolean(version && SEMVER_RE.test(version));

/** Version chip with a pinned-version lock warning. Read-only port. */
const VersionBadge = ({
  version,
  showPinnedWarning,
  className,
}: {
  version?: string | null;
  showPinnedWarning?: boolean;
  className?: string;
}) => {
  const pinned = isPinnedVersion(version);
  const showWarning = Boolean(showPinnedWarning) && pinned;
  const displayVersion = pinned ? `v${version}` : version;

  return (
    <Tooltip
      arrow
      enterDelay={600}
      enterNextDelay={600}
      title={
        showWarning
          ? "This instance's version is pinned and won't update automatically. Consider using a release channel to keep it current."
          : ''
      }
    >
      <BadgeRoot pinned={pinned} className={className}>
        {pinned && <PinnedIcon />}
        <VersionText>{displayVersion}</VersionText>
      </BadgeRoot>
    </Tooltip>
  );
};

const BadgeRoot = stylin(
  Box,
  ['pinned'],
)(({ theme, pinned }: { theme: any; pinned: boolean }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.25, 0.75),
  borderRadius: 1,
  lineHeight: 1,
  backgroundColor: pinned
    ? alpha(theme.palette.warning.main, 0.12)
    : theme.palette.background.field,
  color: pinned ? theme.palette.warning.main : theme.palette.text.secondary,
  border: `1px solid ${
    pinned ? alpha(theme.palette.warning.main, 0.3) : theme.palette.divider
  }`,
}));

const PinnedIcon = stylin(LockIcon)({
  fontSize: 12,
});

const VersionText = stylin('span')(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontWeight: 500,
  color: 'inherit',
  lineHeight: 1,
  fontFamily: theme.typography.fontFamilyMono,
}));

export default VersionBadge;
