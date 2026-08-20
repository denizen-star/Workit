import { query } from '@/lib/db';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import { buildScoreboardEmail, type ScoreboardRow } from '@/lib/emails/templates';
import { todayInNewYork } from '@/lib/emails/nudge';

export function scoreboardTo() {
  return (process.env.WORKIT_SCOREBOARD_TO || 'leacock.kervin@gmail.com').trim() || null;
}

export async function buildLiveScoreboard() {
  const users = await query('SELECT id, name, email FROM users ORDER BY id ASC');
  const rows: ScoreboardRow[] = [];

  for (const user of users.rows as { id: number; name: string; email: string | null }[]) {
    const weekStats = await query(
      `SELECT
         COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as workouts,
         COALESCE(SUM(CASE WHEN es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL
           THEN es.weight_lbs * es.actual_reps ELSE 0 END), 0) as volume
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id
       WHERE ws.user_id = ?
         AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`,
      [user.id]
    );
    const last = await query(
      `SELECT workout_type, week_number, day_number, completed_at
       FROM workout_sessions
       WHERE user_id = ? AND is_completed = 1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [user.id]
    );
    const open = await query(
      `SELECT workout_type, week_number, day_number
       FROM workout_sessions
       WHERE user_id = ? AND (is_completed = 0 OR is_completed IS NULL)
       ORDER BY started_at DESC
       LIMIT 1`,
      [user.id]
    );

    const stats = weekStats.rows[0] as { workouts: number; volume: number };
    const lastRow = last.rows[0] as
      | { workout_type: string; week_number: number; day_number: number; completed_at: string }
      | undefined;
    const openRow = open.rows[0] as
      | { workout_type: string; week_number: number; day_number: number }
      | undefined;

    rows.push({
      name: user.name,
      email: user.email,
      workoutsThisWeek: Number(stats?.workouts || 0),
      volumeThisWeek: Number(stats?.volume || 0),
      lastWorkout: lastRow
        ? 'Week ' + lastRow.week_number + ' · ' + lastRow.workout_type
        : null,
      openSession: openRow ? openRow.workout_type : null,
    });
  }

  return buildScoreboardEmail({
    rangeLabel: 'last 7 days',
    rows,
  });
}

export async function sendScoreboardEmail(opts?: { force?: boolean }) {
  const to = scoreboardTo();
  if (!to) return { sent: false, skipped: 'no-scoreboard-to' };

  const email = await buildLiveScoreboard();
  if (opts?.force) {
    const id = await sendNow(to, email);
    return { sent: Boolean(id), id, skipped: id ? undefined : 'smtp' };
  }

  const { date } = todayInNewYork();
  return claimAndSend({
    userId: null,
    template: 'scoreboard',
    dedupeKey: date,
    to,
    email,
  });
}
