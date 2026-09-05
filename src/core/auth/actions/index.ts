'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createElement } from 'react';

import { brand } from '@/config/brand';
import { env } from '@/core/env';
import { sendEmail } from '@/core/mailer';
import LoginVerificationCode from '@/emails/login-verification-code';

export async function sendVerificationOTPEmail(
  email: string,
  otp: string,
): Promise<void> {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';
  const t = await getTranslations({ locale });

  const labels = {
    preview: t('emails.loginVerificationCode.preview'),
    title: t('emails.loginVerificationCode.title'),
    greeting: t('emails.loginVerificationCode.greeting'),
    content: t('emails.loginVerificationCode.content', { brand: brand.title }),
    disclaimer: t('emails.loginVerificationCode.disclaimer'),
    footnote: t('emails.footer', { brand: brand.title }),
  };

  if (env.NODE_ENV === 'development') {
    console.log('\n┌────────────────────────────────────┐');
    console.log(`│ 🔑 [DEV] OTP Code detected: ${otp} │`);
    console.log('└────────────────────────────────────┘\n');
  }

  await sendEmail({
    to: email,
    subject: labels.preview,
    react: createElement(LoginVerificationCode, { code: otp, locale, labels }),
  });
}
