import { useState, type ReactNode } from 'react';
import Box from '@massdriver/ui/Box';
import Menu from '@massdriver/ui/Menu';
import ArrowDropDownIcon from '@massdriver/ui/icons/ArrowDropDownIcon';
import stylin from '@massdriver/ui/stylin';

export const Switcher = ({
  trigger,
  children,
  ariaLabel,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  ariaLabel?: string;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  return (
    <>
      <Trigger
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={(event: any) => setAnchorEl(event.currentTarget)}
        onKeyDown={(event: any) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setAnchorEl(event.currentTarget);
          }
        }}
      >
        {trigger}
        <DropdownIcon />
      </Trigger>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        MenuListProps={{ sx: { py: 0.5 } }}
        slotProps={{ paper: { sx: { maxWidth: 320, minWidth: 200 } } }}
      >
        {children(close)}
      </Menu>
    </>
  );
};

export default Switcher;

const Trigger = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  cursor: 'pointer',
  padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
  borderRadius: theme.custom.general.borderRadius,
  transition: 'background-color 120ms ease',
  minWidth: 0,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

const DropdownIcon = stylin(ArrowDropDownIcon)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontSize: 16,
  flexShrink: 0,
}));
