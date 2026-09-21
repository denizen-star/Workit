import { query } from '../lib/db';

type Row = {
  session_id: number;
  exercise_name: string;
  completed_at: string | null;
  weight_lbs: number | null;
  actual_reps: number | null;
  hardness: number | null;
};

function effortPct(h: number | null) {
  const score = h != null && h >= 1 && h <= 5 ? h : 3;
  return score * 0.2;
}

function pct(now: number, prior: number) {
  if (!prior) return null;
  return Math.round(((now - prior) / prior) * 1000) / 10;
}

async function main() {
  const sets = await query(
    `SELECT ws.id as session_id, es.exercise_name,
       COALESCE(ws.completed_at, ws.ended_at) as completed_at,
       es.weight_lbs, es.actual_reps, es.hardness
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE ws.user_id = 1 AND ws.is_completed = 1 AND es.is_completed = 1
       AND ws.workout_type = 'Lower Body B'
       AND es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL
     ORDER BY COALESCE(ws.completed_at, ws.ended_at) DESC, es.id`
  );
  const rows = sets.rows as Row[];
  const sessions = [...new Set(rows.map((r) => r.session_id))];
  const latest = sessions[0];
  const priorId = sessions[1];
  function roll(sessionId: number) {
    const mine = rows.filter((r) => r.session_id === sessionId);
    const map = new Map<string, Row[]>();
    for (const r of mine) {
      const list = map.get(r.exercise_name) || [];
      list.push(r);
      map.set(r.exercise_name, list);
    }
    return [...map.entries()].map(([name, list]) => {
      const w = list.reduce((s, r) => s + Number(r.weight_lbs), 0);
      const reps = list.reduce((s, r) => s + Number(r.actual_reps), 0);
      const vol = list.reduce((s, r) => s + Number(r.weight_lbs) * Number(r.actual_reps), 0);
      const eff = list.reduce(
        (s, r) => s + Number(r.weight_lbs) * Number(r.actual_reps) * effortPct(r.hardness),
        0
      );
      return {
        name,
        sets: list.length,
        weightAvg: w / list.length,
        repAvg: reps / list.length,
        vol,
        eff,
      };
    });
  }
  const now = roll(latest);
  const prior = new Map(roll(priorId).map((r) => [r.name, r]));
  const compared = now.map((n) => {
    const p = prior.get(n.name);
    return {
      name: n.name.replace(' or Goblet Squats', '').replace(' (RDLs)', '').replace(' or Glute Bridges', ''),
      now: {
        w: Math.round(n.weightAvg),
        r: Math.round(n.repAvg * 10) / 10,
        v: Math.round(n.vol),
        e: Math.round(n.eff),
      },
      prior: p
        ? {
            w: Math.round(p.weightAvg),
            r: Math.round(p.repAvg * 10) / 10,
            v: Math.round(p.vol),
            e: Math.round(p.eff),
          }
        : null,
      wPct: p ? pct(n.weightAvg, p.weightAvg) : null,
      rPct: p ? pct(n.repAvg, p.repAvg) : null,
      vPct: p ? pct(n.vol, p.vol) : null,
      ePct: p ? pct(n.eff, p.eff) : null,
    };
  });
  compared.sort((a, b) => (b.vPct ?? -999) - (a.vPct ?? -999));
  console.log(JSON.stringify({ latest, priorId, compared }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
