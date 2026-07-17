import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import stylin from '@massdriver/ui/stylin';
import DisabledAction from '../../../../components/DisabledAction';

type Size = 'small' | 'medium' | 'large';

export const DisabledApprovalCluster = ({
  size = 'small',
}: {
  size?: Size;
}) => (
  <Cluster>
    <DisabledAction
      label="Plan"
      size={size}
      variant="outlined"
      color="primary"
      tooltip="Read-only. Open in Massdriver to plan this deployment."
    />
    <DisabledAction
      label="Reject"
      size={size}
      variant="outlined"
      color="error"
      tooltip="Read-only. Open in Massdriver to reject this deployment."
    />
    <DisabledAction
      label="Approve"
      size={size}
      variant="contained"
      color="primary"
      tooltip="Read-only. Open in Massdriver to approve this deployment."
    />
  </Cluster>
);

export const DisabledRollbackButton = ({ size = 'small' }: { size?: Size }) => (
  <DisabledAction
    label="Rollback"
    size={size}
    variant="outlined"
    tooltip="Read-only. Open in Massdriver to roll back to this deployment."
  />
);

export const LogsButton = ({
  onClick,
  size = 'small',
  variant = 'text',
}: {
  onClick: () => void;
  size?: Size;
  variant?: 'text' | 'outlined' | 'contained';
}) => (
  <Button variant={variant} size={size} onClick={onClick}>
    View logs
  </Button>
);

const Cluster = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));
