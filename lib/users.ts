import { query } from '@/lib/db';

export async function deleteUserAndData(userId: number) {
  const sessions = await query(
    'SELECT id FROM workout_sessions WHERE user_id = ?',
    [userId]
  );

  for (const row of sessions.rows as { id: number }[]) {
    await query('DELETE FROM exercise_sets WHERE workout_session_id = ?', [row.id]);
  }

  await query('DELETE FROM workout_sessions WHERE user_id = ?', [userId]);
  await query('DELETE FROM user_badges WHERE user_id = ?', [userId]);
  await query('DELETE FROM daily_stats WHERE user_id = ?', [userId]);
  await query('DELETE FROM users WHERE id = ?', [userId]);
}
