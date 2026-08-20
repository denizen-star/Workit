import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPin,
  isValidPin,
  requireCurrentUser,
  AuthError,
} from '@/lib/auth';
import { isDuplicateEmailError, normalizeEmail, normalizeName } from '@/lib/profile';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, email, CASE WHEN pin_hash IS NULL THEN 0 ELSE 1 END AS has_pin FROM users ORDER BY id ASC'
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireCurrentUser();

    const body = await request.json();
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const pin = body.pin;

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const pinHash = hashPin(pin);

    const result = await query(
      'INSERT INTO users (name, email, pin_hash) VALUES (?, ?, ?)',
      [name, email, pinHash]
    );

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertId,
        name,
        email,
        has_pin: 1,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isDuplicateEmailError(error)) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
