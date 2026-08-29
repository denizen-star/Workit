import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  getCurrentUser,
  hashPin,
  isAdminUser,
  isValidPin,
  requireAdmin,
  AuthError,
} from '@/lib/auth';
import { isDuplicateEmailError, isNameTaken, NAME_TAKEN_MESSAGE, normalizeEmail, normalizeName } from '@/lib/profile';
import { queueWelcomeEmail } from '@/lib/emails/lifecycle';
import { trackServerEvent } from '@/lib/trackServerEvent';
import { lockedWeeksByUser } from '@/lib/beltHousehold';
import { whoBelt } from '@/lib/belts';
import { loadWhoRoster } from '@/lib/whoRoster';

export async function GET(request: NextRequest) {
  try {
    const me = await getCurrentUser();
    const wantAll = request.nextUrl.searchParams.get('all') === '1';
    if (wantAll) {
      if (!me || !isAdminUser(me)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const roster = await loadWhoRoster(wantAll);
    const locked = await lockedWeeksByUser();
    const users = roster.map((row) => {
      const belt = whoBelt(locked.get(Number(row.id)) || 0);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        has_pin: row.has_pin,
        active: row.active,
        newToTraining: row.newToTraining,
        beltName: belt.name,
        beltFill: belt.fill,
        beltEarned: belt.earned,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const pin = body.pin;

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (await isNameTaken(name)) {
      return NextResponse.json({ error: NAME_TAKEN_MESSAGE }, { status: 409 });
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

    void trackServerEvent({
      eventType: 'admin_user',
      pageCategory: 'admin',
      ctaType: 'create',
    });

    queueWelcomeEmail({
      id: Number(result.insertId),
      name,
      email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertId,
        name,
        email,
        has_pin: true,
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
