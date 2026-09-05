import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ProviderType = 'google' | 'github';

interface LoginFormState {
  isPending: boolean;
  isSubmitted: boolean;
  selectedProvider: ProviderType | undefined;
  email: string;

  setIsPending: (isPending: boolean) => void;
  setIsSubmitted: (isSubmitted: boolean) => void;
  setProvider: (provider: ProviderType | undefined) => void;
  setEmail: (email: string) => void;
  reset: () => void;
}

export const useLoginFormStore = create<LoginFormState>()(
  devtools((set) => ({
    isPending: false,
    isSubmitted: false,
    selectedProvider: undefined,
    email: '',

    setIsPending: (isPending: boolean) =>
      set({ isPending }, false, 'login-form/setIsPending'),

    setIsSubmitted: (isSubmitted: boolean) =>
      set({ isSubmitted }, false, 'login-form/setIsSubmitted'),

    setProvider: (provider: ProviderType | undefined) =>
      set({ selectedProvider: provider }, false, 'login-form/setProvider'),

    setEmail: (email: string) => set({ email }, false, 'login-form/setEmail'),

    reset: () =>
      set(
        {
          isPending: false,
          isSubmitted: false,
          selectedProvider: undefined,
          email: '',
        },
        false,
        'login-form/reset',
      ),
  })) as unknown as StateCreator<LoginFormState, [], []>,
);
