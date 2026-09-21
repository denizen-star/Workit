import { query } from '../lib/db';

type SetRow = {
  session_id: number;
  workout_type: string;
  week_number: number;
  day_number: number;
  completed_at: string | null;
  duration_seconds: number | null;
  session_stars: number | null;
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

function muscleGuess(name: string) {
  const n = name.toLowerCase();
  if (/bench|press|fly|pec|push.?up|dip/.test(n) && !/shoulder|ohp|military|leg/.test(n)) return 'Chest';
  if (/row|pulldown|pull.?up|lat|face pull/.test(n)) return 'Back';
  if (/shoulder|ohp|military|lateral|rear delt/.test(n)) return 'Shoulders';
  if (/curl|tricep|pushdown|skull|bicep/.test(n)) return 'Arms';
  if (/squat|leg press|lunge|quad|hack/.test(n)) return 'Quads';
  if (/rdl|deadlift|hamstring|good morning|glide|slide/.test(n)) return 'Hamstrings';
  if (/hip thrust|glute|bridge|kickback/.test(n)) return 'Glutes';
  if (/calf/.test(n)) return 'Calves';
  if (/crunch|core|ab|hanging|knee/.test(n)) return 'Core';
  return 'Other';
}

async function main() {
  const users = await query(`SELECT id, name FROM users WHERE name LIKE 'Kevin%' LIMIT 5`);
  console.log('users', users.rows);

  const kevin = (users.rows as { id: number; name: string }[]).find((u) => u.name === 'Kevin')
    || (users.rows as { id: number; name: string }[])[0];
  if (!kevin) throw new Error('No Kevin');

  const sets = await query(
    `SELECT
       ws.id as session_id,
       ws.workout_type,
       ws.week_number,
       ws.day_number,
       COALESCE(ws.completed_at, ws.ended_at, ws.started_at) as completed_at,
       TIMESTAMPDIFF(SECOND, ws.started_at, COALESCE(ws.ended_at, ws.completed_at)) as duration_seconds,
       sr.stars as session_stars,
       es.exercise_name,
       es.weight_lbs,
       es.actual_reps,
       es.hardness,
       es.target_reps
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     LEFT JOIN session_ratings sr ON sr.session_id = ws.id
     WHERE ws.user_id = ?
       AND ws.is_completed = 1
       AND es.is_completed = 1
     ORDER BY COALESCE(ws.completed_at, ws.ended_at) DESC, es.id`,
    [kevin.id]
  );

  const rows = sets.rows as SetRow[];
  const mechanical = rows.filter(
    (r) =>
      r.weight_lbs != null &&
      r.actual_reps != null &&
      isMechanical(r.target_reps, r.exercise_name)
  );

  const last15 = new Date();
  last15.setDate(last15.getDate() - 15);

  const windowRows = mechanical.filter((r) => {
    if (!r.completed_at) return false;
    return new Date(r.completed_at) >= last15;
  });

  function roll(list: SetRow[]) {
    const setCount = list.length;
    const weightSum = list.reduce((s, r) => s + Number(r.weight_lbs || 0), 0);
    const repSum = list.reduce((s, r) => s + Number(r.actual_reps || 0), 0);
    const volume = list.reduce((s, r) => s + Number(r.weight_lbs || 0) * Number(r.actual_reps || 0), 0);
    const effective = list.reduce(
      (s, r) => s + Number(r.weight_lbs || 0) * Number(r.actual_reps || 0) * effortPct(r.hardness),
      0
    );
    const voted = list.filter((r) => r.hardness != null && r.hardness >= 1 && r.hardness <= 5);
    const effortAvg =
      voted.length > 0
        ? voted.reduce((s, r) => s + Number(r.hardness), 0) / voted.length
        : null;
    return {
      sets: setCount,
      weightSum,
      weightAvgSet: setCount ? weightSum / setCount : 0,
      weightAvgRep: repSum ? volume / repSum : 0,
      repSum,
      repAvgSet: setCount ? repSum / setCount : 0,
      volume,
      effective,
      effortAvg,
    };
  }

  const all = roll(mechanical);
  const t15 = roll(windowRows);

  const byExercise = new Map<string, SetRow[]>();
  for (const r of windowRows) {
    const list = byExercise.get(r.exercise_name) || [];
    list.push(r);
    byExercise.set(r.exercise_name, list);
  }
  const lifts = [...byExercise.entries()]
    .map(([name, list]) => ({ name, ...roll(list) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 8);

  const bySession = new Map<number, SetRow[]>();
  for (const r of windowRows) {
    const list = bySession.get(r.session_id) || [];
    list.push(r);
    bySession.set(r.session_id, list);
  }
  const sessions = [...bySession.entries()]
    .map(([id, list]) => {
      const first = list[0];
      const duration = Number(first.duration_seconds || 0);
      const stars = first.session_stars != null ? Number(first.session_stars) : null;
      const srpe = stars != null && duration > 0 ? stars * (duration / 60) : null;
      return {
        id,
        type: first.workout_type,
        week: first.week_number,
        day: first.day_number,
        when: first.completed_at,
        durationMin: duration ? duration / 60 : null,
        stars,
        srpe,
        ...roll(list),
      };
    })
    .sort((a, b) => String(b.when).localeCompare(String(a.when)))
    .slice(0, 6);

  const hardSets = windowRows.filter((r) => Number(r.hardness) >= 4);
  const byMuscle = new Map<string, number>();
  for (const r of hardSets) {
    const g = muscleGuess(r.exercise_name);
    byMuscle.set(g, (byMuscle.get(g) || 0) + 1);
  }

  console.log(
    JSON.stringify(
      {
        kevin,
        counts: { allSets: mechanical.length, t15Sets: windowRows.length, sessions: bySession.size },
        all,
        t15,
        lifts,
        sessions,
        hardSetsByMuscle: Object.fromEntries(byMuscle),
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
