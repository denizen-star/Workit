import { athletePerformance } from '@/lib/athletePerformance';
import type { HouseholdScoreboardRow, ScoreboardPeriod } from '@/lib/scoreboardTypes';

function performancePeriodForHouse(period: ScoreboardPeriod) {
  if (period === '30') return 't-30' as const;
  if (period === 'all') return 'all' as const;
  return 't-7' as const;
}

/** Stamp lift-level up/down counts for the Tracking line. Pack is small. */
export async function attachHouseTracking(
  rows: HouseholdScoreboardRow[],
  period: ScoreboardPeriod
): Promise<HouseholdScoreboardRow[]> {
  const perfPeriod = performancePeriodForHouse(period);
  const boards = await Promise.all(rows.map((row) => athletePerformance(row.id, perfPeriod)));
  return rows.map((row, index) => ({
    ...row,
    trackingUp: boards[index].summary.gains,
    trackingDown: boards[index].summary.losses,
  }));
}
