import { forwardRef } from 'react';
import { Handle } from '@xyflow/react';
import Box from '@massdriver/ui/Box';
import BluetoothIcon from '@massdriver/ui/icons/BluetoothIcon';
import stylin from '@massdriver/ui/stylin';

export const HANDLE_TYPE = {
  DEFAULT: 'default',
  REQUIRED: 'required',
  ERROR: 'error',
  REMOTE_REFERENCE: 'remote-reference',
} as const;

const DefaultHandle = forwardRef<any, any>(
  ({ hasConnection: _hasConnection, ...props }, ref) => (
    <DefaultStyledHandle {...props} ref={ref} />
  ),
);

const DefaultStyledHandle = stylin(Handle, [
  'xPos',
  'yPos',
  'isValidConnectionTarget',
])(
  ({
    theme,
    xPos,
    yPos,
    position,
    isValidConnectionTarget,
  }: {
    theme: any;
    xPos?: number;
    yPos?: number;
    position: string;
    isValidConnectionTarget?: boolean;
  }) => ({
    '&.react-flow__handle': {
      width: '16px',
      height: '16px',
      top: `${yPos || 0}px`,
      [position]: `${xPos || 0}px`,
      borderRadius: '50%',
      zIndex: 10,
      background: isValidConnectionTarget
        ? theme.palette.success.main
        : theme.palette.background.paper,
      border: `1px solid ${
        isValidConnectionTarget
          ? theme.palette.success.main
          : theme.palette.grey[600]
      }`,
      '&.connectable': { cursor: 'pointer' },
      '&:hover': {
        backgroundColor: isValidConnectionTarget
          ? theme.palette.success.main
          : theme.palette.grey[600],
      },
    },
  }),
);

const ErrorHandle = forwardRef<any, any>(
  ({ hasConnection: _hasConnection, ...props }, ref) => (
    <ErrorStyledHandle {...props} ref={ref} isConnectable={false} />
  ),
);

const ErrorStyledHandle = stylin(Handle, ['xPos', 'yPos'])(
  ({
    theme,
    xPos,
    yPos,
    position,
  }: {
    theme: any;
    xPos?: number;
    yPos?: number;
    position: string;
  }) => ({
    '&.react-flow__handle': {
      width: '16px',
      height: '16px',
      top: `${yPos || 0}px`,
      [position]: `${xPos || 0}px`,
      borderRadius: '50%',
      zIndex: 10,
      background: theme.palette.error.main,
      border: `1px solid ${theme.palette.error.main}`,
      cursor: 'not-allowed',
    },
  }),
);

const REQUIRED_DOT_CLASS = 'required-handle-dot';

const RequiredHandle = forwardRef<any, any>(
  ({ hasConnection, ...props }, ref) => (
    <RequiredStyledHandle hasConnection={hasConnection} {...props} ref={ref}>
      <Dot className={REQUIRED_DOT_CLASS} hasConnection={hasConnection} />
    </RequiredStyledHandle>
  ),
);

const RequiredStyledHandle = stylin(Handle, [
  'hasConnection',
  'xPos',
  'yPos',
  'isValidConnectionTarget',
])(
  ({
    theme,
    hasConnection,
    xPos,
    yPos,
    position,
    isValidConnectionTarget,
  }: {
    theme: any;
    hasConnection?: boolean;
    xPos?: number;
    yPos?: number;
    position: string;
    isValidConnectionTarget?: boolean;
  }) => ({
    '&.react-flow__handle': {
      width: '16px',
      height: '16px',
      top: `${yPos || 0}px`,
      [position]: `${xPos || 0}px`,
      borderRadius: '50%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isValidConnectionTarget
        ? theme.palette.success.main
        : theme.palette.background.paper,
      border: `1px solid ${
        isValidConnectionTarget
          ? theme.palette.success.main
          : hasConnection
          ? theme.palette.grey[600]
          : theme.palette.error.main
      }`,
      '&.connectable': { cursor: 'pointer' },
      '&:hover': {
        backgroundColor: isValidConnectionTarget
          ? theme.palette.success.main
          : theme.palette.grey[600],
        borderColor: isValidConnectionTarget
          ? theme.palette.success.main
          : theme.palette.grey[600],
        [`.${REQUIRED_DOT_CLASS}`]: {
          visibility: 'hidden',
        },
      },
    },
  }),
);

const Dot = stylin(Box, ['hasConnection'])(
  ({ theme, hasConnection }: { theme: any; hasConnection?: boolean }) => ({
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    pointerEvents: 'none',
    backgroundColor: hasConnection
      ? theme.palette.grey[600]
      : theme.palette.error.main,
  }),
);

const REMOTE_ICON_CLASS = 'remote-reference-handle-icon';

const RemoteReferenceHandle = forwardRef<any, any>(
  ({ hasConnection, ...props }, ref) => (
    <RemoteStyledHandle hasConnection={hasConnection} {...props} ref={ref}>
      <RemoteIcon className={REMOTE_ICON_CLASS} />
    </RemoteStyledHandle>
  ),
);

const RemoteStyledHandle = stylin(Handle, [
  'hasConnection',
  'xPos',
  'yPos',
  'isValidConnectionTarget',
])(
  ({
    theme,
    xPos,
    yPos,
    position,
    isValidConnectionTarget,
  }: {
    theme: any;
    xPos?: number;
    yPos?: number;
    position: string;
    isValidConnectionTarget?: boolean;
  }) => ({
    '&.react-flow__handle': {
      width: '16px',
      height: '16px',
      top: `${yPos || 0}px`,
      [position]: `${xPos || 0}px`,
      borderRadius: '50%',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isValidConnectionTarget
        ? theme.palette.success.main
        : theme.palette.background.paper,
      border: `1px solid ${theme.palette.success.main}`,
      '&.connectable': { cursor: 'pointer' },
      '&:hover': {
        backgroundColor: theme.palette.success.main,
        borderColor: theme.palette.success.main,
        [`.${REMOTE_ICON_CLASS}`]: { visibility: 'hidden' },
      },
    },
  }),
);

const RemoteIcon = stylin(BluetoothIcon)(({ theme }: { theme: any }) => ({
  width: '8px',
  height: '8px',
  pointerEvents: 'none',
  color: theme.palette.success.main,
}));

export const HANDLE_TYPES: Record<string, any> = {
  [HANDLE_TYPE.DEFAULT]: DefaultHandle,
  [HANDLE_TYPE.REQUIRED]: RequiredHandle,
  [HANDLE_TYPE.ERROR]: ErrorHandle,
  [HANDLE_TYPE.REMOTE_REFERENCE]: RemoteReferenceHandle,
};
