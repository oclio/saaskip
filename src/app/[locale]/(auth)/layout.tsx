import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ReactNode } from 'react';

import { icon } from '@/config/icons';
import LocaleSwitcher from '@/core/i18n/components/locale-switcher';
import { renderLink } from '@/core/i18n/helpers/render-rich';
import { buttonVariants } from '@/ui/components/shadcn/button';
import ThemeToggle from '@/ui/components/theme-toggle';
import { cn } from '@/ui/helpers';

const legalLinkProps = {
  className: 'hover:text-foreground',
  target: '_blank',
  rel: 'noopener noreferrer',
};

interface Props {
  children: ReactNode;
}

export default async function AuthLayout({ children }: Readonly<Props>) {
  const t = await getTranslations();

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          {icon('back', { 'aria-hidden': true })}
          {t('labels.back')}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="text-muted-foreground mx-auto w-full max-w-md text-center text-xs text-balance">
        {t.rich(
          'pages.authLayout.byContinuing',
          Object.fromEntries(
            ['terms', 'privacy', 'cookies'].map((key) => [
              key,
              renderLink(
                { href: `/${key}`, ...legalLinkProps },
                <span className="sr-only" data-testid="sr-only-label">
                  {t('labels.opensInNewTab')}
                </span>,
              ),
            ]),
          ),
        )}
      </footer>
    </div>
  );
}
