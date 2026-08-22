import { NextRequest, NextResponse } from 'next/server';
import { AuthError, isAdminUser, requireCurrentUser } from '@/lib/auth';
import { loadRatingStats } from '@/lib/ratings';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const household = request.nextUrl.searchParams.get('scope') === 'household';
    if (household && !isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await loadRatingStats(household ? undefined : user.id);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error loading rating stats', error);
    return NextResponse.json({ error: 'Failed to load ratings' }, { status: 500 });
  }
}
