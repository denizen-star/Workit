import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/auth';
import { queuePinResetEmail } from '@/lib/emails/lifecycle';
import { createPinResetToken } from '@/lib/pinReset';

const OK = { success: true as const };

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const id = Number(userId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(OK);
    }

    const user = await getUserById(id);
    const email = user?.email?.trim();
    if (!user?.pin_hash || !email) {
      return NextResponse.json(OK);
    }

    const rawToken = await createPinResetToken(user.id);
    queuePinResetEmail({
      id: user.id,
      name: user.name,
      email,
      rawToken,
    });

    return NextResponse.json(OK);
  } catch (error) {
    console.error('Error requesting PIN reset:', error);
    return NextResponse.json(OK);
  }
}
