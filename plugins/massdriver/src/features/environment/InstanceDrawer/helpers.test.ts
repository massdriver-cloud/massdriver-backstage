import {
  parseMap,
  formatAttributeValue,
  getReleaseChannel,
  getFiringAlerts,
  formatPropertyValue,
  filterAndPaginateProperties,
  describeThreshold,
  isFiring,
  getStatusLabel,
  getSeverity,
  formatMetricLine,
  formatAlarmDimensions,
  bucketAlarms,
  buildResourceRows,
  formatGrantConditions,
  formatPayload,
  buildDependencyRows,
  groupDependenciesBySection,
  formatElapsed,
  truncateDeploymentId,
  parsePlanMessage,
  parseRollbackMessage,
  isRollback,
  stripMessageContext,
  formatDeploymentStatus,
  isDeploymentActive,
  deploymentHasLogs,
  STATUSES_WITHOUT_LOGS,
  composeLogsText,
  formatRelativeTime,
  formatAbsoluteDateTime,
} from './helpers';
import type { Alarm } from './types';

const alarm = (overrides: Partial<Alarm> = {}): Alarm => ({
  id: 'alarm-1',
  ...overrides,
});

describe('parseMap', () => {
  it('returns null for null and undefined', () => {
    expect(parseMap(null)).toBeNull();
    expect(parseMap(undefined)).toBeNull();
  });

  it('returns an object value as-is', () => {
    const value = { a: 1 };
    expect(parseMap(value)).toBe(value);
  });

  it('parses a JSON string into an object', () => {
    expect(parseMap('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for an unparseable string', () => {
    expect(parseMap('not json')).toBeNull();
  });
});

describe('formatAttributeValue', () => {
  it('renders the wildcard as "any"', () => {
    expect(formatAttributeValue('*')).toBe('any');
  });

  it('renders an empty array as "any"', () => {
    expect(formatAttributeValue([])).toBe('any');
  });

  it('joins array members with commas', () => {
    expect(formatAttributeValue(['a', 'b'])).toBe('a, b');
  });

  it('stringifies scalars', () => {
    expect(formatAttributeValue(42)).toBe('42');
    expect(formatAttributeValue('plain')).toBe('plain');
  });
});

describe('getReleaseChannel', () => {
  it('returns null when there is no version', () => {
    expect(getReleaseChannel(null, '1.0')).toBeNull();
  });

  it('returns null when version matches the resolved version', () => {
    expect(getReleaseChannel('1.0', '1.0')).toBeNull();
  });

  it('returns the channel when version differs from resolved', () => {
    expect(getReleaseChannel('stable', '1.0')).toEqual({ channel: 'stable' });
  });
});

describe('getFiringAlerts', () => {
  it('returns [] for null/undefined input', () => {
    expect(getFiringAlerts(null)).toEqual([]);
    expect(getFiringAlerts(undefined)).toEqual([]);
  });

  it('keeps only alarms whose current state is ALARM', () => {
    const firing = alarm({ id: 'firing', currentState: { status: 'ALARM' } });
    const okay = alarm({ id: 'ok', currentState: { status: 'OK' } });
    expect(getFiringAlerts([firing, okay, null])).toEqual([firing]);
  });
});

describe('formatPropertyValue', () => {
  it('renders null and undefined as an em dash', () => {
    expect(formatPropertyValue(null)).toBe('—');
    expect(formatPropertyValue(undefined)).toBe('—');
  });

  it('pretty-prints objects', () => {
    expect(formatPropertyValue({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it('stringifies scalars', () => {
    expect(formatPropertyValue(7)).toBe('7');
    expect(formatPropertyValue(true)).toBe('true');
  });
});

describe('filterAndPaginateProperties', () => {
  const properties = Array.from({ length: 12 }, (_, index) => ({
    name: `prop${index}`,
    path: `.path.${index}`,
    value: index,
  }));

  it('returns an empty page with defaults for no properties', () => {
    expect(filterAndPaginateProperties()).toEqual({
      items: [],
      totalPages: 1,
      page: 1,
    });
  });

  it('paginates in pages of five', () => {
    const result = filterAndPaginateProperties(properties, { page: 1 });
    expect(result.items).toHaveLength(5);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
    expect(result.items[0].name).toBe('prop0');
  });

  it('returns the requested page slice', () => {
    const result = filterAndPaginateProperties(properties, { page: 2 });
    expect(result.items.map(item => item.name)).toEqual([
      'prop5',
      'prop6',
      'prop7',
      'prop8',
      'prop9',
    ]);
  });

  it('clamps a page above the range to the last page', () => {
    const result = filterAndPaginateProperties(properties, { page: 99 });
    expect(result.page).toBe(3);
    expect(result.items).toHaveLength(2);
  });

  it('clamps a page below one to the first page', () => {
    const result = filterAndPaginateProperties(properties, { page: -5 });
    expect(result.page).toBe(1);
  });

  it('filters by name, path, or value (case-insensitive)', () => {
    expect(
      filterAndPaginateProperties(properties, { search: 'PROP3' }).items,
    ).toEqual([{ name: 'prop3', path: '.path.3', value: 3 }]);
    expect(
      filterAndPaginateProperties(properties, { search: 'path.7' }).items,
    ).toEqual([{ name: 'prop7', path: '.path.7', value: 7 }]);
  });
});

describe('describeThreshold', () => {
  it('returns null when there is neither comparison nor period', () => {
    expect(describeThreshold(alarm())).toBeNull();
  });

  it('describes a comparison with a known operator phrase', () => {
    expect(
      describeThreshold(
        alarm({ comparisonOperator: 'GREATER_THAN', threshold: 5 }),
      ),
    ).toBe('above 5');
  });

  it('handles a zero threshold as a real comparison', () => {
    expect(
      describeThreshold(
        alarm({ comparisonOperator: 'LESS_THAN_OR_EQUAL_TO', threshold: 0 }),
      ),
    ).toBe('at or below 0');
  });

  it('appends a whole-minute period phrase', () => {
    expect(
      describeThreshold(
        alarm({
          comparisonOperator: 'GREATER_THAN',
          threshold: 5,
          period: 120,
        }),
      ),
    ).toBe('above 5 for 2 minutes');
  });

  it('renders a single minute without pluralizing', () => {
    expect(describeThreshold(alarm({ period: 60 }))).toBe('for 1 minute');
  });

  it('renders a sub-minute or non-whole-minute period in seconds', () => {
    expect(describeThreshold(alarm({ period: 30 }))).toBe('for 30 seconds');
    expect(describeThreshold(alarm({ period: 90 }))).toBe('for 90 seconds');
  });

  it('falls back to the raw operator when unknown', () => {
    expect(
      describeThreshold(alarm({ comparisonOperator: 'WEIRD', threshold: 1 })),
    ).toBe('WEIRD 1');
  });
});

describe('isFiring', () => {
  it('is true only for the ALARM status', () => {
    expect(isFiring(alarm({ currentState: { status: 'ALARM' } }))).toBe(true);
    expect(isFiring(alarm({ currentState: { status: 'OK' } }))).toBe(false);
    expect(isFiring(alarm())).toBe(false);
    expect(isFiring(null)).toBe(false);
  });
});

describe('getStatusLabel', () => {
  it('returns "No data" without a current state', () => {
    expect(getStatusLabel(undefined)).toBe('No data');
  });

  it('maps known statuses to labels', () => {
    expect(getStatusLabel({ status: 'ALARM' })).toBe('Firing');
    expect(getStatusLabel({ status: 'OK' })).toBe('OK');
  });

  it('passes through an unknown status', () => {
    expect(getStatusLabel({ status: 'PENDING' })).toBe('PENDING');
  });

  it('returns "No data" when the state has no status', () => {
    expect(getStatusLabel({ status: null })).toBe('No data');
  });
});

describe('getSeverity', () => {
  it('classifies firing, ok, and unknown', () => {
    expect(getSeverity(alarm({ currentState: { status: 'ALARM' } }))).toBe(
      'firing',
    );
    expect(getSeverity(alarm({ currentState: { status: 'OK' } }))).toBe('ok');
    expect(getSeverity(alarm())).toBe('unknown');
  });
});

describe('formatMetricLine', () => {
  it('returns null without a metric', () => {
    expect(formatMetricLine(undefined)).toBeNull();
  });

  it('joins namespace and name with a slash', () => {
    expect(formatMetricLine({ namespace: 'AWS', name: 'CPU' })).toBe(
      'AWS / CPU',
    );
  });

  it('appends the statistic in parentheses', () => {
    expect(
      formatMetricLine({ namespace: 'AWS', name: 'CPU', statistic: 'Average' }),
    ).toBe('AWS / CPU (Average)');
  });

  it('returns just the statistic when there is no path', () => {
    expect(formatMetricLine({ statistic: 'Average' })).toBe('Average');
  });

  it('returns null when there is neither a path nor a statistic', () => {
    expect(formatMetricLine({})).toBeNull();
  });
});

describe('formatAlarmDimensions', () => {
  it('returns an empty string for null/undefined', () => {
    expect(formatAlarmDimensions(null)).toBe('');
    expect(formatAlarmDimensions(undefined)).toBe('');
  });

  it('joins name=value pairs, skipping null entries', () => {
    expect(
      formatAlarmDimensions([
        { name: 'InstanceId', value: 'i-123' },
        null,
        { name: 'Region', value: 'us-east-1' },
      ]),
    ).toBe('InstanceId=i-123, Region=us-east-1');
  });
});

describe('bucketAlarms', () => {
  it('returns empty buckets for null/undefined', () => {
    expect(bucketAlarms(null)).toEqual({
      firing: [],
      configured: [],
      total: 0,
    });
  });

  it('sorts by display name and buckets firing vs configured', () => {
    const firing = alarm({
      id: 'b',
      displayName: 'Beta',
      currentState: { status: 'ALARM' },
    });
    const configured = alarm({
      id: 'a',
      displayName: 'Alpha',
      currentState: { status: 'OK' },
    });
    const result = bucketAlarms([firing, configured, null]);
    expect(result.total).toBe(2);
    expect(result.firing).toEqual([firing]);
    expect(result.configured).toEqual([configured]);
  });
});

describe('buildResourceRows', () => {
  it('marks unproduced bundle resources as UNCREATED', () => {
    const rows = buildResourceRows(
      [{ name: 'bucket', required: true, resourceType: { id: 'rt1' } }],
      [],
    );
    expect(rows).toEqual([
      {
        field: 'bucket',
        required: true,
        resource: null,
        resourceType: { id: 'rt1' },
        state: 'UNCREATED',
      },
    ]);
  });

  it('marks produced bundle resources as CREATED and prefers produced data', () => {
    const produced = { id: 'r1', name: 'my-bucket' };
    const rows = buildResourceRows(
      [{ name: 'bucket', required: false, resourceType: { id: 'rt1' } }],
      [
        {
          field: 'bucket',
          required: true,
          resource: produced,
          resourceType: { id: 'rt-produced' },
        },
      ],
    );
    expect(rows[0]).toEqual({
      field: 'bucket',
      required: true,
      resource: produced,
      resourceType: { id: 'rt-produced' },
      state: 'CREATED',
    });
  });

  it('includes orphan produced resources not present in the bundle, sorted by field', () => {
    const rows = buildResourceRows(
      [{ name: 'zeta', resourceType: { id: 'rt-z' } }],
      [{ field: 'alpha', resource: { id: 'r-a' } }],
    );
    expect(rows.map(row => row.field)).toEqual(['alpha', 'zeta']);
    expect(rows[0].state).toBe('CREATED');
    expect(rows[1].state).toBe('UNCREATED');
  });
});

describe('formatGrantConditions', () => {
  it('treats wildcard and null as an org-wide grant', () => {
    expect(formatGrantConditions('*')).toBe(
      'every recipient in the organization',
    );
    expect(formatGrantConditions(null)).toBe(
      'every recipient in the organization',
    );
  });

  it('parses a JSON string and formats the object', () => {
    expect(formatGrantConditions('{"team":"platform"}')).toBe('team: platform');
  });

  it('returns the raw string when it is not valid JSON', () => {
    expect(formatGrantConditions('just text')).toBe('just text');
  });

  it('formats object entries, joining array values', () => {
    expect(
      formatGrantConditions({ team: ['platform', 'infra'], tier: 'gold' }),
    ).toBe('team: platform, infra · tier: gold');
  });

  it('reports an empty object as having no conditions', () => {
    expect(formatGrantConditions({})).toBe('no conditions');
  });

  it('stringifies other primitives', () => {
    expect(formatGrantConditions(5)).toBe('5');
  });
});

describe('formatPayload', () => {
  it('returns an empty string for null/undefined', () => {
    expect(formatPayload(null)).toBe('');
    expect(formatPayload(undefined)).toBe('');
  });

  it('pretty-prints an object payload', () => {
    expect(formatPayload({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe('buildDependencyRows', () => {
  it('derives fulfillment state from the instance dependency source type', () => {
    const bundleDependencies = [
      { name: 'db', required: true, resourceType: { id: 'rt-db' } },
      { name: 'cache', required: false, resourceType: { id: 'rt-cache' } },
    ];
    const instanceDependencies = [
      {
        field: 'db',
        required: true,
        source: { __typename: 'Connection' },
        resourceType: { id: 'rt-db-live' },
      },
    ];
    const rows = buildDependencyRows(bundleDependencies, instanceDependencies);
    expect(rows).toEqual([
      {
        field: 'db',
        required: true,
        resourceType: { id: 'rt-db-live' },
        state: 'CONNECTION',
        source: { __typename: 'Connection' },
      },
      {
        field: 'cache',
        required: false,
        resourceType: { id: 'rt-cache' },
        state: 'UNFULFILLED',
        source: null,
      },
    ]);
  });

  it('maps each source typename to its state', () => {
    const rows = buildDependencyRows(
      [
        { name: 'a', resourceType: { id: '1' } },
        { name: 'b', resourceType: { id: '2' } },
        { name: 'c', resourceType: { id: '3' } },
      ],
      [
        { field: 'a', source: { __typename: 'RemoteReference' } },
        { field: 'b', source: { __typename: 'EnvironmentDefault' } },
        { field: 'c', source: { __typename: 'Unknown' } },
      ],
    );
    expect(rows.map(row => row.state)).toEqual([
      'REMOTE_REFERENCE',
      'ENV_DEFAULT',
      'UNFULFILLED',
    ]);
  });

  it('drops bundle dependencies oriented as ENVIRONMENT_DEFAULT', () => {
    const rows = buildDependencyRows(
      [
        {
          name: 'env-only',
          resourceType: {
            id: 'x',
            connectionOrientation: 'ENVIRONMENT_DEFAULT',
          },
        },
        { name: 'keep', resourceType: { id: 'y' } },
      ],
      [],
    );
    expect(rows.map(row => row.field)).toEqual(['keep']);
  });
});

describe('groupDependenciesBySection', () => {
  it('splits rows into fulfilled and unfulfilled by state', () => {
    const rows = [
      { field: 'a', required: true, state: 'CONNECTION', source: {} },
      { field: 'b', required: true, state: 'REMOTE_REFERENCE', source: {} },
      { field: 'c', required: true, state: 'ENV_DEFAULT', source: {} },
      { field: 'd', required: true, state: 'UNFULFILLED', source: null },
    ] as any;
    const grouped = groupDependenciesBySection(rows);
    expect(grouped.fulfilled.map((row: any) => row.field)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(grouped.unfulfilled.map((row: any) => row.field)).toEqual(['d']);
  });
});

describe('formatElapsed', () => {
  it('returns null for missing, zero, or negative seconds', () => {
    expect(formatElapsed(null)).toBeNull();
    expect(formatElapsed(0)).toBeNull();
    expect(formatElapsed(-10)).toBeNull();
  });

  it('formats seconds as minutes and seconds', () => {
    expect(formatElapsed(90)).toBe('1m 30s');
    expect(formatElapsed(45)).toBe('0m 45s');
  });
});

describe('truncateDeploymentId', () => {
  it('returns an empty string for missing ids', () => {
    expect(truncateDeploymentId(null)).toBe('');
    expect(truncateDeploymentId(undefined)).toBe('');
  });

  it('returns the last hyphen-delimited segment', () => {
    expect(truncateDeploymentId('proj-env-comp-abcdef')).toBe('abcdef');
  });

  it('returns the id unchanged when there is no hyphen', () => {
    expect(truncateDeploymentId('single')).toBe('single');
  });
});

describe('parsePlanMessage', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('returns null for empty input', () => {
    expect(parsePlanMessage(null)).toBeNull();
    expect(parsePlanMessage('')).toBeNull();
  });

  it('extracts the source id and message', () => {
    expect(
      parsePlanMessage(`Planning deployment ${uuid}\nDeploy prod`),
    ).toEqual({
      sourceId: uuid,
      sourceMessage: 'Deploy prod',
    });
  });

  it('returns an empty source message when none follows', () => {
    expect(parsePlanMessage(`Planning deployment ${uuid}`)).toEqual({
      sourceId: uuid,
      sourceMessage: '',
    });
  });

  it('returns null when the prefix does not match', () => {
    expect(parsePlanMessage('Deploying prod')).toBeNull();
  });
});

describe('parseRollbackMessage', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('extracts the source id, version, and message', () => {
    expect(
      parseRollbackMessage(`Rollback to deployment ${uuid} (v2.1.0)\nRestore`),
    ).toEqual({ sourceId: uuid, version: '2.1.0', sourceMessage: 'Restore' });
  });

  it('returns null when the prefix does not match', () => {
    expect(parseRollbackMessage('Deploying prod')).toBeNull();
    expect(parseRollbackMessage(null)).toBeNull();
  });
});

describe('isRollback', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('is true only for rollback-shaped messages', () => {
    expect(isRollback(`Rollback to deployment ${uuid} (v1)\nx`)).toBe(true);
    expect(isRollback('Deploy prod')).toBe(false);
  });
});

describe('stripMessageContext', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';

  it('returns an empty string for empty input', () => {
    expect(stripMessageContext(null)).toBe('');
    expect(stripMessageContext('')).toBe('');
  });

  it('returns a plain message unchanged', () => {
    expect(stripMessageContext('Deploy prod')).toBe('Deploy prod');
  });

  it('unwraps a plan message to its source message', () => {
    expect(
      stripMessageContext(`Planning deployment ${uuid}\nDeploy prod`),
    ).toBe('Deploy prod');
  });

  it('unwraps a rollback message to its source message', () => {
    expect(
      stripMessageContext(`Rollback to deployment ${uuid} (v1)\nDeploy prod`),
    ).toBe('Deploy prod');
  });

  it('recursively unwraps nested plan/rollback context', () => {
    const nested = `Planning deployment ${uuid}\nRollback to deployment ${uuid} (v1)\nDeploy prod`;
    expect(stripMessageContext(nested)).toBe('Deploy prod');
  });
});

describe('formatDeploymentStatus', () => {
  it('returns an em dash without an action or status', () => {
    expect(formatDeploymentStatus(null, 'RUNNING')).toBe('—');
    expect(formatDeploymentStatus('PROVISION', null)).toBe('—');
  });

  it('uses the past participle for completed actions', () => {
    expect(formatDeploymentStatus('PROVISION', 'COMPLETED')).toBe(
      'Provisioned',
    );
    expect(formatDeploymentStatus('DECOMMISSION', 'COMPLETED')).toBe(
      'Decommissioned',
    );
  });

  it('uses the gerund for failed actions', () => {
    expect(formatDeploymentStatus('PROVISION', 'FAILED')).toBe(
      'Provisioning Failed',
    );
  });

  it('combines the action label with the status title otherwise', () => {
    expect(formatDeploymentStatus('PLAN', 'RUNNING')).toBe('Plan Running');
    expect(formatDeploymentStatus('PROVISION', 'PROPOSED')).toBe(
      'Provision Proposed',
    );
  });

  it('passes through unknown actions and statuses', () => {
    expect(formatDeploymentStatus('CUSTOM', 'WEIRD')).toBe('CUSTOM WEIRD');
  });
});

describe('isDeploymentActive', () => {
  it('is true for PENDING and RUNNING only', () => {
    expect(isDeploymentActive('PENDING')).toBe(true);
    expect(isDeploymentActive('RUNNING')).toBe(true);
    expect(isDeploymentActive('COMPLETED')).toBe(false);
    expect(isDeploymentActive(null)).toBe(false);
  });
});

describe('deploymentHasLogs', () => {
  it('is false for missing status', () => {
    expect(deploymentHasLogs(null)).toBe(false);
    expect(deploymentHasLogs(undefined)).toBe(false);
  });

  it('is false for statuses that never stream logs', () => {
    STATUSES_WITHOUT_LOGS.forEach(status => {
      expect(deploymentHasLogs(status)).toBe(false);
    });
  });

  it('is true for statuses that do stream logs', () => {
    expect(deploymentHasLogs('RUNNING')).toBe(true);
    expect(deploymentHasLogs('COMPLETED')).toBe(true);
  });
});

describe('composeLogsText', () => {
  it('returns an empty string for empty or missing logs', () => {
    expect(composeLogsText(null)).toBe('');
    expect(composeLogsText(undefined)).toBe('');
    expect(composeLogsText([])).toBe('');
  });

  it('concatenates messages without separators and adds leading/trailing newlines', () => {
    expect(composeLogsText([{ message: 'a' }, { message: 'b' }])).toBe(
      '\nab\n',
    );
  });

  it('treats a null message as an empty segment', () => {
    expect(composeLogsText([{ message: null }, { message: 'x' }])).toBe(
      '\nx\n',
    );
  });

  it('does not add a second trailing newline when one already exists', () => {
    expect(composeLogsText([{ message: 'line\n' }])).toBe('\nline\n');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-09T12:00:00Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the fallback for empty or invalid input', () => {
    expect(formatRelativeTime(null)).toBe('—');
    expect(formatRelativeTime('not a date')).toBe('—');
    expect(formatRelativeTime(null, 'n/a')).toBe('n/a');
  });

  it('formats recent seconds in the past', () => {
    expect(formatRelativeTime('2026-07-09T11:59:30Z')).toBe('30 seconds ago');
  });

  it('formats hours in the past', () => {
    expect(formatRelativeTime('2026-07-09T09:00:00Z')).toBe('3 hours ago');
  });

  it('uses the "auto" wording for one day ago', () => {
    expect(formatRelativeTime('2026-07-08T12:00:00Z')).toBe('yesterday');
  });

  it('formats times in the future', () => {
    expect(formatRelativeTime('2026-07-09T12:00:30Z')).toBe('in 30 seconds');
  });
});

describe('formatAbsoluteDateTime', () => {
  const expectedFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  it('returns the fallback for empty or invalid input', () => {
    expect(formatAbsoluteDateTime(null)).toBe('');
    expect(formatAbsoluteDateTime('not a date')).toBe('');
    expect(formatAbsoluteDateTime(null, 'n/a')).toBe('n/a');
  });

  it('formats a valid ISO timestamp with month/day/time parts', () => {
    const iso = '2026-07-09T12:34:00Z';
    expect(formatAbsoluteDateTime(iso)).toBe(
      expectedFormatter.format(new Date(iso)),
    );
  });
});
