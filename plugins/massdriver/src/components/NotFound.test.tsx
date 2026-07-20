import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MassdriverThemeScope } from '../theme/MassdriverThemeScope';
import { NotFound } from './NotFound';

const renderInRouter = (element: React.ReactElement) =>
  render(
    <MemoryRouter>
      <MassdriverThemeScope>{element}</MassdriverThemeScope>
    </MemoryRouter>,
  );

describe('NotFound', () => {
  it('renders the default title and message', () => {
    renderInRouter(<NotFound />);

    expect(screen.getByText('Not found')).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't find what you were looking for/i),
    ).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    renderInRouter(
      <NotFound title="No such project" message="This project is gone." />,
    );

    expect(screen.getByText('No such project')).toBeInTheDocument();
    expect(screen.getByText('This project is gone.')).toBeInTheDocument();
  });

  it('links back to the projects list', () => {
    renderInRouter(<NotFound />);

    expect(
      screen.getByRole('link', { name: /back to projects/i }),
    ).toHaveAttribute('href', '/massdriver/projects');
  });
});
