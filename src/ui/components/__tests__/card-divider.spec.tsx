import { render, screen } from '@testing-library/react';

import CardDivider from '../card-divider';

describe('CardDivider', () => {
  it('renders a span with the label when provided', () => {
    render(<CardDivider label="or" />);

    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it.each([
    { name: 'undefined', label: undefined },
    { name: 'empty string', label: '' },
  ])('does not render a span when label is $name', ({ label }) => {
    const { container } = render(<CardDivider label={label} />);

    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('merges custom className with the base classes', () => {
    const { container } = render(<CardDivider className="test-custom-class" />);

    expect(container.firstChild).toHaveClass('test-custom-class');
  });
});
