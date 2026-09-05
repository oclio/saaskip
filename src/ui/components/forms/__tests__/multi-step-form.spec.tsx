import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import {
  MultiStepForm,
  type StepComponentProps,
} from '@/ui/components/forms/multi-step-form';
import {
  barAnimations,
  labelAnimations,
  stepAnimations,
} from '@/ui/components/forms/multi-step-form.motion';

const motionDivProps = vi.fn();
const motionSpanProps = vi.fn();
const animatePresenceProps = vi.fn();

const { mockDirection, mockPreviousIndex } = vi.hoisted(() => ({
  mockDirection: { current: null as number | null },
  mockPreviousIndex: { current: null as unknown },
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (initial === 1 && mockDirection.current !== null) {
        return actual.useState(mockDirection.current);
      }
      if (mockPreviousIndex.current !== null) {
        return actual.useState(mockPreviousIndex.current);
      }
      return actual.useState(initial);
    },
  };
});

vi.mock('motion/react', () => ({
  AnimatePresence: (props: ComponentProps<'div'>) => {
    animatePresenceProps(props);
    return <div data-testid="animate-presence">{props.children}</div>;
  },
  motion: {
    div: (props: ComponentProps<'div'>) => {
      motionDivProps(props);
      return <div {...props} />;
    },
    span: (props: ComponentProps<'span'>) => {
      motionSpanProps(props);
      return <span {...props} />;
    },
  },
}));

function StepA({ goTo, isFirstStep, isLastStep }: StepComponentProps) {
  return (
    <div>
      <span>Step A</span>
      <button onClick={() => goTo('b')}>Next</button>
      <span data-testid="flags">{`${isFirstStep}-${isLastStep}`}</span>
    </div>
  );
}

function StepB({ goTo, isFirstStep, isLastStep }: StepComponentProps) {
  return (
    <div>
      <span>Step B</span>
      <button onClick={() => goTo('a')}>Back</button>
      <span data-testid="flags">{`${isFirstStep}-${isLastStep}`}</span>
    </div>
  );
}

const STEPS = [
  { id: 'a', label: 'First', component: StepA },
  { id: 'b', label: 'Second', component: StepB },
];

describe('MultiStepForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDirection.current = null;
    mockPreviousIndex.current = null;
  });

  it('renders the active step component', () => {
    render(
      <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
    );

    expect(screen.getByText('Step A')).toBeInTheDocument();
  });

  it.each([
    { step: 'a', expected: 'true-false' },
    { step: 'b', expected: 'false-true' },
  ])(
    'passes isFirstStep and isLastStep flags correctly on step $step',
    ({ step, expected }) => {
      render(
        <MultiStepForm
          steps={STEPS}
          activeStep={step}
          onStepChange={vi.fn()}
        />,
      );

      expect(screen.getByTestId('flags')).toHaveTextContent(expected);
    },
  );

  it('passes goTo callback to the step component', async () => {
    const onStepChange = vi.fn();

    render(
      <MultiStepForm
        steps={STEPS}
        activeStep="a"
        onStepChange={onStepChange}
      />,
    );

    await fireEvent.click(screen.getByText('Next'));

    expect(onStepChange).toHaveBeenCalledWith('b');
  });

  it('renders nothing when activeStep does not match any step', () => {
    const { container } = render(
      <MultiStepForm
        steps={STEPS}
        activeStep="unknown"
        onStepChange={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders progress bar with role and aria attributes by default', () => {
    render(
      <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '2');
  });

  it('does not render progress bar when progressBar is false', () => {
    render(
      <MultiStepForm
        steps={STEPS}
        activeStep="a"
        onStepChange={vi.fn()}
        progressBar={false}
      />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders step labels in the progress bar', () => {
    render(
      <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('does not render label span when step has no label', () => {
    const stepsWithoutLabels = [
      { id: 'a', component: StepA },
      { id: 'b', component: StepB },
    ];

    render(
      <MultiStepForm
        steps={stepsWithoutLabels}
        activeStep="a"
        onStepChange={vi.fn()}
      />,
    );

    expect(motionSpanProps).not.toHaveBeenCalled();
  });

  it('updates aria-valuenow when active step changes', () => {
    const { rerender } = render(
      <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '1',
    );

    rerender(
      <MultiStepForm steps={STEPS} activeStep="b" onStepChange={vi.fn()} />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '2',
    );
  });

  it('renders the correct step when navigating backward', async () => {
    const { rerender } = render(
      <MultiStepForm steps={STEPS} activeStep="b" onStepChange={vi.fn()} />,
    );

    expect(screen.getByText('Step B')).toBeInTheDocument();

    rerender(
      <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
    );

    expect(await screen.findByText('Step A')).toBeInTheDocument();
  });

  describe('AnimatePresence', () => {
    it('passes initial={false} and mode="wait"', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      expect(animatePresenceProps).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'wait',
          initial: false,
        }),
      );
    });
  });

  describe('step animation selection', () => {
    it('uses forward animation on initial render', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      expect(motionDivProps).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: stepAnimations.forward.initial,
          exit: stepAnimations.forward.exit,
        }),
      );
    });

    it('uses forward animation when navigating to a later step', () => {
      const { rerender } = render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      rerender(
        <MultiStepForm steps={STEPS} activeStep="b" onStepChange={vi.fn()} />,
      );

      const stepCalls = motionDivProps.mock.calls.filter(
        (call) => call[0].className === 'w-full',
      );
      const lastStepCall = stepCalls.at(-1);

      expect(lastStepCall?.[0]).toEqual(
        expect.objectContaining({
          initial: stepAnimations.forward.initial,
          exit: stepAnimations.forward.exit,
        }),
      );
    });

    it('uses backward animation when navigating to an earlier step', () => {
      const { rerender } = render(
        <MultiStepForm steps={STEPS} activeStep="b" onStepChange={vi.fn()} />,
      );

      rerender(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      expect(motionDivProps).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: stepAnimations.backward.initial,
          exit: stepAnimations.backward.exit,
        }),
      );
    });

    it('uses backward animation when direction is 0', () => {
      mockDirection.current = 0;

      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      const stepCalls = motionDivProps.mock.calls.filter(
        (call) => call[0].className === 'w-full',
      );
      const lastStepCall = stepCalls.at(-1);

      expect(lastStepCall?.[0]).toEqual(
        expect.objectContaining({
          initial: stepAnimations.backward.initial,
          exit: stepAnimations.backward.exit,
        }),
      );
    });

    it('sets backward direction when currentIndex equals coerced previousIndex', () => {
      mockPreviousIndex.current = { valueOf: () => 0 };

      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      const stepCalls = motionDivProps.mock.calls.filter(
        (call) => call[0].className === 'w-full',
      );
      const lastStepCall = stepCalls.at(-1);

      expect(lastStepCall?.[0]).toEqual(
        expect.objectContaining({
          initial: stepAnimations.backward.initial,
          exit: stepAnimations.backward.exit,
        }),
      );
    });
  });

  describe('progress bar animation selection', () => {
    it('passes active label animation to the current step label', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      expect(motionSpanProps).toHaveBeenCalledWith(
        expect.objectContaining({
          animate: labelAnimations.active.animate,
          transition: labelAnimations.active.transition,
          children: 'First',
        }),
      );
    });

    it('passes inactive label animation to non-current step labels', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      expect(motionSpanProps).toHaveBeenCalledWith(
        expect.objectContaining({
          animate: labelAnimations.inactive.animate,
          transition: labelAnimations.inactive.transition,
          children: 'Second',
        }),
      );
    });

    it('passes active bar animation to the current step bar', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      const barCall = motionDivProps.mock.calls.find(
        (call) => call[0].className !== 'w-full',
      );

      expect(barCall?.[0]).toEqual(
        expect.objectContaining({
          animate: barAnimations.active.animate,
          transition: barAnimations.active.transition,
        }),
      );
    });

    it('passes inactive bar animation to non-current step bars', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="a" onStepChange={vi.fn()} />,
      );

      const barCalls = motionDivProps.mock.calls.filter(
        (call) => call[0].className !== 'w-full',
      );

      expect(barCalls[1]?.[0]).toEqual(
        expect.objectContaining({
          animate: barAnimations.inactive.animate,
          transition: barAnimations.inactive.transition,
        }),
      );
    });

    it('passes active label animation to step b when it is current', () => {
      render(
        <MultiStepForm steps={STEPS} activeStep="b" onStepChange={vi.fn()} />,
      );

      expect(motionSpanProps).toHaveBeenCalledWith(
        expect.objectContaining({
          animate: labelAnimations.active.animate,
          children: 'Second',
        }),
      );
    });
  });
});
