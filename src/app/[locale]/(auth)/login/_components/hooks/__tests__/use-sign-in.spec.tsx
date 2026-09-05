import * as Sentry from '@sentry/nextjs';
import { act, renderHook } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { brand } from '@/config/brand';
import { authClient } from '@/core/auth/client';
import { useZodForm } from '@/ui/hooks/use-zod-form';

import { useSignIn } from '../use-sign-in';

const goToMock = vi.fn();
const sendVerificationOtpMock = vi.fn();
const socialSignInMock = vi.fn();

vi.mock('@/core/auth/client', () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn((...arguments_: unknown[]) =>
        sendVerificationOtpMock(...arguments_),
      ),
    },
    signIn: {
      social: vi.fn((...arguments_: unknown[]) =>
        socialSignInMock(...arguments_),
      ),
    },
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const formResetMock = vi.fn();

vi.mock('@/ui/hooks/use-zod-form', () => ({
  useZodForm: vi.fn((schema: unknown, options: unknown) => ({
    __mock: 'form',
    __schema: schema,
    __options: options,
    reset: formResetMock,
    handleSubmit: vi.fn(
      (callback: (data: unknown) => void) => (data: unknown) => callback(data),
    ),
  })),
}));

describe('useSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    vi.mocked(t.rich).mockImplementation(() => 'rich-mock');
    useLoginFormStore.setState({
      isPending: false,
      isSubmitted: false,
      selectedProvider: undefined,
      email: '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns form, isPending, isSubmitted, selectedProvider, and both handlers', () => {
    const { result } = renderHook(() => useSignIn(goToMock));

    expect(result.current.form).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSubmitted).toBe(false);
    expect(result.current.selectedProvider).toBeUndefined();
    expect(typeof result.current.handleSignInEmail).toBe('function');
    expect(typeof result.current.handleSignInProvider).toBe('function');
  });

  it('creates the form with onTouched mode and the store email as default', () => {
    useLoginFormStore.setState({ email: 'stored@example.com' });

    renderHook(() => useSignIn(goToMock));

    expect(useZodForm).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        mode: 'onTouched',
        defaultValues: { email: 'stored@example.com' },
      }),
    );
  });

  it('builds a schema that rejects invalid email and accepts valid email', () => {
    renderHook(() => useSignIn(goToMock));

    const schema = vi.mocked(useZodForm).mock.calls[0][0] as {
      safeParse: (data: unknown) => {
        success: boolean;
        error?: { issues: { message: string }[] };
      };
    };

    expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(schema.safeParse({ email: 'user@example.com' }).success).toBe(true);

    const invalidResult = schema.safeParse({ email: 'not-an-email' });
    expect(invalidResult.error?.issues[0]?.message).toBe(
      'forms.errors.invalidEmail',
    );
  });

  describe('useEffect form reset', () => {
    it('resets the form with empty email on mount when email is empty', () => {
      renderHook(() => useSignIn(goToMock));

      expect(formResetMock).toHaveBeenCalledWith({ email: '' });
    });

    it('does not reset the form when selectedProvider is undefined and email is set', () => {
      useLoginFormStore.setState({
        email: 'stored@example.com',
        selectedProvider: undefined,
      });

      renderHook(() => useSignIn(goToMock));

      expect(formResetMock).not.toHaveBeenCalled();
    });

    it('resets the form when selectedProvider is set even if email is non-empty', () => {
      useLoginFormStore.setState({
        email: 'stored@example.com',
        selectedProvider: 'google',
      });

      renderHook(() => useSignIn(goToMock));

      expect(formResetMock).toHaveBeenCalledWith({ email: '' });
    });

    it('re-runs the effect and resets when selectedProvider becomes set after mount', () => {
      useLoginFormStore.setState({
        email: 'stored@example.com',
        selectedProvider: undefined,
      });

      const { rerender } = renderHook(() => useSignIn(goToMock));

      expect(formResetMock).not.toHaveBeenCalled();

      act(() => {
        useLoginFormStore.setState({ selectedProvider: 'google' });
      });
      rerender();

      expect(formResetMock).toHaveBeenCalledWith({ email: '' });
    });
  });

  describe('handleSignInEmail', () => {
    it('stores the email, sets pending/submitted, and calls sendVerificationOtp', async () => {
      sendVerificationOtpMock.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInEmail({ email: 'user@example.com' });
      });

      expect(useLoginFormStore.getState().email).toBe('user@example.com');
      const callArguments = vi.mocked(authClient.emailOtp.sendVerificationOtp)
        .mock.calls[0][0] as {
        type: string;
        fetchOptions: { headers: Record<string, string> };
      };

      expect(callArguments.type).toBe('sign-in');
      expect(callArguments.fetchOptions.headers['x-locale']).toBe('en');
    });

    it('sets isPending and isSubmitted to true before the async call resolves', async () => {
      const { promise, resolve } = Promise.withResolvers<unknown>();
      sendVerificationOtpMock.mockReturnValue(promise);

      const { result } = renderHook(() => useSignIn(goToMock));

      act(() => {
        result.current.handleSignInEmail({ email: 'user@example.com' });
      });

      expect(useLoginFormStore.getState().isPending).toBe(true);
      expect(useLoginFormStore.getState().isSubmitted).toBe(true);

      await act(async () => {
        resolve({ error: null });
      });
    });

    it('resets pending and submitted to false after the call completes', async () => {
      sendVerificationOtpMock.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInEmail({ email: 'user@example.com' });
      });

      expect(useLoginFormStore.getState().isPending).toBe(false);
      expect(useLoginFormStore.getState().isSubmitted).toBe(false);
    });

    it('shows a success toast and navigates to otpVerification when no error', async () => {
      const t = useTranslations();

      sendVerificationOtpMock.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInEmail({ email: 'user@example.com' });
      });

      expect(toast.success).toHaveBeenCalledWith(
        'pages.login.emailForm.otpSent',
        expect.objectContaining({
          description: 'pages.login.emailForm.otpSentDescription',
        }),
      );
      expect(t).toHaveBeenCalledWith(
        'pages.login.emailForm.otpSentDescription',
        { email: 'user@example.com' },
      );
      expect(goToMock).toHaveBeenCalledWith('otpVerification');
    });

    it('shows an unauthorized toast with brand title, clears email, and resets form on EMAIL_NOT_AUTHORIZED', async () => {
      const t = useTranslations();

      sendVerificationOtpMock.mockResolvedValue({
        error: { code: 'EMAIL_NOT_AUTHORIZED' },
      });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInEmail({ email: 'bad@example.com' });
      });

      expect(toast.error).toHaveBeenCalledWith(
        'pages.login.emailForm.emailNotAuthorized',
        expect.objectContaining({
          description: 'pages.login.emailForm.emailNotAuthorizedDescription',
        }),
      );
      expect(t).toHaveBeenCalledWith(
        'pages.login.emailForm.emailNotAuthorizedDescription',
        { brand: brand.title },
      );
      expect(useLoginFormStore.getState().email).toBe('');
      expect(formResetMock).toHaveBeenCalledWith();
      expect(goToMock).not.toHaveBeenCalled();
    });

    it('captures exception and shows a generic error toast on non-EMAIL_NOT_AUTHORIZED error', async () => {
      sendVerificationOtpMock.mockResolvedValue({
        error: { code: 'OTHER' },
      });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInEmail({ email: 'user@example.com' });
      });

      expect(Sentry.captureException).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'errors.title',
        expect.objectContaining({ description: 'errors.unexpectedError' }),
      );
      expect(goToMock).not.toHaveBeenCalled();
    });
  });

  describe('handleSignInProvider', () => {
    it.each(['google', 'github'] as const)(
      'sets the provider, clears email, sets pending/submitted, and calls signIn.social with %s',
      async (provider) => {
        socialSignInMock.mockResolvedValue(undefined);

        const { result } = renderHook(() => useSignIn(goToMock));

        await act(async () => {
          await result.current.handleSignInProvider(provider);
        });

        expect(useLoginFormStore.getState().selectedProvider).toBe(provider);
        expect(useLoginFormStore.getState().email).toBe('');
        expect(useLoginFormStore.getState().isPending).toBe(true);
        expect(useLoginFormStore.getState().isSubmitted).toBe(true);
        expect(authClient.signIn.social).toHaveBeenCalledWith(
          expect.objectContaining({
            provider,
            callbackURL: '/dashboard',
          }),
        );
      },
    );

    it('shows an error toast and resets the store on social sign-in error', async () => {
      socialSignInMock.mockImplementation((options) => {
        options.fetchOptions.onError();
        return Promise.resolve();
      });

      const { result } = renderHook(() => useSignIn(goToMock));

      await act(async () => {
        await result.current.handleSignInProvider('google');
      });

      expect(toast.error).toHaveBeenCalledWith(
        'errors.title',
        expect.objectContaining({ description: 'errors.unexpectedError' }),
      );
      expect(useLoginFormStore.getState().isPending).toBe(false);
      expect(useLoginFormStore.getState().isSubmitted).toBe(false);
      expect(useLoginFormStore.getState().selectedProvider).toBeUndefined();
    });
  });

  describe('useCallback dependency tracking', () => {
    it('recreates handleSignInEmail when a dependency changes between renders', () => {
      const { rerender, result } = renderHook(() => useSignIn(goToMock));
      const firstCallback = result.current.handleSignInEmail;

      rerender();

      expect(result.current.handleSignInEmail).not.toBe(firstCallback);
    });

    it('recreates handleSignInProvider when a dependency changes between renders', () => {
      const t1 = vi.fn((key: string) => key) as unknown as ReturnType<
        typeof useTranslations
      >;
      const t2 = vi.fn((key: string) => key) as unknown as ReturnType<
        typeof useTranslations
      >;
      vi.mocked(useTranslations)
        .mockReturnValueOnce(t1)
        .mockReturnValueOnce(t2);

      const { rerender, result } = renderHook(() => useSignIn(goToMock));
      const firstCallback = result.current.handleSignInProvider;

      rerender();

      expect(result.current.handleSignInProvider).not.toBe(firstCallback);
    });
  });
});
