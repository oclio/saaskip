import {
  boolean,
  index as pgIndex,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { Role } from '../types';

// ─── AUTH ────────────────────────────────────────────────────────────────────

// ─── Tables ──────────────────────────────────────────────────────────────────
// ─── Users ───
export const usersTable = pgTable('auth_user', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role').$type<Role>().notNull().default('guest'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Sessions ───
export const sessionsTable = pgTable('auth_session', {
  id: uuid('id').defaultRandom().primaryKey(),

  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id),
});

// ─── Accounts ───
export const accountsTable = pgTable('auth_account', {
  id: uuid('id').defaultRandom().primaryKey(),

  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  issuer: text('issuer'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id),
});

// ─── Verifications ───
export const verificationsTable = pgTable('auth_verification', {
  id: uuid('id').defaultRandom().primaryKey(),

  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Audit Logs ───
export const auditLogTable = pgTable(
  'auth_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    status: text('status').notNull(),
    severity: text('severity').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: text('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    pgIndex('audit_log_user_id_idx').on(table.userId),
    pgIndex('audit_log_action_idx').on(table.action),
    pgIndex('audit_log_created_at_idx').on(table.createdAt),
  ],
);

// ─── Types ───────────────────────────────────────────────────────────────────
export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
export type AccountInsert = typeof accountsTable.$inferInsert;
