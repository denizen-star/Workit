import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserById } from '@/lib/auth';
import { queuePinResetEmail } from '@/lib/emails/lifecycle';
import { createPinResetToken } from '@/lib/pinReset';
import { normalizeEmail } from '@/lib/profile';

const OK = { success: true as const };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const id = Number(body.userId);
    let user = Number.isFinite(id) && id > 0 ? await getUserById(id) : null;
    if (!user && email) {
      const result = await query(
        'SELECT id, name, email, pin_hash FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1',
        [email]
      );
      const row = result.rows[0] as { id: number; name: string; email: string | null; pin_hash: string | null } | undefined;
      user = row ?? null;
    }
    const address = user?.email?.trim();
    if (!user?.pin_hash || !address) {
      return NextResponse.json(OK);
    }

    const rawToken = await createPinResetToken(user.id);
    queuePinResetEmail({
      id: user.id,
      name: user.name,
      email: address,
      rawToken,
    });

    return NextResponse.json(OK);
  } catch (error) {
    console.error('Error requesting PIN reset:', error);
    return NextResponse.json(OK);
  }
}
