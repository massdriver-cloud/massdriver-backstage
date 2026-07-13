import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import stylin from '@massdriver/ui/stylin';
import DisabledAction from '../../../../components/DisabledAction';

// Read-only mirrors of the web app's deployment mutations. Every mutating
// affordance is rendered as a greyed `DisabledAction` (tooltip points the user
// to Massdriver); viewing logs is a genuine in-app action (opens the read-only
// logs overlay), not disabled and not a link-out.

type Size = 'small' | 'medium' | 'large';

/** Disabled Plan / Reject / Approve cluster shown on PROPOSED deployments. */
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

/** Disabled Rollback shown on completed PROVISION deployments. */
export const DisabledRollbackButton = ({ size = 'small' }: { size?: Size }) => (
  <DisabledAction
    label="Rollback"
    size={size}
    variant="outlined"
    tooltip="Read-only. Open in Massdriver to roll back to this deployment."
  />
);

/** Opens the read-only deployment logs overlay in-app. */
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
