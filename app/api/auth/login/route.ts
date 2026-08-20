import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  clearFailedAttempts,
  createSessionToken,
  getUserById,
  isUserLockedOut,
  isValidPin,
  recordFailedAttempt,
  sessionCookieOptions,
  verifyPin,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, pin } = await request.json();
    const id = Number(userId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    if (isUserLockedOut(id)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.pin_hash) {
      return NextResponse.json(
        { error: 'No PIN set for this profile. Create one first.', needsSetup: true },
        { status: 403 }
      );
    }

    if (!verifyPin(pin, user.pin_hash)) {
      recordFailedAttempt(id);
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
    }

    clearFailedAttempts(id);
    const token = await createSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, hasPin: true },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
