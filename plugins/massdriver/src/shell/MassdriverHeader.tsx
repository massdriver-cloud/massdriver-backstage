import Box from '@massdriver/ui/Box';
import stylin from '@massdriver/ui/stylin';
import darkBgLogo from '../assets/massdriver-logo-dark.svg';
import lightBgLogo from '../assets/massdriver-logo-light.svg';
import { useThemeMode } from '../theme/useThemeMode';

export const MassdriverHeader = () => {
  const mode = useThemeMode();

  return (
    <HeaderRoot>
      <Logo src={mode === 'dark' ? darkBgLogo : lightBgLogo} alt="Massdriver" />
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
