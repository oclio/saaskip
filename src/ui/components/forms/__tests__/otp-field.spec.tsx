import { fireEvent, render, screen } from '@testing-library/react';

import OtpField from '@/ui/components/forms/otp-field';

interface RenderProps {
  field: { onChange: (value: string) => void; value?: string };
  fieldState: {
    invalid: boolean;
    isTouched?: boolean;
    error?: { message?: string };
  };
  formState: { isSubmitted: boolean };
}

const renderPropsSignal: { current: RenderProps } = {
  current: {
    field: { onChange: vi.fn(), value: '' },
    fieldState: { invalid: false },
    formState: { isSubmitted: false },
  },
};

vi.mock('react-hook-form', () => ({
  Controller: ({
    render,
  }: {
    render: (props: RenderProps) => React.ReactNode;
  }) => render(renderPropsSignal.current),
}));

vi.mock('@/ui/components/shadcn/input-otp', () => ({
  InputOTP: ({
    children,
    maxLength,
    disabled,
    onChange,
    ...props
  }: {
    children: React.ReactNode;
    maxLength?: number;
    disabled?: boolean;
    onChange?: (value: string) => void;
    'aria-invalid'?: boolean;
  }) => (
    <div
      data-testid="input-otp"
      data-max-length={maxLength}
      aria-disabled={disabled}
      {...props}
    >
      {children}
      <input
        data-testid="otp-input"
        onChange={(event_) => onChange?.(event_.target.value)}
      />
    </div>
  ),
  InputOTPGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="input-otp-group">{children}</div>
  ),
  InputOTPSlot: ({ index }: { index: number }) => (
    <div data-testid="input-otp-slot" data-index={index} />
  ),
}));

function renderOtpField(overrides?: {
  length?: number;
  disabled?: boolean;
  onComplete?: () => void;
  labelClassName?: string;
}) {
  return render(
    <OtpField
      control={{} as never}
      name="code"
      label="Enter code"
      onComplete={overrides?.onComplete}
      length={overrides?.length}
      disabled={overrides?.disabled}
      labelClassName={overrides?.labelClassName}
    />,
  );
}

describe('OtpField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderPropsSignal.current = {
      field: { onChange: vi.fn(), value: '' },
      fieldState: { invalid: false },
      formState: { isSubmitted: false },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders the label with the provided text', () => {
      renderOtpField();

      expect(screen.getByText('Enter code')).toBeInTheDocument();
    });

    it('renders the correct number of OTP slots by default', () => {
      renderOtpField();

      expect(screen.getAllByTestId('input-otp-slot')).toHaveLength(6);
    });

    it('renders the correct number of OTP slots when length is provided', () => {
      renderOtpField({ length: 4 });

      expect(screen.getAllByTestId('input-otp-slot')).toHaveLength(4);
    });

    it('passes maxLength to InputOTP matching the length prop', () => {
      renderOtpField({ length: 8 });

      expect(screen.getByTestId('input-otp')).toHaveAttribute(
        'data-max-length',
        '8',
      );
    });
  });

  describe('disabled state', () => {
    it.each([
      { disabled: true, expected: 'true' },
      { disabled: false, expected: 'false' },
      { disabled: undefined, expected: null },
    ])(
      'sets aria-disabled=$expected when disabled=$disabled',
      ({ disabled, expected }) => {
        renderOtpField({ disabled });

        const input = screen.getByTestId('input-otp');

        if (expected === null) {
          expect(input).not.toHaveAttribute('aria-disabled');
        } else {
          expect(input).toHaveAttribute('aria-disabled', expected);
        }
      },
    );
  });

  describe('onChange handling', () => {
    it('calls field.onChange when the OTP input value changes', () => {
      const onChange = vi.fn();
      renderPropsSignal.current.field.onChange = onChange;

      renderOtpField();

      fireEvent.change(screen.getByTestId('otp-input'), {
        target: { value: '123' },
      });

      expect(onChange).toHaveBeenCalledWith('123');
    });

    it('calls onComplete when the value length matches the field length', () => {
      const onComplete = vi.fn();
      renderPropsSignal.current.field.onChange = vi.fn();

      renderOtpField({ length: 6, onComplete });

      fireEvent.change(screen.getByTestId('otp-input'), {
        target: { value: '123456' },
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('does not call onComplete when the value length is less than the field length', () => {
      const onComplete = vi.fn();
      renderPropsSignal.current.field.onChange = vi.fn();

      renderOtpField({ length: 6, onComplete });

      fireEvent.change(screen.getByTestId('otp-input'), {
        target: { value: '123' },
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('does not call onComplete when no onComplete prop is provided', () => {
      renderPropsSignal.current.field.onChange = vi.fn();

      renderOtpField({ length: 6 });

      fireEvent.change(screen.getByTestId('otp-input'), {
        target: { value: '123456' },
      });

      expect(renderPropsSignal.current.field.onChange).toHaveBeenCalledWith(
        '123456',
      );
    });
  });

  describe('error display', () => {
    it('renders the field error when the field is invalid and touched', () => {
      renderPropsSignal.current.fieldState = {
        invalid: true,
        isTouched: true,
        error: { message: 'Invalid code' },
      };

      renderOtpField();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid code')).toBeInTheDocument();
    });

    it('renders the field error when the field is invalid and the form is submitted', () => {
      renderPropsSignal.current.fieldState = {
        invalid: true,
        error: { message: 'Invalid code' },
      };
      renderPropsSignal.current.formState = { isSubmitted: true };

      renderOtpField();

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not render the field error when the field is valid', () => {
      renderPropsSignal.current.fieldState = {
        invalid: false,
        isTouched: true,
      };
      renderPropsSignal.current.formState = { isSubmitted: true };

      renderOtpField();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not render the field error when the field is invalid but not touched nor submitted', () => {
      renderPropsSignal.current.fieldState = {
        invalid: true,
        isTouched: false,
        error: { message: 'Invalid code' },
      };
      renderPropsSignal.current.formState = { isSubmitted: false };

      renderOtpField();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('aria-invalid', () => {
    it.each([
      { invalid: true, expected: 'true' },
      { invalid: false, expected: 'false' },
    ])(
      'sets aria-invalid=$expected when fieldState.invalid=$invalid',
      ({ invalid, expected }) => {
        renderPropsSignal.current.fieldState = { invalid };

        renderOtpField();

        expect(screen.getByTestId('input-otp')).toHaveAttribute(
          'aria-invalid',
          expected,
        );
      },
    );
  });

  describe('label className', () => {
    it('applies the provided labelClassName to the label', () => {
      renderOtpField({ labelClassName: 'test-label-class' });

      expect(screen.getByText('Enter code')).toHaveClass('test-label-class');
    });

    it('includes the disabled class when disabled is true', () => {
      renderOtpField({ labelClassName: 'test-label-class', disabled: true });

      expect(screen.getByText('Enter code')).toHaveClass('disabled');
    });
  });
});
