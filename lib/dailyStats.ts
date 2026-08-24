import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume } from '@/lib/optionals';

export async function updateDailyStats(workoutSessionId: number, userId: number) {
  try {
    const sessionResult = await query(
      'SELECT user_id, DATE(COALESCE(completed_at, NOW())) as workout_date FROM workout_sessions WHERE id = ? AND user_id = ?',
      [workoutSessionId, userId]
    );

    if (sessionResult.rows.length === 0) return;

    const { user_id, workout_date } = sessionResult.rows[0];

    const statsResult = await query(
      `SELECT 
        COUNT(DISTINCT exercise_name) as total_exercises,
        COUNT(*) as total_sets,
        SUM(${sqlSetVolume()}) as total_weight
       FROM exercise_sets es
       JOIN workout_sessions ws ON es.workout_session_id = ws.id
       WHERE ws.user_id = ? AND DATE(COALESCE(ws.completed_at, NOW())) = ? AND es.is_completed = true`,
      [user_id, workout_date]
    );

    const optionalResult = await query(
      `SELECT COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as optional_lbs
       FROM workout_sessions ws
       WHERE ws.user_id = ? AND DATE(COALESCE(ws.completed_at, NOW())) = ?`,
      [user_id, workout_date]
    );

    const stats = statsResult.rows[0] as {
      total_exercises: number;
      total_sets: number;
      total_weight: number;
    };
    const optionalLbs = Number(
      (optionalResult.rows[0] as { optional_lbs: number } | undefined)?.optional_lbs || 0
    );

    await query(
      `INSERT INTO daily_stats (user_id, workout_date, total_exercises_completed, total_sets_completed, total_weight_lifted)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         total_exercises_completed = VALUES(total_exercises_completed),
         total_sets_completed = VALUES(total_sets_completed),
         total_weight_lifted = VALUES(total_weight_lifted)`,
      [user_id, workout_date, stats.total_exercises, stats.total_sets, Number(stats.total_weight || 0) + optionalLbs]
    );
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}
