import { fireEvent, render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { useOtpVerification } from '@/app/[locale]/(auth)/login/_components/hooks/use-otp-verification';
import { renderStrong } from '@/core/i18n/helpers/render-rich';
import CountdownButton from '@/ui/components/forms/countdown-button';
import OtpField from '@/ui/components/forms/otp-field';
import PendingButton from '@/ui/components/forms/pending-button';
import { Button } from '@/ui/components/shadcn/button';

import StepOtpVerification from '../step-otp-verification';

type OtpReturn = ReturnType<typeof useOtpVerification>;

const handleSubmitMock = vi.fn();
const handleResendOtpMock = vi.fn();
const otpHandleSubmitMock = vi.fn(() => vi.fn());
const otpFormResetMock = vi.fn();

const createOtpReturn = (overrides: Partial<OtpReturn> = {}): OtpReturn =>
  ({
    otpForm: {
      control: {},
      handleSubmit: otpHandleSubmitMock,
      formState: { isValid: true, isSubmitted: false },
      reset: otpFormResetMock,
    },
    isPending: false,
    isSubmitted: false,
    email: 'user@example.com',
    handleSubmit: handleSubmitMock,
    handleResendOtp: handleResendOtpMock,
    ...overrides,
  }) as unknown as OtpReturn;

vi.mock(
  '@/app/[locale]/(auth)/login/_components/hooks/use-otp-verification',
  () => ({
    useOtpVerification: vi.fn(() => createOtpReturn()),
  }),
);

vi.mock('input-otp', () => ({
  REGEXP_ONLY_DIGITS: '[0-9]',
}));

const { renderStrongMock } = vi.hoisted(() => ({
  renderStrongMock: vi.fn(() => vi.fn((parts: unknown[]) => parts)),
}));

vi.mock('@/core/i18n/helpers/render-rich', () => ({
  renderStrong: renderStrongMock,
}));

vi.mock('@/ui/components/forms/otp-field', () => ({
  default: vi.fn((props: ComponentProps<typeof OtpField>) => (
    <div data-testid="otp-field" data-disabled={props.disabled}>
      <label data-testid="otp-label">{props.label}</label>
    </div>
  )),
}));

vi.mock('@/ui/components/forms/pending-button', () => ({
  default: vi.fn(
    ({
      children,
      pending,
      disabled,
      type,
      pendingLabel,
    }: ComponentProps<typeof PendingButton> & { type?: string }) => (
      <button
        type={type ?? 'button'}
        disabled={pending || disabled}
        data-testid="pending-button"
        data-pending={pending}
      >
        {pending ? pendingLabel : children}
      </button>
    ),
  ),
}));

vi.mock('@/ui/components/forms/countdown-button', () => ({
  default: vi.fn(
    ({
      label,
      disabled,
      onAction,
      seconds,
    }: ComponentProps<typeof CountdownButton>) => (
      <button
        type="button"
        data-testid="countdown-button"
        disabled={disabled}
        onClick={onAction}
        data-seconds={seconds}
      >
        {label}
      </button>
    ),
  ),
}));

vi.mock('@/ui/components/shadcn/button', () => ({
  Button: vi.fn(
    ({
      children,
      disabled,
      onClick,
      variant,
      size,
    }: ComponentProps<typeof Button>) => (
      <button
        type="button"
        data-testid="back-button"
        disabled={disabled}
        onClick={onClick}
        data-variant={variant}
        data-size={size}
      >
        {children}
      </button>
    ),
  ),
}));

vi.mock('@/ui/components/shadcn/field', () => ({
  FieldGroup: vi.fn(({ children }) => (
    <div data-testid="field-group">{children}</div>
  )),
}));

const goToMock = vi.fn();

describe('StepOtpVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    vi.mocked(t).rich = vi.fn(
      ((key: string) => key) as unknown as ReturnType<
        typeof useTranslations
      >['rich'],
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the code sent description with the email', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(vi.mocked(useTranslations()).rich).toHaveBeenCalledWith(
      'pages.login.codeSent.description',
      expect.objectContaining({ email: 'user@example.com' }),
    );
  });

  it('passes renderStrong to the rich translation', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(renderStrong).toHaveBeenCalled();
  });

  it('renders the OTP field with the code label and required class', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('otp-field')).toBeInTheDocument();
    expect(screen.getByTestId('otp-label')).toHaveTextContent(
      'pages.login.codeLabel',
    );
  });

  it('sets noValidate on the form', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(document.querySelector('form')).toHaveAttribute('novalidate');
  });

  it('passes the otpForm handleSubmit and handleSubmit callback to the form onSubmit', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(otpHandleSubmitMock).toHaveBeenCalledWith(handleSubmitMock);
  });

  it('renders the verify button with the verifyCode label', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByText('pages.login.verifyCode')).toBeInTheDocument();
  });

  it('passes the verifyCode translation as the pending label', () => {
    const t = useTranslations();
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(t).toHaveBeenCalledWith('pages.login.verifyCode');
  });

  it('renders a non-empty pending label on the verify button when pending', () => {
    vi.mocked(useOtpVerification).mockReturnValueOnce(
      createOtpReturn({ isPending: true }),
    );

    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('pending-button')).not.toBeEmptyDOMElement();
  });

  it('keeps the OTP field enabled when not pending and not submitted', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('otp-field')).toHaveAttribute(
      'data-disabled',
      'false',
    );
  });

  it.each([
    { override: { isPending: true }, label: 'isPending is true' },
    { override: { isSubmitted: true }, label: 'isSubmitted is true' },
  ])('disables the OTP field when $label', ({ override }) => {
    vi.mocked(useOtpVerification).mockReturnValueOnce(
      createOtpReturn(override),
    );

    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('otp-field')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it.each([
    {
      override: {},
      disabled: false,
      pending: 'false',
      label: 'the form is valid and not submitted',
    },
    {
      override: {
        otpForm: {
          control: {},
          handleSubmit: otpHandleSubmitMock,
          formState: { isValid: false, isSubmitted: false },
          reset: otpFormResetMock,
        } as unknown as OtpReturn['otpForm'],
      },
      disabled: true,
      pending: 'false',
      label: 'the form is not valid',
    },
    {
      override: { isSubmitted: true },
      disabled: true,
      pending: 'false',
      label: 'isSubmitted is true',
    },
    {
      override: { isPending: true },
      disabled: true,
      pending: 'true',
      label: 'isPending is true',
    },
  ])(
    'verify button is disabled=$disabled and data-pending=$pending when $label',
    ({ override, disabled, pending }) => {
      vi.mocked(useOtpVerification).mockReturnValueOnce(
        createOtpReturn(override),
      );

      render(
        <StepOtpVerification
          goTo={goToMock}
          isFirstStep={false}
          isLastStep={true}
        />,
      );

      const button = screen.getByTestId('pending-button');
      expect(button).toHaveAttribute('data-pending', pending);
      if (disabled) {
        expect(button).toBeDisabled();
      } else {
        expect(button).not.toBeDisabled();
      }
    },
  );

  it('renders the countdown button with the resendCode label and 60 seconds', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('countdown-button')).toHaveTextContent(
      'pages.login.resendCode',
    );
    expect(screen.getByTestId('countdown-button').dataset.seconds).not.toBe('');
  });

  it('calls handleResendOtp when the countdown button is clicked', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    fireEvent.click(screen.getByTestId('countdown-button'));

    expect(handleResendOtpMock).toHaveBeenCalled();
  });

  it('keeps the countdown button enabled when not pending and not submitted', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('countdown-button')).not.toBeDisabled();
  });

  it.each([
    { override: { isPending: true }, label: 'isPending is true' },
    { override: { isSubmitted: true }, label: 'isSubmitted is true' },
  ])('disables the countdown button when $label', ({ override }) => {
    vi.mocked(useOtpVerification).mockReturnValueOnce(
      createOtpReturn(override),
    );

    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('countdown-button')).toBeDisabled();
  });

  it('renders the back to email button with the backToEmail label', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('back-button')).toHaveTextContent(
      'pages.login.backToEmail',
    );
  });

  it('calls goTo with login when the back button is clicked', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    fireEvent.click(screen.getByTestId('back-button'));

    expect(goToMock).toHaveBeenCalledWith('login');
  });

  it('keeps the back button enabled when not pending and not submitted', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('back-button')).not.toBeDisabled();
  });

  it.each([
    { override: { isPending: true }, label: 'isPending is true' },
    { override: { isSubmitted: true }, label: 'isSubmitted is true' },
  ])('disables the back button when $label', ({ override }) => {
    vi.mocked(useOtpVerification).mockReturnValueOnce(
      createOtpReturn(override),
    );

    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    expect(screen.getByTestId('back-button')).toBeDisabled();
  });

  it('passes the REGEXP_ONLY_DIGITS pattern to the OTP field', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    const callArguments = vi.mocked(OtpField).mock.calls[0][0] as {
      pattern?: string;
    };

    expect(callArguments.pattern).toBe('[0-9]');
  });

  it('passes the onComplete callback that triggers form submission', () => {
    render(
      <StepOtpVerification
        goTo={goToMock}
        isFirstStep={false}
        isLastStep={true}
      />,
    );

    otpHandleSubmitMock.mockClear();

    const callArguments = vi.mocked(OtpField).mock.calls[0][0] as {
      onComplete?: () => void;
    };

    callArguments.onComplete?.();

    expect(otpHandleSubmitMock).toHaveBeenCalledWith(handleSubmitMock);
  });
});
