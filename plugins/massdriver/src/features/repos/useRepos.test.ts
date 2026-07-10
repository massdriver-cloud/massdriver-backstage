import { toRepoRow } from './useRepos';

describe('toRepoRow', () => {
  it('prefixes the newest tag with v for latestVersion', () => {
    const row = toRepoRow({
      id: 'aws-s3',
      name: 'aws-s3',
      tags: { items: [{ tag: '1.4.0' }, { tag: '1.3.0' }] },
    });
    expect(row.latestVersion).toBe('v1.4.0');
  });

  it('leaves latestVersion null when there are no tags', () => {
    const row = toRepoRow({
      id: 'aws-s3',
      name: 'aws-s3',
      tags: { items: [] },
    });
    expect(row.latestVersion).toBeNull();
  });

  it('normalizes missing name and description', () => {
    const row = toRepoRow({ id: 'aws-s3', name: '' });
    expect(row.name).toBe('');
    expect(row.description).toBeNull();
  });

  it('keeps the raw updatedAt for the tooltip and formats the display value', () => {
    const row = toRepoRow({
      id: 'aws-s3',
      name: 'aws-s3',
      updatedAt: '2020-01-01T00:00:00Z',
    });
    expect(row.updatedAtRaw).toBe('2020-01-01T00:00:00Z');
    expect(row.updatedAt).not.toBe('2020-01-01T00:00:00Z');
  });
});
