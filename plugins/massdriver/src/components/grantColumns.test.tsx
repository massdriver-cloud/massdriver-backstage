import {
  buildGrantColumns,
  formatGrantCreatedAt,
  mapGrantToRow,
} from './grantColumns';

describe('formatGrantCreatedAt', () => {
  it('formats an ISO timestamp as a short UTC date', () => {
    expect(formatGrantCreatedAt('2026-03-05T12:00:00Z')).toMatch(/Mar 5, 2026/);
  });

  it('falls back to -- for missing or invalid values', () => {
    expect(formatGrantCreatedAt(null)).toBe('--');
    expect(formatGrantCreatedAt(undefined)).toBe('--');
    expect(formatGrantCreatedAt('not a date')).toBe('--');
  });
});

describe('mapGrantToRow', () => {
  it('maps a grant to a display row with a formatted date', () => {
    const row = mapGrantToRow({
      id: 'grant1',
      action: 'repo:pull',
      recipientConditions: '{"md-env":"prod"}',
      createdAt: '2026-03-05T12:00:00Z',
    });
    expect(row).toEqual({
      id: 'grant1',
      action: 'repo:pull',
      recipientConditions: '{"md-env":"prod"}',
      createdAt: expect.stringMatching(/Mar 5, 2026/),
    });
  });
});

describe('buildGrantColumns', () => {
  it('builds action, recipients, created, and a deep-linked remove action', () => {
    const columns = buildGrantColumns({
      manageUrl:
        'https://app.massdriver.cloud/orgs/org1/repos/r/all/permissions',
    });
    expect(columns.map(column => column.field)).toEqual([
      'action',
      'recipientConditions',
      'createdAt',
      '__actions',
    ]);
    const actions = columns[3].typeProps.actions;
    expect(actions).toHaveLength(1);
    expect(actions[0].tooltip).toBe('Remove in Massdriver');
    expect(actions[0].href()).toBe(
      'https://app.massdriver.cloud/orgs/org1/repos/r/all/permissions',
    );
    expect(actions[0].target).toBe('_blank');
  });
});
