import { APIError, createAuthMiddleware } from 'better-auth/api';

import { logger } from '@/core/observability/axiom/server';
import { isAuthorizedEmail } from '@/core/security/email-whitelist';

export const restrictUserCreationHook = async (user: { email: string }) => {
  const email = user.email;

  if (!isAuthorizedEmail(email)) {
    logger.warn(`Registration blocked: Email ${email} is not authorized`, {
      event: 'auth.registration.blocked',
      email,
      reason: 'email_not_authorized',
    });

    throw new APIError('UNAUTHORIZED', {
      message: 'Email not authorized',
      code: 'EMAIL_NOT_AUTHORIZED',
    });
  }
};

export const restrictAuthBeforeHook = createAuthMiddleware(async (context) => {
  if (context.path !== '/email-otp/send-verification-otp') {
    return;
  }

  const body = context.body as undefined | { email?: string };
  const email = body?.email;

  if (email && !isAuthorizedEmail(email)) {
    logger.warn(`OTP generation blocked: Email ${email} is not authorized`, {
      event: 'auth.otp.blocked',
      email,
      reason: 'email_not_authorized',
    });

    throw new APIError('UNAUTHORIZED', {
      message: 'Email not authorized',
      code: 'EMAIL_NOT_AUTHORIZED',
    });
  }
});
