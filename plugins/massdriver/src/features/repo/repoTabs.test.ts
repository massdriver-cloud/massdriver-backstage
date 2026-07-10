import { DEFAULT_REPO_TAB, REPO_TABS, resolveActiveRepoTab } from './repoTabs';

describe('repoTabs', () => {
  it('lists the visible tabs in order (Alarms hidden)', () => {
    expect(REPO_TABS.map(tab => tab.id)).toEqual([
      'overview',
      'instances',
      'deployments',
      'files',
      'versions',
      'permissions',
    ]);
  });

  it('resolves a valid tab to itself', () => {
    expect(resolveActiveRepoTab('deployments')).toBe('deployments');
  });

  it('falls back to Overview for unknown or missing tabs', () => {
    expect(resolveActiveRepoTab('alarms')).toBe(DEFAULT_REPO_TAB);
    expect(resolveActiveRepoTab(undefined)).toBe('overview');
  });
});
