import { getTranslations } from 'next-intl/server';

import PageLayout from '@/app/[locale]/(main)/_components/page-layout';
import { createPageMetadata } from '@/core/seo';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    namespace: 'pages.privacy',
    path: '/privacy',
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations('pages.privacy');

  return <PageLayout title={t('title')}>{/* content */}</PageLayout>;
}
