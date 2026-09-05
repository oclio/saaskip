import { getTranslations } from 'next-intl/server';

import PageLayout from '@/app/[locale]/(main)/_components/page-layout';
import { createPageMetadata } from '@/core/seo';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    namespace: 'pages.cookies',
    path: '/cookies',
  });
}

export default async function CookiesPage() {
  const t = await getTranslations('pages.cookies');

  return <PageLayout title={t('title')}>{/* content */}</PageLayout>;
}
