import { useApi } from '@backstage/frontend-plugin-api';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import Button from '@massdriver/ui/Button';
import GuideMarkdown from '@massdriver/ui/GuideMarkdown';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import DescriptionOutlinedIcon from '@massdriver/ui/icons/DescriptionOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import type { RepoTabProps } from '../RepoDetailsPage';
import { BUNDLE_QUERY } from '../queries';
import { bundleQueryId } from '../resolveVersion';
import { RepoEmptyState } from '../RepoEmptyState';
import { RepoNoVersionsState } from '../RepoNoVersionsState';
import type { RepoBundle } from '../types';

export const OverviewTab = ({
  repoId,
  version,
  hasNoVersions,
}: RepoTabProps) => {
  const api = useApi(massdriverApiRef);
  const id = bundleQueryId(repoId, version);

  const { value, loading, error } = useAsync(async () => {
    if (hasNoVersions || !id) return null;
    const data = (await api.query(BUNDLE_QUERY, { id })) as {
      bundle: RepoBundle | null;
    };
    return data.bundle;
  }, [api, id, hasNoVersions]);

  if (hasNoVersions) {
    return <RepoNoVersionsState tabLabel="an overview" />;
  }

  if (loading) {
    return (
      <Centered>
        <LoadingIndicator />
      </Centered>
    );
  }

  if (error) {
    return (
      <Padded>
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      </Padded>
    );
  }

  const readme = value?.readme;
  const sourceUrl = value?.sourceUrl;
  const versionLabel = !version || version === 'all' ? 'latest' : version;

  return readme ? (
    <ReadmeContainer>
      <GuideMarkdown shouldLinkHeadings>{readme}</GuideMarkdown>
    </ReadmeContainer>
  ) : (
    <EmptyContainer>
      <RepoEmptyState
        icon={<DescriptionOutlinedIcon />}
        title={`Version ${versionLabel} has no README`}
        description={
          sourceUrl
            ? 'Add a README.md in the source repository to display it here.'
            : 'Add a README.md in your code repository to make it available here.'
        }
        action={
          sourceUrl ? (
            <Button
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="text"
            >
              Open source repository
            </Button>
          ) : null
        }
      />
    </EmptyContainer>
  );
};

const ReadmeContainer = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
  maxWidth: '100%',
}));

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
}));

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const EmptyContainer = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
}));
