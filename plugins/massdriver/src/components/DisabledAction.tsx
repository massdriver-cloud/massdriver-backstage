import { ReactNode } from 'react';
import Button from '@massdriver/ui/Button';
import Tooltip from '@massdriver/ui/Tooltip';
import stylin from '@massdriver/ui/stylin';

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
