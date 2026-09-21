import { query } from '../lib/db';

type SetRow = {
  user_id: number;
  user_name: string;
  session_id: number;
  workout_type: string;
  completed_at: string | null;
  exercise_name: string;
  weight_lbs: number | null;
  actual_reps: number | null;
  hardness: number | null;
  target_reps: string | null;
};

function isMechanical(target: string | null, name: string) {
  const reps = (target || '').toLowerCase();
  const n = name.toLowerCase();
  if (reps.includes('second')) return false;
  if (n.includes('plank') && !n.includes('iso')) return false;
  if (reps.includes('meter') || reps.includes('walk') || n.includes('carry')) return false;
  return true;
}

function effortPct(hardness: number | null) {
  const score = hardness != null && hardness >= 1 && hardness <= 5 ? hardness : 3;
  return score * 0.2;
}

function pct(now: number, prior: number) {
  if (!prior) return null;
  return Math.round(((now - prior) / prior) * 1000) / 10;
}

function verdict(delta: number | null) {
  if (delta == null) return 'first';
  if (delta > 1) return 'up';
  if (delta < -1) return 'down';
  return 'held';
}

type Roll = { sets: number; weightSum: number; weightAvg: number; repSum: number; repAvg: number; volume: number; effective: number };

function roll(list: SetRow[]): Roll {
  const sets = list.length;
  const weightSum = list.reduce((s, r) => s + Number(r.weight_lbs || 0), 0);
  const repSum = list.reduce((s, r) => s + Number(r.actual_reps || 0), 0);
  const volume = list.reduce((s, r) => s + Number(r.weight_lbs || 0) * Number(r.actual_reps || 0), 0);
  const effective = list.reduce(
    (s, r) => s + Number(r.weight_lbs || 0) * Number(r.actual_reps || 0) * effortPct(r.hardness),
    0
  );
  return {
    sets,
    weightSum,
    weightAvg: sets ? weightSum / sets : 0,
    repSum,
    repAvg: sets ? repSum / sets : 0,
    volume,
    effective,
  };
}

async function main() {
  const sets = await query(
    `SELECT
       u.id as user_id,
       u.name as user_name,
       ws.id as session_id,
       ws.workout_type,
       COALESCE(ws.completed_at, ws.ended_at, ws.started_at) as completed_at,
       es.exercise_name,
       es.weight_lbs,
       es.actual_reps,
       es.hardness,
       es.target_reps
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     JOIN users u ON u.id = ws.user_id
     WHERE ws.is_completed = 1
       AND es.is_completed = 1
       AND u.pin_hash IS NOT NULL
     ORDER BY COALESCE(ws.completed_at, ws.ended_at) DESC, es.id`
  );

  const rows = (sets.rows as SetRow[]).filter(
    (r) => r.weight_lbs != null && r.actual_reps != null && isMechanical(r.target_reps, r.exercise_name)
  );

  function sessionLifts(userId: number) {
    const mine = rows.filter((r) => r.user_id === userId);
    const map = new Map<string, Map<number, SetRow[]>>();
    for (const r of mine) {
      const bySession = map.get(r.exercise_name) || new Map();
      const list = bySession.get(r.session_id) || [];
      list.push(r);
      bySession.set(r.session_id, list);
      map.set(r.exercise_name, bySession);
    }
    return [...map.entries()].map(([name, bySession]) => {
      const sessions = [...bySession.entries()]
        .map(([id, list]) => ({
          id,
          when: list[0].completed_at,
          type: list[0].workout_type,
          ...roll(list),
        }))
        .sort((a, b) => String(b.when).localeCompare(String(a.when)));
      const now = sessions[0];
      const prior = sessions[1];
      if (!now) return null;
      const weightPct = prior ? pct(now.weightAvg, prior.weightAvg) : null;
      const repPct = prior ? pct(now.repAvg, prior.repAvg) : null;
      const volPct = prior ? pct(now.volume, prior.volume) : null;
      const effPct = prior ? pct(now.effective, prior.effective) : null;
      return {
        name,
        now,
        prior,
        weightPct,
        repPct,
        volPct,
        effPct,
        result: verdict(volPct),
      };
    }).filter(Boolean);
  }

  const kevinLifts = sessionLifts(1).sort((a, b) => {
    const av = a!.volPct == null ? -999 : a!.volPct;
    const bv = b!.volPct == null ? -999 : b!.volPct;
    return bv - av;
  });

  const compared = kevinLifts.filter((l) => l!.prior);
  const up = compared.filter((l) => l!.result === 'up');
  const down = compared.filter((l) => l!.result === 'down');
  const held = compared.filter((l) => l!.result === 'held');

  const byType = new Map<string, Map<number, SetRow[]>>();
  for (const r of rows.filter((x) => x.user_id === 1)) {
    const bySession = byType.get(r.workout_type) || new Map();
    const list = bySession.get(r.session_id) || [];
    list.push(r);
    bySession.set(r.session_id, list);
    byType.set(r.workout_type, bySession);
  }
  const sessions = [...byType.entries()].map(([type, bySession]) => {
    const ordered = [...bySession.entries()]
      .map(([id, list]) => ({ id, type, when: list[0].completed_at, ...roll(list) }))
      .sort((a, b) => String(b.when).localeCompare(String(a.when)));
    const now = ordered[0];
    const prior = ordered[1];
    return {
      type,
      now,
      prior,
      volPct: prior ? pct(now.volume, prior.volume) : null,
      effPct: prior ? pct(now.effective, prior.effective) : null,
      weightPct: prior ? pct(now.weightAvg, prior.weightAvg) : null,
      repPct: prior ? pct(now.repAvg, prior.repAvg) : null,
    };
  });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const names = new Map(rows.map((r) => [r.user_id, r.user_name]));
  const house = userIds
    .map((id) => {
      const lifts = sessionLifts(id).filter((l) => l!.prior);
      const name = names.get(id) || String(id);
      if (name === 'Test') return null;
      const volUp = lifts.filter((l) => l!.result === 'up').length;
      const volDown = lifts.filter((l) => l!.result === 'down').length;
      const volHeld = lifts.filter((l) => l!.result === 'held').length;
      const avgVol =
        lifts.length === 0
          ? null
          : lifts.reduce((s, l) => s + (l!.volPct || 0), 0) / lifts.length;
      const avgEff =
        lifts.length === 0
          ? null
          : lifts.reduce((s, l) => s + (l!.effPct || 0), 0) / lifts.length;
      const weightUp = lifts.filter((l) => verdict(l!.weightPct) === 'up').length;
      const repsUp = lifts.filter((l) => verdict(l!.repPct) === 'up').length;
      return {
        name,
        compared: lifts.length,
        volUp,
        volDown,
        volHeld,
        weightUp,
        repsUp,
        avgVol: avgVol == null ? null : Math.round(avgVol * 10) / 10,
        avgEff: avgEff == null ? null : Math.round(avgEff * 10) / 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.volUp - b!.volDown) - (a!.volUp - a!.volDown) || (b!.avgVol || 0) - (a!.avgVol || 0));

  console.log(
    JSON.stringify(
      {
        kevinSummary: {
          compared: compared.length,
          up: up.length,
          down: down.length,
          held: held.length,
        },
        sessions,
        downs: kevinLifts
          .filter((l) => l!.result === 'down')
          .map((l) => ({
            name: l!.name,
            volPct: l!.volPct,
            effPct: l!.effPct,
            weightPct: l!.weightPct,
            repPct: l!.repPct,
            nowVol: Math.round(l!.now.volume),
            priorVol: l!.prior ? Math.round(l!.prior.volume) : null,
          })),
        lifts: kevinLifts.slice(0, 12).map((l) => ({
          name: l!.name,
          result: l!.result,
          nowVol: Math.round(l!.now.volume),
          priorVol: l!.prior ? Math.round(l!.prior.volume) : null,
          volPct: l!.volPct,
          effPct: l!.effPct,
          weightPct: l!.weightPct,
          repPct: l!.repPct,
          nowWeight: Math.round(l!.now.weightAvg),
          priorWeight: l!.prior ? Math.round(l!.prior.weightAvg) : null,
          nowReps: Math.round(l!.now.repAvg * 10) / 10,
          priorReps: l!.prior ? Math.round(l!.prior.repAvg * 10) / 10 : null,
          nowEff: Math.round(l!.now.effective),
          priorEff: l!.prior ? Math.round(l!.prior.effective) : null,
        })),
        house,
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
