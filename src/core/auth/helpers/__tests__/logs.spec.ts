import { vi } from 'vitest';

import { axiomLoggerMock } from '@/tests/unit/mocks/observability';

const { insertChainMock, dbMock } = vi.hoisted(() => {
  const insertChainMock = {
    values: vi.fn(function () {
      return insertChainMock;
    }),
    execute: vi.fn(async function () {
      return insertChainMock;
    }),
  };
  const dbMock = {
    insert: vi.fn(function () {
      return insertChainMock;
    }),
  };
  return { insertChainMock, dbMock };
});

vi.mock('@/core/db', () => ({ db: dbMock }));

vi.mock('@/core/auth/db-schemas', () => ({
  auditLogTable: {},
}));

vi.mock('better-auth-audit-logs', () => ({
  auditLog: vi.fn((config) => ({
    id: 'audit-log',
    hooks: {},
    config,
  })),
}));

import { auditLogPlugin, logSessionCreated } from '../logs';

const plugin = auditLogPlugin as unknown as {
  config: {
    capture: Record<string, unknown>;
    beforeLog: (entry: unknown) => Promise<unknown>;
    afterLog: (entry: unknown) => Promise<void>;
  };
};

describe('auditLogPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is configured with capture and schema options', () => {
    expect(auditLogPlugin).toBeDefined();
    expect(plugin.config.capture).toMatchObject({
      ipAddress: true,
      userAgent: true,
      requestBody: false,
    });
  });

  describe('beforeLog', () => {
    it('returns null for sign-in success entries to suppress duplicate writes', async () => {
      const result = await plugin.config.beforeLog({
        action: 'sign-in',
        status: 'success',
      });

      expect(result).toBeNull();
    });

    it.each([
      { action: 'sign-out', status: 'success' },
      { action: 'sign-in', status: 'failed' },
      { action: 'change-email', status: 'success' },
    ])(
      'returns the entry unchanged for action=$action status=$status',
      async ({ action, status }) => {
        const entry = { action, status, userId: 'u1' };

        const result = await plugin.config.beforeLog(entry);

        expect(result).toBe(entry);
      },
    );
  });

  describe('afterLog', () => {
    it.each([
      { action: 'change-email', event: 'auth.email.changed' },
      { action: 'sign-out', event: 'auth.logout.success' },
      { action: 'delete-user', event: 'auth.account.deleted' },
      { action: 'revoke-session', event: 'auth.session.revoked' },
      { action: 'revoke-sessions', event: 'auth.sessions.revoked.all' },
    ])('logs $event for action $action', async ({ action, event }) => {
      await plugin.config.afterLog({
        action,
        userId: 'u1',
        status: 'success',
        severity: 'low',
        ipAddress: '192.0.2.1',
        userAgent: 'test-agent',
      });

      expect(axiomLoggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Auth event'),
        expect.objectContaining({
          event,
          action,
          userId: 'u1',
          status: 'success',
          severity: 'low',
        }),
      );
    });

    it('does not log for unmapped actions', async () => {
      await plugin.config.afterLog({
        action: 'unknown-action',
        userId: 'u1',
        status: 'success',
        severity: 'low',
      });

      expect(axiomLoggerMock.info).not.toHaveBeenCalled();
    });
  });
});

describe('logSessionCreated', () => {
  const SESSION = {
    userId: 'user-1',
    ipAddress: '192.0.2.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts an audit log entry with provider derived from path', async () => {
    await logSessionCreated(SESSION, { path: '/login' });

    expect(dbMock.insert).toHaveBeenCalled();
    expect(insertChainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'sign-in:email',
        status: 'success',
        severity: 'medium',
        metadata: JSON.stringify({ provider: 'email' }),
      }),
    );
  });

  it('derives email-otp provider when path includes email-otp', async () => {
    await logSessionCreated(SESSION, { path: '/email-otp/send' });

    expect(insertChainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'sign-in:email-otp' }),
    );
  });

  it('derives social provider from callback path with params.id', async () => {
    await logSessionCreated(SESSION, {
      path: '/callback/github',
      params: { id: 'github' },
    });

    expect(insertChainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'sign-in:github' }),
    );
  });

  it('defaults to social provider for callback path without params.id', async () => {
    await logSessionCreated(SESSION, { path: '/callback/' });

    expect(insertChainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'sign-in:social' }),
    );
  });

  it('defaults path to empty string when context is null', async () => {
    const startsWithSpy = vi.spyOn(String.prototype, 'startsWith');

    await logSessionCreated(SESSION, null);

    expect(startsWithSpy.mock.instances[0]?.toString()).toBe('');
  });

  it('handles null context safely when path matches callback pattern', async () => {
    vi.spyOn(String.prototype, 'startsWith').mockReturnValue(true);

    await expect(logSessionCreated(SESSION, null)).resolves.not.toThrow();
  });

  it('logs auth.login.success event after inserting', async () => {
    await logSessionCreated(SESSION, { path: '/login' });

    expect(axiomLoggerMock.info).toHaveBeenCalledWith(
      expect.stringContaining('Auth event'),
      expect.objectContaining({
        event: 'auth.login.success',
        userId: 'user-1',
        status: 'success',
        severity: 'medium',
        provider: 'email',
      }),
    );
  });

  it('logs error and continues when db insert fails', async () => {
    insertChainMock.execute.mockRejectedValueOnce(new Error('db down'));

    await logSessionCreated(SESSION, { path: '/login' });

    expect(axiomLoggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist'),
      expect.objectContaining({ event: 'auth.audit.persist_failed' }),
    );
    expect(axiomLoggerMock.info).toHaveBeenCalled();
  });

  it('converts null ipAddress and userAgent to undefined', async () => {
    await logSessionCreated(
      { userId: 'u1', ipAddress: null, userAgent: null },
      { path: '/login' },
    );

    expect(insertChainMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: undefined, userAgent: undefined }),
    );
  });
});
