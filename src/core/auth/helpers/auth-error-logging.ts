import { logger } from '@/core/observability/axiom/server';

export const authErrorLogging = {
  onError: (error: unknown, context: unknown) => {
    const context_ = context as {
      path?: string;
      body?: { email?: string };
    };
    const path = context_.path ?? '';
    const err = error as null | undefined | { message?: string; code?: string };

    if (err?.code === 'EMAIL_NOT_AUTHORIZED') return;

    const errorMessage = err?.message || 'Unknown authentication error';
    const errorCode = err?.code;
    const body = context_.body;

    if (path.includes('/login') || path.startsWith('/callback/')) {
      logger.warn(`Failed login attempt: ${errorMessage}`, {
        event: 'auth.login.failed',
        email: body?.email,
        error: errorMessage,
        code: errorCode,
        path,
      });
    } else {
      logger.error(`Auth API error on ${path}`, {
        event: 'auth.error',
        error: errorMessage,
        code: errorCode,
        path,
      });
    }
  },
};
