import { zodResolver } from '@hookform/resolvers/zod';
import { type FieldValues, useForm, type UseFormProps } from 'react-hook-form';
import { type ZodType } from 'zod';

export function useZodForm<TOutput extends FieldValues>(
  schema: ZodType<TOutput>,
  options?: Omit<UseFormProps<TOutput>, 'resolver'>,
) {
  return useForm<TOutput>({
    ...options,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
  });
}
