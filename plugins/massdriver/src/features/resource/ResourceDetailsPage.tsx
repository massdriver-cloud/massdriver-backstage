import { useApi } from '@backstage/frontend-plugin-api';
import { resourceUrl } from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import IconButton from '@massdriver/ui/IconButton';
import IconTile from '@massdriver/ui/IconTile';
import PageTabs from '@massdriver/ui/PageTabs';
import Tooltip from '@massdriver/ui/Tooltip';
import DeleteIcon from '@massdriver/ui/icons/DeleteIcon';
import ExtensionIcon from '@massdriver/ui/icons/ExtensionIcon';
import stylin from '@massdriver/ui/stylin';
import useAsync from 'react-use/esm/useAsync';
import { useParams } from 'react-router-dom';
import { massdriverApiRef } from '../../api';
import { DisabledAction } from '../../components/DisabledAction';
import { NotFound } from '../../components/NotFound';
import { OpenInMassdriverButton } from '../../components/OpenInMassdriverButton';
import { PageLayout } from '../../components/PageLayout';
import { RouterLinkAdapter } from '../../components/RouterLinkAdapter';
import { internalRoutes } from '../../internalRoutes';
import {
  PROVISIONED_DELETE_TOOLTIP,
  PROVISIONED_EDIT_TOOLTIP,
} from '../resources/resourceConstants';
import { RESOURCE_HEADER_QUERY } from './queries';
import { GeneralTab } from './tabs/GeneralTab';
import { PermissionsTab } from './tabs/PermissionsTab';
import { UsageTab } from './tabs/UsageTab';

// Ported from apps/web/features/resources/pages/ResourceDetailsPage.js and
// utils/resourceTabs.js. The web app's Edit/Delete mutate: for imported
// resources they deep-link out to the resource in Massdriver; for provisioned
// resources they stay disabled with the web app's own tooltips (it disables
// them too).

const DELETE_TOOLTIP = 'Delete in Massdriver';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'usage', label: 'Usage' },
  { id: 'permissions', label: 'Permissions' },
];

const PANELS: Record<
  string,
  (props: {
    resourceId: string;
    resourceOrigin?: string | null;
  }) => JSX.Element | null
> = {
  general: GeneralTab,
  usage: UsageTab,
  permissions: PermissionsTab,
};

interface ResourceHeader {
  id: string;
  name: string;
  origin?: string | null;
  resourceType?: {
    id: string;
    name?: string | null;
    icon?: string | null;
  } | null;
}

/** Read-only resource details: vertical side-tabs mirroring the web app. */
export const ResourceDetailsPage = () => {
  const api = useApi(massdriverApiRef);
  const { resourceId: rawResourceId = '', tab } = useParams();
  const resourceId = decodeURIComponent(rawResourceId);
  const activeTab = TABS.some(entry => entry.id === tab) ? tab! : 'general';

  const {
    value: resource,
    loading,
    error,
  } = useAsync(async () => {
    const data = (await api.query(RESOURCE_HEADER_QUERY, {
      id: resourceId,
    })) as { resource: ResourceHeader | null };
    return data.resource;
  }, [api, resourceId]);

  if (!loading && !error && !resource) {
    return (
      <NotFound
        title="Resource not found"
        message="This resource doesn't exist or you don't have access to it."
      />
    );
  }

  const isProvisioned = resource?.origin === 'PROVISIONED';

  const tabs = TABS.map(entry => ({
    ...entry,
    href: internalRoutes.resourceTab(resourceId, entry.id),
  }));

  const titleNode = resource ? (
    <TitleRow>
      <IconTile
        src={resource.resourceType?.icon}
        alt={resource.resourceType?.name}
        size="medium"
        fallback={<ExtensionIcon />}
      />
      <TitleText>{resource.name}</TitleText>
    </TitleRow>
  ) : (
    ''
  );

  return (
    <PageLayout
      title={titleNode}
      description={resource?.resourceType?.name}
      headerActions={
        resource ? (
          <HeaderActions>
            <OpenInMassdriverButton
              url={resourceUrl(api.appUrl, api.organizationId, resourceId)}
              variant="outlined"
            >
              Open in Massdriver
            </OpenInMassdriverButton>
            {isProvisioned ? (
              <DisabledAction label="Edit" tooltip={PROVISIONED_EDIT_TOOLTIP} />
            ) : (
              <OpenInMassdriverButton
                url={resourceUrl(api.appUrl, api.organizationId, resourceId)}
                variant="outlined"
              >
                Edit
              </OpenInMassdriverButton>
            )}
            {/* Web renders Delete as a danger icon button; imported resources
                deep-link out, provisioned stay disabled like the web app. */}
            <Tooltip
              title={
                isProvisioned ? PROVISIONED_DELETE_TOOLTIP : DELETE_TOOLTIP
              }
              arrow
              placement="top"
            >
              <ButtonWrap>
                <DangerIconButton
                  aria-label="Delete resource"
                  disabled={isProvisioned}
                  {...(isProvisioned
                    ? {}
                    : {
                        href: resourceUrl(
                          api.appUrl,
                          api.organizationId,
                          resourceId,
                        ),
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      })}
                >
                  <DeleteIcon />
                </DangerIconButton>
              </ButtonWrap>
            </Tooltip>
          </HeaderActions>
        ) : null
      }
      flush
    >
      <PageTabs
        orientation="vertical"
        tabs={tabs}
        panels={PANELS}
        activeTab={activeTab}
        panelProps={{ resourceId, resourceOrigin: resource?.origin }}
        LinkComponent={RouterLinkAdapter}
      />
    </PageLayout>
  );
};

const TitleRow = stylin('span')(({ theme }: { theme: any }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const TitleText = stylin('span')({
  minWidth: 0,
  wordBreak: 'break-word',
});

const HeaderActions = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ButtonWrap = stylin('span')({
  display: 'inline-flex',
});

const DangerIconButton = stylin(IconButton)(({ theme }: { theme: any }) => ({
  '&:hover:not(:disabled)': {
    color: theme.palette.error.main,
  },
}));
