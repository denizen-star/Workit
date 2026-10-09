import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { coachCatalogPayload } from '@/lib/coachCatalogPayload';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(await coachCatalogPayload());
  } catch (error) {
    console.error('Error getting coach catalog:', error);
    return NextResponse.json({ error: 'Failed to get coach catalog' }, { status: 500 });
  }
}
