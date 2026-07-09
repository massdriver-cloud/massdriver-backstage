import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import NodeViewersBadge from './NodeViewersBadge';
import { usePresence, type PresenceViewer } from '../realtime/PresenceProvider';

jest.mock('../realtime/PresenceProvider', () => ({
  ...jest.requireActual('../realtime/PresenceProvider'),
  usePresence: jest.fn(),
}));

const usePresenceMock = usePresence as jest.MockedFunction<typeof usePresence>;

const viewer = (overrides: Partial<PresenceViewer> = {}): PresenceViewer => ({
  accountId: 'acct-1',
  firstName: 'Joe',
  email: 'joe@example.com',
  avatarUrl: null,
  cursor: { x: 1, y: 2, packageIdentifier: 'proj-cache' },
  focus: { kind: 'node', nodeId: 'proj-cache' },
  ...overrides,
});

describe('NodeViewersBadge', () => {
  it('renders nothing when no viewer is focused on the node', () => {
    usePresenceMock.mockReturnValue({
      viewers: [viewer({ focus: { kind: 'floating' } })],
    });
    const { container } = render(<NodeViewersBadge nodeId="proj-cache" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders avatars only for viewers focused on this node', () => {
    usePresenceMock.mockReturnValue({
      viewers: [
        viewer(),
        viewer({
          accountId: 'acct-2',
          firstName: 'Dana',
          focus: { kind: 'node', nodeId: 'proj-other' },
        }),
      ],
    });
    render(
      <MassdriverThemeScope>
        <NodeViewersBadge nodeId="proj-cache" />
      </MassdriverThemeScope>,
    );
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
  });
});
