import { render } from '@testing-library/react';

import {
  renderBr,
  renderLink,
  renderSmall,
  renderStrong,
} from '../render-rich';

vi.mock('@/ui/helpers', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    'data-testid': testId,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={href} className={className} data-testid={testId}>
      {children}
    </a>
  ),
}));

describe('renderLink', () => {
  it('renders a Link with the given props and chunks as children', () => {
    const renderFunction = renderLink({
      href: 'https://example.com',
      className: 'test-link-class',
      'data-testid': 'test-link',
    });

    const { getByTestId } = render(<>{renderFunction('click here')}</>);

    const link = getByTestId('test-link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('class', 'test-link-class');
    expect(link).toHaveTextContent('click here');
  });

  it('renders a suffix after the chunks when provided', () => {
    const renderFunction = renderLink(
      { href: 'https://example.com', 'data-testid': 'test-link' },
      <span className="sr-only">(opens in new tab)</span>,
    );

    const { getByTestId } = render(<>{renderFunction('click here')}</>);

    const link = getByTestId('test-link');
    expect(link).toHaveTextContent('click here(opens in new tab)');
    expect(link).toHaveTextContent('(opens in new tab)');
  });
});

describe('renderStrong', () => {
  it('renders a strong element with the chunks as children', () => {
    const renderFunction = renderStrong();

    const { container } = render(<>{renderFunction('important text')}</>);

    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent('important text');
  });

  it('applies the font-bold class by default', () => {
    const renderFunction = renderStrong();

    const { container } = render(<>{renderFunction('text')}</>);

    expect(container.querySelector('strong')).toHaveClass('font-bold');
  });

  it('merges a custom className with font-bold', () => {
    const renderFunction = renderStrong('test-strong-class');

    const { container } = render(<>{renderFunction('text')}</>);

    expect(container.querySelector('strong')).toHaveClass('font-bold');
    expect(container.querySelector('strong')).toHaveClass('test-strong-class');
  });
});

describe('renderSmall', () => {
  it('renders a small element with the chunks as children', () => {
    const renderFunction = renderSmall();

    const { container } = render(<>{renderFunction('fine print')}</>);

    const small = container.querySelector('small');
    expect(small).not.toBeNull();
    expect(small).toHaveTextContent('fine print');
  });

  it('applies the given className', () => {
    const renderFunction = renderSmall('test-small-class');

    const { container } = render(<>{renderFunction('text')}</>);

    expect(container.querySelector('small')).toHaveClass('test-small-class');
  });
});

describe('renderBr', () => {
  it('returns a function that renders a br element', () => {
    const renderFunction = renderBr();

    const { container } = render(<>{renderFunction()}</>);

    expect(container.querySelector('br')).not.toBeNull();
  });

  it('returns the same function reference on every call', () => {
    expect(renderBr()).toBe(renderBr());
  });
});
