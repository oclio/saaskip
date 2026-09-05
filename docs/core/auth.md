# Authentication

saaskip uses [Better Auth](https://www.better-auth.com) as its authentication framework — a framework-agnostic, type-safe library that runs entirely on your own infrastructure. No third-party auth service, no vendor lock-in.

## Features

- **Email OTP** — passwordless sign-in via one-time code sent by email
- **Social providers** — Google and GitHub OAuth
- **Email whitelist** — restrict access to authorized email addresses
- **Session management** — cookie-based sessions with secure attributes
- **Audit logging** — all auth events persisted to the database and streamed to Axiom
- **Rate limiting** — OTP send endpoint limited to 3 requests per 60 seconds
- **Route protection** — middleware-level redirects for `/dashboard` and `/login`

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│  authClient (Better Auth React SDK)                     │
│  ├── emailOTPClient()                                   │
│  └── inferAdditionalFields<typeof auth>()               │
└──────────────┬──────────────────────────────────────────┘
               │ fetch
               ▼
┌─────────────────────────────────────────────────────────┐
│                     API Route                           │
│  /api/auth/[...all] → toNextJsHandler(auth)             │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   Better Auth server                    │
│  ├── drizzleAdapter (PostgreSQL)                        │
│  ├── emailOTP plugin                                    │
│  ├── auditLog plugin                                    │
│  ├── databaseHooks (user.create, session.create)        │
│  ├── hooks.before (restrictAuthBeforeHook)              │
│  └── socialProviders (Google, GitHub)                   │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Environment variables

| Variable               | Required | Description                                                         |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Yes      | Secret key for signing tokens (32+ characters)                      |
| `BETTER_AUTH_URL`      | Yes      | Base URL of your app (e.g. `http://localhost:3000`)                 |
| `GITHUB_CLIENT_ID`     | Yes      | GitHub OAuth client ID                                              |
| `GITHUB_CLIENT_SECRET` | Yes      | GitHub OAuth client secret                                          |
| `GOOGLE_CLIENT_ID`     | Yes      | Google OAuth client ID                                              |
| `GOOGLE_CLIENT_SECRET` | Yes      | Google OAuth client secret                                          |
| `EMAIL_WHITELIST`      | No       | Comma-separated authorized emails. If unset, all emails are allowed |

### OAuth provider setup

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Copy the Client ID and Client Secret to your `.env`

#### GitHub

1. Go to [GitHub Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Authorization callback URL: `https://yourdomain.com/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env`

## Database schema

All auth tables use the `auth_` prefix to avoid collisions with application tables.

### Tables

| Table               | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `auth_user`         | Users with email, name, role, email verification status |
| `auth_session`      | Active sessions with token, expiry, IP, user-agent      |
| `auth_account`      | OAuth accounts linked to users (provider, tokens)       |
| `auth_verification` | Pending verifications (OTP codes, email changes)        |
| `auth_audit_log`    | Audit trail of auth events                              |

### User roles

The `auth_user.role` column uses the `Role` type:

| Role         | Description             |
| ------------ | ----------------------- |
| `guest`      | Default role on sign-up |
| `manager`    | Application-level role  |
| `admin`      | Application-level role  |
| `superAdmin` | Application-level role  |

Roles are stored as text and typed via Drizzle's `$type<Role>()`. The `input: false` flag on the `role` field prevents clients from setting their own role during sign-up.

### Migrations

Auth tables are managed by Drizzle Kit. The initial migration (`0000_silly_rhodey.sql`) creates the core tables. Subsequent migrations add columns or indexes:

```bash
pnpm db:migrate    # Apply pending migrations
pnpm db:generate   # Generate a new migration from schema changes
```

## Server instance

The Better Auth server is configured in `src/core/auth/index.ts`.

### Plugins

| Plugin     | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `emailOTP` | Passwordless email OTP sign-in                  |
| `auditLog` | Persists auth events to `auth_audit_log`        |
| `openAPI`  | Dev-only API reference at `/api/auth/reference` |

### Database hooks

| Hook                       | Trigger                | Purpose                                                    |
| -------------------------- | ---------------------- | ---------------------------------------------------------- |
| `restrictUserCreationHook` | `user.create.before`   | Blocks registration for non-whitelisted emails             |
| `logSessionCreated`        | `session.create.after` | Persists sign-in audit entry with provider, IP, user-agent |

### Before hook

`restrictAuthBeforeHook` intercepts the `/email-otp/send-verification-otp` endpoint and rejects non-whitelisted emails with `EMAIL_NOT_AUTHORIZED` before Better Auth processes the request.

### Rate limiting

Custom rate limit rule on the OTP send endpoint:

```ts
rateLimit: {
  customRules: {
    '/email-otp/send-verification-otp': {
      window: 60,  // 60 seconds
      max: 3,      // 3 requests per window
    },
  },
}
```

### Cookie configuration

| Attribute  | Value             | Notes                               |
| ---------- | ----------------- | ----------------------------------- |
| `httpOnly` | `true`            | Prevents JavaScript access          |
| `sameSite` | `lax`             | Allows top-level navigation cookies |
| `secure`   | `production` only | HTTPS-only in production            |

The `withSecureCookies` middleware (outermost in the proxy chain) enforces additional attributes (`SameSite=Strict`, `Path=/`) on all response cookies, including the session cookie.

## Client instance

The Better Auth client is configured in `src/core/auth/client.ts`:

```ts
export const authClient = createAuthClient({
  plugins: [emailOTPClient(), inferAdditionalFields<typeof auth>()],
});
```

- `emailOTPClient()` — adds `signIn.emailOtp()` and `emailOtp.sendVerificationOtp()` to the client
- `inferAdditionalFields<typeof auth>()` — infers the `role` additional field type from the server config

## Login flow

The login flow is a multi-step form with two steps: email entry and OTP verification.

### Step 1: Email entry

```text
User enters email → POST /api/auth/email-otp/send-verification-otp
  ├── Email whitelisted → 200, OTP sent by email, toast.success, go to Step 2
  └── Email not whitelisted → 401 EMAIL_NOT_AUTHORIZED, toast.error, stay on Step 1
```

### Step 2: OTP verification

```text
User enters 6-digit code → POST /api/auth/sign-in/email-otp
  ├── Valid OTP → 200, session cookie set, redirect to /dashboard
  └── Invalid OTP → 401 INVALID_OTP, field error on OTP input
```

The OTP input auto-submits when all 6 digits are entered (`onComplete` callback). A 60-second countdown disables the resend button to prevent abuse.

### Social sign-in

```text
User clicks Google/GitHub → authClient.signIn.social({ provider, callbackURL: '/dashboard' })
  └── Redirects to OAuth provider → callback → session cookie set → redirect to /dashboard
```

### Components

| Component             | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `LoginForm`           | Orchestrates steps, reads `error` query param for unauthorized toast |
| `StepLogin`           | Email input + social provider buttons                                |
| `StepOtpVerification` | OTP input + verify button + resend countdown + back button           |
| `login-form.store.ts` | Zustand store for pending/submitted state, selected provider, email  |

### Hooks

| Hook                 | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `useSignIn`          | Email OTP send + social sign-in, form validation with Zod |
| `useOtpVerification` | OTP verification + resend, redirect on success            |
| `useSignOut`         | Sign-out + toast + redirect to `/`                        |

## Route protection

The `withAuth` middleware runs in the proxy chain (see [Security](./security)) and protects two route patterns:

| Route                | Unauthenticated              | Authenticated                    | Unauthorized email                                    |
| -------------------- | ---------------------------- | -------------------------------- | ----------------------------------------------------- |
| `/:locale/dashboard` | Redirect to `/:locale/login` | Allowed                          | Redirect to `/:locale/login?error=UNAUTHORIZED_EMAIL` |
| `/:locale/login`     | Allowed                      | Redirect to `/:locale/dashboard` | Redirect to `/:locale/login?error=UNAUTHORIZED_EMAIL` |

### Session verification

The middleware reads the `better-auth.session_token` cookie (or `__Secure-` variant in production) and calls `/api/auth/get-session` internally to validate the session. The session user is injected into the request headers as `x-user` for downstream consumption.

### Unauthorized email handling

If the session user's email is not in the whitelist:

1. The session cookie is deleted
2. The user is redirected to `/:locale/login?error=UNAUTHORIZED_EMAIL`
3. The `LoginForm` component reads the `error` query param and displays an error toast

## Email delivery

OTP codes are delivered via [Resend](https://resend.com) using a localized React Email template.

### Server action

`sendVerificationOTPEmail(email, otp)` in `src/core/auth/actions/index.ts`:

1. Reads the `x-locale` header to determine the locale
2. Loads translations for the email template
3. In development, logs the OTP code to the console for easy testing — no need to configure a real email provider locally
4. Sends the email via the provider-agnostic mailer interface

### Template

The `LoginVerificationCode` template (`emails/login-verification-code.tsx`) renders a localized email with the 6-digit code in a highlighted box. See [Mailer](./mailer) for the email infrastructure.

## Audit logging

All auth events are logged through two mechanisms:

### Audit log plugin

The `auditLog` plugin captures Better Auth events and persists them to `auth_audit_log`. The `beforeLog` filter skips sign-in success events (handled by `logSessionCreated` instead). The `afterLog` hook forwards selected events to Axiom:

| Action            | Axiom event                 |
| ----------------- | --------------------------- |
| `sign-out`        | `auth.logout.success`       |
| `change-email`    | `auth.email.changed`        |
| `delete-user`     | `auth.account.deleted`      |
| `revoke-session`  | `auth.session.revoked`      |
| `revoke-sessions` | `auth.sessions.revoked.all` |

### Session creation

`logSessionCreated` runs on `session.create.after` and writes a richer audit entry that includes the authentication provider (`email-otp`, `google`, `github`, or `social`). This entry is also streamed to Axiom as `auth.login.success`.

### Error logging

The `onAPIError` handler logs auth API errors to Axiom:

- Login/callback failures → `auth.login.failed` (warn level)
- Other API errors → `auth.error` (error level)
- `EMAIL_NOT_AUTHORIZED` errors are silently skipped (expected behavior, not an error)
