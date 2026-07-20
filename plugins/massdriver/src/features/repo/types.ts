import type { InstanceStatus } from '@massdriver/backstage-plugin-common';

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

export interface RepoInstance {
  id: string;
  status: InstanceStatus;
  version?: string | null;
  resolvedVersion?: string | null;
  deployedVersion?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cost?: {
    lastMonth?: { amount?: number | null; currency?: string } | null;
  } | null;
  environment?: { id: string; name?: string | null } | null;
  component?: {
    id: string;
    project?: { id: string; name?: string | null } | null;
  } | null;
}

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

export interface DeploymentLogLine {
  timestamp?: string | null;
  message?: string | null;
}

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

export interface RepoFile {
  name: string;
  mediaType?: string | null;
  size?: number | null;
  digest?: string | null;
  url?: string | null;
}
