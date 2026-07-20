import { useEffect, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import Alert from '@massdriver/ui/Alert';
import Box from '@massdriver/ui/Box';
import CodeViewer from '@massdriver/ui/CodeViewer';
import GuideMarkdown from '@massdriver/ui/GuideMarkdown';
import Skeleton from '@massdriver/ui/Skeleton';
import Typography from '@massdriver/ui/Typography';
import DescriptionOutlinedIcon from '@massdriver/ui/icons/DescriptionOutlinedIcon';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../api';
import { RepoEmptyState } from './RepoEmptyState';
import { isMarkdownFile, languageFromExtension } from './FileViewer.helpers';
import type { RepoFile } from './types';

export const FileViewer = ({ file }: { file: RepoFile | null }) => {
  const api = useApi(massdriverApiRef);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file?.url) {
      setContent(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent(null);

    api
      .fetchText(file.url)
      .then(text => {
        if (cancelled) return;
        setContent(text);
        setLoading(false);
      })
      .catch(caught => {
        if (cancelled) return;
        setError((caught as Error).message || 'Could not load file.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, file?.url]);

  if (!file) {
    return (
      <EmptyContainer>
        <RepoEmptyState
          icon={<DescriptionOutlinedIcon />}
          title="Select a file"
          description="Pick a file in the tree to preview its contents."
        />
      </EmptyContainer>
    );
  }

  return (
    <Container>
      <FileHeader>{file.name}</FileHeader>
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <Padded>
          <Alert severity="error">{error}</Alert>
        </Padded>
      ) : content ? (
        <Body>
          {isMarkdownFile(file.name) ? (
            <MarkdownWrapper>
              <GuideMarkdown shouldLinkHeadings>{content}</GuideMarkdown>
            </MarkdownWrapper>
          ) : (
            <CodeViewer language={languageFromExtension(file.name)}>
              {content}
            </CodeViewer>
          )}
        </Body>
      ) : (
        <EmptyContainer>
          <RepoEmptyState
            title="Empty file"
            description="This file is empty."
          />
        </EmptyContainer>
      )}
    </Container>
  );
};

export default FileViewer;

const SkeletonRows = () => (
  <SkeletonWrapper>
    {Array.from({ length: 8 }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={`${60 + ((index * 7) % 35)}%`}
        height={16}
      />
    ))}
  </SkeletonWrapper>
);

const Container = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
});

const FileHeader = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Body = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const MarkdownWrapper = stylin(Box)({
  maxWidth: '100%',
});

const SkeletonWrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const EmptyContainer = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: '1 1 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
}));

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));
