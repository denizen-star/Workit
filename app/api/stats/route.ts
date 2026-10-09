import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { statsPayload } from '@/lib/statsPayload';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const params = request.nextUrl.searchParams;
    return NextResponse.json(
      await statsPayload(user, {
        home: params.get('home') === '1',
        excludeSession: Math.trunc(Number(params.get('excludeSession') || 0)),
        overallOnly: params.get('overall') === '1',
      })
    );
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
