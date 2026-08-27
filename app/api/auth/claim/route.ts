import { NextRequest, NextResponse } from 'next/server';
import { findWaitingUserByToken } from '@/lib/invite';

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('token') || '';
    const user = await findWaitingUserByToken(raw);
    if (!user) {
      return NextResponse.json({ error: 'Invite link is not valid' }, { status: 404 });
    }
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Error resolving claim:', error);
    return NextResponse.json({ error: 'Failed to load invite' }, { status: 500 });
  }
}
