import { z } from 'zod';

import { env } from '@/core/env';

const emailSchema = z.email();

const emailWhitelist = env.EMAIL_WHITELIST
  ? [
      ...new Set(
        env.EMAIL_WHITELIST.split(/[;,]/)
          .map((email) => email.trim().toLowerCase())
          .filter((email) => emailSchema.safeParse(email).success),
      ),
    ]
  : [];

export function isAuthorizedEmail(email: string): boolean {
  if (emailWhitelist.length === 0) {
    return true;
  }

  return emailWhitelist.includes(email.trim().toLowerCase());
}
