import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    priority,
    className,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    className?: string;
  }) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      data-priority={priority ? 'true' : 'false'}
      className={className}
    />
  ),
}));

vi.mock('next/error', () => ({
  default: ({ statusCode }: { statusCode: number }) => (
    <div data-testid="next-error" data-status-code={statusCode} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
