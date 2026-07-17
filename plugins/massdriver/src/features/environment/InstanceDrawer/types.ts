export interface Money {
  amount?: number | null;
  currency?: string | null;
}

export interface Cost {
  lastDay?: Money | null;
  lastMonth?: Money | null;
  dailyAverage?: Money | null;
  monthlyAverage?: Money | null;
}

export interface AlarmCurrentState {
  id?: string;
  status?: string | null;
  message?: string | null;
  occurredAt?: string | null;
}

export interface AlarmDimension {
  name?: string | null;
  value?: string | null;
}

export interface AlarmMetric {
  namespace?: string | null;
  name?: string | null;
  statistic?: string | null;
  dimensions?: (AlarmDimension | null)[] | null;
}

export interface Alarm {
  id: string;
  displayName?: string | null;
  cloudResourceId?: string | null;
  comparisonOperator?: string | null;
  threshold?: number | null;
  period?: number | null;
  metric?: AlarmMetric | null;
  currentState?: AlarmCurrentState | null;
}

export interface Bundle {
  id: string;
  name?: string | null;
  version?: string | null;
  description?: string | null;
}

export interface SecretField {
  name: string;
  required?: boolean | null;
  title?: string | null;
  description?: string | null;
  sha256?: string | null;
}

export interface PanelInstance {
  id: string;
  name?: string | null;
  status?: string | null;
  version?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  environment?: { id: string; name?: string | null } | null;
  component?: { id: string; name?: string | null } | null;
  cost?: Cost | null;
  secretFields?: (SecretField | null)[] | null;
  alarms?: { items?: (Alarm | null)[] | null } | null;
}

export interface InstanceProperty {
  name: string;
  path?: string | null;
  value?: unknown;
}

export interface ResourceType {
  id: string;
  name?: string | null;
  icon?: string | null;
  connectionOrientation?: string | null;
}

export interface ProducedResource {
  id: string;
  name?: string | null;
  origin?: string | null;
  formats?: string[] | null;
  payload?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
  instance?: { id: string; name?: string | null } | null;
}

export interface InstanceResourceEntry {
  field: string;
  required?: boolean | null;
  resourceType?: ResourceType | null;
  resource?: ProducedResource | null;
}

export interface BundleResourceEntry {
  name: string;
  required?: boolean | null;
  resourceType?: ResourceType | null;
}

export interface Deployment {
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

export interface HistoryInstance {
  id: string;
  createdAt?: string | null;
  environment?: { id: string; name?: string | null } | null;
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
