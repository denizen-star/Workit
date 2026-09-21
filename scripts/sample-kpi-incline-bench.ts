import { query } from '../lib/db';

type Row = {
  session_id: number;
  completed_at: string | null;
  exercise_name: string;
  set_number: number;
  weight_lbs: number | null;
  actual_reps: number | null;
  hardness: number | null;
};

const PLANNED_SETS = 3;
const TARGET_NAMES = ['Incline Dumbbell Bench Press', 'DB Incline Press'];

function effortFactor(h: number | null) {
  const score = h != null && h >= 1 && h <= 5 ? h : 3;
  return (7 + score) / 10;
}

async function main() {
  const users = await query(`SELECT id, name FROM users WHERE name LIKE 'Kevin%' LIMIT 5`);
  const kevin = (users.rows as { id: number; name: string }[]).find((u) => u.name === 'Kevin')
    || (users.rows as { id: number; name: string }[])[0];
  if (!kevin) throw new Error('No Kevin found');

  const placeholders = TARGET_NAMES.map(() => '?').join(',');
  const sets = await query(
    `SELECT ws.id as session_id,
            COALESCE(ws.completed_at, ws.ended_at) as completed_at,
            es.exercise_name, es.set_number, es.weight_lbs, es.actual_reps, es.hardness
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE ws.user_id = ?
       AND ws.is_completed = 1
       AND es.is_completed = 1
       AND es.exercise_name IN (${placeholders})
     ORDER BY COALESCE(ws.completed_at, ws.ended_at) DESC, es.set_number ASC`,
    [kevin.id, ...TARGET_NAMES]
  );

  const rows = sets.rows as Row[];
  if (rows.length === 0) {
    console.log(JSON.stringify({ kevin, message: 'No completed sets found for this exercise' }, null, 2));
    return;
  }

  const sessionIds = [...new Set(rows.map((r) => r.session_id))];
  const latestSessionId = sessionIds[0];

  // Tile 3: best set (heaviest weight) from the most recent prior session
  const lastSessionRows = rows.filter((r) => r.session_id === latestSessionId);
  const bestLastSession = [...lastSessionRows].sort((a, b) => {
    const wa = Number(a.weight_lbs || 0);
    const wb = Number(b.weight_lbs || 0);
    if (wb !== wa) return wb - wa;
    return Number(b.actual_reps || 0) - Number(a.actual_reps || 0);
  })[0];

  // Tiles 1 & 2: per-set-number history, planned sets only (exclude extras), across ALL sessions
  const bySetNumber = new Map<number, Row[]>();
  for (const r of rows) {
    if (r.set_number > PLANNED_SETS) continue; // exclude extras
    if (r.weight_lbs == null || r.actual_reps == null) continue;
    const list = bySetNumber.get(r.set_number) || [];
    list.push(r);
    bySetNumber.set(r.set_number, list);
  }

  const perSetTiles = [...bySetNumber.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([setNumber, list]) => {
      const n = list.length;
      const weightAvg = list.reduce((s, r) => s + Number(r.weight_lbs), 0) / n;
      const repAvg = list.reduce((s, r) => s + Number(r.actual_reps), 0) / n;
      const hardnessAvg =
        list.reduce((s, r) => s + (r.hardness != null && r.hardness >= 1 && r.hardness <= 5 ? Number(r.hardness) : 3), 0) / n;
      const effortAvgFactor = effortFactor(hardnessAvg);
      const effectiveAvg =
        list.reduce((s, r) => {
          const vol = Number(r.weight_lbs) * Number(r.actual_reps);
          return s + vol * effortFactor(r.hardness);
        }, 0) / n;
      return {
        setNumber,
        sampleSize: n,
        weightAvg: Math.round(weightAvg * 10) / 10,
        repAvg: Math.round(repAvg * 10) / 10,
        hardnessAvg: Math.round(hardnessAvg * 10) / 10,
        effortAvgFactor: Math.round(effortAvgFactor * 100) / 100,
        effectiveAvg: Math.round(effectiveAvg),
      };
    });

  // Tile 4: average set volume, current-session-so-far simulation using the latest session's own sets
  const currentSessionSets = lastSessionRows.filter((r) => r.weight_lbs != null && r.actual_reps != null);
  const sessionVolumes = currentSessionSets.map((r) => Number(r.weight_lbs) * Number(r.actual_reps));
  const sessionVolumeAvg = sessionVolumes.length
    ? Math.round(sessionVolumes.reduce((a, b) => a + b, 0) / sessionVolumes.length)
    : null;

  console.log(
    JSON.stringify(
      {
        kevin,
        counts: { totalSets: rows.length, sessions: sessionIds.length },
        latestSessionId,
        tile3_bestSetLastSession: bestLastSession
          ? { weight: bestLastSession.weight_lbs, reps: bestLastSession.actual_reps, setNumber: bestLastSession.set_number }
          : null,
        tile1_and_2_perSetHistory: perSetTiles,
        tile4_sessionVolumeAvg_usingLastSessionAsExample: sessionVolumeAvg,
        note: 'perSetHistory excludes extras (set_number > 3) and is averaged across ALL past completed sessions (not just last).',
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
