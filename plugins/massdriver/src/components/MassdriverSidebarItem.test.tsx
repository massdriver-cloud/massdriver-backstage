import { renderInTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import { Sidebar } from '@backstage/core-components';
import { MassdriverSidebarItem } from './MassdriverSidebarItem';

describe('MassdriverSidebarItem', () => {
  it('renders a sidebar entry linking to the projects list', async () => {
    await renderInTestApp(
      <Sidebar>
        <MassdriverSidebarItem />
      </Sidebar>,
    );

    const links = screen.getAllByRole('link');
    const hrefs = links.map(link => link.getAttribute('href'));
    expect(hrefs).toContain('/massdriver/projects');
  });
});
