import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { weekPodiumPayload } from '@/lib/weekPodiumPayload';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(await weekPodiumPayload(user));
  } catch (error) {
    console.error('Error getting week podium:', error);
    return NextResponse.json({ error: 'Failed to get week podium' }, { status: 500 });
  }
}
