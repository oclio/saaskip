import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import LoginForm from '@/app/[locale]/(auth)/login/_components/login-form';
import { createPageMetadata } from '@/core/seo';
import Logo from '@/ui/components/logo';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/components/shadcn/card';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    namespace: 'pages.login',
    path: '/login',
  });
}

export default async function LoginPage() {
  const t = await getTranslations('pages.login');

  return (
    <Card>
      <CardHeader className="gap-5">
        <Logo />
        <CardTitle className="page-title">
          <h1>{t('title')}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
