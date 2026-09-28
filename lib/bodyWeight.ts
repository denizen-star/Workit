// Body weight history (docs/plans/PLAN_BODY_WEIGHT.md). users.body_weight_lb stays the
// "current" value every existing reader uses; body_weight_log keeps one dated row per
// change so the athlete (and Kevin) can see the trend. Never shown on house boards.
import { query } from '@/lib/db';
import { BODYWEIGHT_SHARES } from '@/lib/bodyweightShare';
import { BODY_WEIGHT_MISSING_LINE, bodyWeightUsedLine } from '@/lib/bodyWeightShared';

export { parseBodyWeightInput } from '@/lib/bodyWeightShared';

export type BodyWeightSource = 'join' | 'profile' | 'checkin';

export type BodyWeightEntry = { weightLb: number; source: BodyWeightSource; createdAt: string };

/** DB timestamps are UTC with no zone ("2026-09-28 01:15:24"); make them unambiguous ISO. */
function utcIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? text.replace(' ', 'T') + 'Z' : text;
}

/**
 * Adds a history row when the saved weight actually changed. Callers write
 * users.body_weight_lb themselves (it rides along with the rest of the profile).
 * Clearing the field (next = null) is not a weigh-in, so it is not logged.
 */
export async function logBodyWeightChange(
  userId: number,
  previousLb: number | null,
  nextLb: number | null,
  source: BodyWeightSource
): Promise<boolean> {
  if (nextLb == null || (previousLb != null && Number(previousLb) === nextLb)) return false;
  await query('INSERT INTO body_weight_log (user_id, weight_lb, source) VALUES (?, ?, ?)', [
    userId,
    nextLb,
    source,
  ]);
  return true;
}

/** Weight-only save (6-week check-in): current value + history row in one call. */
export async function saveBodyWeight(
  userId: number,
  previousLb: number | null,
  nextLb: number,
  source: BodyWeightSource
): Promise<void> {
  await query('UPDATE users SET body_weight_lb = ? WHERE id = ?', [nextLb, userId]);
  await logBodyWeightChange(userId, previousLb, nextLb, source);
}

/** Oldest → newest, for the trend chart. */
export async function bodyWeightHistory(userId: number): Promise<BodyWeightEntry[]> {
  const result = await query(
    'SELECT weight_lb, source, created_at FROM body_weight_log WHERE user_id = ? ORDER BY created_at ASC, id ASC',
    [userId]
  );
  return (result.rows as Array<{ weight_lb: number | string; source: string; created_at: string }>).map(
    (row) => ({
      weightLb: Number(row.weight_lb),
      source: row.source as BodyWeightSource,
      createdAt: utcIso(row.created_at),
    })
  );
}

/**
 * The weight on file (users.body_weight_lb, the source of truth — a cleared field reads
 * null) and when it was last saved (latest history row), for "182 lb (saved Sep 3)".
 */
export async function currentBodyWeight(userId: number): Promise<{ lb: number | null; savedAt: string | null }> {
  const result = await query(
    `SELECT u.body_weight_lb,
            (SELECT MAX(b.created_at) FROM body_weight_log b WHERE b.user_id = u.id) AS saved_at
     FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  const row = result.rows[0] as { body_weight_lb?: unknown; saved_at?: unknown } | undefined;
  const lb = row?.body_weight_lb == null ? null : Number(row.body_weight_lb);
  return { lb, savedAt: lb == null || row?.saved_at == null ? null : utcIso(row.saved_at) };
}

/**
 * The one neutral recap line (in-app recap + recap email) for a finished session:
 * "Body weight used: 182 lb (saved Sep 3)" when a listed movement earned credit,
 * the add-your-weight nudge when listed movements were done with no weight on file,
 * and null when the session had no listed movements at all.
 */
export async function sessionBodyWeightNote(sessionId: number, userId: number): Promise<string | null> {
  const names = Object.keys(BODYWEIGHT_SHARES);
  const result = await query(
    `SELECT COUNT(*) AS listed, SUM(es.bodyweight_lb IS NOT NULL) AS credited
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE es.workout_session_id = ? AND ws.user_id = ? AND es.is_completed = 1
       AND es.exercise_name IN (${names.map(() => '?').join(', ')})`,
    [sessionId, userId, ...names]
  );
  const row = result.rows[0] as { listed?: unknown; credited?: unknown } | undefined;
  if (!Number(row?.listed)) return null;
  const current = await currentBodyWeight(userId);
  if (!Number(row?.credited) || current.lb == null) return BODY_WEIGHT_MISSING_LINE;
  return bodyWeightUsedLine(current.lb, current.savedAt);
}
