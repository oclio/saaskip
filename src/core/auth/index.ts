import { betterAuth, BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP, openAPI } from 'better-auth/plugins';

import { sendVerificationOTPEmail } from '@/core/auth/actions';
import {
  accountsTable,
  auditLogTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from '@/core/auth/db-schemas';
import {
  auditLogPlugin,
  authErrorLogging,
  logSessionCreated,
} from '@/core/auth/helpers';
import {
  restrictAuthBeforeHook,
  restrictUserCreationHook,
} from '@/core/auth/hooks';
import { db } from '@/core/db';
import { env } from '@/core/env';

const plugins: BetterAuthPlugin[] = [
  emailOTP({
    sendVerificationOTP: async ({ email, otp }) =>
      sendVerificationOTPEmail(email, otp),
  }),
  auditLogPlugin,
];

if (env.NODE_ENV === 'development') {
  plugins.push(openAPI()); // /api/auth/reference
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
      auditLog: auditLogTable,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: restrictUserCreationHook,
      },
    },
    session: {
      create: {
        after: async (session, context) => logSessionCreated(session, context),
      },
    },
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'guest',
        input: false,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  hooks: {
    before: restrictAuthBeforeHook,
  },
  onAPIError: authErrorLogging,
  rateLimit: {
    customRules: {
      '/email-otp/send-verification-otp': {
        window: 60,
        max: 3,
      },
    },
  },
  plugins,
});
