import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import {
  createSessionToken,
  getUserById,
  hashPin,
  isValidPin,
  sessionCookieOptions,
} from '@/lib/auth';
import { getWaitingGuest, inviteTokenMatches } from '@/lib/invite';

export async function POST(request: NextRequest) {
  try {
    const { userId, pin, confirmPin, inviteToken } = await request.json();
    const id = Number(userId);
    const rawToken = typeof inviteToken === 'string' ? inviteToken : '';

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: 'PINs do not match' }, { status: 400 });
    }

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.pin_hash) {
      return NextResponse.json(
        { error: 'This profile already has a PIN. Use login instead.' },
        { status: 409 }
      );
    }

    const waiting = await getWaitingGuest(id);
    if (!waiting || !inviteTokenMatches(rawToken, waiting.invite_token)) {
      return NextResponse.json(
        { error: 'Use the invite link from your email to create a PIN.' },
        { status: 403 }
      );
    }

    const pinHash = hashPin(pin);
    await query('UPDATE users SET pin_hash = ?, invite_token = NULL WHERE id = ?', [pinHash, id]);

    const token = await createSessionToken(id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, hasPin: true },
    });
  } catch (error) {
    console.error('Error setting PIN:', error);
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }
}
