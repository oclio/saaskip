import { render, screen } from '@testing-library/react';
import { getTranslations } from 'next-intl/server';

import DashboardPage from '../page';

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title in an h1 heading', async () => {
      render(await DashboardPage());

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).not.toBeEmptyDOMElement();
    });

    it('uses the dashboard.home translation namespace', async () => {
      await DashboardPage();

      expect(getTranslations).toHaveBeenCalledWith('dashboard.home');
    });
  });
});
