import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { verifyEmailToken } from '@/lib/emailVerify';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('token') || '';
  const userId = await verifyEmailToken(raw);
  if (!userId) {
    return NextResponse.json({ error: 'That verify link is not valid' }, { status: 403 });
  }
  await query('UPDATE users SET email_verified_at = UTC_TIMESTAMP() WHERE id = ?', [userId]);
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));
  return NextResponse.redirect(new URL('/home', request.url));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const raw = typeof body.token === 'string' ? body.token : '';
    const userId = await verifyEmailToken(raw);
    if (!userId) {
      return NextResponse.json({ error: 'That verify link is not valid' }, { status: 403 });
    }
    await query('UPDATE users SET email_verified_at = UTC_TIMESTAMP() WHERE id = ?', [userId]);
    const token = await createSessionToken(userId);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Could not verify email' }, { status: 500 });
  }
}
