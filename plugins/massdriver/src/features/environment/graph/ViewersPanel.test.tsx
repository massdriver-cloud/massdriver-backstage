import { render, screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import ViewersPanel from './ViewersPanel';
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
  cursor: null,
  focus: { kind: 'floating' },
  ...overrides,
});

describe('ViewersPanel', () => {
  it('renders nothing when no one is viewing', () => {
    usePresenceMock.mockReturnValue({ viewers: [] });
    const { container } = render(<ViewersPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one avatar per viewer with their initial', () => {
    usePresenceMock.mockReturnValue({
      viewers: [viewer(), viewer({ accountId: 'acct-2', firstName: 'Dana' })],
    });
    render(
      <MassdriverThemeScope>
        <ViewersPanel />
      </MassdriverThemeScope>,
    );
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('falls back to the email initial when there is no first name', () => {
    usePresenceMock.mockReturnValue({
      viewers: [viewer({ firstName: '', email: 'zoe@example.com' })],
    });
    render(
      <MassdriverThemeScope>
        <ViewersPanel />
      </MassdriverThemeScope>,
    );
    expect(screen.getByText('Z')).toBeInTheDocument();
  });
});
