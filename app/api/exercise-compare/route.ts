import { NextRequest, NextResponse } from 'next/server';
import { AuthError, getCurrentUser, requireAdmin } from '@/lib/auth';
import { parseRange } from '@/lib/analyticsTime';
import {
  athleteExerciseCompare,
  householdExerciseCompare,
} from '@/lib/exerciseCompare';
import { isTestUserName } from '@/lib/householdUsers';
import { isScoreboardPeriod, type ScoreboardPeriod } from '@/lib/scoreboardTypes';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const rangeParam = request.nextUrl.searchParams.get('range');
    if (rangeParam) {
      await requireAdmin();
      const rows = await householdExerciseCompare({
        kind: 'analytics',
        range: parseRange(rangeParam),
      });
      return NextResponse.json({ hidden: false, rows });
    }

    if (isTestUserName(user.name)) {
      return NextResponse.json({ hidden: true, row: null });
    }

    const requested = request.nextUrl.searchParams.get('period') || '7';
    const period: ScoreboardPeriod = isScoreboardPeriod(requested) ? requested : '7';
    const row = await athleteExerciseCompare(user.id, { kind: 'scoreboard', period });
    return NextResponse.json({ hidden: false, period, row });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error getting exercise compare:', error);
    return NextResponse.json({ error: 'Failed to get exercise compare' }, { status: 500 });
  }
}
