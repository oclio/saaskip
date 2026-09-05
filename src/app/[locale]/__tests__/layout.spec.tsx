import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';

import { routing } from '@/core/i18n/routing';
import {
  createLayoutMetadata,
  createViewport,
  JsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from '@/core/seo';
import { fontHeading, fontSans } from '@/ui/fonts';

import RootLayout, {
  generateMetadata,
  generateStaticParams,
  viewport,
} from '../layout';

vi.mock('@/core/seo', () => ({
  createLayoutMetadata: vi.fn(async ({ locale }: { locale: string }) => ({
    title: `mock-title-${locale}`,
    description: 'mock-description',
  })),
  createViewport: vi.fn(() => ({
    width: 'device-width',
    initialScale: 1,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    ],
  })),
  JsonLdScript: vi.fn(({ data }: { data: Record<string, unknown> }) => (
    <script type="application/ld+json" data-testid="json-ld-script">
      {JSON.stringify(data)}
    </script>
  )),
  organizationJsonLd: vi.fn(() => ({ '@type': 'Organization' })),
  websiteJsonLd: vi.fn(() => ({ '@type': 'WebSite' })),
}));

const localeParameters = (locale: string) => ({
  params: Promise.resolve({ locale }),
});

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children', async () => {
    render(
      await RootLayout({
        children: <div>Test content</div>,
        ...localeParameters('en'),
      }),
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it.each(routing.locales)('sets html lang attribute to %s', async (locale) => {
    render(
      await RootLayout({
        children: <div>Content</div>,
        ...localeParameters(locale),
      }),
    );

    expect(document.documentElement).toHaveAttribute('lang', locale);
  });

  it('applies font variables to html element', async () => {
    render(
      await RootLayout({
        children: <div>Content</div>,
        ...localeParameters('en'),
      }),
    );

    const html = document.documentElement;
    expect(html).toHaveClass(fontSans.variable);
    expect(html).toHaveClass(fontHeading.variable);
  });

  it('fetches messages for the given locale', async () => {
    render(
      await RootLayout({
        children: <div>Content</div>,
        ...localeParameters('fr'),
      }),
    );

    expect(getMessages).toHaveBeenCalledWith({ locale: 'fr' });
  });

  it('throws notFound for an invalid locale', async () => {
    await expect(
      RootLayout({
        children: <div>Content</div>,
        ...localeParameters('invalid'),
      }),
    ).rejects.toThrow();

    expect(notFound).toHaveBeenCalledOnce();
  });

  it('renders both JsonLd scripts with website and organization data', async () => {
    render(
      await RootLayout({
        children: <div>Content</div>,
        ...localeParameters('en'),
      }),
    );

    const scripts = screen.getAllByTestId('json-ld-script');
    expect(scripts).toHaveLength(2);
    expect(websiteJsonLd).toHaveBeenCalledOnce();
    expect(organizationJsonLd).toHaveBeenCalledOnce();
    const passedData = vi
      .mocked(JsonLdScript)
      .mock.calls.map(([props]) => props.data);
    expect(passedData).toEqual([
      { '@type': 'WebSite' },
      { '@type': 'Organization' },
    ]);
  });
});

describe('generateStaticParams', () => {
  it('returns all supported locales', () => {
    const parameters = generateStaticParams();

    expect(parameters).toEqual(routing.locales.map((locale) => ({ locale })));
  });
});

describe('generateMetadata', () => {
  it('delegates to createLayoutMetadata with the locale', async () => {
    const result = await generateMetadata({
      params: Promise.resolve({ locale: 'fr' }),
    });

    expect(createLayoutMetadata).toHaveBeenCalledWith({ locale: 'fr' });
    expect(result).toEqual({
      title: 'mock-title-fr',
      description: 'mock-description',
    });
  });
});

describe('viewport', () => {
  it('is built from createViewport', () => {
    expect(viewport).toEqual(createViewport());
  });
});
