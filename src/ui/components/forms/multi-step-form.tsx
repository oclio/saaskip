'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import {
  barAnimations,
  labelAnimations,
  stepAnimations,
} from './multi-step-form.motion';

export interface StepComponentProps {
  goTo: (stepId: string) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface Step {
  id: string;
  label?: string;
  component: React.ComponentType<StepComponentProps>;
}

interface Props {
  steps: Step[];
  activeStep: string;
  onStepChange: (stepId: string) => void;
  progressBar?: boolean;
}

export function MultiStepForm({
  steps,
  activeStep,
  onStepChange,
  progressBar = true,
}: Readonly<Props>) {
  const currentIndex = steps.findIndex((step) => step.id === activeStep);
  const [direction, setDirection] = useState(1);
  const [previousIndex, setPreviousIndex] = useState(currentIndex);

  if (currentIndex !== previousIndex) {
    setDirection(currentIndex > previousIndex ? 1 : -1);
    setPreviousIndex(currentIndex);
  }

  if (currentIndex === -1) return;

  const CurrentComponent = steps[currentIndex].component;
  const stepAnim =
    direction > 0 ? stepAnimations.forward : stepAnimations.backward;

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeStep}
          initial={stepAnim.initial}
          animate={stepAnim.animate}
          exit={stepAnim.exit}
          transition={stepAnim.transition}
          className="w-full"
        >
          <CurrentComponent
            goTo={onStepChange}
            isFirstStep={currentIndex === 0}
            isLastStep={currentIndex === steps.length - 1}
          />
        </motion.div>
      </AnimatePresence>

      {progressBar && (
        <div
          className="mt-4 flex gap-2"
          aria-valuenow={currentIndex + 1}
          aria-valuemax={steps.length}
        >
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const labelAnim = isActive
              ? labelAnimations.active
              : labelAnimations.inactive;
            const barAnim = isActive
              ? barAnimations.active
              : barAnimations.inactive;

            return (
              <div key={step.id} className="flex flex-1 flex-col gap-1">
                {step.label && (
                  <motion.span
                    animate={labelAnim.animate}
                    transition={labelAnim.transition}
                    className="text-xs"
                  >
                    {step.label}
                  </motion.span>
                )}
                <motion.div
                  animate={barAnim.animate}
                  transition={barAnim.transition}
                  className="h-1 rounded-full"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
