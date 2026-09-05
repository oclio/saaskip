import { act, renderHook } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { authClient } from '@/core/auth/client';

import { useSignOut } from '../use-signout';

const routerReplaceMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('@/core/auth/client', () => ({
  authClient: {
    signOut: vi.fn((...arguments_: unknown[]) => signOutMock(...arguments_)),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock('@/core/i18n/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const t = useTranslations();
    vi.mocked(t).mockImplementation((key: string) => key);
    signOutMock.mockImplementation(
      (options?: { fetchOptions?: { onSuccess?: () => void } }) => {
        options?.fetchOptions?.onSuccess?.();
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a signOut function', () => {
    const { result } = renderHook(() => useSignOut());

    expect(typeof result.current.signOut).toBe('function');
  });

  it('calls authClient.signOut with fetchOptions', async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(authClient.signOut).toHaveBeenCalledWith(
      expect.objectContaining({ fetchOptions: expect.any(Object) }),
    );
  });

  it('shows a success toast with the translated message on success', async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(toast.success).toHaveBeenCalledWith('hooks.useSignOut.success');
  });

  it('redirects to the home page on success', async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(routerReplaceMock).toHaveBeenCalledWith('/');
  });
});
