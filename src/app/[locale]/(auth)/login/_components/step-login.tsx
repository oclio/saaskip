'use client';

import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

import { useSignIn } from '@/app/[locale]/(auth)/login/_components/hooks/use-sign-in';
import type { ProviderType } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { brand } from '@/config/brand';
import { icon } from '@/config/icons';
import HorizontalDivider from '@/ui/components/card-divider';
import type { StepComponentProps } from '@/ui/components/forms/multi-step-form';
import PendingButton from '@/ui/components/forms/pending-button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/ui/components/shadcn/field';
import { Input } from '@/ui/components/shadcn/input';
import { cn } from '@/ui/helpers';

const providers = [
  {
    name: 'google',
    title: 'Google',
    icon: icon('socialGoogle'),
  },
  {
    name: 'github',
    title: 'GitHub',
    icon: icon('socialGithub'),
  },
];

export default function StepLogin({ goTo }: Readonly<StepComponentProps>) {
  const t = useTranslations();
  const {
    form,
    isPending,
    isSubmitted,
    selectedProvider,
    handleSignInEmail,
    handleSignInProvider,
  } = useSignIn(goTo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground">
          {t('pages.login.socialProviders.description', { brand: brand.title })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {providers.map((provider) => (
            <PendingButton
              onClick={() =>
                handleSignInProvider(provider.name as ProviderType)
              }
              pending={isPending && selectedProvider === provider.name}
              disabled={isSubmitted || isPending}
              pendingLabel={provider.title}
              variant="outline"
              title={t('pages.login.socialProviders.signInWith', {
                provider: provider.title,
              })}
              key={provider.name}
            >
              {provider.icon}
            </PendingButton>
          ))}
        </div>
      </div>

      <HorizontalDivider label={t('pages.login.orContinueWith')} />

      <form onSubmit={form.handleSubmit(handleSignInEmail)} noValidate={true}>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-4">
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor="email"
                    className={cn('required', {
                      disabled: isPending || isSubmitted,
                    })}
                  >
                    {t('forms.labels.yourEmail')}
                  </FieldLabel>

                  <Input
                    {...field}
                    data-testid="email-input"
                    disabled={isPending || isSubmitted}
                    aria-invalid={fieldState.invalid}
                    placeholder={`${t('forms.placeholders.email')}...`}
                    autoComplete="email"
                  />
                  {(form.formState.isSubmitted || fieldState.isDirty) && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>

                <PendingButton
                  type="submit"
                  data-testid="submit-email-button"
                  pending={isPending && !selectedProvider}
                  disabled={!form.formState.isValid || isSubmitted}
                  pendingLabel={t('pages.login.emailForm.receiveACode')}
                >
                  {t('pages.login.emailForm.receiveACode')}
                </PendingButton>
              </Field>
            )}
          />
        </FieldGroup>
      </form>
    </div>
  );
}
