import Link from 'next/link';
import { ComponentProps, ReactNode } from 'react';

import { cn } from '@/ui/helpers';

export function renderLink(
  props: ComponentProps<typeof Link> &
    Partial<Record<`data-${string}`, string | boolean | undefined>>,
  suffix?: ReactNode,
) {
  return (chunks: ReactNode) => (
    <Link {...props}>
      {chunks}
      {suffix}
    </Link>
  );
}

export function renderStrong(className?: string) {
  return (chunks: ReactNode) => (
    <strong className={cn('font-bold', className)}>{chunks}</strong>
  );
}

export function renderSmall(className?: string) {
  return (chunks: ReactNode) => <small className={className}>{chunks}</small>;
}

const Br = () => <br />;

export function renderBr() {
  return Br;
}
