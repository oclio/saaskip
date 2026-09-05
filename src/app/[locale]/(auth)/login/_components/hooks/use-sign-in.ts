'use client';

import * as Sentry from '@sentry/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import type { ProviderType } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { brand } from '@/config/brand';
import { authClient } from '@/core/auth/client';
import { useZodForm } from '@/ui/hooks/use-zod-form';

export function useSignIn(goTo: (stepId: string) => void) {
  const t = useTranslations();
  const locale = useLocale();
  const {
    isPending,
    isSubmitted,
    selectedProvider,
    email,
    setEmail,
    setProvider,
    setIsPending,
    setIsSubmitted,
    reset,
  } = useLoginFormStore(
    useShallow((s) => ({
      isPending: s.isPending,
      isSubmitted: s.isSubmitted,
      selectedProvider: s.selectedProvider,
      email: s.email,
      setEmail: s.setEmail,
      setProvider: s.setProvider,
      setIsPending: s.setIsPending,
      setIsSubmitted: s.setIsSubmitted,
      reset: s.reset,
    })),
  );

  const schema = z.object({
    email: z.email({ error: t('forms.errors.invalidEmail') }),
  });

  const form = useZodForm(schema, {
    mode: 'onTouched',
    defaultValues: {
      email,
    },
  });

  useEffect(() => {
    if (selectedProvider || !email) {
      form.reset({ email: '' });
    }
  }, [selectedProvider, email, form]);

  const handleSignInEmail = useCallback(
    async (data: z.infer<typeof schema>) => {
      const { email } = data;
      setEmail(email);
      setIsPending(true);
      setIsSubmitted(true);

      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
        fetchOptions: {
          headers: {
            'x-locale': locale,
          },
        },
      });

      setIsPending(false);
      setIsSubmitted(false);

      if (error) {
        const isUnauthorized = error.code === 'EMAIL_NOT_AUTHORIZED';

        if (isUnauthorized) {
          toast.error(t('pages.login.emailForm.emailNotAuthorized'), {
            description: t(
              'pages.login.emailForm.emailNotAuthorizedDescription',
              { brand: brand.title },
            ),
            duration: 10_000,
          });
          setEmail('');
          form.reset();
        } else {
          Sentry.captureException(error);
          toast.error(t('errors.title'), {
            description: t('errors.unexpectedError'),
          });
        }
        return;
      }

      toast.success(t('pages.login.emailForm.otpSent'), {
        description: t('pages.login.emailForm.otpSentDescription', { email }),
      });

      goTo('otpVerification');
    },
    [t, locale, setEmail, setIsPending, setIsSubmitted, goTo, form],
  );

  const handleSignInProvider = useCallback(
    async (provider: ProviderType) => {
      setProvider(provider);
      setEmail('');
      setIsPending(true);
      setIsSubmitted(true);

      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
        fetchOptions: {
          onError: () => {
            toast.error(t('errors.title'), {
              description: t('errors.unexpectedError'),
            });
            reset();
          },
        },
      });
    },
    [t, setProvider, setEmail, setIsPending, setIsSubmitted, reset],
  );

  return {
    form,
    isPending,
    isSubmitted,
    selectedProvider,
    handleSignInEmail,
    handleSignInProvider,
  };
}
