'use client';

import { useTranslations } from 'next-intl';

import { icon } from '@/config/icons';
import { useSignOut } from '@/core/auth/hooks/use-signout';
import { Button } from '@/ui/components/shadcn/button';

export default function SignOutButton() {
  const t = useTranslations();
  const { signOut } = useSignOut();

  return (
    <Button data-testid="logout-button" variant="outline" onClick={signOut}>
      {icon('logout', { 'aria-hidden': true })}
      {t('labels.logout')}
    </Button>
  );
}
