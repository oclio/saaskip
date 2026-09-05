import { getTranslations } from 'next-intl/server';

import SignOutButton from './_components/sign-out-button';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard.home');

  return (
    <div>
      <h1 data-testid="dashboard-title">{t('title')}</h1>
      <SignOutButton />
    </div>
  );
}
