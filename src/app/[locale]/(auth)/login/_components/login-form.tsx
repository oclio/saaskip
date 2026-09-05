'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import StepLogin from '@/app/[locale]/(auth)/login/_components/step-login';
import StepOtpVerification from '@/app/[locale]/(auth)/login/_components/step-otp-verification';
import { brand } from '@/config/brand';
import { MultiStepForm } from '@/ui/components/forms/multi-step-form';

const steps = [
  { id: 'login', component: StepLogin },
  { id: 'otpVerification', component: StepOtpVerification },
];

export default function LoginForm() {
  const [activeStep, setActiveStep] = useState('login');
  const reset = useLoginFormStore((s) => s.reset);
  const searchParameters = useSearchParams();
  const t = useTranslations();

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (searchParameters.get('error') === 'UNAUTHORIZED_EMAIL') {
      toast.error(t('pages.login.emailForm.emailNotAuthorized'), {
        description: t('pages.login.emailForm.emailNotAuthorizedDescription', {
          brand: brand.title,
        }),
        duration: 10_000,
      });
    }
  }, [searchParameters, t]);

  return (
    <MultiStepForm
      steps={steps}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      progressBar={false}
    />
  );
}
