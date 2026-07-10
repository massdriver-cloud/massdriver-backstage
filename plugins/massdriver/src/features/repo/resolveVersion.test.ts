import {
  ALL_VERSIONS,
  bundleQueryId,
  resolveSelectedVersion,
} from './resolveVersion';

describe('bundleQueryId', () => {
  it('uses semver "latest" for the all-versions view', () => {
    expect(bundleQueryId('aws-s3', ALL_VERSIONS)).toBe('aws-s3@latest');
  });

  it('pins to the concrete version otherwise', () => {
    expect(bundleQueryId('aws-s3', '1.2.3')).toBe('aws-s3@1.2.3');
  });

  it('returns null when repoId or version is missing', () => {
    expect(bundleQueryId(null, '1.2.3')).toBeNull();
    expect(bundleQueryId('aws-s3', null)).toBeNull();
  });
});

describe('resolveSelectedVersion', () => {
  const repo = {
    tags: { items: [{ tag: '1.3.0' }, { tag: '1.2.0' }] },
    releaseChannels: { items: [{ name: 'latest', tag: '1.3.0' }] },
  };

  it('returns the newest tag for the all-versions view', () => {
    expect(resolveSelectedVersion(ALL_VERSIONS, repo)).toBe('1.3.0');
    expect(resolveSelectedVersion('', repo)).toBe('1.3.0');
  });

  it('resolves a release-channel name to its tag', () => {
    expect(resolveSelectedVersion('latest', repo)).toBe('1.3.0');
  });

  it('resolves a concrete tag to itself', () => {
    expect(resolveSelectedVersion('1.2.0', repo)).toBe('1.2.0');
  });

  it('returns null for an unknown version or a null repo', () => {
    expect(resolveSelectedVersion('9.9.9', repo)).toBeNull();
    expect(resolveSelectedVersion('1.2.0', null)).toBeNull();
  });
});
