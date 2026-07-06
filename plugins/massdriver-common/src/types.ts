/**
 * Lifecycle status of a Massdriver instance (deployed component).
 *
 * @public
 */
export type InstanceStatus =
  | 'INITIALIZED'
  | 'PROVISIONED'
  | 'DECOMMISSIONED'
  | 'FAILED';

/**
 * Status of a Massdriver deployment.
 *
 * @public
 */
export type DeploymentStatus =
  | 'PROPOSED'
  | 'REJECTED'
  | 'APPROVED'
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABORTED';

/**
 * A Massdriver project, as fetched for catalog sync and read-only views.
 *
 * @public
 */
export interface MassdriverProject {
  id: string;
  name: string;
  description?: string | null;
}

/** @public */
export interface MassdriverEnvironment {
  id: string;
  name: string;
  description?: string | null;
  project?: { id: string } | null;
}

/** @public */
export interface MassdriverInstance {
  id: string;
  name: string;
  status: InstanceStatus;
  resolvedVersion?: string | null;
  deployedVersion?: string | null;
  environment?: { id: string } | null;
}

/** @public */
export interface MassdriverDeployment {
  id: string;
  status: DeploymentStatus;
  action?: string | null;
  version?: string | null;
  deployedBy?: string | null;
  instance?: { id: string } | null;
}
