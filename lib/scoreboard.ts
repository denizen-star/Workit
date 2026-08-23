import { bonusTypeSql } from '@/lib/bonusDay';
import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { type BonusHonorRow, type HouseholdScoreboardRow, type ScoreboardPeriod } from '@/lib/scoreboardTypes';

function periodFilter(period: ScoreboardPeriod, column: string) {
  if (period === 'all') return '';
  const days = period === '30' ? 30 : 7;
  return ` AND ${column} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`;
}

export async function householdScoreboard(period: ScoreboardPeriod): Promise<HouseholdScoreboardRow[]> {
  const sessionWindow = periodFilter(
    period,
    'COALESCE(ws.completed_at, ws.started_at, ws.created_at)'
  );
  const badgeWindow = periodFilter(period, 'ub.earned_at');

  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(DISTINCT ws.id) as workouts,
       COALESCE(SUM(${sqlSetVolume('es')}), 0) as volume,
       COUNT(CASE WHEN es.is_completed = 1 THEN es.id END) as sets,
       COALESCE(MAX(es.weight_lbs), 0) as heaviest,
       AVG(CASE WHEN ws.started_at IS NOT NULL AND ws.ended_at IS NOT NULL
         THEN TIMESTAMPDIFF(SECOND, ws.started_at, ws.ended_at) END) as avg_seconds
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 ${sessionWindow}
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id
     GROUP BY u.id, u.name
     HAVING COUNT(DISTINCT ws.id) > 0
     ORDER BY workouts DESC, volume DESC, u.name ASC`
  );

  const rows = result.rows as {
    id: number;
    name: string;
    workouts: number;
    volume: number;
    sets: number;
    heaviest: number;
    avg_seconds: number | null;
  }[];

  if (rows.length === 0) return [];

  const last = await query(
    `SELECT ws.user_id, ws.week_number, ws.workout_type, ws.completed_at
     FROM workout_sessions ws
     INNER JOIN (
       SELECT user_id, MAX(completed_at) as last_at
       FROM workout_sessions
       WHERE is_completed = 1
       GROUP BY user_id
     ) latest ON latest.user_id = ws.user_id AND ws.completed_at = latest.last_at
     WHERE ws.is_completed = 1`
  );

  const best = await query(
    `SELECT user_id, MAX(session_volume) as best_session
     FROM (
       SELECT
         ws.user_id,
         COALESCE(SUM(${sqlSetVolume('es')}), 0) as session_volume
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id
       WHERE ws.is_completed = 1 ${sessionWindow}
       GROUP BY ws.user_id, ws.id
     ) session_totals
     GROUP BY user_id`
  );

  const badges = await query(
    `SELECT user_id, COUNT(*) as badges
     FROM user_badges ub
     WHERE 1=1 ${badgeWindow}
     GROUP BY user_id`
  );

  const lastByUser = new Map<
    number,
    { week_number: number; workout_type: string; completed_at: string }
  >();
  for (const row of last.rows as {
    user_id: number;
    week_number: number;
    workout_type: string;
    completed_at: string;
  }[]) {
    lastByUser.set(Number(row.user_id), row);
  }

  const bestByUser = new Map<number, number>();
  for (const row of best.rows as { user_id: number; best_session: number }[]) {
    bestByUser.set(Number(row.user_id), Number(row.best_session || 0));
  }

  const badgesByUser = new Map<number, number>();
  for (const row of badges.rows as { user_id: number; badges: number }[]) {
    badgesByUser.set(Number(row.user_id), Number(row.badges || 0));
  }

  return rows.map((row) => {
    const lastRow = lastByUser.get(Number(row.id));
    return {
      id: Number(row.id),
      name: row.name,
      workouts: Number(row.workouts || 0),
      volume: Number(row.volume || 0),
      sets: Number(row.sets || 0),
      heaviest: Number(row.heaviest || 0),
      avgSeconds: row.avg_seconds == null ? null : Number(row.avg_seconds),
      bestSessionVolume: bestByUser.get(Number(row.id)) || 0,
      badges: badgesByUser.get(Number(row.id)) || 0,
      lastWorkout: lastRow ? `Week ${lastRow.week_number} · ${lastRow.workout_type}` : null,
      lastAt: lastRow?.completed_at || null,
    };
  });
}

export async function householdBonusHonor(period: ScoreboardPeriod): Promise<BonusHonorRow[]> {
  const sessionWindow = periodFilter(
    period,
    'COALESCE(ws.completed_at, ws.started_at, ws.created_at)'
  );
  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(DISTINCT ws.week_number) as bonus_weeks
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 AND ${bonusTypeSql('ws')} ${sessionWindow}
     WHERE ${SQL_EXCLUDE_TEST_USER}
     GROUP BY u.id, u.name
     HAVING COUNT(DISTINCT ws.week_number) > 0
     ORDER BY bonus_weeks DESC, u.name ASC`
  );

  return (result.rows as { id: number; name: string; bonus_weeks: number }[]).map((row) => ({
    id: Number(row.id),
    name: row.name,
    bonusWeeks: Number(row.bonus_weeks || 0),
  }));
}
