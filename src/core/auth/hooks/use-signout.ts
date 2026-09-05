'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { authClient } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';

export function useSignOut() {
  const router = useRouter();
  const t = useTranslations();

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success(t('hooks.useSignOut.success'));
          router.replace('/');
        },
      },
    });
  };

  return { signOut };
}
