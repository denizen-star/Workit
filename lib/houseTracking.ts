import { athletePerformanceForUsers } from '@/lib/athletePerformance';
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
  // One set query for the whole pack, not one lifetime scan per athlete.
  const boards = await athletePerformanceForUsers(
    rows.map((row) => row.id),
    perfPeriod
  );
  return rows.map((row) => ({
    ...row,
    trackingUp: boards.get(row.id)?.summary.gains ?? 0,
    trackingDown: boards.get(row.id)?.summary.losses ?? 0,
  }));
}
