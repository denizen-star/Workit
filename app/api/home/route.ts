import { NextResponse } from 'next/server';
import { homePayload } from '@/lib/homePayload';

/** Home in one call (lib/homePayload.ts). A blocked account gets the same 403 as /api/me. */
export async function GET() {
  try {
    const payload = await homePayload();
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
