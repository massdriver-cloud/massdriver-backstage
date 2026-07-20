import Box from '@massdriver/ui/Box';
import Chip from '@massdriver/ui/Chip';
import Typography from '@massdriver/ui/Typography';
import HistoryIcon from '@massdriver/ui/icons/HistoryIcon';
import stylin from '@massdriver/ui/stylin';
import type { RepoTabProps } from '../RepoDetailsPage';
import { RepoEmptyState } from '../RepoEmptyState';
import { RepoNoVersionsState } from '../RepoNoVersionsState';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const formatDate = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
};

export const VersionsTab = ({ repo, hasNoVersions }: RepoTabProps) => {
  if (hasNoVersions) {
    return <RepoNoVersionsState tabLabel="version history" />;
  }

  const tags = (repo?.tags?.items ?? []).filter(Boolean) as Array<{
    tag: string;
    createdAt?: string;
  }>;
  const releaseChannels = (repo?.releaseChannels?.items ?? []).filter(
    Boolean,
  ) as Array<{ name: string; tag: string }>;

  if (tags.length === 0) {
    return (
      <EmptyContainer>
        <RepoEmptyState
          icon={<HistoryIcon />}
          title="No published versions"
          description="Publish a version to populate this list."
        />
      </EmptyContainer>
    );
  }

  return (
    <Container>
      {releaseChannels.length > 0 ? (
        <Section>
          <SectionTitle variant="subtitle2">Release channels</SectionTitle>
          <List>
            {releaseChannels.map(channel => (
              <ChannelRow key={channel.name}>
                <ChannelName>{channel.name}</ChannelName>
                <Arrow aria-hidden="true">→</Arrow>
                <VersionTag label={`v${channel.tag}`} size="small" />
              </ChannelRow>
            ))}
          </List>
        </Section>
      ) : null}
      <Section>
        <SectionTitle variant="subtitle2">
          Versions
          <Count variant="caption">({tags.length})</Count>
        </SectionTitle>
        <List>
          {tags.map((tag, index) => {
            const releasedOn = formatDate(tag.createdAt);
            return (
              <TagRow key={tag.tag}>
                <TagLeft>
                  <VersionTag label={`v${tag.tag}`} size="small" />
                  {index === 0 ? (
                    <LatestChip label="latest" size="small" color="primary" />
                  ) : null}
                </TagLeft>
                {releasedOn ? (
                  <ReleaseDate variant="caption">
                    Released {releasedOn}
                  </ReleaseDate>
                ) : null}
              </TagRow>
            );
          })}
        </List>
      </Section>
    </Container>
  );
};

const Container = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

const Section = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const SectionTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'baseline',
  gap: theme.spacing(0.75),
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const Count = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 400,
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

const ChannelRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.25, 2),
  '&:not(:last-of-type)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const ChannelName = stylin('span')(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 600,
  color: theme.palette.text.primary,
  minWidth: theme.spacing(8),
}));

const Arrow = stylin('span')(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontSize: theme.typography.pxToRem(14),
}));

const TagRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.25, 2),
  '&:not(:last-of-type)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const TagLeft = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const VersionTag = stylin(Chip)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontWeight: 600,
}));

const LatestChip = stylin(Chip)({
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  fontSize: '11px',
});

const ReleaseDate = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const EmptyContainer = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(3),
}));
