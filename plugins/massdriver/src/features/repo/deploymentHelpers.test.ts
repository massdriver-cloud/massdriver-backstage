import {
  composeLogsText,
  deploymentHasLogs,
  formatElapsed,
  parsePlanMessage,
  parseRollbackMessage,
  stripMessageContext,
  truncateDeploymentId,
} from './deploymentHelpers';

describe('truncateDeploymentId', () => {
  it('returns the last hyphen segment', () => {
    expect(truncateDeploymentId('proj-env-cache-abc123')).toBe('abc123');
  });

  it('returns the id unchanged when it has no hyphen', () => {
    expect(truncateDeploymentId('abc123')).toBe('abc123');
  });

  it('returns empty string for a missing id', () => {
    expect(truncateDeploymentId(null)).toBe('');
  });
});

describe('parsePlanMessage', () => {
  it('extracts the source id and message from a plan precursor', () => {
    const parsed = parsePlanMessage(
      'Planning deployment 12345678-1234-1234-1234-123456789012\nBumped version',
    );
    expect(parsed).toEqual({
      sourceId: '12345678-1234-1234-1234-123456789012',
      sourceMessage: 'Bumped version',
    });
  });

  it('returns null for a non-plan message', () => {
    expect(parsePlanMessage('Just a normal message')).toBeNull();
    expect(parsePlanMessage(null)).toBeNull();
  });
});

describe('formatElapsed', () => {
  it('formats seconds as "Xm Ys"', () => {
    expect(formatElapsed(125)).toBe('2m 5s');
    expect(formatElapsed(59)).toBe('0m 59s');
  });

  it('returns null for missing or non-positive durations', () => {
    expect(formatElapsed(0)).toBeNull();
    expect(formatElapsed(null)).toBeNull();
    expect(formatElapsed(undefined)).toBeNull();
  });
});

describe('parseRollbackMessage', () => {
  it('extracts the source id, version, and message', () => {
    expect(
      parseRollbackMessage(
        'Rollback to deployment 12345678-1234-1234-1234-123456789012 (v1.2.3)\nReverting',
      ),
    ).toEqual({
      sourceId: '12345678-1234-1234-1234-123456789012',
      version: '1.2.3',
      sourceMessage: 'Reverting',
    });
  });

  it('returns null for a non-rollback message', () => {
    expect(parseRollbackMessage('Just a normal message')).toBeNull();
    expect(parseRollbackMessage(null)).toBeNull();
  });
});

describe('stripMessageContext', () => {
  it('strips a plan precursor, leaving the human note', () => {
    expect(
      stripMessageContext(
        'Planning deployment 12345678-1234-1234-1234-123456789012\nBumped version',
      ),
    ).toBe('Bumped version');
  });

  it('strips a rollback precursor', () => {
    expect(
      stripMessageContext(
        'Rollback to deployment 12345678-1234-1234-1234-123456789012 (v1.2.3)\nReverting',
      ),
    ).toBe('Reverting');
  });

  it('returns a plain message unchanged', () => {
    expect(stripMessageContext('Just a note')).toBe('Just a note');
    expect(stripMessageContext(null)).toBe('');
  });
});

describe('deploymentHasLogs', () => {
  it('is false for proposal/approval statuses that never stream logs', () => {
    expect(deploymentHasLogs('PROPOSED')).toBe(false);
    expect(deploymentHasLogs('APPROVED')).toBe(false);
    expect(deploymentHasLogs('REJECTED')).toBe(false);
  });

  it('is true for in-flight or terminal statuses', () => {
    expect(deploymentHasLogs('RUNNING')).toBe(true);
    expect(deploymentHasLogs('COMPLETED')).toBe(true);
    expect(deploymentHasLogs('FAILED')).toBe(true);
  });

  it('is false when the status is missing', () => {
    expect(deploymentHasLogs(null)).toBe(false);
    expect(deploymentHasLogs(undefined)).toBe(false);
  });
});

describe('composeLogsText', () => {
  it('returns empty string for missing or empty batches', () => {
    expect(composeLogsText(null)).toBe('');
    expect(composeLogsText([])).toBe('');
  });

  it('concatenates batch messages without extra separators, trailing newline', () => {
    expect(
      composeLogsText([{ message: 'line 1\n' }, { message: 'line 2' }]),
    ).toBe('\nline 1\nline 2\n');
  });

  it('keeps an already-trailing newline without doubling it', () => {
    expect(composeLogsText([{ message: 'done\n' }])).toBe('\ndone\n');
  });

  it('treats null/empty lines as blank', () => {
    expect(composeLogsText([null, { message: null }, { message: 'x' }])).toBe(
      '\nx\n',
    );
  });
});
