import {
  StatusAborted,
  StatusError,
  StatusOK,
  StatusPending,
} from '@backstage/core-components';
import { InstanceStatus } from '@massdriver-cloud/backstage-plugin-massdriver-common';

/** Render a Massdriver instance status as a Backstage status indicator. */
export const InstanceStatusIndicator = ({
  status,
}: {
  status: InstanceStatus;
}) => {
  switch (status) {
    case 'PROVISIONED':
      return <StatusOK>Provisioned</StatusOK>;
    case 'FAILED':
      return <StatusError>Failed</StatusError>;
    case 'DECOMMISSIONED':
      return <StatusAborted>Decommissioned</StatusAborted>;
    case 'INITIALIZED':
    default:
      return <StatusPending>Initialized</StatusPending>;
  }
};
