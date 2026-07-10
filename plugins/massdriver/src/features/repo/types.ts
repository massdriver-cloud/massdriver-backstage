import type { InstanceStatus } from '@massdriver-cloud/backstage-plugin-massdriver-common';

/** OCI repo header shape (MassdriverOciRepoHeader). */
export interface RepoHeader {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sourceUrl?: string | null;
  readme?: string | null;
  changelog?: string | null;
  reference?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  releaseChannels?: {
    items?: Array<{ name: string; tag: string } | null> | null;
  } | null;
  tags?: {
    items?: Array<{ tag: string; createdAt?: string } | null> | null;
  } | null;
}

/** A bundle as fetched for the Overview tab (MassdriverBundle). */
export interface RepoBundle {
  id: string;
  name?: string | null;
  version?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
  readme?: string | null;
  changelog?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** An instance row on the repo Instances tab (MassdriverRepoInstances). */
export interface RepoInstance {
  id: string;
  status: InstanceStatus;
  version?: string | null;
  resolvedVersion?: string | null;
  deployedVersion?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cost?: { lastMonth?: { amount?: number | null; currency?: string } | null } | null;
  environment?: { id: string; name?: string | null } | null;
  component?: { id: string; project?: { id: string; name?: string | null } | null } | null;
}

/** A deployment row on the repo Deployments tab (MassdriverRepoDeployments). */
export interface RepoDeployment {
  id: string;
  status?: string | null;
  action?: string | null;
  version?: string | null;
  message?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastTransitionedAt?: string | null;
  elapsedTime?: number | null;
  deployedBy?: string | null;
  instance?: {
    id: string;
    environment?: { id: string; name?: string | null } | null;
    component?: {
      id: string;
      project?: { id: string; name?: string | null } | null;
    } | null;
  } | null;
}

/** Full deployment snapshot for the details dialog (MassdriverDeployment). */
export interface DeploymentDetail {
  id: string;
  status?: string | null;
  action?: string | null;
  version?: string | null;
  message?: string | null;
  params?: unknown;
  effectiveAttributes?: unknown;
  createdAt?: string | null;
  lastTransitionedAt?: string | null;
  elapsedTime?: number | null;
  deployedBy?: string | null;
  instance?: {
    id: string;
    component?: { id: string; name?: string | null } | null;
  } | null;
}

/** A single log line streamed for a deployment. */
export interface DeploymentLogLine {
  timestamp?: string | null;
  message?: string | null;
}

/** Deployment shape for the logs drawer (MassdriverDeploymentLogs). */
export interface DeploymentLogs {
  id: string;
  status?: string | null;
  action?: string | null;
  version?: string | null;
  instance?: {
    id: string;
    component?: { id: string; name?: string | null } | null;
  } | null;
  logs?: (DeploymentLogLine | null)[] | null;
}

/** A file entry within a repo tag (MassdriverRepoTagFiles). */
export interface RepoFile {
  name: string;
  mediaType?: string | null;
  size?: number | null;
  digest?: string | null;
  url?: string | null;
}
