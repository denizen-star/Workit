import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, hashPin, isValidPin } from '@/lib/auth';
import { isDuplicateEmailError, normalizeEmail, normalizeName } from '@/lib/profile';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const pin = typeof body.pin === 'string' && body.pin.length > 0 ? body.pin : null;

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (pin != null) {
      if (!isValidPin(pin)) {
        return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
      }
      await query('UPDATE users SET name = ?, email = ?, pin_hash = ? WHERE id = ?', [
        name,
        email,
        hashPin(pin),
        user.id,
      ]);
    } else {
      await query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user.id]);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name,
        email,
        hasPin: pin != null || user.hasPin,
      },
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
