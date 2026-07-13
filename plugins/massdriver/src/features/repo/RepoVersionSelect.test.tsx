import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MassdriverThemeScope } from '../../theme/MassdriverThemeScope';
import { RepoVersionSelect } from './RepoVersionSelect';

const repoFixture = {
  releaseChannels: {
    items: [
      { name: 'latest', tag: '1.2.3' },
      { name: '~1', tag: '1.2.3' },
      { name: 'latest+dev', tag: '1.3.0-dev.20240701T120000Z' },
    ],
  },
  tags: {
    items: [
      { tag: '1.2.3', createdAt: '2024-06-01' },
      { tag: '1.2.2', createdAt: '2024-05-01' },
      { tag: '1.3.0-dev.20240701T120000Z', createdAt: '2024-07-01' },
    ],
  },
};

const renderSelect = (props: Record<string, unknown> = {}) =>
  render(
    <MassdriverThemeScope>
      <RepoVersionSelect
        repo={repoFixture}
        currentVersion="1.2.3"
        onChange={() => {}}
        {...props}
      />
    </MassdriverThemeScope>,
  );

describe('RepoVersionSelect', () => {
  it('renders the channel-aware label for the current version', () => {
    renderSelect({ currentVersion: '1.2.3' });
    expect(
      screen.getByRole('button', { name: /latest \(v1\.2\.3\)/i }),
    ).toBeInTheDocument();
  });

  it('renders "All versions" when currentVersion is "all"', () => {
    renderSelect({ currentVersion: 'all' });
    expect(
      screen.getByRole('button', { name: /all versions/i }),
    ).toBeInTheDocument();
  });

  it('falls back to v<tag> when no channel resolves to the current version', () => {
    renderSelect({ currentVersion: '1.2.2' });
    expect(
      screen.getByRole('button', { name: /v1\.2\.2/i }),
    ).toBeInTheDocument();
  });

  it('lists stable channels and tags, hiding dev entries by default', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');

    expect(within(menu).getByText(/all versions/i)).toBeInTheDocument();
    expect(within(menu).getByText(/latest \(v1\.2\.3\)/i)).toBeInTheDocument();
    expect(within(menu).getByText('v1.2.2')).toBeInTheDocument();
    expect(within(menu).queryByText(/latest\+dev/i)).not.toBeInTheDocument();
  });

  it('reveals dev channels via the channels toggle', async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByLabelText(/show development channels/i));

    expect(
      screen.getByText(/latest\+dev \(v1\.3\.0-dev\.20240701T120000Z\)/i),
    ).toBeInTheDocument();
  });

  it('calls onChange with the selected version', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderSelect({ onChange, currentVersion: '1.2.3' });

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('v1.2.2'));

    expect(onChange).toHaveBeenCalledWith('1.2.2');
  });

  it('skips onChange when the user picks the current version', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderSelect({ onChange, currentVersion: '1.2.3' });

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('v1.2.3'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables the trigger when no repo data is available', () => {
    renderSelect({ repo: null });
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
