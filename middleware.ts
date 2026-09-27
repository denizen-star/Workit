import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { DEVICE_BLOCK_COOKIE, readDeviceBlockToken, verifyDeviceBlockToken } from '@/lib/deviceBlockToken';

/** Sign-up surfaces a blocked browser loses (lib/deviceBlock.ts). Login and signed-in use stay open. */
const DEVICE_BLOCKED_PATHS = new Set(['/join', '/faq', '/waiver', '/api/join']);

function toLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

function toHome(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/home';
  url.search = '';
  return NextResponse.redirect(url);
}

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

  // /blocked and its status/request API are the only way out of a block, so always public.
  if (pathname === '/blocked' || pathname === '/api/device-block') {
    return NextResponse.next();
  }

  // Cookie check only (no DB): whether the block was cleared is settled on /blocked itself.
  if (DEVICE_BLOCKED_PATHS.has(pathname) && (await verifyDeviceBlockToken(request.cookies.get(DEVICE_BLOCK_COOKIE)?.value))) {
    const signedIn = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value ?? '');
    if (!signedIn) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Blocked', blocked: true }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/blocked';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/api/auth') || pathname === '/api/join' || pathname === '/waiver' || pathname === '/faq') {
    return NextResponse.next();
  }

  if (pathname === '/api/users' && request.method === 'GET') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifySessionToken(token) : null;

  if (pathname === '/' || pathname === '/who' || pathname === '/login') {
    if (userId && pathname !== '/login') {
      return pathname === '/' ? NextResponse.rewrite(new URL('/home', request.url)) : toHome(request);
    }
    if (userId && pathname === '/login' && !request.nextUrl.searchParams.get('verify')) {
      return toHome(request);
    }
    if (!userId && (pathname === '/' || pathname === '/who')) {
      const next = request.nextUrl.clone();
      next.pathname = '/login';
      const claim = request.nextUrl.searchParams.get('claim');
      const reset = request.nextUrl.searchParams.get('reset');
      if (claim) {
        next.pathname = '/join';
        next.search = '?claim=' + encodeURIComponent(claim);
      } else if (reset) {
        next.search = '?reset=' + encodeURIComponent(reset);
      } else {
        next.search = '';
      }
      return NextResponse.redirect(next);
    }
    return NextResponse.next();
  }

  if (pathname === '/join') {
    if (userId) return toHome(request);
    const h = request.nextUrl.searchParams.get('h') || '';
    const claim = request.nextUrl.searchParams.get('claim') || '';
    if (!claim && (!h || h === 'og')) {
      return toLogin(request);
    }
    return NextResponse.next();
  }

  if (!userId) {
    // An evicted blocked account (lib/auth.ts) lands on /blocked, not /login. Its parallel
    // requests race the eviction, so APIs answer `blocked` for AppMenu to redirect on.
    const block = await readDeviceBlockToken(request.cookies.get(DEVICE_BLOCK_COOKIE)?.value);
    if (block?.account) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Blocked', blocked: true }, { status: 403 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/blocked';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return toLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
