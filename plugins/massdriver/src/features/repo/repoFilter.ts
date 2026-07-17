import { ALL_VERSIONS } from './resolveVersion';

export const buildRepoVersionFilter = (
  repoId?: string | null,
  version?: string | null,
): Record<string, unknown> | undefined => {
  if (!repoId) return undefined;
  return version === ALL_VERSIONS
    ? { ociRepoName: { eq: repoId } }
    : { bundleId: { eq: `${repoId}@${version}` } };
};
