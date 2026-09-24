import { query } from '@/lib/db';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { effortFactorFromScore, DEFAULT_HARDNESS } from '@/lib/hardness';
import { isTimedPickType } from '@/lib/yourPick';

/** Used when an athlete has no lifting history at all to average. */
export const YOUR_PICK_CREDIT_FLOOR_LBS = 2000;

/**
 * Average raw lifted volume per finished lifting session for this athlete — only
 * sessions with real set volume and no credit of their own, so credited Yoga/Core
 * sessions never feed back into their own average. `sinceDays` null = all time.
 */
async function averageLiftingSession(userId: number, excludeSessionId: number, sinceDays: number | null) {
  const window = sinceDays == null ? '' : 'AND COALESCE(ws.completed_at, ws.created_at) >= NOW() - INTERVAL ? DAY';
  const result = await query(
    `SELECT AVG(session_volume) AS avg_volume
     FROM (
       SELECT ws.id, SUM(${sqlSetVolume('es')}) AS session_volume
       FROM workout_sessions ws
       INNER JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
       WHERE ws.user_id = ? AND ws.is_completed = 1 AND ws.id <> ?
         AND COALESCE(ws.credit_lbs, 0) = 0
         ${window}
       GROUP BY ws.id
       HAVING session_volume > 0
     ) lifting`,
    sinceDays == null ? [userId, excludeSessionId] : [userId, excludeSessionId, sinceDays]
  );
  const avg = Number((result.rows[0] as { avg_volume?: number | null } | undefined)?.avg_volume || 0);
  return Number.isFinite(avg) ? avg : 0;
}

/**
 * Yoga/Core Your pick credit (docs/plans/PLAN_YOUR_PICK.md): scored as a full
 * workout — the athlete's average lifting session over the last 7 days (falling back
 * to all time, then YOUR_PICK_CREDIT_FLOOR_LBS), times the session's effort factor
 * (How hard 1-5 → 0.80-1.20; unrated = Fair).
 */
export async function computeYourPickCredit(
  userId: number,
  sessionId: number,
  sessionHardness: number | null
): Promise<number> {
  const base =
    (await averageLiftingSession(userId, sessionId, 7)) ||
    (await averageLiftingSession(userId, sessionId, null)) ||
    YOUR_PICK_CREDIT_FLOOR_LBS;
  const factor = effortFactorFromScore(sessionHardness ?? DEFAULT_HARDNESS);
  return Math.round(base * factor * 100) / 100;
}

/**
 * On Finish, stores `credit_lbs` (and `session_hardness`) on a Yoga/Core Your pick.
 * Runs before badges / daily stats so both already see the credit. No-op for any
 * other session. Returns the credit written (0 when none).
 */
export async function applyYourPickCredit(
  userId: number,
  session: { id: number; pick_type?: string | null },
  sessionHardness: unknown
): Promise<number> {
  if (!isTimedPickType(session.pick_type)) return 0;
  const raw = Number(sessionHardness);
  const hardness = Number.isFinite(raw) && raw >= 1 && raw <= 5 ? raw : null;
  const credit = await computeYourPickCredit(userId, Number(session.id), hardness);
  await query('UPDATE workout_sessions SET credit_lbs = ?, session_hardness = ? WHERE id = ? AND user_id = ?', [
    credit,
    hardness,
    session.id,
    userId,
  ]);
  return credit;
}
