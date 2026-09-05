import { render, screen } from '@testing-library/react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useLoginFormStore } from '@/app/[locale]/(auth)/login/_components/login-form.store';
import { brand } from '@/config/brand';
import { MultiStepForm } from '@/ui/components/forms/multi-step-form';

import LoginForm from '../login-form';

const resetMock = vi.fn();

vi.mock('@/app/[locale]/(auth)/login/_components/login-form.store', () => ({
  useLoginFormStore: vi.fn((selector: (state: unknown) => unknown) =>
    selector({ reset: resetMock }),
  ),
}));

vi.mock('@/ui/components/forms/multi-step-form', () => ({
  MultiStepForm: vi.fn(() => <div data-testid="multi-step-form" />),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/(auth)/login/_components/step-login', () => ({
  default: vi.fn(() => <div data-testid="step-login" />),
}));

vi.mock(
  '@/app/[locale]/(auth)/login/_components/step-otp-verification',
  () => ({
    default: vi.fn(() => <div data-testid="step-otp" />),
  }),
);

const createSearchParameters = (search: string) =>
  new URLSearchParams(search) as unknown as ReadonlyURLSearchParams;

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    vi.mocked(useSearchParams).mockReturnValue(createSearchParameters(''));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the MultiStepForm', () => {
    render(<LoginForm />);

    expect(screen.getByTestId('multi-step-form')).toBeInTheDocument();
  });

  it('passes the login and otpVerification step ids to MultiStepForm', () => {
    render(<LoginForm />);

    const callArguments = vi.mocked(MultiStepForm).mock.calls[0][0] as {
      steps: { id: string }[];
    };

    const stepIds = callArguments.steps.map((s) => s.id);

    expect(callArguments.steps).toHaveLength(2);
    expect(stepIds).toEqual(
      expect.arrayContaining(['login', 'otpVerification']),
    );
  });

  it('passes progressBar as false', () => {
    render(<LoginForm />);

    const callArguments = vi.mocked(MultiStepForm).mock.calls[0][0] as {
      progressBar: boolean;
    };

    expect(callArguments.progressBar).toBe(false);
  });

  it('starts with the login step as the active step', () => {
    render(<LoginForm />);

    const callArguments = vi.mocked(MultiStepForm).mock.calls[0][0] as {
      activeStep: string;
    };

    expect(callArguments.activeStep).toBe('login');
  });

  it('resets the login form store on mount', () => {
    render(<LoginForm />);

    expect(resetMock).toHaveBeenCalled();
  });

  it('does not show an error toast when there is no error search parameter', () => {
    render(<LoginForm />);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not show an error toast for a non-UNAUTHORIZED_EMAIL error parameter', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      createSearchParameters('error=OTHER_ERROR'),
    );

    render(<LoginForm />);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows an unauthorized email error toast when the error parameter is UNAUTHORIZED_EMAIL', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      createSearchParameters('error=UNAUTHORIZED_EMAIL'),
    );

    render(<LoginForm />);

    expect(toast.error).toHaveBeenCalledWith(
      'pages.login.emailForm.emailNotAuthorized',
      expect.objectContaining({
        description: 'pages.login.emailForm.emailNotAuthorizedDescription',
      }),
    );
  });

  it('passes the brand title to the unauthorized email description', () => {
    const t = useTranslations();
    vi.mocked(useSearchParams).mockReturnValue(
      createSearchParameters('error=UNAUTHORIZED_EMAIL'),
    );

    render(<LoginForm />);

    expect(t).toHaveBeenCalledWith(
      'pages.login.emailForm.emailNotAuthorizedDescription',
      { brand: brand.title },
    );
  });

  it('re-runs the error effect when search parameters change between renders', () => {
    vi.mocked(useSearchParams).mockReturnValue(createSearchParameters(''));

    const { rerender } = render(<LoginForm />);

    expect(toast.error).not.toHaveBeenCalled();

    vi.mocked(useSearchParams).mockReturnValue(
      createSearchParameters('error=UNAUTHORIZED_EMAIL'),
    );

    rerender(<LoginForm />);

    expect(toast.error).toHaveBeenCalled();
  });

  it('re-runs the reset effect when reset reference changes between renders', () => {
    const reset1 = vi.fn();
    const reset2 = vi.fn();
    vi.mocked(useLoginFormStore).mockImplementation(((
      selector: (state: unknown) => unknown,
    ) => selector({ reset: reset1 })) as never);

    const { rerender } = render(<LoginForm />);

    expect(reset1).toHaveBeenCalled();
    expect(reset2).not.toHaveBeenCalled();

    vi.mocked(useLoginFormStore).mockImplementation(((
      selector: (state: unknown) => unknown,
    ) => selector({ reset: reset2 })) as never);

    resetMock.mockClear();
    rerender(<LoginForm />);

    expect(reset2).toHaveBeenCalled();
  });
});
