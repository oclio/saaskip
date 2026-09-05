import * as Sentry from '@sentry/nextjs';
import { act, renderHook } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { authClient } from '@/core/auth/client';
import { renderStrong } from '@/core/i18n/helpers/render-rich';
import { useZodForm } from '@/ui/hooks/use-zod-form';

import { useOtpVerification } from '../use-otp-verification';

const routerPushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPushMock }),
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

const emailOtpSignInMock = vi.fn();
const sendVerificationOtpMock = vi.fn();

vi.mock('@/core/auth/client', () => ({
  authClient: {
    signIn: {
      emailOtp: vi.fn((...arguments_: unknown[]) =>
        emailOtpSignInMock(...arguments_),
      ),
    },
    emailOtp: {
      sendVerificationOtp: vi.fn((...arguments_: unknown[]) =>
        sendVerificationOtpMock(...arguments_),
      ),
    },
  },
}));

const renderStrongFunction = (chunks: unknown) => chunks;

vi.mock('@/core/i18n/helpers/render-rich', () => ({
  renderStrong: vi.fn(() => renderStrongFunction),
}));

vi.mock('@/ui/hooks/use-zod-form', () => ({
  useZodForm: vi.fn((schema: unknown, options: unknown) => ({
    __mock: 'form',
    __schema: schema,
    __options: options,
    setError: vi.fn(),
    reset: vi.fn(),
    handleSubmit: vi.fn(
      (callback: (data: unknown) => void) => (data: unknown) => callback(data),
    ),
  })),
}));

describe('useOtpVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    vi.mocked(t.rich).mockImplementation(() => 'rich-mock');
    useLoginFormStore.setState({
      isPending: false,
      isSubmitted: false,
      selectedProvider: undefined,
      email: 'user@example.com',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns otpForm, isPending, isSubmitted, email, handleSubmit, and handleResendOtp', () => {
    const { result } = renderHook(() => useOtpVerification());

    expect(result.current.otpForm).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSubmitted).toBe(false);
    expect(result.current.email).toBe('user@example.com');
    expect(typeof result.current.handleSubmit).toBe('function');
    expect(typeof result.current.handleResendOtp).toBe('function');
  });

  it('creates the form with onChange mode and empty code default', () => {
    const t = useTranslations();

    renderHook(() => useOtpVerification());

    expect(useZodForm).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        mode: 'onChange',
        defaultValues: { code: '' },
      }),
    );
    expect(t).toHaveBeenCalledWith('forms.errors.invalidCode');
  });

  it('builds a schema that rejects missing code and short code with the invalidCode message', () => {
    renderHook(() => useOtpVerification());

    const schema = vi.mocked(useZodForm).mock.calls[0][0] as {
      safeParse: (data: unknown) => {
        success: boolean;
        error?: { issues: { message: string }[] };
      };
    };

    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ code: '123' }).success).toBe(false);
    expect(schema.safeParse({ code: '123456' }).success).toBe(true);

    const shortCodeResult = schema.safeParse({ code: '123' });
    expect(shortCodeResult.error?.issues[0]?.message).toBe(
      'forms.errors.invalidCode',
    );
  });

  describe('handleSubmit', () => {
    it('calls authClient.signIn.emailOtp with email, code, and callbackURL', async () => {
      emailOtpSignInMock.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleSubmit({ code: '123456' });
      });

      expect(authClient.signIn.emailOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          otp: '123456',
          callbackURL: '/dashboard',
        }),
      );
    });

    it('sets isPending and isSubmitted to true before the async call resolves', async () => {
      const { promise, resolve } = Promise.withResolvers<undefined>();
      emailOtpSignInMock.mockReturnValue(promise);

      const { result } = renderHook(() => useOtpVerification());

      act(() => {
        result.current.handleSubmit({ code: '123456' });
      });

      expect(useLoginFormStore.getState().isPending).toBe(true);
      expect(useLoginFormStore.getState().isSubmitted).toBe(true);

      await act(async () => {
        resolve(undefined);
      });
    });

    it('redirects to /dashboard on success', async () => {
      emailOtpSignInMock.mockImplementation((options) => {
        options.fetchOptions.onSuccess();
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleSubmit({ code: '123456' });
      });

      expect(routerPushMock).toHaveBeenCalledWith('/dashboard');
    });

    it('sets a field error with the invalidCode translation on INVALID_OTP', async () => {
      emailOtpSignInMock.mockImplementation((options) => {
        options.fetchOptions.onError({ error: { code: 'INVALID_OTP' } });
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());
      const setErrorSpy = result.current.otpForm.setError;

      await act(async () => {
        await result.current.handleSubmit({ code: 'wrong' });
      });

      expect(setErrorSpy).toHaveBeenCalledWith(
        'code',
        expect.objectContaining({ message: 'forms.errors.invalidCode' }),
      );
      expect(toast.error).not.toHaveBeenCalled();
    });

    it.each([
      { error: {}, label: 'missing error property' },
      {
        error: { error: { code: 'OTHER' } },
        label: 'non-INVALID_OTP error code',
      },
    ])(
      'captures exception, shows error toast, and resets form on $label',
      async ({ error }) => {
        emailOtpSignInMock.mockImplementation((options) => {
          options.fetchOptions.onError(error);
          return Promise.resolve();
        });

        const { result } = renderHook(() => useOtpVerification());
        const resetSpy = result.current.otpForm.reset;

        await act(async () => {
          await result.current.handleSubmit({ code: '123456' });
        });

        expect(Sentry.captureException).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(
          'errors.somethingWentWrong',
          expect.objectContaining({ description: 'errors.unexpectedError' }),
        );
        expect(resetSpy).toHaveBeenCalled();
      },
    );

    it('resets pending and submitted to false after an error', async () => {
      emailOtpSignInMock.mockImplementation((options) => {
        options.fetchOptions.onError({ error: { code: 'INVALID_OTP' } });
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleSubmit({ code: '123456' });
      });

      expect(useLoginFormStore.getState().isPending).toBe(false);
      expect(useLoginFormStore.getState().isSubmitted).toBe(false);
    });
  });

  describe('handleResendOtp', () => {
    it('calls sendVerificationOtp with the current email and sign-in type', async () => {
      sendVerificationOtpMock.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          type: 'sign-in',
        }),
      );
    });

    it('sets isPending and isSubmitted to true before the async call resolves', async () => {
      const { promise, resolve } = Promise.withResolvers<undefined>();
      sendVerificationOtpMock.mockReturnValue(promise);

      const { result } = renderHook(() => useOtpVerification());

      act(() => {
        result.current.handleResendOtp();
      });

      expect(useLoginFormStore.getState().isPending).toBe(true);
      expect(useLoginFormStore.getState().isSubmitted).toBe(true);

      await act(async () => {
        resolve(undefined);
      });
    });

    it('passes the x-locale header from useLocale', async () => {
      sendVerificationOtpMock.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleResendOtp();
      });

      const callArguments = vi.mocked(authClient.emailOtp.sendVerificationOtp)
        .mock.calls[0][0] as {
        fetchOptions: { headers: Record<string, string> };
      };

      expect(callArguments.fetchOptions.headers['x-locale']).toBe('en');
    });

    it('shows a success toast with codeSent title and resets pending/submitted on success', async () => {
      sendVerificationOtpMock.mockImplementation((options) => {
        options.fetchOptions.onSuccess();
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(toast.success).toHaveBeenCalledWith(
        'pages.login.codeSent.title',
        expect.objectContaining({ description: 'rich-mock' }),
      );
      expect(useLoginFormStore.getState().isPending).toBe(false);
      expect(useLoginFormStore.getState().isSubmitted).toBe(false);
    });

    it('uses renderStrong for the rich toast description', async () => {
      const t = useTranslations();

      sendVerificationOtpMock.mockImplementation((options) => {
        options.fetchOptions.onSuccess();
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(renderStrong).toHaveBeenCalled();
      expect(t.rich).toHaveBeenCalledWith(
        'pages.login.codeSent.description',
        expect.objectContaining({ email: 'user@example.com' }),
      );
    });

    it('captures exception, shows error toast with description, and resets pending/submitted on error', async () => {
      sendVerificationOtpMock.mockImplementation((options) => {
        options.fetchOptions.onError(new Error('network'));
        return Promise.resolve();
      });

      const { result } = renderHook(() => useOtpVerification());

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(Sentry.captureException).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'errors.somethingWentWrong',
        expect.objectContaining({ description: 'errors.unexpectedError' }),
      );
      expect(useLoginFormStore.getState().isPending).toBe(false);
      expect(useLoginFormStore.getState().isSubmitted).toBe(false);
    });
  });
});
