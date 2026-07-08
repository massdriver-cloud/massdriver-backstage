import { useApi } from '@backstage/frontend-plugin-api';
import { useSearchParams } from 'react-router-dom';
import {
  composeInstanceId,
  instanceUrl,
  parseEnvironmentId,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import Box from '@massdriver/ui/Box';
import Alert from '@massdriver/ui/Alert';
import LoadingIndicator from '@massdriver/ui/LoadingIndicator';
import stylin from '@massdriver/ui/stylin';
import { massdriverApiRef } from '../../../api';
import { NotFound } from '../../../components/NotFound';
import { useInstanceApiQuery } from './useInstanceApiQuery';
import { useResizableWidth } from './useResizableWidth';
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
  const { width, panelRef, onResizeStart } = useResizableWidth();

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
    <Panel ref={panelRef} style={{ width }}>
      <ResizeHandle onMouseDown={onResizeStart} data-testid="resize-handle" />
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
    </Panel>
  );
};

export default InstanceDrawer;

// Read-only panel pinned to the right edge of the environment graph. Uses a
// plain absolutely-positioned Box rather than @massdriver/ui/Drawer: MUI v5's
// Drawer relies on its Slide transition (and a Modal/portal for the temporary
// variant), which does not paint reliably inside Backstage's hybrid runtime
// (its own MUI v4 layer + the scoped `mdui` Emotion cache). Fixed width for now;
// a drag-to-resize handle can be reintroduced later. GraphArea is `position:
// relative`, so this anchors to it.
const Panel = stylin(Box)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  maxWidth: '100%',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
}));

const ResizeHandle = stylin(Box)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  width: theme.spacing(0.75),
  cursor: 'col-resize',
  zIndex: 1,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

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
