import { query } from '@/lib/db';
import { formatHardnessWithPct } from '@/lib/hardness';
import { bestLoggedSet } from '@/lib/setHistory';

export async function holdLineForDay(userId: number, workoutType: string) {
  const last = await query(
    `SELECT id
     FROM workout_sessions
     WHERE user_id = ?
       AND is_completed = 1
       AND workout_type = ?
     ORDER BY COALESCE(completed_at, ended_at, started_at, created_at) DESC
     LIMIT 1`,
    [userId, workoutType]
  );
  const sessionId = Number((last.rows[0] as { id: number } | undefined)?.id || 0);
  const short = workoutType.replace(/^Upper Body /, 'Upper ').replace(/^Lower Body /, 'Lower ');
  if (!sessionId) {
    return { line: `First ${short}. Log the iron and Effort.` };
  }

  const sets = await query(
    `SELECT weight_lbs, actual_reps, hardness
     FROM exercise_sets
     WHERE workout_session_id = ?
       AND is_completed = 1`,
    [sessionId]
  );
  const rows = sets.rows as {
    weight_lbs: number | null;
    actual_reps: number | null;
    hardness: number | null;
  }[];
  const best = bestLoggedSet(rows);
  const voted = rows.map((row) => Number(row.hardness)).filter((value) => value >= 1 && value <= 5);
  const effort = voted.length ? voted.reduce((sum, value) => sum + value, 0) / voted.length : null;
  if (!best || !best.weight_lbs) {
    return { line: `Hold last ${short}. Beat the iron or keep Effort from rising.` };
  }

  const reps = best.actual_reps != null ? Math.round(best.actual_reps) : null;
  const load = reps != null ? `${Math.round(best.weight_lbs)} lb × ${reps}` : `${Math.round(best.weight_lbs)} lb`;
  return {
    line: `Hold ${load} at Effort ${formatHardnessWithPct(effort)}. Beat the iron or keep Effort from rising.`,
  };
}
