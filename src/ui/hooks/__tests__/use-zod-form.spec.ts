import { renderHook } from '@testing-library/react';
import { z } from 'zod';

import { useZodForm } from '@/ui/hooks/use-zod-form';

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn((schema) => ({ schema, __mock: 'resolver' })),
}));

vi.mock('react-hook-form', () => ({
  useForm: vi.fn((options) => ({ ...options, __mock: 'form' })),
}));

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

describe('useZodForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls useForm with the zodResolver and provided options', () => {
    const schema = z.object({ email: z.string() });
    const options = { mode: 'onSubmit' as const, defaultValues: { email: '' } };

    useZodForm(schema, options);

    expect(useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'onSubmit',
        defaultValues: { email: '' },
        resolver: expect.any(Object),
      }),
    );
  });

  it('calls zodResolver with the provided schema', () => {
    const schema = z.object({ name: z.string() });

    useZodForm(schema);

    expect(zodResolver).toHaveBeenCalledWith(schema);
  });

  it('works without options', () => {
    const schema = z.object({ value: z.number() });

    useZodForm(schema);

    expect(useForm).toHaveBeenCalledWith(
      expect.objectContaining({
        resolver: expect.any(Object),
      }),
    );
  });

  it('returns the form instance from useForm', () => {
    const schema = z.object({ field: z.string() });

    const { result } = renderHook(() => useZodForm(schema));

    expect(result.current).toMatchObject({ __mock: 'form' });
  });
});
