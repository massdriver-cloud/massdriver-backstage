import { useApi } from '@backstage/frontend-plugin-api';
import { parseEnvironmentId } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Card from '@massdriver/ui/Card';
import Divider from '@massdriver/ui/Divider';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import Alert from '@massdriver/ui/Alert';
import Typography from '@massdriver/ui/Typography';
import ChevronRightIcon from '@massdriver/ui/icons/ChevronRightIcon';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { massdriverApiRef } from '../../../api';
import { RouterLinkAdapter } from '../../../components/RouterLinkAdapter';
import { internalRoutes } from '../../../internalRoutes';
import {
  formatCurrency,
  formatRelativeTime,
} from '../../../utils/formatRelativeTime';

interface Money {
  amount?: number | null;
  currency?: string | null;
}
interface Cost {
  lastDay?: Money;
  dailyAverage?: Money;
  lastMonth?: Money;
  monthlyAverage?: Money;
}
interface EnvSummary {
  id: string;
  name: string;
  description?: string | null;
  updatedAt?: string | null;
  cost?: Cost;
}
interface ProjectOverview {
  id: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cost?: Cost;
  environments?: { items?: (EnvSummary | null)[] | null };
}

const MONEY = `{ amount currency }`;
const COST = `cost { lastDay ${MONEY} dailyAverage ${MONEY} lastMonth ${MONEY} monthlyAverage ${MONEY} }`;
const OVERVIEW_QUERY = `
  query MassdriverProjectOverview($organizationId: ID!, $id: ID!) {
    project(organizationId: $organizationId, id: $id) {
      id
      name
      description
      createdAt
      updatedAt
      ${COST}
      environments(cursor: { limit: 100 }) {
        items { id name description updatedAt ${COST} }
      }
    }
  }
`;

const useProjectOverview = (projectId: string) => {
  const api = useApi(massdriverApiRef);
  return useAsync(async () => {
    const data = (await api.query(OVERVIEW_QUERY, { id: projectId })) as {
      project: ProjectOverview | null;
    };
    return data.project;
  }, [api, projectId]);
};

/** Read-only project Overview tab: metadata, cost summary, environments. */
export const OverviewTab = ({ projectId }: { projectId: string }) => {
  const { value: project, loading, error } = useProjectOverview(projectId);

  if (loading) {
    return (
      <Centered>
        <LoadingIndicator />
      </Centered>
    );
  }
  if (error) {
    return (
      <Wrapper>
        <Alert severity="error">{String(error.message ?? error)}</Alert>
      </Wrapper>
    );
  }

  const environments = (project?.environments?.items ?? []).filter(
    Boolean,
  ) as EnvSummary[];

  return (
    <Wrapper>
      <TopRow>
        <MetadataCard project={project} />
        <CostSummaryCard cost={project?.cost} />
      </TopRow>
      <EnvironmentSummaryCards
        environments={environments}
        projectId={projectId}
      />
    </Wrapper>
  );
};

const MetadataCard = ({ project }: { project?: ProjectOverview | null }) => (
  <MetaWrapper>
    <SectionTitle variant="overline">Details</SectionTitle>
    <FieldList>
      <Field label="Identifier" value={project?.id} mono />
      <Field
        label="Created"
        value={project?.createdAt ? formatRelativeTime(project.createdAt) : '—'}
      />
      <Field
        label="Last updated"
        value={project?.updatedAt ? formatRelativeTime(project.updatedAt) : '—'}
      />
    </FieldList>
  </MetaWrapper>
);

const Field = ({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) => (
  <FieldRow>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <FieldValue variant="body2" mono={mono} title={value ?? ''}>
      {value}
    </FieldValue>
  </FieldRow>
);

const CostSummaryCard = ({ cost }: { cost?: Cost }) => (
  <CostWrapper>
    <SectionTitle variant="overline">Cost</SectionTitle>
    <CostRow>
      <CostBlock
        label="Last 24 hours"
        amount={cost?.lastDay?.amount}
        currency={cost?.lastDay?.currency}
        avg={cost?.dailyAverage?.amount}
        avgLabel="7-day avg"
      />
      <CostBlock
        label="Last month"
        amount={cost?.lastMonth?.amount}
        currency={cost?.lastMonth?.currency}
        avg={cost?.monthlyAverage?.amount}
        avgLabel="Monthly avg"
      />
    </CostRow>
  </CostWrapper>
);

const CostBlock = ({
  label,
  amount,
  currency,
  avg,
  avgLabel,
}: {
  label: string;
  amount?: number | null;
  currency?: string | null;
  avg?: number | null;
  avgLabel: string;
}) => (
  <CostBlockRoot>
    <CostLabel variant="caption">{label}</CostLabel>
    <CostAmount variant="h4">
      {formatCurrency(amount, currency ?? 'USD', 'No data yet')}
    </CostAmount>
    <CostAvg variant="caption">
      {avgLabel}: {formatCurrency(avg, currency ?? 'USD', 'No data yet')}
    </CostAvg>
  </CostBlockRoot>
);

const EnvironmentSummaryCards = ({
  environments,
  projectId,
}: {
  environments: EnvSummary[];
  projectId: string;
}) => (
  <EnvWrapper>
    <SectionTitle variant="overline">Environments</SectionTitle>
    {environments.length === 0 ? (
      <EmptyState>
        <Typography variant="body2" color="text.secondary">
          No environments yet. Create your first environment to start deploying.
        </Typography>
      </EmptyState>
    ) : (
      <List>
        {environments.map((env, index) => (
          <EnvironmentRow
            key={env.id}
            environment={env}
            href={internalRoutes.environment(projectId, env.id)}
            isFirst={index === 0}
          />
        ))}
      </List>
    )}
  </EnvWrapper>
);

const EnvironmentRow = ({
  environment,
  href,
  isFirst,
}: {
  environment: EnvSummary;
  href: string;
  isFirst: boolean;
}) => {
  const { scopedEnvironmentId } = parseEnvironmentId(environment.id);
  const currency =
    environment.cost?.lastMonth?.currency ??
    environment.cost?.monthlyAverage?.currency ??
    environment.cost?.lastDay?.currency ??
    environment.cost?.dailyAverage?.currency ??
    'USD';

  return (
    <>
      {!isFirst && <Divider />}
      <RowLink component={RouterLinkAdapter} href={href}>
        <Row>
          <PrimaryColumn>
            <NameRow>
              <Name variant="subtitle1">{environment.name}</Name>
              <IdBadge>{scopedEnvironmentId}</IdBadge>
            </NameRow>
            {environment.description ? (
              <Description variant="body2">
                {environment.description}
              </Description>
            ) : (
              <DescriptionMuted variant="body2">
                No description
              </DescriptionMuted>
            )}
          </PrimaryColumn>
          <Stats>
            <Stat>
              <StatLabel variant="caption">Last 24 hours</StatLabel>
              <StatPrimary variant="body1">
                {formatCurrency(
                  environment.cost?.lastDay?.amount,
                  currency,
                  '—',
                )}
              </StatPrimary>
              <StatSecondary variant="caption">
                7-day avg{' '}
                {formatCurrency(
                  environment.cost?.dailyAverage?.amount,
                  currency,
                  '—',
                )}
              </StatSecondary>
            </Stat>
            <Stat>
              <StatLabel variant="caption">Last month</StatLabel>
              <StatPrimary variant="body1">
                {formatCurrency(
                  environment.cost?.lastMonth?.amount,
                  currency,
                  '—',
                )}
              </StatPrimary>
              <StatSecondary variant="caption">
                Monthly avg{' '}
                {formatCurrency(
                  environment.cost?.monthlyAverage?.amount,
                  currency,
                  '—',
                )}
              </StatSecondary>
            </Stat>
          </Stats>
          <Trailing>
            {environment.updatedAt ? (
              <Updated variant="caption">
                Updated {formatRelativeTime(environment.updatedAt)}
              </Updated>
            ) : null}
            <Chevron />
          </Trailing>
        </Row>
      </RowLink>
    </>
  );
};

const Wrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  maxWidth: 1400,
  mx: 'auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4),
}));

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const TopRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.6fr)',
  gap: theme.spacing(2),
  [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr' },
}));

const SectionTitle = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  letterSpacing: theme.spacing(0.1),
}));

const MetaWrapper = stylin(Card)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(3),
}));

const FieldList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
}));

const FieldRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: `${theme.spacing(14)} 1fr`,
  alignItems: 'baseline',
  gap: theme.spacing(2),
  minWidth: 0,
}));

const FieldValue = stylin(Typography, ['mono'])(
  ({ theme, mono }: { theme: any; mono?: boolean }) => ({
    color: theme.palette.text.primary,
    fontFamily: mono
      ? theme.typography.fontFamilyMono
      : theme.typography.body2.fontFamily,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  }),
);

const CostWrapper = stylin(Card)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
}));

const CostRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(3),
}));

const CostBlockRoot = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  paddingLeft: theme.spacing(1.5),
  borderLeft: `2px solid ${theme.palette.divider}`,
}));

const CostLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
  fontSize: '0.7rem',
}));

const CostAmount = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightBold,
  lineHeight: 1.1,
}));

const CostAvg = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
}));

const EnvWrapper = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const List = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
}));

const RowLink = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'block',
  padding: theme.spacing(2.5, 3),
  textDecoration: 'none',
  color: 'inherit',
  transition: 'background-color 120ms ease',
  '&:hover': { backgroundColor: `${theme.palette.primary.main}14` },
}));

const Row = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 3fr) auto',
  gap: theme.spacing(4),
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
}));

const PrimaryColumn = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const NameRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: 0,
}));

const Name = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const IdBadge = stylin(Box)(({ theme }: { theme: any }) => ({
  fontFamily: theme.typography.fontFamilyMono,
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.action.hover,
  padding: theme.spacing(0.25, 0.75),
  borderRadius: theme.custom.general.borderRadiusSm,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}));

const Description = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const DescriptionMuted = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontStyle: 'italic',
}));

const Stats = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  [theme.breakpoints.down('md')]: { gap: theme.spacing(3) },
}));

const Stat = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  minWidth: theme.spacing(14),
}));

const StatLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
  fontSize: '0.65rem',
}));

const StatPrimary = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightBold,
  fontVariantNumeric: 'tabular-nums',
}));

const StatSecondary = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  fontVariantNumeric: 'tabular-nums',
}));

const Trailing = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexShrink: 0,
}));

const Updated = stylin(Typography)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
}));

const Chevron = stylin(ChevronRightIcon)(({ theme }: { theme: any }) => ({
  color: theme.palette.text.disabled,
  fontSize: 20,
}));

const EmptyState = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(4),
  border: `1px dashed ${theme.palette.divider}`,
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}));
