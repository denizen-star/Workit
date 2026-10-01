import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listHouseholdAthletes } from '@/lib/household';
import { attachHouseTracking } from '@/lib/houseTracking';
import { loadHouseWeekdays } from '@/lib/houseWeekdays';
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
    const [rawRows, bonusHonor, optionalHonor, cardioHonor, dailySeries, members, weekdays] = await Promise.all([
      householdScoreboard(period, houseId),
      householdBonusHonor(period, houseId),
      householdOptionalHonor(period, houseId),
      householdCardioHonor(period, houseId),
      householdWeightSeries(period, houseId),
      listHouseholdAthletes(houseId),
      loadHouseWeekdays(period, houseId, { id: user.id, name: user.name }),
    ]);
    const rows = await attachHouseTracking(rawRows, period);

    return NextResponse.json({
      period,
      rangeLabel: scoreboardRangeLabel(period),
      rows,
      members,
      bonusHonor,
      optionalHonor,
      cardioHonor,
      dailySeries,
      weekdays,
    });
  } catch (error) {
    console.error('Error getting scoreboard:', error);
    return NextResponse.json({ error: 'Failed to get scoreboard' }, { status: 500 });
  }
}
