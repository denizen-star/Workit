import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AuthError, requireCurrentUser } from '@/lib/auth';
import { isTestUserName } from '@/lib/householdUsers';
import {
  countInvitesBy,
  createInviteToken,
  INVITE_CAP,
  listGuestsFor,
} from '@/lib/invite';
import { queueInviteEmail } from '@/lib/emails/lifecycle';
import {
  isDuplicateEmailError,
  isNameTaken,
  NAME_TAKEN_MESSAGE,
  normalizeEmail,
  normalizeName,
} from '@/lib/profile';

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (isTestUserName(user.name)) {
      return NextResponse.json({ guests: [] });
    }
    const guests = await listGuestsFor(user.id);
    return NextResponse.json({ guests, remaining: Math.max(0, INVITE_CAP - guests.length) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error listing invites:', error);
    return NextResponse.json({ error: 'Failed to list invites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (isTestUserName(user.name)) {
      return NextResponse.json({ error: 'Test cannot invite' }, { status: 403 });
    }

    const body = await request.json();
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (await isNameTaken(name)) {
      return NextResponse.json({ error: NAME_TAKEN_MESSAGE }, { status: 409 });
    }

    const used = await countInvitesBy(user.id);
    if (used >= INVITE_CAP) {
      return NextResponse.json(
        { error: 'You have invited 100 people. That is the cap.' },
        { status: 400 }
      );
    }

    const { raw, hash } = createInviteToken();
    const result = await query(
      `INSERT INTO users (name, email, pin_hash, invited_by, invite_token, invited_at)
       VALUES (?, ?, NULL, ?, ?, UTC_TIMESTAMP())`,
      [name, email, user.id, hash]
    );

    const id = Number(result.insertId);
    queueInviteEmail({
      id,
      name,
      email,
      inviterName: user.name,
      inviterEmail: user.email,
      inviterId: user.id,
      rawToken: raw,
    });

    return NextResponse.json({
      success: true,
      guest: {
        id,
        name,
        email,
        has_pin: false,
        invited_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isDuplicateEmailError(error)) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
