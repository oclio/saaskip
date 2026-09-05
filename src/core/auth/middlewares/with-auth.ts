import { NextRequest, NextResponse } from 'next/server';

import { CustomMiddleware } from '@/core/middlewares/types';
import { logger } from '@/core/observability/axiom/server';
import { isAuthorizedEmail } from '@/core/security/email-whitelist';

interface SessionData {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

async function fetchSession(
  request: NextRequest,
): Promise<SessionData | undefined> {
  try {
    const response = await fetch(
      new URL('/api/auth/get-session', request.url),
      {
        headers: {
          cookie: request.headers.get('cookie') ?? '',
        },
      },
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    logger.error('Failed to verify session in middleware:', {
      err: error,
      event: 'auth.middleware.session_fetch_failed',
    });
  }
  return undefined;
}

export const withAuth: CustomMiddleware = async (request, _event, next) => {
  const { pathname } = request.nextUrl;
  const isDashboard = /^\/[a-z]{2}\/dashboard/.test(pathname);
  const isLogin = /^\/[a-z]{2}\/login$/.test(pathname);

  if (!isDashboard && !isLogin) {
    return next();
  }

  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token');

  const locale = pathname.split('/', 2)[1];

  if (!sessionCookie) {
    if (isDashboard) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    return next();
  }

  const session = await fetchSession(request);
  const user = session?.user;

  if (user) {
    request.headers.set('x-user', JSON.stringify(user));

    if (!isAuthorizedEmail(user.email)) {
      logger.warn(`Access denied: Email ${user.email} is not authorized`, {
        event: 'auth.access.denied',
        email: user.email,
        pathname,
      });

      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/login?error=UNAUTHORIZED_EMAIL`, request.url),
      );
      redirectResponse.cookies.delete('better-auth.session_token');
      redirectResponse.cookies.delete('__Secure-better-auth.session_token');
      return redirectResponse;
    }

    if (isLogin) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard`, request.url),
      );
    }
  }

  return next();
};
