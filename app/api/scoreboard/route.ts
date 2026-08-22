import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { householdScoreboard } from '@/lib/scoreboard';
import {
  isScoreboardPeriod,
  scoreboardRangeLabel,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const requested = request.nextUrl.searchParams.get('period') || '7';
    const period: ScoreboardPeriod = isScoreboardPeriod(requested) ? requested : '7';
    const rows = await householdScoreboard(period);

    return NextResponse.json({
      period,
      rangeLabel: scoreboardRangeLabel(period),
      rows,
    });
  } catch (error) {
    console.error('Error getting scoreboard:', error);
    return NextResponse.json({ error: 'Failed to get scoreboard' }, { status: 500 });
  }
}
