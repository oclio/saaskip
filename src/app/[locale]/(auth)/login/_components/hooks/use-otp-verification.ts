'use client';

import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { authClient } from '@/core/auth/client';
import { renderStrong } from '@/core/i18n/helpers/render-rich';
import { useZodForm } from '@/ui/hooks/use-zod-form';

export function useOtpVerification() {
  const t = useTranslations();
  const locale = useLocale();
  const { isPending, isSubmitted, setIsPending, setIsSubmitted, email } =
    useLoginFormStore(
      useShallow((s) => ({
        isPending: s.isPending,
        isSubmitted: s.isSubmitted,
        setIsPending: s.setIsPending,
        setIsSubmitted: s.setIsSubmitted,
        email: s.email,
      })),
    );

  const router = useRouter();

  const otpSchema = z.object({
    code: z.string().length(6, { message: t('forms.errors.invalidCode') }),
  });

  const otpForm = useZodForm(otpSchema, {
    mode: 'onChange',
    defaultValues: {
      code: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof otpSchema>) => {
    setIsPending(true);
    setIsSubmitted(true);
    await authClient.signIn.emailOtp({
      email,
      otp: data.code,
      callbackURL: '/dashboard',
      fetchOptions: {
        onSuccess: () => {
          router.push('/dashboard');
        },
        onError: (context: unknown) => {
          const errorContext = context as { error?: { code?: string } };
          if (errorContext.error?.code === 'INVALID_OTP') {
            otpForm.setError('code', {
              message: t('forms.errors.invalidCode'),
            });
          } else {
            Sentry.captureException(context);
            toast.error(t('errors.somethingWentWrong'), {
              description: t('errors.unexpectedError'),
            });
            otpForm.reset();
          }

          setIsPending(false);
          setIsSubmitted(false);
        },
      },
    });
  };

  const handleResendOtp = async () => {
    setIsPending(true);
    setIsSubmitted(true);
    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
      fetchOptions: {
        headers: {
          'x-locale': locale,
        },
        onSuccess: () => {
          setIsPending(false);
          setIsSubmitted(false);
          toast.success(t('pages.login.codeSent.title'), {
            description: t.rich('pages.login.codeSent.description', {
              email,
              strong: renderStrong(),
            }),
          });
        },
        onError: (error: unknown) => {
          Sentry.captureException(error);
          toast.error(t('errors.somethingWentWrong'), {
            description: t('errors.unexpectedError'),
          });
          setIsPending(false);
          setIsSubmitted(false);
        },
      },
    });
  };

  return {
    otpForm,
    isPending,
    isSubmitted,
    email,
    handleSubmit,
    handleResendOtp,
  };
}
