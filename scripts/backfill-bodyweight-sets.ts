// One-time body-weight credit for sets logged before exercise_sets.bodyweight_lb existed
// (docs/plans/PLAN_BODY_WEIGHT.md). Stamps share × the athlete's CURRENT weight — the
// only weight on file for the past — onto completed sets of listed movements
// (lib/bodyweightShare.ts) that have no credit yet, then refreshes daily_stats for the
// touched sessions and re-runs the badge check (weight badges read set volume).
//
// Dry run (default) prints per-athlete sets + lb added and writes nothing:
//   npx tsx --env-file=.env.local scripts/backfill-bodyweight-sets.ts
// Write it:
//   npx tsx --env-file=.env.local scripts/backfill-bodyweight-sets.ts --apply
// Re-run = safe: only NULL credits are filled, so it also picks up an athlete who adds
// a weight later.
import { query } from '../lib/db';
import { BODYWEIGHT_SHARES, bodyweightCreditLb } from '../lib/bodyweightShare';
import { updateDailyStats } from '../lib/dailyStats';
import { checkAndAwardBadges } from '../lib/badges';

type Row = {
  id: number;
  exercise_name: string;
  actual_reps: number | string | null;
  session_id: number;
  user_id: number;
  user_name: string;
  body_weight_lb: number | string;
};

async function main() {
  const apply = process.argv.includes('--apply');
  const names = Object.keys(BODYWEIGHT_SHARES);
  const result = await query(
    `SELECT es.id, es.exercise_name, es.actual_reps, ws.id AS session_id, u.id AS user_id, u.name AS user_name,
            u.body_weight_lb
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     JOIN users u ON u.id = ws.user_id
     WHERE es.is_completed = 1 AND es.bodyweight_lb IS NULL AND u.body_weight_lb IS NOT NULL
       AND es.exercise_name IN (${names.map(() => '?').join(', ')})`,
    names
  );
  const rows = result.rows as Row[];

  const byUser = new Map<number, { name: string; weight: number; sets: number; lbs: number; sessions: Set<number> }>();
  for (const row of rows) {
    const credit = bodyweightCreditLb(row.exercise_name, Number(row.body_weight_lb));
    if (credit <= 0) continue;
    const entry = byUser.get(row.user_id) ?? {
      name: row.user_name,
      weight: Number(row.body_weight_lb),
      sets: 0,
      lbs: 0,
      sessions: new Set<number>(),
    };
    entry.sets += 1;
    entry.lbs += credit * Number(row.actual_reps || 0);
    entry.sessions.add(row.session_id);
    byUser.set(row.user_id, entry);
    if (apply) {
      await query('UPDATE exercise_sets SET bodyweight_lb = ? WHERE id = ? AND bodyweight_lb IS NULL', [credit, row.id]);
    }
  }

  for (const [userId, entry] of byUser) {
    console.log(
      `${entry.name} (${entry.weight} lb): ${entry.sets} sets, +${Math.round(entry.lbs).toLocaleString()} lb across ${entry.sessions.size} sessions`
    );
    if (!apply) continue;
    for (const sessionId of entry.sessions) await updateDailyStats(sessionId, userId);
    const awarded = await checkAndAwardBadges(userId);
    if (awarded.length) console.log(`  new badges: ${awarded.map((badge) => badge.name).join(', ')}`);
  }
  if (byUser.size === 0) console.log('Nothing to backfill.');
  console.log(apply ? 'Applied.' : 'Dry run — nothing written. Re-run with --apply.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
