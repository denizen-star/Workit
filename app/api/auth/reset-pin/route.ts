import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import {
  clearFailedAttempts,
  createSessionToken,
  getUserById,
  hashPin,
  isValidPin,
  sessionCookieOptions,
} from '@/lib/auth';
import { verifyPinResetToken } from '@/lib/pinReset';

export async function POST(request: NextRequest) {
  try {
    const { token, pin, confirmPin } = await request.json();
    const rawToken = typeof token === 'string' ? token : '';

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'PINs do not match' }, { status: 400 });
    }

    const userId = await verifyPinResetToken(rawToken);
    if (!userId) {
      return NextResponse.json({ error: 'Reset link is not valid' }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user?.pin_hash) {
      return NextResponse.json({ error: 'Reset link is not valid' }, { status: 403 });
    }

    await query('UPDATE users SET pin_hash = ? WHERE id = ?', [hashPin(pin), userId]);
    clearFailedAttempts(userId);

    const session = await createSessionToken(userId);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(session));

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, hasPin: true },
    });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    return NextResponse.json({ error: 'Could not set PIN' }, { status: 500 });
  }
}
