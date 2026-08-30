import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/auth';
import { verifyPinResetToken } from '@/lib/pinReset';

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('token') || '';
    const userId = await verifyPinResetToken(raw);
    if (!userId) {
      return NextResponse.json({ error: 'Reset link is not valid' }, { status: 404 });
    }

    const user = await getUserById(userId);
    if (!user?.pin_hash) {
      return NextResponse.json({ error: 'Reset link is not valid' }, { status: 404 });
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Error resolving PIN reset:', error);
    return NextResponse.json({ error: 'Failed to load reset' }, { status: 500 });
  }
}
