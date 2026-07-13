import { ReactNode } from 'react';
import Button from '@massdriver/ui/Button';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';

/**
 * A greyed-out (disabled) action control with an explanatory tooltip, for
 * mutating actions the app offers that this read-only mini-app cannot perform.
 * Mirrors the disabled "Propose" button pattern — the affordance stays visible
 * so the UI matches the web app, but it's non-interactive and the tooltip points
 * the user to Massdriver. The span wrapper lets the tooltip fire on a disabled
 * button (MUI swallows events on disabled elements otherwise).
 */
export const DisabledAction = ({
  label,
  tooltip,
  variant = 'outlined',
  size,
  color,
  startIcon,
  children,
}: {
  label?: ReactNode;
  tooltip: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  startIcon?: ReactNode;
  children?: ReactNode;
}) => (
  <Tooltip title={tooltip} placement="top">
    <Wrap>
      <Button
        variant={variant}
        size={size}
        color={color}
        startIcon={startIcon}
        disabled
      >
        {label ?? children}
      </Button>
    </Wrap>
  </Tooltip>
);

export default DisabledAction;

const Wrap = stylin('span')({
  display: 'inline-flex',
});
