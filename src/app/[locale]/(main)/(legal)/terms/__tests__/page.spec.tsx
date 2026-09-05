import { render, screen } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';

import { createPageMetadata } from '@/core/seo';

import TermsPage, { generateMetadata } from '../page';

vi.mock('@/core/seo', () => ({
  createPageMetadata: vi.fn(async () => ({
    title: 'mock-title',
    description: 'mock-description',
  })),
}));

describe('TermsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('delegates to createPageMetadata with the terms namespace', async () => {
      await generateMetadata({
        params: Promise.resolve({ locale: 'en' }),
      });

      expect(createPageMetadata).toHaveBeenCalledWith({
        locale: 'en',
        namespace: 'pages.terms',
        path: '/terms',
      });
    });

    it('returns the metadata from createPageMetadata', async () => {
      const result = await generateMetadata({
        params: Promise.resolve({ locale: 'en' }),
      });

      expect(result).toEqual({
        title: 'mock-title',
        description: 'mock-description',
      });
    });
  });

  describe('rendering', () => {
    it('renders the page title in an h1 heading', async () => {
      render(await TermsPage());

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).not.toBeEmptyDOMElement();
    });

    it('uses the pages.terms translation namespace', async () => {
      await TermsPage();

      expect(getTranslations).toHaveBeenCalledWith('pages.terms');
    });
  });
});
