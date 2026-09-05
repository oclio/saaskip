import { fireEvent, render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';

import { useSignIn } from '@/app/[locale]/(auth)/login/_components/hooks/use-sign-in';
import { brand } from '@/config/brand';
import HorizontalDivider from '@/ui/components/card-divider';
import PendingButton from '@/ui/components/forms/pending-button';
import { FieldError } from '@/ui/components/shadcn/field';

import StepLogin from '../step-login';

type SignInReturn = ReturnType<typeof useSignIn>;

const handleSignInEmailMock = vi.fn();
const handleSignInProviderMock = vi.fn();
const handleSubmitMock = vi.fn();
const formResetMock = vi.fn();

const createSignInReturn = (
  overrides: Partial<SignInReturn> = {},
): SignInReturn =>
  ({
    form: {
      control: {},
      handleSubmit: handleSubmitMock,
      formState: { isValid: true, isSubmitted: false },
      reset: formResetMock,
    },
    isPending: false,
    isSubmitted: false,
    selectedProvider: undefined,
    handleSignInEmail: handleSignInEmailMock,
    handleSignInProvider: handleSignInProviderMock,
    ...overrides,
  }) as unknown as SignInReturn;

vi.mock('@/app/[locale]/(auth)/login/_components/hooks/use-sign-in', () => ({
  useSignIn: vi.fn(() => createSignInReturn()),
}));

const { iconMock } = vi.hoisted(() => ({
  iconMock: vi.fn(() => null),
}));

vi.mock('@/config/icons', () => ({
  icon: iconMock,
}));

vi.mock('@/ui/components/card-divider', () => ({
  default: vi.fn(({ label }: ComponentProps<typeof HorizontalDivider>) => (
    <div data-testid="horizontal-divider" data-label={label} />
  )),
}));

vi.mock('@/ui/components/forms/pending-button', () => ({
  default: vi.fn(
    ({
      children,
      pending,
      disabled,
      onClick,
      type,
      pendingLabel,
      title,
    }: ComponentProps<typeof PendingButton> & {
      type?: string;
      title?: string;
    }) => (
      <button
        type={type ?? 'button'}
        disabled={pending || disabled}
        onClick={onClick}
        title={title}
        data-testid="pending-button"
        data-pending={pending}
      >
        {pending ? pendingLabel : children}
      </button>
    ),
  ),
}));

vi.mock('@/ui/components/shadcn/field', () => ({
  Field: vi.fn(({ children, 'data-invalid': dataInvalid }) => (
    <div data-testid="field" data-invalid={dataInvalid}>
      {children}
    </div>
  )),
  FieldGroup: vi.fn(({ children }) => (
    <div data-testid="field-group">{children}</div>
  )),
  FieldLabel: vi.fn(({ children, htmlFor }) => (
    <label data-testid="field-label" htmlFor={htmlFor}>
      {children}
    </label>
  )),
  FieldError: vi.fn(({ errors }: ComponentProps<typeof FieldError>) => (
    <div data-testid="field-error" data-has-error={Boolean(errors?.[0])} />
  )),
}));

vi.mock('@/ui/components/shadcn/input', () => ({
  Input: vi.fn((props) => (
    <input
      data-testid="email-input"
      disabled={props.disabled}
      aria-invalid={props['aria-invalid']}
      placeholder={props.placeholder}
      autoComplete={props.autoComplete}
      value={props.value ?? ''}
      onChange={props.onChange}
    />
  )),
}));

vi.mock('@/ui/helpers', () => ({
  cn: vi.fn((...arguments_: unknown[]) => arguments_.filter(Boolean).join(' ')),
}));

const controllerState = {
  fieldState: { invalid: false, isDirty: false, error: undefined },
  formState: { isSubmitted: false, isValid: true },
};

vi.mock('react-hook-form', () => ({
  Controller: vi.fn(({ render }) =>
    render({
      field: { value: '', onChange: vi.fn() },
      fieldState: controllerState.fieldState,
      formState: controllerState.formState,
    }),
  ),
}));

const goToMock = vi.fn();

const getProviderButtons = () =>
  screen
    .getAllByTestId('pending-button')
    .filter((b) => b.getAttribute('type') !== 'submit');

const getSubmitButton = () =>
  screen
    .getAllByTestId('pending-button')
    .find((b) => b.getAttribute('type') === 'submit') as HTMLButtonElement;

describe('StepLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    controllerState.fieldState = {
      invalid: false,
      isDirty: false,
      error: undefined,
    };
    controllerState.formState = { isSubmitted: false, isValid: true };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the social providers description with the brand title', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(useTranslations()).toHaveBeenCalledWith(
      'pages.login.socialProviders.description',
      { brand: brand.title },
    );
  });

  it('renders a provider button for each social provider', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(getProviderButtons()).toHaveLength(2);
  });

  it('renders the divider with the orContinueWith label', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('horizontal-divider')).toHaveAttribute(
      'data-label',
      'pages.login.orContinueWith',
    );
  });

  it('renders the email field label', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('field-label')).toHaveTextContent(
      'forms.labels.yourEmail',
    );
  });

  it('renders the email input with the email placeholder and autocomplete', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('placeholder', 'forms.placeholders.email...');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('renders the submit button with the receiveACode label', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(
      screen.getByText('pages.login.emailForm.receiveACode'),
    ).toBeInTheDocument();
  });

  it.each([
    { index: 0, provider: 'google' },
    { index: 1, provider: 'github' },
  ])(
    'calls handleSignInProvider with $provider when the $provider button is clicked',
    ({ index, provider }) => {
      render(
        <StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />,
      );

      fireEvent.click(getProviderButtons()[index]);

      expect(handleSignInProviderMock).toHaveBeenCalledWith(provider);
    },
  );

  it.each([
    { override: { isSubmitted: true }, label: 'isSubmitted is true' },
    { override: { isPending: true }, label: 'isPending is true' },
  ])('disables all provider buttons when $label', ({ override }) => {
    vi.mocked(useSignIn).mockReturnValueOnce(createSignInReturn(override));

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    for (const button of getProviderButtons()) {
      expect(button).toBeDisabled();
    }
  });

  it('shows pending state only on the selected provider button', () => {
    vi.mocked(useSignIn).mockReturnValueOnce(
      createSignInReturn({ isPending: true, selectedProvider: 'google' }),
    );

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    const buttons = getProviderButtons();
    expect(buttons[0]).toHaveAttribute('data-pending', 'true');
    expect(buttons[1]).toHaveAttribute('data-pending', 'false');
  });

  it.each([
    {
      override: {
        form: {
          control: {},
          handleSubmit: handleSubmitMock,
          formState: { isValid: false, isSubmitted: false },
          reset: formResetMock,
        } as unknown as SignInReturn['form'],
      },
      label: 'the form is not valid',
    },
    {
      override: { isSubmitted: true },
      label: 'isSubmitted is true',
    },
  ])('disables the submit button when $label', ({ override }) => {
    vi.mocked(useSignIn).mockReturnValueOnce(createSignInReturn(override));

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(getSubmitButton()).toBeDisabled();
  });

  it('passes the goTo function to useSignIn', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(useSignIn).toHaveBeenCalledWith(goToMock);
  });

  it('renders the signInWith title for each provider button', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    const buttons = getProviderButtons();
    expect(buttons[0]).toHaveAttribute(
      'title',
      'pages.login.socialProviders.signInWith',
    );
    expect(buttons[1]).toHaveAttribute(
      'title',
      'pages.login.socialProviders.signInWith',
    );
  });

  it('passes the provider title to the signInWith translation', () => {
    const t = useTranslations();
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(t).toHaveBeenCalledWith('pages.login.socialProviders.signInWith', {
      provider: 'Google',
    });
    expect(t).toHaveBeenCalledWith('pages.login.socialProviders.signInWith', {
      provider: 'GitHub',
    });
  });

  it('sets noValidate on the email form', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    const form = document.querySelector('form');
    expect(form).toHaveAttribute('novalidate');
  });

  it('keeps the email input enabled when not pending and not submitted', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('email-input')).not.toBeDisabled();
  });

  it.each([
    { override: { isPending: true }, label: 'isPending is true' },
    { override: { isSubmitted: true }, label: 'isSubmitted is true' },
  ])('disables the email input when $label', ({ override }) => {
    vi.mocked(useSignIn).mockReturnValueOnce(createSignInReturn(override));

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('email-input')).toBeDisabled();
  });

  it('does not render the field error when the field is pristine and not submitted', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.queryByTestId('field-error')).not.toBeInTheDocument();
  });

  it('passes the field error to FieldError', () => {
    const error = { type: 'required', message: 'invalid' } as never;
    controllerState.fieldState = {
      invalid: true,
      isDirty: true,
      error,
    };

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('field-error')).toHaveAttribute(
      'data-has-error',
      'true',
    );
  });

  it('renders the field error when the form has been submitted', () => {
    vi.mocked(useSignIn).mockReturnValueOnce(
      createSignInReturn({
        form: {
          control: {},
          handleSubmit: handleSubmitMock,
          formState: { isValid: true, isSubmitted: true },
          reset: formResetMock,
        } as unknown as SignInReturn['form'],
      }),
    );

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(screen.getByTestId('field-error')).toBeInTheDocument();
  });

  it.each([
    {
      override: { isPending: true, selectedProvider: undefined },
      expected: 'true',
      label: 'isPending and no provider is selected',
    },
    {
      override: { isPending: true, selectedProvider: 'google' as const },
      expected: 'false',
      label: 'a provider is selected',
    },
    {
      override: { isPending: false, selectedProvider: undefined },
      expected: 'false',
      label: 'not pending',
    },
  ])(
    'shows data-pending=$expected on the submit button when $label',
    ({ override, expected }) => {
      vi.mocked(useSignIn).mockReturnValueOnce(createSignInReturn(override));

      render(
        <StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />,
      );

      expect(getSubmitButton()).toHaveAttribute('data-pending', expected);
    },
  );

  it('renders a non-empty pending label on the submit button when pending', () => {
    vi.mocked(useSignIn).mockReturnValueOnce(
      createSignInReturn({ isPending: true, selectedProvider: undefined }),
    );

    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(getSubmitButton()).not.toBeEmptyDOMElement();
  });

  it('keeps the submit button enabled when the form is valid and not submitted', () => {
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    const submitButton = getSubmitButton();
    expect(submitButton).not.toBeDisabled();
  });

  it('passes the receiveACode translation key as the pending label', () => {
    const t = useTranslations();
    render(<StepLogin goTo={goToMock} isFirstStep={true} isLastStep={false} />);

    expect(t).toHaveBeenCalledWith('pages.login.emailForm.receiveACode');
  });
});
