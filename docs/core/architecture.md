# Architecture

The `src/core/` directory contains the foundational infrastructure of saaskip. These modules are not features — they are the building blocks that features build on.

App-level configuration lives at `src/config/brand.ts` — the first file to edit when customizing the boilerplate (title, author).

## Structure

```text
src/
  config/brand.ts    → brand metadata (title, author)
  core/
    async/           → withTimeout helper, TimeoutError
    auth/            → Better Auth server, client, hooks, helpers, middleware, schemas, actions
    env/             → typed environment variable validation
    db/              → Drizzle ORM client, health check
    errors/          → AppError class, error codes, message helpers
    helpers/         → shared utilities (string formatting)
    i18n/            → next-intl routing, messages, locale switcher
    mailer/          → Resend email client, template rendering, recipient whitelist
    middlewares/     → composable middleware chain + proxy entrypoint
    observability/   → Axiom logging, Sentry error tracking, request tracing, web vitals, health checks
    security/        → Arcjet, CSP, CSRF, body size limit, secure cookies, email whitelist
    seo/             → metadata, sitemap, robots, JSON-LD, PWA manifest helpers
```

## async

| File                      | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `helpers/with-timeout.ts` | Runs a promise with a maximum timeout delay              |
| `errors/timeout-error.ts` | Error thrown when an operation exceeds its timeout (504) |

## auth

Authentication via [Better Auth](https://www.better-auth.com) with email OTP, Google and GitHub social providers, email whitelist enforcement, audit logging, and route protection middleware. See [Authentication](./auth) for the full guide.

## env

Validates environment variables at startup using `@t3-oss/env-nextjs` and zod. See [Environment Variables](./env) for the full guide.

## config (`src/config/brand.ts`)

App-level metadata consumed by the root layout, emails, and metadata APIs:

```ts
export const brand = {
  title: 'saaskip',
  author: {
    name: 'oclio',
    email: 'hello@oclio.dev',
    url: 'https://oclio.dev',
    twitter: '@oclio',
  },
};
```

This is the first file to edit when forking the boilerplate — change the title and author to match your product.

## db

Type-safe database access via [Drizzle ORM](https://orm.drizzle.team) with a `postgres-js` connection pool. Includes query logging to Axiom and a health check for the `/api/health` endpoint. See [Database](./database) for the full guide.

## errors

| File           | Purpose                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app-error.ts` | Base error class with `code`, `statusCode`, and `context`                                                        |
| `codes.ts`     | Enum of error codes (`MIDDLEWARE_CHAIN_ERROR`, `UNKNOWN_ERROR`, `TIMEOUT`)                                       |
| `helpers.ts`   | `getErrorMessage()` normalizes any thrown value to a string; `formatErrorMessage()` cleans and sentence-cases it |

To create a domain-specific error, extend `AppError`:

```ts
import { AppError, ErrorCode } from '@/core/errors';

class BillingError extends AppError {
  constructor(context?: Record<string, unknown>, cause?: unknown) {
    super(ErrorCode.UNKNOWN_ERROR, 'Billing failed', 400, context, { cause });
  }
}
```

## helpers

Small, pure utilities shared across the codebase.

| Function           | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `toSentence(text)` | Capitalizes first letter, adds trailing period if missing |

## i18n

Locale-prefixed routing, type-safe messages, and server/client translation access via [next-intl](https://next-intl.dev). See [Internationalization](./i18n) for the full guide.

## mailer

Transactional email via [Resend](https://resend.com) with [React Email](https://react.email) templates. Supports HTML, React elements, and named templates. Recipients are filtered through the email whitelist. See [Mailer](./mailer) for the full guide.

## middlewares

Next.js middleware is composed via a chain pattern instead of a single monolithic function.

| File                               | Purpose                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `types/index.ts`                   | `CustomMiddleware` type — `(req, event, next) => Promise<Response>`           |
| `chain.ts`                         | Composes an array of middlewares into a single handler with `next()` dispatch |
| `errors/middleware-chain-error.ts` | Wraps non-`AppError` thrown inside the chain                                  |

The entrypoint is `src/proxy.ts`. It sets the `x-pathname` header on the request before calling the chain, so downstream middlewares and server components can access the original pathname. Middlewares are registered in `src/proxy-stack.ts`:

```ts
import type { CustomMiddleware } from '@/core/middlewares/types';

const myMiddleware: CustomMiddleware = async (req, event, next) => {
  // do something before
  const response = await next();
  // do something after
  return response;
};

const stack: CustomMiddleware[] = [myMiddleware];
export default stack;
```

The chain runs middlewares in order, unwinds in reverse, and wraps any non-`AppError` into a `MiddlewareChainError` with the original message preserved in `context.originalError`.

### Middleware stack

| Order | Middleware          | Purpose                                                      |
| ----- | ------------------- | ------------------------------------------------------------ |
| 1     | `withSecureCookies` | Enforces HttpOnly, Secure, SameSite on response cookies      |
| 2     | `withIntl`          | Locale resolution — sets `x-locale` on response (all routes) |
| 3     | `withAxiom`         | Request logging and tracing via Axiom                        |
| 4     | `withCsp`           | Content-Security-Policy header                               |
| 5     | `withCsrf`          | CSRF protection for state-changing requests                  |
| 6     | `withBodySizeLimit` | Rejects requests exceeding the configured body size          |
| 7     | `withArcjet`        | Rate limiting and bot detection via Arcjet                   |
| 8     | `withAuth`          | Route protection — redirects for `/dashboard` and `/login`   |

`withSecureCookies` is intentionally first (outermost) so it sees the final response after all other middlewares have set their `Set-Cookie` headers. See [Security](./security#why-withsecurecookies-is-outermost) for details.

### Header flow

| Header       | Set by     | Read by              | Purpose                            |
| ------------ | ---------- | -------------------- | ---------------------------------- |
| `x-pathname` | `proxy.ts` | `createPageMetadata` | Full pathname (with locale prefix) |
| `x-locale`   | `withIntl` | `createPageMetadata` | Resolved locale (`en`, `fr`, etc.) |
| `x-user`     | `withAuth` | Downstream handlers  | Session user JSON (when logged in) |

## observability

Structured logging, request tracing, web vitals via [Axiom](https://axiom.co), error tracking via [Sentry](https://sentry.io), and a `/api/health` endpoint for load balancers. See [Observability](./observability) for the full guide.

## security

Defense-in-depth via composable middleware: CSP, CSRF, body size limit, secure cookies, email whitelist, and Arcjet for rate limiting and bot detection. Each layer can be independently enabled or disabled via environment variables. See [Security](./security) for the full guide.

## seo

SEO built entirely on the Next.js App Router metadata API — no external dependencies. Generates layout and page metadata from translated `meta` namespaces, a multilingual sitemap with hreflang alternates, robots.txt, OpenGraph and Twitter cards, JSON-LD structured data (WebSite and Organization schemas), and a PWA manifest with Apple touch icons. See [SEO](./seo) for the full guide.
