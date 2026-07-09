import { render, screen, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/frontend-test-utils';
import { massdriverApiRef, MassdriverApi } from '../../../api';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import InstanceStatusPill from './InstanceStatusPill';

const latestDeployment = (
  action: string | null,
  status: string | null,
): unknown => ({
  deployments: {
    items: action || status ? [{ id: 'dep-1', action, status }] : [],
  },
});

const createMockApi = (queryResult: unknown = { deployments: { items: [] } }) =>
  ({
    appUrl: 'https://app.massdriver.cloud',
    organizationId: 'org-1',
    query: jest.fn().mockResolvedValue(queryResult),
    subscribe: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MassdriverApi>);

// The pill's styled chip reads Massdriver theme keys, and instance mode needs
// the relay api, so render within both scopes.
const renderPill = (element: React.ReactElement, api = createMockApi()) => {
  render(
    <TestApiProvider apis={[[massdriverApiRef, api]]}>
      <MassdriverThemeScope>{element}</MassdriverThemeScope>
    </TestApiProvider>,
  );
  return api;
};

describe('InstanceStatusPill', () => {
  describe('status mode', () => {
    it.each([
      ['INITIALIZED', 'Initialized'],
      ['PROVISIONED', 'Provisioned'],
      ['DECOMMISSIONED', 'Decommissioned'],
      ['EXTERNAL', 'Remote Reference'],
      ['FAILED', 'Deployment Failed'],
    ])('renders the human label for %s', (status, label) => {
      renderPill(<InstanceStatusPill status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it.each([
      ['PROVISION_RUNNING', 'Provision Running'],
      ['PROVISION_PENDING', 'Provision Pending'],
      ['PROVISION_COMPLETED', 'Provisioned'],
      ['PROVISION_FAILED', 'Provisioning Failed'],
      ['DECOMMISSION_RUNNING', 'Decommission Running'],
      ['PLAN_COMPLETED', 'Planned'],
    ])('renders the compound label for %s', (status, label) => {
      renderPill(<InstanceStatusPill status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('renders an em dash when the status is missing', () => {
      renderPill(<InstanceStatusPill status={null} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('does not query when only a status is given', () => {
      const api = renderPill(<InstanceStatusPill status="PROVISIONED" />);
      expect(api.query).not.toHaveBeenCalled();
    });
  });

  describe('instance mode', () => {
    it('shows the compound status while the latest deployment is active', async () => {
      renderPill(
        <InstanceStatusPill
          instance={{ id: 'proj-env-cache', status: 'PROVISIONED' }}
        />,
        createMockApi(latestDeployment('PROVISION', 'RUNNING')),
      );

      await waitFor(() =>
        expect(screen.getByText('Provision Running')).toBeInTheDocument(),
      );
    });

    it('falls back to the stored status when the latest deployment is terminal', async () => {
      const api = createMockApi(latestDeployment('PROVISION', 'COMPLETED'));
      renderPill(
        <InstanceStatusPill
          instance={{ id: 'proj-env-cache', status: 'PROVISIONED' }}
        />,
        api,
      );

      await waitFor(() => expect(api.query).toHaveBeenCalled());
      expect(screen.getByText('Provisioned')).toBeInTheDocument();
    });

    it('ignores PROPOSED deployments (awaiting human action)', async () => {
      const api = createMockApi(latestDeployment('PROVISION', 'PROPOSED'));
      renderPill(
        <InstanceStatusPill
          instance={{ id: 'proj-env-cache', status: 'INITIALIZED' }}
        />,
        api,
      );

      await waitFor(() => expect(api.query).toHaveBeenCalled());
      expect(screen.getByText('Initialized')).toBeInTheDocument();
    });

    it('degrades to the stored status while the deployment query loads', () => {
      const api = createMockApi();
      api.query.mockReturnValue(new Promise(() => {}));
      renderPill(
        <InstanceStatusPill
          instance={{ id: 'proj-env-cache', status: 'PROVISIONED' }}
        />,
        api,
      );

      expect(screen.getByText('Provisioned')).toBeInTheDocument();
    });

    it('queries the latest deployment for the instance', async () => {
      const api = renderPill(
        <InstanceStatusPill
          instance={{ id: 'proj-env-cache', status: 'PROVISIONED' }}
        />,
      );

      await waitFor(() => expect(api.query).toHaveBeenCalledTimes(1));
      expect(api.query.mock.calls[0][1]).toEqual({
        instanceId: 'proj-env-cache',
      });
    });
  });
});
