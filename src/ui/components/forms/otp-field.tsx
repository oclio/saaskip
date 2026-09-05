'use client';

import { ComponentProps } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/ui/components/shadcn/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/ui/components/shadcn/input-otp';
import { cn } from '@/ui/helpers';

interface Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
  ComponentProps<typeof InputOTP>,
  'onChange' | 'value' | 'render' | 'maxLength'
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  labelClassName?: string;
  length?: number;
  disabled?: boolean;
  onComplete?: () => void;
}

export default function OtpField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  labelClassName,
  length = 6,
  disabled,
  onComplete,
  ...props
}: Readonly<Props<TFieldValues, TName>>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState, formState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-4">
          <div className="flex flex-col items-center gap-1">
            <FieldLabel
              htmlFor={name}
              className={cn(labelClassName, { disabled })}
            >
              {label}
            </FieldLabel>

            <InputOTP
              {...field}
              {...props}
              maxLength={length}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              onChange={(value: string) => {
                field.onChange(value);
                if (value.length === length) {
                  onComplete?.();
                }
              }}
            >
              <InputOTPGroup>
                {Array.from({ length }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {fieldState.invalid &&
              (fieldState.isTouched || formState.isSubmitted) && (
                <FieldError errors={[fieldState.error]} />
              )}
          </div>
        </Field>
      )}
    />
  );
}
