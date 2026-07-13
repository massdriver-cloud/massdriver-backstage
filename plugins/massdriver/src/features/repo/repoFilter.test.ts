import { buildRepoVersionFilter } from './repoFilter';
import { ALL_VERSIONS } from './resolveVersion';

describe('buildRepoVersionFilter', () => {
  it('filters by OCI repo name for the all-versions view', () => {
    expect(buildRepoVersionFilter('aws-s3', ALL_VERSIONS)).toEqual({
      ociRepoName: { eq: 'aws-s3' },
    });
  });

  it('pins to a bundle id for a concrete version', () => {
    expect(buildRepoVersionFilter('aws-s3', '1.2.3')).toEqual({
      bundleId: { eq: 'aws-s3@1.2.3' },
    });
  });

  it('returns undefined without a repoId', () => {
    expect(buildRepoVersionFilter(null, '1.2.3')).toBeUndefined();
  });
});
