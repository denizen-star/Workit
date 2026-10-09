import { query } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';
import { sqlSetEffortVolume, sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume, sqlUserOptionalVolume } from '@/lib/optionals';
import { lockedWeekStreak } from '@/lib/bonusDay';
import { householdHomeStats } from '@/lib/statsHousehold';
import { lockedWeekNumbers } from '@/lib/lockedWeeks';
import { sqlSessionCountsForWeek, sqlSetCounts } from '@/lib/skippedSets';

/**
 * Your stats (GET /api/stats, and Home's part of GET /api/home): totals, daily weight
 * and How hard, locked-week streak, and the house averages. `home` skips the weekly /
 * timing reads Home doesn't show; `overallOnly` returns just the totals (the live bar);
 * `lockedWeeks` skips the locked-weeks read when the caller already has it.
 */
export async function statsPayload(
  user: SessionUser,
  opts: { home: boolean; excludeSession: number; overallOnly?: boolean; lockedWeeks?: number[] }
) {
  const userId = user.id;
  const { home, excludeSession } = opts;
  const excludeThis = excludeSession > 0;
  const optionalExclude = excludeThis ? `AND optws.id != ${excludeSession}` : '';
  const optionalTotal = sqlUserOptionalVolume(String(Number(userId)), optionalExclude);

  const overallQuery = query(
    `SELECT 
      COUNT(DISTINCT ws.id) as total_workouts,
      COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
      COUNT(DISTINCT es.exercise_name) as unique_exercises,
      COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${optionalTotal} as total_weight_lifted,
      COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) + ${optionalTotal} as total_effort_lifted
     FROM workout_sessions ws
     LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id AND ${sqlSetCounts('es')}
     WHERE ws.user_id = ?${excludeThis ? ' AND ws.id != ?' : ''}`,
    excludeThis ? [userId, excludeSession] : [userId]
  );

  // The live session's All-time bar only needs the totals.
  if (opts.overallOnly) {
    return { overall: (await overallQuery).rows[0] };
  }

  // Everything below is independent, so it goes out in one batch.
  const [
    overallStatsResult,
    weeklyStats,
    dailyStats,
    lockedWeeks,
    durationStats,
    recentDurations,
    effortAndOptionalDays,
    hardness,
  ] = await Promise.all([
    overallQuery,
    home
      ? { rows: [] as unknown[] }
      : query(
          `SELECT 
        week_number,
        COUNT(*) as total_days,
        COUNT(CASE WHEN is_completed AND ${sqlSessionCountsForWeek()} THEN 1 END) as completed_days
       FROM workout_sessions
       WHERE user_id = ?
       GROUP BY week_number
       ORDER BY week_number`,
          [userId]
        ),
    query(
      `SELECT * FROM daily_stats 
       WHERE user_id = ? 
       ORDER BY workout_date DESC`,
      [userId]
    ),
    opts.lockedWeeks ? opts.lockedWeeks : lockedWeekNumbers(userId),
    home
      ? { rows: [{}] }
      : query(
          `SELECT
        AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_seconds,
        MAX(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as max_seconds,
        SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds
       FROM workout_sessions
       WHERE user_id = ?
         AND is_completed = 1
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL`,
          [userId]
        ),
    home
      ? { rows: [] as unknown[] }
      : query(
          `SELECT workout_type, week_number, day_number, started_at, ended_at,
              TIMESTAMPDIFF(SECOND, started_at, ended_at) as duration_seconds
       FROM workout_sessions
       WHERE user_id = ?
         AND is_completed = 1
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL
       ORDER BY ended_at DESC
       LIMIT 5`,
          [userId]
        ),
    Promise.all([
      query(
        `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
                COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) as weight
         FROM exercise_sets es
         INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
         WHERE ws.user_id = ?
           AND ws.is_completed = 1
           AND ${sqlSetCounts('es')}
         GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))`,
        [userId]
      ),
      query(
        `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
                COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as weight
         FROM workout_sessions ws
         WHERE ws.user_id = ?
           AND ws.is_completed = 1
         GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))`,
        [userId]
      ),
    ]).catch(() => null),
    query(
      `SELECT DATE(COALESCE(ws.completed_at, ws.created_at)) as workout_date,
              AVG(es.hardness) as avg_hard
       FROM exercise_sets es
       INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
       WHERE ws.user_id = ?
         AND ws.is_completed = 1
         AND ${sqlSetCounts('es')}
         AND es.hardness IS NOT NULL
       GROUP BY DATE(COALESCE(ws.completed_at, ws.created_at))
       ORDER BY workout_date DESC`,
      [userId]
    ).catch(() => null),
  ]);

  const currentStreak = lockedWeekStreak(lockedWeeks);

  const household = await householdHomeStats(
    dailyStats.rows.map((row) => row.workout_date),
    user.householdId
  );

  let daily = dailyStats.rows as { workout_date: string; total_weight_lifted: number | string }[];
  if (effortAndOptionalDays) {
    const [effortDays, optionalDays] = effortAndOptionalDays;
    const byDate = new Map<string, number>();
    for (const row of [
      ...(effortDays.rows as { workout_date: unknown; weight: number }[]),
      ...(optionalDays.rows as { workout_date: unknown; weight: number }[]),
    ]) {
      const key = String(row.workout_date || '').slice(0, 10);
      if (!key) continue;
      byDate.set(key, (byDate.get(key) || 0) + Number(row.weight || 0));
    }
    if (byDate.size > 0) {
      daily = [...byDate.entries()]
        .map(([workout_date, total_weight_lifted]) => ({ workout_date, total_weight_lifted }))
        .sort((a, b) => b.workout_date.localeCompare(a.workout_date));
    }
  }

  const dailyHardness = (hardness?.rows ?? []) as { workout_date: string; avg_hard: number }[];

  return {
    overall: overallStatsResult.rows[0],
    weekly: weeklyStats.rows,
    daily,
    dailyHardness,
    currentStreak,
    timing: durationStats.rows[0],
    recentDurations: recentDurations.rows,
    household,
  };
}
