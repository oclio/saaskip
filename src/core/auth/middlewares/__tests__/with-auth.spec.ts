import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { vi } from 'vitest';

import {
  mockNextFetchEvent,
  mockNextRequest,
} from '@/tests/unit/helpers/request';
import { axiomLoggerMock } from '@/tests/unit/mocks/observability';

const { isAuthorizedEmailMock, fetchMock } = vi.hoisted(() => ({
  isAuthorizedEmailMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('@/core/security/email-whitelist', () => ({
  isAuthorizedEmail: isAuthorizedEmailMock,
}));

import { withAuth } from '../with-auth';

const mockEvent = mockNextFetchEvent;

function nextMock() {
  return vi.fn().mockResolvedValue(NextResponse.next());
}

function requestWith(
  pathname: string,
  cookies: Record<string, string> = {},
): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  return mockNextRequest({
    pathname,
    url: `http://localhost:3000${pathname}`,
    cookies,
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

function mockFetchResponse(body: unknown, isOk = true) {
  fetchMock.mockResolvedValue({
    ok: isOk,
    json: async () => body,
  });
}

const SESSION_TOKEN_COOKIE = {
  'better-auth.session_token': 'token-abc',
};

const SECURE_SESSION_TOKEN_COOKIE = {
  '__Secure-better-auth.session_token': 'token-secure',
};

const USER = {
  id: '1',
  email: 'a@b.com',
  name: 'Test',
  role: 'member',
};

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    isAuthorizedEmailMock.mockReturnValue(true);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('non-auth routes', () => {
    it('calls next without checking session for unrelated paths', async () => {
      const request = requestWith('/en/about');
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(next).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not fetch session for non-auth route even with session cookie', async () => {
      const request = requestWith('/en/about', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(next).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('regex anchors', () => {
    it.each(['/foo/en/dashboard', '/foo/en/login', '/en/login/extra'])(
      'does not intercept path %s',
      async (pathname) => {
        const request = requestWith(pathname, SESSION_TOKEN_COOKIE);
        const next = nextMock();

        await withAuth(request, mockEvent(), next);

        expect(next).toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe('dashboard without session cookie', () => {
    it('redirects to login with locale in URL', async () => {
      const request = requestWith('/fr/dashboard');
      const next = nextMock();

      const response = await withAuth(request, mockEvent(), next);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/fr/login');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('login without session cookie', () => {
    it('calls next', async () => {
      const request = requestWith('/en/login');
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('with secure session cookie', () => {
    it('fetches session using __Secure-better-auth.session_token cookie', async () => {
      mockFetchResponse({ user: USER });
      const request = requestWith('/en/dashboard', SECURE_SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(fetchMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('with session cookie and authorized user', () => {
    it('redirects to dashboard with locale in URL when on login', async () => {
      mockFetchResponse({ user: USER });
      const request = requestWith('/fr/login', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      const response = await withAuth(request, mockEvent(), next);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/fr/dashboard');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next when on dashboard', async () => {
      mockFetchResponse({ user: USER });
      const request = requestWith('/en/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(next).toHaveBeenCalled();
    });

    it('sets x-user header with session data', async () => {
      mockFetchResponse({ user: USER });
      const request = requestWith('/en/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(request.headers.get('x-user')).toBe(JSON.stringify(USER));
    });

    it('fetches session from /api/auth/get-session with cookie header', async () => {
      mockFetchResponse({ user: USER });
      const request = requestWith('/en/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url.toString()).toContain('/api/auth/get-session');
      expect(options.headers.cookie).toContain(
        'better-auth.session_token=token-abc',
      );
    });
  });

  describe('with session cookie and unauthorized email', () => {
    it('redirects to login with error and deletes session cookies', async () => {
      isAuthorizedEmailMock.mockReturnValue(false);
      mockFetchResponse({ user: { ...USER, email: 'bad@b.com' } });
      const request = requestWith('/fr/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      const response = await withAuth(request, mockEvent(), next);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(
        '/fr/login?error=UNAUTHORIZED_EMAIL',
      );
      expect(next).not.toHaveBeenCalled();
      expect(axiomLoggerMock.warn).toHaveBeenCalledWith(
        expect.stringMatching(/Access denied/),
        expect.objectContaining({ event: 'auth.access.denied' }),
      );

      const setCookies = response.headers.getSetCookie();
      expect(setCookies).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^better-auth\.session_token=/),
          expect.stringMatching(/^__Secure-better-auth\.session_token=/),
        ]),
      );
    });
  });

  describe('fetchSession failure', () => {
    it('logs error and calls next when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('network'));
      const request = requestWith('/en/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(axiomLoggerMock.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          event: 'auth.middleware.session_fetch_failed',
        }),
      );
      expect(String(axiomLoggerMock.error.mock.calls[0][0])).not.toBe('');
      expect(next).toHaveBeenCalled();
    });

    it('does not set x-user when fetch returns non-ok response with user body', async () => {
      mockFetchResponse({ user: USER }, false);
      const request = requestWith('/en/dashboard', SESSION_TOKEN_COOKIE);
      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      expect(next).toHaveBeenCalled();
      expect(request.headers.get('x-user')).toBeNull();
    });

    it('passes empty cookie header when request has no cookie header', async () => {
      mockFetchResponse({ user: USER });
      const request = mockNextRequest({
        pathname: '/en/dashboard',
        url: 'http://localhost:3000/en/dashboard',
        cookies: SESSION_TOKEN_COOKIE,
      });

      const next = nextMock();

      await withAuth(request, mockEvent(), next);

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.cookie).toBe('');
    });
  });
});
