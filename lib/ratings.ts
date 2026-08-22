import { query } from '@/lib/db';
import { DAY_TYPE_ORDER } from '@/lib/feedback';

export type RatingStatRow = { avg: number; count: number };
export type NamedStat = RatingStatRow & { name: string };
export type ModeStat = RatingStatRow & { mode: string };
export type WeekStat = RatingStatRow & { week: number };
export type DayTypeStat = RatingStatRow & { type: string };
export type OutcomeStat = RatingStatRow & { outcome: string };
export type HeatCell = RatingStatRow & { week: number; type: string };

export type RatingStats = {
  overall: RatingStatRow;
  athletes: NamedStat[];
  modes: ModeStat[];
  weeks: WeekStat[];
  dayTypes: DayTypeStat[];
  outcomes: OutcomeStat[];
  heatmap: HeatCell[];
};

type AggRow = {
  bucket: string;
  avg_stars: number | string | null;
  n: number | string;
};

function toAvg(value: number | string | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toCount(value: number | string | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function emptyStats(): RatingStats {
  return {
    overall: { avg: 0, count: 0 },
    athletes: [],
    modes: [],
    weeks: [],
    dayTypes: [],
    outcomes: [],
    heatmap: [],
  };
}

/**
 * Averages over session_ratings. Pass a user id for one athlete; omit for the household.
 */
export async function loadRatingStats(userId?: number): Promise<RatingStats> {
  const where = userId != null ? 'WHERE user_id = ?' : '';
  const params = userId != null ? [userId] : [];

  const [overallRes, athleteRes, modeRes, weekRes, typeRes, outcomeRes, heatRes] = await Promise.all([
    query(
      `SELECT AVG(stars) as avg_stars, COUNT(*) as n FROM session_ratings ${where}`,
      params
    ),
    query(
      `SELECT u.name as bucket, AVG(r.stars) as avg_stars, COUNT(*) as n
       FROM session_ratings r
       INNER JOIN users u ON u.id = r.user_id
       ${userId != null ? 'WHERE r.user_id = ?' : ''}
       GROUP BY u.id, u.name
       ORDER BY AVG(r.stars) ASC, u.name ASC`,
      params
    ),
    query(
      `SELECT workout_mode as bucket, AVG(stars) as avg_stars, COUNT(*) as n
       FROM session_ratings ${where}
       GROUP BY workout_mode`,
      params
    ),
    query(
      `SELECT week_number as bucket, AVG(stars) as avg_stars, COUNT(*) as n
       FROM session_ratings ${where}
       GROUP BY week_number`,
      params
    ),
    query(
      `SELECT workout_type as bucket, AVG(stars) as avg_stars, COUNT(*) as n
       FROM session_ratings ${where}
       GROUP BY workout_type`,
      params
    ),
    query(
      `SELECT outcome as bucket, AVG(stars) as avg_stars, COUNT(*) as n
       FROM session_ratings ${where}
       GROUP BY outcome`,
      params
    ),
    query(
      `SELECT week_number, workout_type, AVG(stars) as avg_stars, COUNT(*) as n
       FROM session_ratings ${where}
       GROUP BY week_number, workout_type`,
      params
    ),
  ]);

  const overallRow = overallRes.rows[0] as AggRow | undefined;
  const count = toCount(overallRow?.n ?? 0);
  if (!count) return emptyStats();

  const typeMap = new Map(
    (typeRes.rows as AggRow[]).map((row) => [
      row.bucket,
      { type: row.bucket, avg: toAvg(row.avg_stars), count: toCount(row.n) },
    ])
  );

  return {
    overall: { avg: toAvg(overallRow?.avg_stars ?? 0), count },
    athletes: (athleteRes.rows as AggRow[])
      .map((row) => ({ name: row.bucket, avg: toAvg(row.avg_stars), count: toCount(row.n) }))
      .filter((row) => row.count > 0),
    modes: (modeRes.rows as AggRow[])
      .map((row) => ({ mode: row.bucket, avg: toAvg(row.avg_stars), count: toCount(row.n) }))
      .filter((row) => row.count > 0),
    weeks: (weekRes.rows as AggRow[])
      .map((row) => ({ week: Number(row.bucket), avg: toAvg(row.avg_stars), count: toCount(row.n) }))
      .filter((row) => row.count > 0)
      .sort((a, b) => a.week - b.week),
    dayTypes: [
      ...DAY_TYPE_ORDER.map((type) => typeMap.get(type)).filter(
        (row): row is DayTypeStat => !!row && row.count > 0
      ),
      ...[...typeMap.values()].filter(
        (row) => row.count > 0 && !(DAY_TYPE_ORDER as readonly string[]).includes(row.type)
      ),
    ],
    outcomes: (outcomeRes.rows as AggRow[])
      .map((row) => ({ outcome: row.bucket, avg: toAvg(row.avg_stars), count: toCount(row.n) }))
      .filter((row) => row.count > 0),
    heatmap: (
      heatRes.rows as Array<{
        week_number: number;
        workout_type: string;
        avg_stars: number | string | null;
        n: number | string;
      }>
    )
      .map((row) => ({
        week: Number(row.week_number),
        type: row.workout_type,
        avg: toAvg(row.avg_stars),
        count: toCount(row.n),
      }))
      .filter((row) => row.count > 0),
  };
}
