'use client';

import * as React from 'react';

import { cn } from '@/ui/helpers';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- generic wrapper, association is done by the consumer via htmlFor
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-xs leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
