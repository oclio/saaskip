import { getTranslations } from 'next-intl/server';

import PageLayout from '@/app/[locale]/(main)/_components/page-layout';
import { createPageMetadata } from '@/core/seo';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    namespace: 'pages.license',
    path: '/license',
  });
}

export default async function LicensePage() {
  const t = await getTranslations('pages.license');

  return <PageLayout title={t('title')}>{/* content */}</PageLayout>;
}
