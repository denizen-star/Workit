import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { attachHouseTracking } from '@/lib/houseTracking';
import { householdBonusHonor, householdScoreboard, householdWeightSeries } from '@/lib/scoreboard';
import { householdCardioHonor, householdOptionalHonor } from '@/lib/optionals';
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
    const houseId = user.householdId;
    const [rawRows, bonusHonor, optionalHonor, cardioHonor, dailySeries] = await Promise.all([
      householdScoreboard(period, houseId),
      householdBonusHonor(period, houseId),
      householdOptionalHonor(period, houseId),
      householdCardioHonor(period, houseId),
      householdWeightSeries(period, houseId),
    ]);
    const rows = await attachHouseTracking(rawRows, period);

    return NextResponse.json({
      period,
      rangeLabel: scoreboardRangeLabel(period),
      rows,
      bonusHonor,
      optionalHonor,
      cardioHonor,
      dailySeries,
    });
  } catch (error) {
    console.error('Error getting scoreboard:', error);
    return NextResponse.json({ error: 'Failed to get scoreboard' }, { status: 500 });
  }
}
