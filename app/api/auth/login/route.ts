import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import {
  clearFailedAttempts,
  createSessionToken,
  isUserLockedOut,
  isValidPin,
  recordFailedAttempt,
  sessionCookieOptions,
  verifyPin,
} from '@/lib/auth';
import { EMAIL_NOT_VERIFIED } from '@/lib/joinCopy';
import { normalizeEmail } from '@/lib/profile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pin = body.pin;
    const email = normalizeEmail(body.email);
    const userId = Number(body.userId);

    if (!isValidPin(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    let row: {
      id: number;
      name: string;
      email: string | null;
      pin_hash: string | null;
      email_verified_at?: string | Date | null;
    } | undefined;

    const load = async (sql: string, params: unknown[]) => {
      const result = await query(sql, params);
      return result.rows[0] as typeof row;
    };
    try {
      if (email) {
        row = await load(
          'SELECT id, name, email, pin_hash, email_verified_at FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1',
          [email]
        );
      } else if (Number.isFinite(userId) && userId > 0) {
        row = await load(
          'SELECT id, name, email, pin_hash, email_verified_at FROM users WHERE id = ? LIMIT 1',
          [userId]
        );
      } else {
        return NextResponse.json({ error: 'Enter your email' }, { status: 400 });
      }
    } catch {
      if (email) {
        row = await load(
          'SELECT id, name, email, pin_hash FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1',
          [email]
        );
      } else if (Number.isFinite(userId) && userId > 0) {
        row = await load('SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1', [userId]);
      }
    }

    if (!row) {
      return NextResponse.json({ error: 'No profile for that email' }, { status: 404 });
    }

    if (isUserLockedOut(row.id)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    if (!row.pin_hash) {
      return NextResponse.json(
        { error: 'No PIN set for this profile. Use your invite link.' },
        { status: 403 }
      );
    }

    if (row.email_verified_at !== undefined && !row.email_verified_at) {
      return NextResponse.json({ error: EMAIL_NOT_VERIFIED, unverified: true }, { status: 403 });
    }

    if (!verifyPin(pin, row.pin_hash)) {
      recordFailedAttempt(row.id);
      return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
    }

    clearFailedAttempts(row.id);
    const token = await createSessionToken(row.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieOptions(token));

    return NextResponse.json({
      success: true,
      user: { id: row.id, name: row.name, email: row.email, hasPin: true },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
