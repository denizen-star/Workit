import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AuthError, isAdminUser, requireCurrentUser } from '@/lib/auth';
import { isTestUserName } from '@/lib/householdUsers';
import { getWaitingGuest, rotateInviteToken } from '@/lib/invite';
import { resendInviteEmail } from '@/lib/emails/lifecycle';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (isTestUserName(user.name) && !isAdminUser(user)) {
      return NextResponse.json({ error: 'Test cannot invite' }, { status: 403 });
    }

    const body = await request.json();
    const guestId = Number(body.userId);
    if (!Number.isFinite(guestId) || guestId <= 0) {
      return NextResponse.json({ error: 'Invalid guest' }, { status: 400 });
    }

    const guest = await getWaitingGuest(guestId);
    if (!guest) {
      return NextResponse.json(
        { error: 'That person already set a PIN. Nothing to resend.' },
        { status: 409 }
      );
    }

    const admin = isAdminUser(user);
    if (!admin && guest.invited_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!guest.email) {
      return NextResponse.json({ error: 'That profile has no email' }, { status: 400 });
    }

    const rawToken = await rotateInviteToken(guest.id);
    if (!rawToken) {
      return NextResponse.json(
        { error: 'That person already set a PIN. Nothing to resend.' },
        { status: 409 }
      );
    }

    let inviterName = user.name;
    let inviterEmail = user.email;
    if (guest.invited_by && guest.invited_by !== user.id) {
      const inviter = await query(
        'SELECT name, email FROM users WHERE id = ? LIMIT 1',
        [guest.invited_by]
      );
      const row = inviter.rows[0] as { name: string; email: string | null } | undefined;
      if (row) {
        inviterName = row.name;
        inviterEmail = row.email;
      }
    }

    await resendInviteEmail({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      inviterName,
      inviterEmail,
      inviterId: guest.invited_by || user.id,
      rawToken,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error resending invite:', error);
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}
