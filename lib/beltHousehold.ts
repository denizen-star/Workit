import { progressFor } from '@/lib/belts';
import { query } from '@/lib/db';

export async function lockedWeeksByUser() {
  const result = await query(
    `SELECT user_id, COUNT(*) as locked
     FROM (
       SELECT user_id, week_number
       FROM workout_sessions
       WHERE is_completed = 1
       GROUP BY user_id, week_number
       HAVING COUNT(*) >= 4
     ) locked
     GROUP BY user_id`
  );
  const map = new Map<number, number>();
  for (const row of result.rows as { user_id: number; locked: number }[]) {
    map.set(Number(row.user_id), Number(row.locked || 0));
  }
  return map;
}

export async function householdBeltRows() {
  const [users, locked] = await Promise.all([
    query('SELECT id, name FROM users WHERE pin_hash IS NOT NULL ORDER BY name ASC'),
    lockedWeeksByUser(),
  ]);
  return (users.rows as { id: number; name: string }[]).map((user) => {
    const lockedWeeks = locked.get(Number(user.id)) || 0;
    return {
      id: Number(user.id),
      name: user.name,
      ...progressFor(lockedWeeks),
    };
  });
}
