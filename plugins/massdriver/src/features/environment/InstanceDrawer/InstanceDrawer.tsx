import { useApi } from '@backstage/frontend-plugin-api';
import { useSearchParams } from 'react-router-dom';
import {
  composeInstanceId,
  instanceUrl,
  parseEnvironmentId,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Alert from '@massdriver/ui/Alert';
import Drawer from '@massdriver/ui/Drawer';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../../api';
import { NotFound } from '../../../components/NotFound';
import { useInstanceApiQuery } from './useInstanceApiQuery';
import { PANEL_QUERY } from './queries';
import { InstanceDrawerHeader } from './InstanceDrawerHeader';
import { InstanceTabs } from './InstanceTabs';
import OverviewTab from './tabs/OverviewTab';
import ResourcesTab from './tabs/ResourcesTab';
import DependenciesTab from './tabs/DependenciesTab';
import MonitorTab from './tabs/MonitorTab';
import HistoryTab from './tabs/HistoryTab';
import GuideTab from './tabs/GuideTab';
import SecretsTab from './tabs/SecretsTab';
import type { PanelInstance, SecretField } from './types';

const DEFAULT_TAB = 'overview';

// App tab order minus the omitted Config tab. Secrets is spliced in only when
// the instance declares secret fields (see below).
const BASE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'guide', label: 'Guide' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'resources', label: 'Resources' },
];

/**
 * Read-only instance drawer rendered over the environment graph. Opens when the
 * `scopedComponentId` route param is present (the `.../instances/:scopedComponentId`
 * sub-route, mirroring the web app); closing navigates back to the environment
 * route. The active tab is carried in the `?tab=` query param.
 */
export const InstanceDrawer = ({
  projectId,
  environmentId,
  scopedComponentId,
  onClose,
}: {
  projectId: string;
  environmentId: string;
  scopedComponentId?: string;
  onClose: () => void;
}) => {
  const api = useApi(massdriverApiRef);
  const [searchParams, setSearchParams] = useSearchParams();

  const isOpen = Boolean(scopedComponentId);
  const activeTab = searchParams.get('tab') || DEFAULT_TAB;

  const { scopedEnvironmentId } = parseEnvironmentId(environmentId);
  const fullInstanceId =
    isOpen && projectId && scopedEnvironmentId && scopedComponentId
      ? composeInstanceId(projectId, scopedEnvironmentId, scopedComponentId)
      : null;

  const { value, loading, error } = useInstanceApiQuery<{
    instance: PanelInstance | null;
  }>(PANEL_QUERY, fullInstanceId);
  const instance = value?.instance;

  const secretFields = (instance?.secretFields ?? []).filter(
    Boolean,
  ) as SecretField[];

  const tabs = secretFields.length
    ? [
        BASE_TABS[0],
        BASE_TABS[1],
        { id: 'secrets', label: 'Secrets' },
        ...BASE_TABS.slice(2),
      ]
    : BASE_TABS;

  const tabExists = tabs.some(tab => tab.id === activeTab);
  const resolvedTab = tabExists ? activeTab : DEFAULT_TAB;

  const handleClose = () => onClose();

  const handleTabChange = (tabId: string) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('tab', tabId);
      return next;
    });
  };

  const appUrl =
    fullInstanceId && api.appUrl
      ? `${instanceUrl(api.appUrl, api.organizationId, fullInstanceId)}?tab=${resolvedTab}`
      : '';

  const renderTab = () => {
    switch (resolvedTab) {
      case 'resources':
        return <ResourcesTab instanceId={fullInstanceId} />;
      case 'dependencies':
        return <DependenciesTab instanceId={fullInstanceId} />;
      case 'monitor':
        return <MonitorTab instanceId={fullInstanceId} />;
      case 'history':
        return <HistoryTab instanceId={fullInstanceId} />;
      case 'guide':
        return <GuideTab instanceId={fullInstanceId} />;
      case 'secrets':
        return <SecretsTab secretFields={secretFields} />;
      case 'overview':
      default:
        return <OverviewTab instanceId={fullInstanceId} />;
    }
  };

  if (!isOpen) return null;

  return (
    <StyledDrawer
      variant="permanent"
      anchor="right"
      resizable
      minWidth={575}
      defaultWidth={720}
    >
      <PanelContainer>
        <InstanceDrawerHeader
          instance={instance}
          appUrl={appUrl}
          onClose={handleClose}
        />
        {loading ? (
          <Centered>
            <LoadingIndicator />
          </Centered>
        ) : error ? (
          <Padded>
            <Alert severity="error">{String(error.message ?? error)}</Alert>
          </Padded>
        ) : !instance ? (
          <NotFound
            title="Instance not found"
            message="This instance doesn't exist or you don't have access to it."
          />
        ) : (
          <>
            <InstanceTabs
              tabs={tabs}
              activeTab={resolvedTab}
              onTabChange={handleTabChange}
            />
            <ContentArea role="tabpanel">{renderTab()}</ContentArea>
          </>
        )}
      </PanelContainer>
    </StyledDrawer>
  );
};

export default InstanceDrawer;

// Uses the real @massdriver/ui/Drawer (MUI v5) via the `permanent` variant.
// `persistent`/`temporary` wrap the paper in a Slide transition (and a
// Modal/portal), which does not settle visible inside Backstage's runtime,
// leaving the paper parked off-screen. `permanent` renders the paper with no
// transition. The drawer is mounted only while open (the `isOpen` guard above),
// and its paper is positioned absolutely over the graph (GraphArea is
// `position: relative`) rather than docked into the layout.
const StyledDrawer = stylin(Drawer)({
  '& .MuiDrawer-paper': {
    position: 'absolute',
    zIndex: 10,
  },
});

const PanelContainer = stylin(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

const ContentArea = stylin(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const Centered = stylin(Box)(({ theme }: { theme: any }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(6),
}));

const Padded = stylin(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
}));
