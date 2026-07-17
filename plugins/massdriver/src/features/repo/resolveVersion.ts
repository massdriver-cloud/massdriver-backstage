// Ported from the Massdriver web app
export const ALL_VERSIONS = 'all';

interface RepoVersions {
  tags?: { items?: Array<{ tag: string } | null> | null } | null;
  releaseChannels?: {
    items?: Array<{ name: string; tag: string } | null> | null;
  } | null;
}

/**
 * The `BundleId` used to fetch a bundle for a given repo + version. When the
 * page is scoped to "all versions" we resolve the semver to `latest`.
 */
export const bundleQueryId = (
  repoId?: string | null,
  version?: string | null,
): string | null => {
  if (!repoId || !version) return null;
  const semver = version === ALL_VERSIONS ? 'latest' : version;
  return `${repoId}@${semver}`;
};

/**
 * Resolve the concrete semver tag to load for a page version. "all"/empty →
 * the newest tag; a release-channel name → its tag; a tag → itself; otherwise
 * null.
 */
export const resolveSelectedVersion = (
  version: string | null | undefined,
  repo: RepoVersions | null | undefined,
): string | null => {
  if (!repo) return null;

  const tags = repo.tags?.items ?? [];
  const channels = repo.releaseChannels?.items ?? [];

  if (version === ALL_VERSIONS || !version) {
    return tags[0]?.tag ?? null;
  }

  const channelMatch = channels.find(channel => channel?.name === version);
  if (channelMatch) return channelMatch.tag;

  const tagMatch = tags.find(tag => tag?.tag === version);
  if (tagMatch) return tagMatch.tag;

  return null;
};
