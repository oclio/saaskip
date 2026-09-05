import { expect, type Page, type Route, test } from '@playwright/test';

const AUTHORIZED_EMAIL = 'tester1@example.com';
const UNAUTHORIZED_EMAIL = 'intruder@example.com';
const VALID_OTP = '123456';
const INVALID_OTP = '000000';
const SESSION_COOKIE = 'better-auth.session_token';

const mockUser = {
  id: 'test-user-id',
  email: AUTHORIZED_EMAIL,
  name: 'Tester',
  role: 'guest',
};

const mockSession = {
  session: {
    id: 'test-session-id',
    token: 'test-session-token',
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  },
  user: mockUser,
};

function jsonResponse(
  route: Route,
  status: number,
  data: unknown,
  headers?: Record<string, string>,
) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
    headers,
  });
}

function handleGetSession(route: Route, session: typeof mockSession | null) {
  if (session) {
    return jsonResponse(route, 200, session);
  }
  return route.fulfill({ status: 401, body: '{}' });
}

function handleSendOtp(
  route: Route,
  body: { email?: string } | undefined,
  authorizedEmail: string,
) {
  const email = body?.email;
  if (email !== authorizedEmail && email) {
    return jsonResponse(route, 401, {
      code: 'EMAIL_NOT_AUTHORIZED',
      message: 'Email not authorized',
    });
  }
  return jsonResponse(route, 200, { status: true });
}

function handleSignInOtp(
  route: Route,
  body: { otp?: string } | undefined,
  validOtp: string,
  session: typeof mockSession,
) {
  if (body?.otp === validOtp) {
    return jsonResponse(route, 200, {
      token: session.session.token,
      user: session.user,
      session: session.session,
    });
  }
  return jsonResponse(route, 401, {
    code: 'INVALID_OTP',
    message: 'Invalid OTP',
  });
}

function handleSignOut(route: Route) {
  return jsonResponse(
    route,
    200,
    { status: true },
    {
      'set-cookie': `${SESSION_COOKIE}=; Path=/; Max-Age=0`,
    },
  );
}

function handleSocialSignIn(
  route: Route,
  body: { provider?: string } | undefined,
) {
  const provider = body?.provider;
  return jsonResponse(route, 200, {
    url: `https://accounts.${provider}.com/oauth/authorize`,
    redirect: true,
  });
}

/**
 * Mocks the Better Auth API endpoints used by the login flow.
 * All auth API calls are intercepted so no real database or email
 * provider is required.
 */
async function mockAuthApi(
  page: Page,
  options: {
    authorizedEmail?: string;
    otp?: string;
    session?: typeof mockSession | null;
  } = {},
) {
  const authorizedEmail = options.authorizedEmail ?? AUTHORIZED_EMAIL;
  const validOtp = options.otp ?? VALID_OTP;
  const session = options.session ?? mockSession;

  await page.route('**/api/auth/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();
    const body = route.request().postDataJSON();

    if (method === 'GET' && url.includes('/api/auth/get-session')) {
      return handleGetSession(route, session);
    }

    if (url.includes('/email-otp/send-verification-otp')) {
      return handleSendOtp(route, body, authorizedEmail);
    }

    if (url.includes('/sign-in/email-otp')) {
      return handleSignInOtp(route, body, validOtp, session);
    }

    if (url.includes('/sign-out')) {
      return handleSignOut(route);
    }

    if (url.includes('/sign-in/social')) {
      return handleSocialSignIn(route, body);
    }

    return route.continue();
  });
}

/**
 * Injects a mock session cookie so the browser appears authenticated.
 */
async function setSessionCookie(page: Page) {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: 'test-session-token',
      url: 'http://localhost:3000',
    },
  ]);
}

/**
 * Removes the session cookie so the browser appears unauthenticated.
 */
async function clearSessionCookie(page: Page) {
  await page.context().clearCookies();
}

/**
 * Fills the OTP input with the given code.
 * OTPInput from input-otp renders the hidden <input> with autocomplete="one-time-code".
 * We locate the input directly on the page and use pressSequentially so each digit
 * triggers input-otp's internal key handlers and react-hook-form's onChange.
 */
async function fillOtp(page: Page, code: string) {
  const input = page.locator('input[autocomplete="one-time-code"]');
  await input.pressSequentially(code);
}

test.describe('Login flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await clearSessionCookie(page);
    await mockAuthApi(page);
  });

  // ─── Step 1: Login form ───────────────────────────────────────────────

  test.describe('Step 1: Login form', () => {
    test('displays the login heading in the default locale (en)', async ({
      page,
    }) => {
      await page.goto('/en/login');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('renders the email input with autocomplete="email"', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    test('renders the social provider buttons (Google, GitHub)', async ({
      page,
    }) => {
      await page.goto('/en/login');

      await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /GitHub/i })).toBeVisible();
    });

    test('disables the submit button when the email is empty', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const submitButton = page.getByTestId('submit-email-button');
      await expect(submitButton).toBeDisabled();
    });

    test('enables the submit button when a valid email is entered', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill('user@example.com');

      const submitButton = page.getByTestId('submit-email-button');
      await expect(submitButton).toBeEnabled();
    });
  });

  // ─── Step 2: OTP verification (email flow) ────────────────────────────

  test.describe('Step 2: OTP verification', () => {
    test('navigates to the OTP step when submitting an authorized email', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      const submitButton = page.getByTestId('submit-email-button');
      await submitButton.click();

      // The OTP step is shown — the OTP input is visible
      await expect(page.getByTestId('otp-input')).toBeVisible();
    });

    test('renders the OTP field with 6 slots', async ({ page }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // The OTP input should be present
      await expect(page.getByTestId('otp-input')).toBeVisible();
    });

    test('renders the resend countdown button', async ({ page }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // The resend button is disabled during the initial countdown
      const resendButton = page.getByTestId('resend-button');
      await expect(resendButton).toBeVisible();
      await expect(resendButton).toBeDisabled();
    });

    test('navigates back to the login step when clicking "back to email"', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // Click the "back to email" link button
      const backButton = page.getByTestId('back-to-email');
      await backButton.click();

      // Should be back on the login step with the email form
      await expect(page.getByTestId('email-input')).toBeVisible();
    });

    test('shows a field error when submitting an invalid OTP code', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // Wait for the OTP step to mount and be ready
      await expect(page.getByTestId('otp-input')).toBeVisible();

      // Fill the OTP input with an invalid code (onComplete auto-submits, or click verify)
      await fillOtp(page, INVALID_OTP);

      // Should show a field error (FieldError renders with data-slot="field-error")
      await expect(page.locator('[data-slot="field-error"]')).toBeVisible();
    });

    test('redirects to /en/dashboard on valid OTP submission', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(AUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // Wait for the OTP step to mount and be ready
      await expect(page.getByTestId('otp-input')).toBeVisible();

      // Fill the OTP input with the valid code (onComplete auto-submits)
      await setSessionCookie(page);
      await fillOtp(page, VALID_OTP);

      // Should redirect to the dashboard (longer timeout for first-time lazy compilation in dev)
      await expect(page).toHaveURL(/\/en\/dashboard/, { timeout: 15_000 });
      await expect(page.getByTestId('dashboard-title')).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  // ─── Step 3: Unauthorized email ───────────────────────────────────────

  test.describe('Step 3: Unauthorized email', () => {
    test('shows an error toast when the email is not in the whitelist', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(UNAUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // Should show an error toast (Sonner renders toasts as [data-sonner-toast][data-type="error"])
      await expect(
        page.locator('[data-sonner-toast][data-type="error"]').first(),
      ).toBeVisible();
    });

    test('stays on the login step after the unauthorized error', async ({
      page,
    }) => {
      await page.goto('/en/login');

      const emailInput = page.getByTestId('email-input');
      await emailInput.fill(UNAUTHORIZED_EMAIL);

      await page.getByTestId('submit-email-button').click();

      // Should still be on the login step (email form visible)
      await expect(page.getByTestId('email-input')).toBeVisible();
    });
  });

  // ─── Step 4: Social login ─────────────────────────────────────────────

  test.describe('Step 4: Social login', () => {
    test('initiates Google sign-in when clicking the Google button', async ({
      page,
    }) => {
      let socialProvider = '';
      await page.route('**/api/auth/sign-in/social', async (route) => {
        socialProvider = route.request().postDataJSON()?.provider ?? '';
        await handleSocialSignIn(route, { provider: socialProvider });
      });

      await page.goto('/en/login');

      const googleButton = page.getByRole('button', { name: /Google/i });
      await googleButton.click();

      await page.waitForTimeout(500);
      expect(socialProvider).toBe('google');
    });

    test('initiates GitHub sign-in when clicking the GitHub button', async ({
      page,
    }) => {
      let socialProvider = '';
      await page.route('**/api/auth/sign-in/social', async (route) => {
        socialProvider = route.request().postDataJSON()?.provider ?? '';
        await handleSocialSignIn(route, { provider: socialProvider });
      });

      await page.goto('/en/login');

      const githubButton = page.getByRole('button', { name: /GitHub/i });
      await githubButton.click();

      await page.waitForTimeout(500);
      expect(socialProvider).toBe('github');
    });
  });

  // ─── Step 5: Auth middleware ──────────────────────────────────────────

  test.describe('Step 5: Auth middleware', () => {
    test('redirects to /en/login when visiting /en/dashboard without session', async ({
      page,
    }) => {
      await page.goto('/en/dashboard');

      await expect(page).toHaveURL(/\/en\/login/);
    });

    test('shows an error toast when visiting login with error=UNAUTHORIZED_EMAIL', async ({
      page,
    }) => {
      await page.goto('/en/login?error=UNAUTHORIZED_EMAIL');

      await expect(
        page.locator('[data-sonner-toast][data-type="error"]').first(),
      ).toBeVisible();
    });
  });

  // ─── Step 6: Sign out ─────────────────────────────────────────────────

  test.describe('Step 6: Sign out', () => {
    test('redirects to /en/ after clicking sign out from the dashboard', async ({
      page,
    }) => {
      await page.route('**/api/auth/get-session', async (route) => {
        await jsonResponse(route, 200, mockSession);
      });

      await page.route('**/api/auth/sign-out', async (route) => {
        await handleSignOut(route);
      });

      await setSessionCookie(page);
      await page.goto('/en/dashboard');

      const signOutButton = page.getByTestId('logout-button');
      await signOutButton.click();

      await expect(page).toHaveURL(/\/en\/?$/);
    });

    test('shows a success toast after sign out', async ({ page }) => {
      await page.route('**/api/auth/get-session', async (route) => {
        await jsonResponse(route, 200, mockSession);
      });

      await page.route('**/api/auth/sign-out', async (route) => {
        await handleSignOut(route);
      });

      await setSessionCookie(page);
      await page.goto('/en/dashboard');

      const signOutButton = page.getByTestId('logout-button');
      await signOutButton.click();

      // Should show a success toast (Sonner renders toasts as [data-sonner-toast][data-type="success"])
      await expect(
        page.locator('[data-sonner-toast][data-type="success"]').first(),
      ).toBeVisible();
    });

    test('redirects to /en/login when visiting /en/dashboard after sign out', async ({
      page,
    }) => {
      let hasSession = true;
      await page.route('**/api/auth/get-session', async (route) => {
        if (hasSession) {
          await jsonResponse(route, 200, mockSession);
        } else {
          await route.fulfill({ status: 401, body: '{}' });
        }
      });

      await page.route('**/api/auth/sign-out', async (route) => {
        hasSession = false;
        await page.context().clearCookies();
        await handleSignOut(route);
      });

      await setSessionCookie(page);
      await page.goto('/en/dashboard');

      const signOutButton = page.getByTestId('logout-button');
      await signOutButton.click();

      await expect(page).toHaveURL(/\/en\/?$/);

      await page.goto('/en/dashboard');
      await expect(page).toHaveURL(/\/en\/login/);
    });
  });
});
