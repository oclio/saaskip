import { act, fireEvent, render, screen } from '@testing-library/react';

import CountdownButton from '@/ui/components/forms/countdown-button';

vi.mock('@/ui/components/shadcn/button', () => ({
  Button: ({
    children,
    disabled,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button
      data-testid="button"
      disabled={disabled}
      onClick={onClick}
      data-classname={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('CountdownButton', () => {
  let clearTimeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders the label with countdown on mount', () => {
    render(<CountdownButton seconds={5} onAction={vi.fn()} label="Resend" />);

    expect(screen.getByTestId('button')).toHaveTextContent('Resend (5s)');
  });

  it('disables the button while counting', () => {
    render(<CountdownButton seconds={3} onAction={vi.fn()} label="Resend" />);

    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('renders just the label and re-enables after countdown completes', () => {
    render(<CountdownButton seconds={2} onAction={vi.fn()} label="Resend" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).not.toBeDisabled();
    expect(screen.getByTestId('button')).toHaveTextContent('Resend');
  });

  it('decrements the countdown every second', () => {
    render(<CountdownButton seconds={3} onAction={vi.fn()} label="Resend" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toHaveTextContent('Resend (2s)');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toHaveTextContent('Resend (1s)');
  });

  it('calls onAction and restarts the countdown when clicked', () => {
    const onAction = vi.fn();

    render(<CountdownButton seconds={3} onAction={onAction} label="Resend" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('button'));

    expect(onAction).toHaveBeenCalled();
    expect(screen.getByTestId('button')).toBeDisabled();
    expect(screen.getByTestId('button')).toHaveTextContent('Resend (3s)');
  });

  it('is disabled when the disabled prop is true even after countdown', () => {
    render(
      <CountdownButton
        seconds={2}
        onAction={vi.fn()}
        label="Resend"
        disabled
      />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('has aria-live set to polite', () => {
    render(<CountdownButton seconds={3} onAction={vi.fn()} label="Resend" />);

    expect(screen.getByTestId('button')).toHaveAttribute('aria-live', 'polite');
  });

  it('resets the countdown when seconds prop changes', () => {
    const { rerender } = render(
      <CountdownButton seconds={5} onAction={vi.fn()} label="Resend" />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toHaveTextContent('Resend (2s)');

    rerender(
      <CountdownButton seconds={10} onAction={vi.fn()} label="Resend" />,
    );

    expect(screen.getByTestId('button')).toHaveTextContent('Resend (10s)');
    expect(screen.getByTestId('button')).toBeDisabled();
  });

  it('passes className through to the button', () => {
    render(
      <CountdownButton
        seconds={3}
        onAction={vi.fn()}
        label="Resend"
        className="custom-class"
      />,
    );

    expect(screen.getByTestId('button')).toHaveAttribute(
      'data-classname',
      'custom-class',
    );
  });

  it('stops at 0 and does not schedule a timer when countdown reaches 0', () => {
    render(<CountdownButton seconds={1} onAction={vi.fn()} label="Resend" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toHaveTextContent('Resend');
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('button')).toHaveTextContent('Resend');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timer on cleanup when countdown decrements', () => {
    render(<CountdownButton seconds={3} onAction={vi.fn()} label="Resend" />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
