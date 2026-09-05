import { auditLog } from 'better-auth-audit-logs';

import { auditLogTable } from '@/core/auth/db-schemas';
import { db } from '@/core/db';
import { logger } from '@/core/observability/axiom/server';

export const auditLogPlugin = auditLog({
  enabled: true,
  nonBlocking: true,
  capture: {
    ipAddress: true,
    userAgent: true,
    requestBody: false,
  },
  schema: {
    auditLog: { modelName: 'auditLog' },
  },
  beforeLog: async (entry) => {
    // Sign-in events are handled by logSessionCreated (databaseHooks.session.create.after)
    // which captures richer context (provider, IP, user-agent).
    if (entry.action.includes('sign-in') && entry.status === 'success') {
      // eslint-disable-next-line unicorn/no-null -- plugin suppresses writes only on a strict `null` return
      return null;
    }
    return entry;
  },
  afterLog: async (entry) => {
    const eventMap: Record<string, string> = {
      'change-email': 'auth.email.changed',
      'sign-out': 'auth.logout.success',
      'delete-user': 'auth.account.deleted',
      'revoke-session': 'auth.session.revoked',
      'revoke-sessions': 'auth.sessions.revoked.all',
    };

    const event = eventMap[entry.action];
    if (!event) return;

    logger.info(`Auth event: ${entry.action}`, {
      event,
      userId: entry.userId,
      status: entry.status,
      severity: entry.severity,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      action: entry.action,
    });
  },
});

export async function logSessionCreated(
  session: {
    userId: string;
    ipAddress?: null | string;
    userAgent?: null | string;
  },
  context: {
    path?: string;
    params?: Record<string, string | undefined>;
  } | null,
) {
  const path = context?.path ?? '';

  let provider = 'email';
  if (path.startsWith('/callback/')) {
    provider = context?.params?.id || 'social';
  } else if (path.includes('email-otp')) {
    provider = 'email-otp';
  }

  const action = `sign-in:${provider}`;
  const ipAddress = session.ipAddress ?? undefined;
  const userAgent = session.userAgent ?? undefined;

  try {
    await db
      .insert(auditLogTable)
      .values({
        userId: session.userId,
        action,
        status: 'success',
        severity: 'medium',
        ipAddress,
        userAgent,
        metadata: JSON.stringify({ provider }),
      })
      .execute();
  } catch (error) {
    logger.error('Failed to persist login audit entry', {
      event: 'auth.audit.persist_failed',
      userId: session.userId,
      action,
      error,
    });
  }

  logger.info(`Auth event: ${action}`, {
    event: 'auth.login.success',
    userId: session.userId,
    status: 'success',
    severity: 'medium',
    ipAddress,
    userAgent,
    provider,
    action,
  });
}
