import { renderInTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import { MassdriverThemeScope } from '../../../theme/MassdriverThemeScope';
import { SettingsTabLayout } from './SettingsTabLayout';
import { TabHeader } from './TabHeader';

const render = (node: JSX.Element) =>
  renderInTestApp(<MassdriverThemeScope>{node}</MassdriverThemeScope>);

describe('TabHeader', () => {
  it('renders the title, description, and actions', async () => {
    await render(
      <TabHeader
        title="Permissions"
        description="Share this resource with other environments."
        actions={<button type="button">Add permission</button>}
      />,
    );

    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(
      screen.getByText('Share this resource with other environments.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add permission' }),
    ).toBeInTheDocument();
  });

  it('omits the description and actions when not provided', async () => {
    await render(<TabHeader title="Usage" />);

    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('SettingsTabLayout', () => {
  it('renders its children', async () => {
    await render(
      <SettingsTabLayout>
        <span>tab body</span>
      </SettingsTabLayout>,
    );

    expect(screen.getByText('tab body')).toBeInTheDocument();
  });
});
