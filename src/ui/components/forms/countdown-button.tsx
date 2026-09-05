'use client';

import { ComponentProps, useEffect, useState } from 'react';

import { Button } from '@/ui/components/shadcn/button';

interface Props extends ComponentProps<typeof Button> {
  seconds: number;
  onAction: () => void;
  label: string;
}

/**
Button that disables itself for a countdown period after each click.
*/
export default function CountdownButton({
  seconds,
  onAction,
  label,
  disabled,
  className,
  ...props
}: Readonly<Props>) {
  const [countdown, setCountdown] = useState(seconds);
  const [previousSeconds, setPreviousSeconds] = useState(seconds);

  if (seconds !== previousSeconds) {
    setPreviousSeconds(seconds);
    setCountdown(seconds);
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isCounting = countdown > 0;

  const handleClick = () => {
    setCountdown(seconds);
    onAction();
  };

  return (
    <Button
      {...props}
      disabled={disabled || isCounting}
      onClick={handleClick}
      aria-live="polite"
      className={className}
    >
      {isCounting ? `${label} (${countdown}s)` : label}
    </Button>
  );
}
