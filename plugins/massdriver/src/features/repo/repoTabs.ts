export const TAB_IDS = {
  OVERVIEW: 'overview',
  INSTANCES: 'instances',
  DEPLOYMENTS: 'deployments',
  FILES: 'files',
  VERSIONS: 'versions',
  PERMISSIONS: 'permissions',
} as const;

export const DEFAULT_REPO_TAB = TAB_IDS.OVERVIEW;

export const REPO_TABS = [
  { id: TAB_IDS.OVERVIEW, label: 'Overview' },
  { id: TAB_IDS.INSTANCES, label: 'Instances' },
  { id: TAB_IDS.DEPLOYMENTS, label: 'Deployments' },
  { id: TAB_IDS.FILES, label: 'Files' },
  { id: TAB_IDS.VERSIONS, label: 'Versions' },
  { id: TAB_IDS.PERMISSIONS, label: 'Permissions' },
];

const TAB_VALUES = REPO_TABS.map(tab => tab.id) as string[];

export const resolveActiveRepoTab = (tab?: string | null): string =>
  tab && TAB_VALUES.includes(tab) ? tab : DEFAULT_REPO_TAB;
