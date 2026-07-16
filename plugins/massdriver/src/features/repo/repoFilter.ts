import { ALL_VERSIONS } from './resolveVersion';

// Ported from the Massdriver web app
//
// Builds the filter shape shared by the instances / deployments queries on the
// repo details page. When scoped to "all versions" we filter by the OCI repo
// name (matches every published release); otherwise we pin to a specific bundle
// id ("name@version"), which also accepts release channels like "name@latest".
export const buildRepoVersionFilter = (
  repoId?: string | null,
  version?: string | null,
): Record<string, unknown> | undefined => {
  if (!repoId) return undefined;
  return version === ALL_VERSIONS
    ? { ociRepoName: { eq: repoId } }
    : { bundleId: { eq: `${repoId}@${version}` } };
};
