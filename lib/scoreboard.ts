import { query } from '@/lib/db';
import { type HouseholdScoreboardRow, type ScoreboardPeriod } from '@/lib/scoreboardTypes';

export async function householdScoreboard(period: ScoreboardPeriod): Promise<HouseholdScoreboardRow[]> {
  const windowSql =
    period === 'all'
      ? ''
      : period === '30'
        ? ' AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)'
        : ' AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)';

  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(DISTINCT ws.id) as workouts,
       COALESCE(SUM(CASE WHEN es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL
         THEN es.weight_lbs * es.actual_reps ELSE 0 END), 0) as volume
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 ${windowSql}
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id
     GROUP BY u.id, u.name
     HAVING COUNT(DISTINCT ws.id) > 0
     ORDER BY workouts DESC, volume DESC, u.name ASC`
  );

  return (result.rows as { id: number; name: string; workouts: number; volume: number }[]).map(
    (row) => ({
      id: Number(row.id),
      name: row.name,
      workouts: Number(row.workouts || 0),
      volume: Number(row.volume || 0),
    })
  );
}
