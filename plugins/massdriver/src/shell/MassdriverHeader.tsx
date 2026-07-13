import Box from '@massdriver/ui/Box';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';
import DarkModeIcon from '@massdriver/ui/icons/DarkModeIcon';
import LightModeIcon from '@massdriver/ui/icons/LightModeIcon';
import darkBgLogo from '../assets/massdriver-logo-dark.svg';
import lightBgLogo from '../assets/massdriver-logo-light.svg';
import { useThemeMode } from '../theme/ThemeModeContext';

/**
 * Minimal header for the embedded Massdriver views: just the logo and a
 * light/dark theme toggle. No navigation, no account menu — Backstage provides
 * the surrounding chrome.
 */
export const MassdriverHeader = () => {
  const { mode, toggleMode } = useThemeMode();

  return (
    <HeaderRoot>
      <Logo src={mode === 'dark' ? darkBgLogo : lightBgLogo} alt="Massdriver" />
      <Tooltip title="Toggle theme" arrow>
        <IconButton onClick={toggleMode} aria-label="toggle theme" size="small">
          {mode === 'dark' ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </HeaderRoot>
  );
};

const HeaderRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 56,
  flexShrink: 0,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const Logo = stylin('img')({
  height: 32,
  width: 'auto',
  display: 'block',
});
