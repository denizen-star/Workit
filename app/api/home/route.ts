import { NextRequest, NextResponse } from 'next/server';
import { homePayload, type HomePart } from '@/lib/homePayload';

/** Home on open (lib/homePayload.ts): `?part=top` / `?part=rest`, or both with no part.
 * A blocked account gets the same 403 as /api/me. */
export async function GET(request: NextRequest) {
  try {
    const partParam = request.nextUrl.searchParams.get('part');
    const part: HomePart | undefined = partParam === 'top' || partParam === 'rest' ? partParam : undefined;
    const payload = await homePayload(part);
    if (payload === 'blocked') {
      return NextResponse.json({ error: 'Blocked', blocked: true }, { status: 403 });
    }
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error loading home:', error);
    return NextResponse.json({ error: 'Failed to load home' }, { status: 500 });
  }
}
