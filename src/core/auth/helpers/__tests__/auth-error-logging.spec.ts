import { axiomLoggerMock } from '@/tests/unit/mocks/observability';

import { authErrorLogging } from '../auth-error-logging';

describe('authErrorLogging.onError', () => {
  const { onError } = authErrorLogging;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns early without logging when error code is EMAIL_NOT_AUTHORIZED', () => {
    onError(
      { code: 'EMAIL_NOT_AUTHORIZED', message: 'Email not authorized' },
      { path: '/login', body: { email: 'bad@b.com' } },
    );

    expect(axiomLoggerMock.warn).not.toHaveBeenCalled();
    expect(axiomLoggerMock.error).not.toHaveBeenCalled();
  });

  it('logs a warning for login path failures', () => {
    onError(
      { code: 'INVALID_PASSWORD', message: 'Wrong password' },
      { path: '/api/auth/sign-in/login', body: { email: 'a@b.com' } },
    );

    expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed login attempt'),
      expect.objectContaining({
        event: 'auth.login.failed',
        email: 'a@b.com',
        error: expect.any(String),
        code: 'INVALID_PASSWORD',
        path: '/api/auth/sign-in/login',
      }),
    );
    expect(axiomLoggerMock.error).not.toHaveBeenCalled();
  });

  it('logs a warning for callback path failures', () => {
    onError({ message: 'OAuth failed' }, { path: '/callback/github' });

    expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: 'auth.login.failed' }),
    );
  });

  it('logs an error for non-login paths', () => {
    onError(
      { code: 'DB_ERROR', message: 'Database down' },
      { path: '/api/auth/change-email' },
    );

    expect(axiomLoggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Auth API error'),
      expect.objectContaining({
        event: 'auth.error',
        error: expect.any(String),
        code: 'DB_ERROR',
        path: '/api/auth/change-email',
      }),
    );
    expect(axiomLoggerMock.warn).not.toHaveBeenCalled();
  });

  it('uses Unknown authentication error when error has no message', () => {
    onError(null, { path: '/api/auth/unknown' });

    expect(axiomLoggerMock.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: 'auth.error',
        error: 'Unknown authentication error',
      }),
    );
  });

  it('defaults path to empty string when context has no path', () => {
    onError({ message: 'fail' }, {});

    expect(axiomLoggerMock.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ path: '' }),
    );
  });

  it('passes undefined email when body is absent', () => {
    onError({ message: 'fail' }, { path: '/login' });

    expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ email: undefined }),
    );
  });
});
