import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import stylin from '@massdriver/ui/stylin';
import DisabledAction from '../../../../components/DisabledAction';

// Read-only mirrors of the web app's deployment mutations. Every mutating
// affordance is rendered as a greyed `DisabledAction` (tooltip points the user
// to Massdriver); viewing logs is a genuine link-out (new tab), not disabled.

type Size = 'small' | 'medium' | 'large';

/** Disabled Plan / Reject / Approve cluster shown on PROPOSED deployments. */
export const DisabledApprovalCluster = ({ size = 'small' }: { size?: Size }) => (
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

/** Link-out to the instance's History tab in Massdriver (opens in a new tab). */
export const LogsLinkButton = ({
  href,
  size = 'small',
  variant = 'text',
}: {
  href: string;
  size?: Size;
  variant?: 'text' | 'outlined' | 'contained';
}) => (
  <Button
    variant={variant}
    size={size}
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    View logs
  </Button>
);

const Cluster = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
}));
