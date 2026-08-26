import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = request.cookies.get('dvt_session');

  // 1. If user is already logged in and attempts to access auth pages (/login, /register, /forgot-password)
  if (session && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/dashboard';
    const targetUrl = new URL(returnUrl, request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 2. Allow public static assets and API routes
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. If user is not logged in and tries to access dashboard or protected routes, redirect to login with returnUrl
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('returnUrl', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
