import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/sounds/') ||
    pathname.startsWith('/badges/') ||
    pathname.match(/\.(png|svg|jpg|jpeg|webp|ico|wav)$/)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/cron') || pathname === '/api/analytics/event') {
    return NextResponse.next();
  }

  if (pathname === '/') {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const userId = token ? await verifySessionToken(token) : null;
    if (!userId) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.rewrite(url);
  }

  if (pathname === '/who' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname === '/api/users' && request.method === 'GET') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  if (!userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/who';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
