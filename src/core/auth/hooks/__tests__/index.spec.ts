import { vi } from 'vitest';

import { axiomLoggerMock } from '@/tests/unit/mocks/observability';

import { restrictAuthBeforeHook, restrictUserCreationHook } from '../index';

const isAuthorizedEmailMock = vi.hoisted(() => vi.fn());

vi.mock('@/core/security/email-whitelist', () => ({
  isAuthorizedEmail: isAuthorizedEmailMock,
}));

vi.mock('better-auth/api', () => ({
  APIError: class APIError extends Error {
    code: string;
    status: string;
    constructor(status: string, options: { message: string; code: string }) {
      super(options.message);
      this.status = status;
      this.code = options.code;
    }
  },
  createAuthMiddleware: vi.fn((handler) => handler),
}));

const hook = {
  restrictUserCreationHook: restrictUserCreationHook as unknown as (user: {
    email: string;
  }) => Promise<void>,
  restrictAuthBeforeHook: restrictAuthBeforeHook as unknown as (context: {
    path?: string;
    body?: { email?: string };
  }) => Promise<unknown>,
};

describe('restrictUserCreationHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw when email is authorized', async () => {
    isAuthorizedEmailMock.mockReturnValue(true);

    await expect(
      hook.restrictUserCreationHook({ email: 'authorized@example.com' }),
    ).resolves.toBeUndefined();

    expect(axiomLoggerMock.warn).not.toHaveBeenCalled();
  });

  it('throws APIError with UNAUTHORIZED status and EMAIL_NOT_AUTHORIZED code when email is not authorized', async () => {
    isAuthorizedEmailMock.mockReturnValue(false);

    await expect(
      hook.restrictUserCreationHook({ email: 'blocked@example.com' }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_AUTHORIZED',
      message: 'Email not authorized',
      status: 'UNAUTHORIZED',
    });
  });

  it('logs a warning with registration blocked event when email is not authorized', async () => {
    isAuthorizedEmailMock.mockReturnValue(false);

    await expect(
      hook.restrictUserCreationHook({ email: 'blocked@example.com' }),
    ).rejects.toThrow();

    expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Registration blocked'),
      expect.objectContaining({
        event: 'auth.registration.blocked',
        email: 'blocked@example.com',
        reason: 'email_not_authorized',
      }),
    );
  });
});

describe('restrictAuthBeforeHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined for non-OTP paths', async () => {
    const result = await hook.restrictAuthBeforeHook({
      path: '/sign-in/email',
      body: { email: 'blocked@example.com' },
    });

    expect(result).toBeUndefined();
    expect(isAuthorizedEmailMock).not.toHaveBeenCalled();
  });

  it('does not call isAuthorizedEmail when path matches but email is missing', async () => {
    isAuthorizedEmailMock.mockReturnValue(false);

    const result = await hook.restrictAuthBeforeHook({
      path: '/email-otp/send-verification-otp',
      body: {},
    });

    expect(result).toBeUndefined();
    expect(isAuthorizedEmailMock).not.toHaveBeenCalled();
  });

  it('does not throw when email is authorized on OTP path', async () => {
    isAuthorizedEmailMock.mockReturnValue(true);

    await expect(
      hook.restrictAuthBeforeHook({
        path: '/email-otp/send-verification-otp',
        body: { email: 'authorized@example.com' },
      }),
    ).resolves.toBeUndefined();

    expect(axiomLoggerMock.warn).not.toHaveBeenCalled();
  });

  it('throws APIError with UNAUTHORIZED status and EMAIL_NOT_AUTHORIZED when email is not authorized on OTP path', async () => {
    isAuthorizedEmailMock.mockReturnValue(false);

    await expect(
      hook.restrictAuthBeforeHook({
        path: '/email-otp/send-verification-otp',
        body: { email: 'blocked@example.com' },
      }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_AUTHORIZED',
      message: 'Email not authorized',
      status: 'UNAUTHORIZED',
    });
  });

  it('logs a warning with OTP blocked event when email is not authorized on OTP path', async () => {
    isAuthorizedEmailMock.mockReturnValue(false);

    await expect(
      hook.restrictAuthBeforeHook({
        path: '/email-otp/send-verification-otp',
        body: { email: 'blocked@example.com' },
      }),
    ).rejects.toThrow();

    expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('OTP generation blocked'),
      expect.objectContaining({
        event: 'auth.otp.blocked',
        email: 'blocked@example.com',
        reason: 'email_not_authorized',
      }),
    );
  });

  it('handles undefined body gracefully on OTP path', async () => {
    const result = await hook.restrictAuthBeforeHook({
      path: '/email-otp/send-verification-otp',
      body: undefined,
    });

    expect(result).toBeUndefined();
    expect(isAuthorizedEmailMock).not.toHaveBeenCalled();
  });
});
