import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisabledAction } from './DisabledAction';

describe('DisabledAction', () => {
  it('renders the label on a disabled button', () => {
    render(<DisabledAction label="Propose" tooltip="Do this in Massdriver" />);

    const button = screen.getByRole('button', { name: 'Propose' });
    expect(button).toBeDisabled();
  });

  it('renders children when no label is given', () => {
    render(
      <DisabledAction tooltip="Do this in Massdriver">Deploy</DisabledAction>,
    );

    expect(screen.getByRole('button', { name: 'Deploy' })).toBeDisabled();
  });

  it('shows the explanatory tooltip on hover of the wrapper', async () => {
    const user = userEvent.setup();
    render(<DisabledAction label="Propose" tooltip="Do this in Massdriver" />);

    // The disabled button swallows pointer events, so the span wrapper carries
    // the hover — hover it to surface the tooltip.
    const wrapper = screen.getByRole('button', { name: 'Propose' })
      .parentElement as HTMLElement;
    await user.hover(wrapper);

    expect(
      await screen.findByRole('tooltip', { name: 'Do this in Massdriver' }),
    ).toBeInTheDocument();
  });
});
