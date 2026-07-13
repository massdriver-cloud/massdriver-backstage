import { useMemo, useState } from 'react';
import Box from '@massdriver/ui/Box';
import Typography from '@massdriver/ui/Typography';
import CopyButton from '@massdriver/ui/CopyButton';
import CodeBlock from '@massdriver/ui/CodeBlock';
import TextField from '@massdriver/ui/TextField';
import InputAdornment from '@massdriver/ui/InputAdornment';
import IconButton from '@massdriver/ui/IconButton';
import Tooltip from '@massdriver/ui/Tooltip';
import SearchIcon from '@massdriver/ui/icons/SearchIcon';
import ChevronLeftIcon from '@massdriver/ui/icons/ChevronLeftIcon';
import ChevronRightIcon from '@massdriver/ui/icons/ChevronRightIcon';
import ExpandCircleDownOutlinedIcon from '@massdriver/ui/icons/ExpandCircleDownOutlinedIcon';
import OpenInNewIcon from '@massdriver/ui/icons/OpenInNewIcon';
import AlertBanner from '@massdriver/ui/AlertBanner';
import stylin from '@massdriver/ui/stylin';
import { useApi } from '@backstage/frontend-plugin-api';
import {
  instanceTabUrl,
  repoVersionOverviewUrl,
} from '@massdriver/backstage-plugin-common';
import { massdriverApiRef } from '../../../../api';
import { TabState } from '../TabState';
import AlarmCard from '../AlarmCard';
import { OVERVIEW_QUERY } from '../queries';
import { useInstanceApiQuery } from '../useInstanceApiQuery';
import {
  filterAndPaginateProperties,
  formatAttributeValue,
  formatPropertyValue,
  getFiringAlerts,
  getReleaseChannel,
  parseMap,
} from '../helpers';
import type { Alarm, Bundle, InstanceProperty } from '../types';
import { outlinedInputClasses } from '../../../../theme/muiClasses';

interface OverviewInstance {
  id: string;
  name?: string | null;
  status?: string | null;
  version?: string | null;
  resolvedVersion?: string | null;
  availableUpgrade?: string | null;
  effectiveAttributes?: unknown;
  bundle?: Bundle | null;
  properties?: (InstanceProperty | null)[] | null;
  alarms?: { items?: (Alarm | null)[] | null } | null;
}

/** Read-only Overview tab: firing alerts, identifiers, version, attributes, properties. */
export const OverviewTab = ({ instanceId }: { instanceId: string | null }) => {
  const api = useApi(massdriverApiRef);
  const { value, loading, error } = useInstanceApiQuery<{
    instance: OverviewInstance | null;
  }>(OVERVIEW_QUERY, instanceId);
  const instance = value?.instance;

  // Editing the version is a mutation — link out to the instance's overview in
  // Massdriver (where the change-version dialog lives). The bundle links to its
  // version overview in the repository.
  const changeVersionUrl =
    instanceId && api.appUrl
      ? instanceTabUrl(api.appUrl, api.organizationId, instanceId, 'overview')
      : '';
  const repoUrl =
    instance?.bundle?.name && instance?.resolvedVersion && api.appUrl
      ? repoVersionOverviewUrl(
          api.appUrl,
          api.organizationId,
          instance.bundle.name,
          instance.resolvedVersion,
        )
      : '';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const firingAlerts = useMemo(
    () => getFiringAlerts(instance?.alarms?.items),
    [instance?.alarms],
  );
  const releaseChannel = getReleaseChannel(
    instance?.version,
    instance?.resolvedVersion,
  );
  const properties = (instance?.properties ?? []).filter(
    Boolean,
  ) as InstanceProperty[];
  const propertiesView = useMemo(
    () => filterAndPaginateProperties(properties, { search, page }),
    [properties, search, page],
  );

  return (
    <TabState loading={loading} error={error}>
      {instance ? (
        <Root>
          {firingAlerts.length ? (
            <Section>
              <Header>Firing Alerts</Header>
              <AlertList>
                {firingAlerts.map(alarm => (
                  <AlarmCard key={alarm.id} alarm={alarm} />
                ))}
              </AlertList>
            </Section>
          ) : null}

          <Section>
            <Header>Identifiers</Header>
            <IdGrid>
              <Field>
                <Label>Instance ID</Label>
                <ValueRow>
                  <Value title={instance.id}>{instance.id}</Value>
                  <CopyButton text={instance.id} tooltip="Copy instance ID" />
                </ValueRow>
              </Field>
              <Field>
                <Label>Name</Label>
                <ValueRow>
                  <Value title={instance.name ?? '—'}>
                    {instance.name ?? '—'}
                  </Value>
                  {instance.name ? (
                    <CopyButton text={instance.name} tooltip="Copy name" />
                  ) : null}
                </ValueRow>
              </Field>
            </IdGrid>
            {instance.bundle?.description ? (
              <Field>
                <Label>Description</Label>
                <Description>{instance.bundle.description}</Description>
              </Field>
            ) : null}
          </Section>

          <Section>
            <SectionHeaderRow>
              <Header>Version</Header>
              {changeVersionUrl && instance.status !== 'EXTERNAL' ? (
                <Tooltip
                  arrow
                  title="Change version in Massdriver"
                  placement="top"
                >
                  <HeaderLink
                    href={changeVersionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Change version in Massdriver"
                  >
                    <LinkIcon />
                  </HeaderLink>
                </Tooltip>
              ) : null}
            </SectionHeaderRow>
            <Card>
              {instance.status === 'EXTERNAL' ? (
                <ExternalNote>
                  You cannot edit the version of a remote reference instance.
                </ExternalNote>
              ) : (
                <>
                  {instance.bundle?.name ? (
                    <RowLine>
                      <RowLabel>Bundle</RowLabel>
                      <RowValueGroup>
                        <RowValue>{instance.bundle.name}</RowValue>
                        {repoUrl ? (
                          <Tooltip
                            arrow
                            title="View bundle in repository"
                            placement="top"
                          >
                            <RepoLink
                              href={repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="View bundle in repository"
                            >
                              <LinkIcon />
                            </RepoLink>
                          </Tooltip>
                        ) : null}
                      </RowValueGroup>
                    </RowLine>
                  ) : null}
                  <RowLine>
                    <RowLabel>Version</RowLabel>
                    <RowValueGroup>
                      <RowValue>
                        {instance.resolvedVersion
                          ? `v${instance.resolvedVersion}`
                          : '—'}
                      </RowValue>
                      {instance.availableUpgrade ? (
                        <Tooltip
                          arrow
                          title={`Upgrade available: v${instance.availableUpgrade}`}
                        >
                          <UpgradeBadge>
                            <UpArrow />
                          </UpgradeBadge>
                        </Tooltip>
                      ) : null}
                    </RowValueGroup>
                  </RowLine>
                  {releaseChannel ? (
                    <RowLine>
                      <RowLabel>Release channel</RowLabel>
                      <RowValue>{releaseChannel.channel}</RowValue>
                    </RowLine>
                  ) : null}
                </>
              )}
            </Card>
          </Section>

          <AttributesSection attributes={instance.effectiveAttributes} />

          <PropertiesSection
            status={instance.status}
            hasAnyProperties={properties.length > 0}
            view={propertiesView}
            search={search}
            onSearchChange={value2 => {
              setSearch(value2);
              setPage(1);
            }}
            onPrevPage={() => setPage(current => Math.max(1, current - 1))}
            onNextPage={() =>
              setPage(current =>
                Math.min(propertiesView.totalPages, current + 1),
              )
            }
          />
        </Root>
      ) : null}
    </TabState>
  );
};

export default OverviewTab;

const AttributesSection = ({ attributes }: { attributes: unknown }) => {
  const parsed = parseMap(attributes);
  const entries = parsed ? Object.entries(parsed) : [];
  return (
    <Section>
      <Header>Instance attributes</Header>
      <Card>
        {entries.length === 0 ? (
          <EmptyNote>No effective attributes.</EmptyNote>
        ) : (
          entries.map(([key, value]) => (
            <RowLine key={key}>
              <MonoLabel title={key}>{key}</MonoLabel>
              <MonoValue title={formatAttributeValue(value)}>
                {formatAttributeValue(value)}
              </MonoValue>
            </RowLine>
          ))
        )}
      </Card>
    </Section>
  );
};

const PropertiesSection = ({
  status,
  hasAnyProperties,
  view,
  search,
  onSearchChange,
  onPrevPage,
  onNextPage,
}: {
  status?: string | null;
  hasAnyProperties: boolean;
  view: { items: InstanceProperty[]; totalPages: number; page: number };
  search: string;
  onSearchChange: (value: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) => {
  const isInitialized = status === 'INITIALIZED';
  const isEmpty = view.items.length === 0;

  return (
    <Section>
      <Header>Resource properties</Header>
      {status === 'EXTERNAL' ? (
        <AlertBanner
          severity="info"
          description="These are properties of the remote reference resources."
        />
      ) : null}
      {isInitialized ? (
        <EmptyNote>
          You must provision this instance to see its created properties.
        </EmptyNote>
      ) : !hasAnyProperties ? (
        <EmptyNote>
          This instance has no properties because it does not produce any
          resources.
        </EmptyNote>
      ) : (
        <Card>
          <SearchField
            fullWidth
            size="small"
            placeholder="Search properties…"
            value={search}
            onChange={(event: any) => onSearchChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchAdornmentIcon />
                </InputAdornment>
              ),
            }}
          />
          {isEmpty ? (
            <EmptyNote>No properties match your search.</EmptyNote>
          ) : (
            <PropList>
              {view.items.map((property, index) => (
                <PropertyItem
                  key={`${property.name}-${property.path ?? index}`}
                  name={property.name}
                  path={property.path}
                  value={property.value}
                  isLast={index === view.items.length - 1}
                />
              ))}
            </PropList>
          )}
          {view.totalPages > 1 ? (
            <Pagination>
              <PageInfo>
                Page {view.page} of {view.totalPages}
              </PageInfo>
              <PaginationButtons>
                <PageButton
                  size="small"
                  onClick={onPrevPage}
                  disabled={view.page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon fontSize="small" />
                </PageButton>
                <PageButton
                  size="small"
                  onClick={onNextPage}
                  disabled={view.page === view.totalPages}
                  aria-label="Next page"
                >
                  <ChevronRightIcon fontSize="small" />
                </PageButton>
              </PaginationButtons>
            </Pagination>
          ) : null}
        </Card>
      )}
    </Section>
  );
};

const PropertyItem = ({
  name,
  path,
  value,
  isLast,
}: {
  name: string;
  path?: string | null;
  value: unknown;
  isLast: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const formatted = formatPropertyValue(value);
  const isMultiline = formatted.includes('\n') || formatted.length > 160;

  return (
    <PropContainer isLast={isLast}>
      <PropHeader>
        <PropContent>
          <PropName title={name}>{name}</PropName>
          {!expanded ? (
            <PropValueText title={formatted}>{formatted}</PropValueText>
          ) : null}
          {path ? <PropPath title={path}>{path}</PropPath> : null}
        </PropContent>
        <PropActions>
          {value != null ? (
            <CopyButton text={formatted} tooltip="Copy value" />
          ) : null}
          {isMultiline ? (
            <ExpandToggle
              expanded={expanded}
              onClick={() => setExpanded(prev => !prev)}
              size="small"
              aria-label={expanded ? 'Collapse value' : 'Expand value'}
            >
              <ExpandIcon fontSize="inherit" />
            </ExpandToggle>
          ) : null}
        </PropActions>
      </PropHeader>
      {expanded && isMultiline ? (
        <PropExpanded>
          <CodeBlock>{formatted}</CodeBlock>
        </PropExpanded>
      ) : null}
    </PropContainer>
  );
};

const Root = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
}));

const Section = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

const Header = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(14),
  fontWeight: theme.typography.fontWeightBold,
  color: theme.palette.text.primary,
}));

const SectionHeaderRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const HeaderLink = stylin('a')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  '&:hover': { color: theme.palette.primary.main },
}));

const RepoLink = stylin('a')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  '&:hover': { color: theme.palette.primary.main },
}));

const LinkIcon = stylin(OpenInNewIcon)({
  fontSize: 15,
});

const AlertList = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const IdGrid = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  gap: theme.spacing(2),
}));

const Field = stylin(Box)(({ theme }: { theme: any }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const Label = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.text.secondary,
}));

const ValueRow = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
}));

const Value = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
}));

const Description = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.primary,
  whiteSpace: 'pre-wrap',
}));

const Card = stylin(Box)(({ theme }: { theme: any }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 1,
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  overflow: 'hidden',
}));

const RowLine = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  minWidth: 0,
}));

const RowValueGroup = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const RowLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  minWidth: 110,
}));

const RowValue = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamilyMono,
}));

const MonoLabel = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
  minWidth: 110,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const MonoValue = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
}));

const ExternalNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

const UpgradeBadge = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  color: theme.palette.success.main,
}));

const UpArrow = stylin(ExpandCircleDownOutlinedIcon)({
  width: 16,
  height: 16,
  transform: 'rotate(180deg)',
});

const EmptyNote = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
}));

const SearchField = stylin(TextField)(({ theme }: { theme: any }) => ({
  [`.${outlinedInputClasses.root}`]: {
    fontSize: theme.typography.pxToRem(12),
    borderRadius: 0,
    '& fieldset': {
      border: 'none',
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '&:hover fieldset': { borderBottom: `1px solid ${theme.palette.divider}` },
    '&.Mui-focused fieldset': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  [`.${outlinedInputClasses.input}`]: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingRight: theme.spacing(1.5),
    paddingLeft: 0,
  },
}));

const SearchAdornmentIcon = stylin(SearchIcon)(({ theme }: { theme: any }) => ({
  fontSize: 18,
  color: theme.palette.text.disabled,
}));

const PropList = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
});

const Pagination = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
}));

const PageInfo = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  color: theme.palette.text.secondary,
}));

const PaginationButtons = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const PageButton = stylin(IconButton)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(0.25),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0.5,
  color: theme.palette.text.secondary,
}));

const PropContainer = stylin(Box, ['isLast'])(
  ({ theme, isLast }: { theme: any; isLast: boolean }) => ({
    borderBottom: isLast ? 'none' : `1px solid ${theme.palette.divider}`,
  }),
);

const PropHeader = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1, 1, 1.5),
  minHeight: 48,
}));

const PropContent = stylin(Box)({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

const PropName = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(12),
  fontWeight: 500,
  lineHeight: 1.4,
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const PropValueText = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(11),
  lineHeight: 1.4,
  marginTop: theme.spacing(0.25),
  color: theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const PropPath = stylin(Typography)(({ theme }: { theme: any }) => ({
  fontSize: theme.typography.pxToRem(10),
  lineHeight: 1.4,
  color: theme.palette.text.disabled,
  fontFamily: theme.typography.fontFamilyMono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const PropActions = stylin(Box)({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
});

const ExpandToggle = stylin(IconButton, ['expanded'])(
  ({ theme, expanded }: { theme: any; expanded: boolean }) => ({
    padding: theme.spacing(0.75),
    color: theme.palette.text.disabled,
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 150ms ease',
  }),
);

const ExpandIcon = stylin(ExpandCircleDownOutlinedIcon)({
  width: 18,
  height: 18,
});

const PropExpanded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(0, 1, 1, 1.5),
}));
