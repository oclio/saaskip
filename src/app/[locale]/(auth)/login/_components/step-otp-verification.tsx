'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useTranslations } from 'next-intl';

import { useOtpVerification } from '@/app/[locale]/(auth)/login/_components/hooks/use-otp-verification';
import { renderStrong } from '@/core/i18n/helpers/render-rich';
import CountdownButton from '@/ui/components/forms/countdown-button';
import type { StepComponentProps } from '@/ui/components/forms/multi-step-form';
import OtpField from '@/ui/components/forms/otp-field';
import PendingButton from '@/ui/components/forms/pending-button';
import { Button } from '@/ui/components/shadcn/button';
import { FieldGroup } from '@/ui/components/shadcn/field';

export default function StepOtpVerification({
  goTo,
}: Readonly<StepComponentProps>) {
  const t = useTranslations();
  const {
    otpForm,
    isPending,
    isSubmitted,
    email,
    handleSubmit,
    handleResendOtp,
  } = useOtpVerification();

  return (
    <form onSubmit={otpForm.handleSubmit(handleSubmit)} noValidate={true}>
      <FieldGroup className="gap-3">
        <p className="text-muted-foreground text-center text-sm">
          {t.rich('pages.login.codeSent.description', {
            email,
            strong: renderStrong(),
          })}
        </p>

        <OtpField
          name="code"
          control={otpForm.control}
          label={t('pages.login.codeLabel')}
          labelClassName="required"
          disabled={isPending || isSubmitted}
          onComplete={() => otpForm.handleSubmit(handleSubmit)()}
          pattern={REGEXP_ONLY_DIGITS}
          data-testid="otp-input"
        />

        <PendingButton
          data-testid="verify-button"
          pending={isPending}
          disabled={!otpForm.formState.isValid || isSubmitted || isPending}
          pendingLabel={t('pages.login.verifyCode')}
        >
          {t('pages.login.verifyCode')}
        </PendingButton>

        <div className="flex flex-col items-center gap-2">
          <CountdownButton
            data-testid="resend-button"
            variant="outline"
            seconds={60}
            onAction={handleResendOtp}
            label={t('pages.login.resendCode')}
            disabled={isPending || isSubmitted}
            className="w-full"
          />

          <Button
            data-testid="back-to-email"
            variant="link"
            size="sm"
            disabled={isPending || isSubmitted}
            onClick={() => goTo('login')}
            className="text-muted-foreground pt-2"
          >
            {t('pages.login.backToEmail')}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
