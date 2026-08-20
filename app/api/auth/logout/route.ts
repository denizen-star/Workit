import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCookieOptions, requireAdmin, AuthError } from '@/lib/auth';

export async function POST() {
  try {
    await requireAdmin();
    const cookieStore = await cookies();
    cookieStore.set(clearSessionCookieOptions());
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
