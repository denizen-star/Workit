import { writeFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';
import { performancePeriodWindow, inPeriodWindow } from '../lib/performancePeriod';
import type { PerformancePeriod } from '../lib/athletePerformanceTypes';

type SetRow = {
  session_id: number;
  workout_type: string;
  completed_at: string | null;
  exercise_name: string;
  weight_lbs: number | null;
  actual_reps: number | null;
  hardness: number | null;
  target_reps: string | null;
  set_number: number | null;
};

const WO: Record<string, string> = {
  all: 'all',
  ua: 'Upper Body A',
  la: 'Lower Body A',
  ub: 'Upper Body B',
  lb: 'Lower Body B',
};

function isMechanical(target: string | null, name: string) {
  const reps = (target || '').toLowerCase();
  const n = name.toLowerCase();
  if (reps.includes('second')) return false;
  if (n.includes('plank') && !n.includes('iso')) return false;
  if (reps.includes('meter') || reps.includes('walk') || n.includes('carry')) return false;
  return true;
}

function effortPct(h: number | null) {
  const score = h != null && h >= 1 && h <= 5 ? h : 3;
  return score * 0.2;
}

function shortName(name: string) {
  return name
    .replace(' Body ', ' ')
    .replace(' or Goblet Squats', '')
    .replace(' or Glute Bridges', '')
    .replace(' (RDLs)', '')
    .replace(' or Barbell Conventional Deadlifts', '')
    .replace(' or Cable Rows', '')
    .replace(' or Overhead Extensions', '')
    .replace(' or Goblet Step-Ups', '')
    .replace(' or Sissy Squats', '')
    .replace('Overhead Dumbbell Shoulder Press', 'OHP')
    .replace('Incline Dumbbell Bench Press', 'Incline DB')
    .replace('Barbell or Dumbbell Bench Press', 'Bench')
    .replace('Walking Lunges', 'Lunges')
    .replace('Bulgarian Split Squats', 'Splits')
    .replace('Barbell Hip Thrusts', 'Hip Thrusts')
    .replace('Trap Bar Deadlifts', 'Trap Bar')
    .replace('Standing Calf Raises', 'Calves')
    .replace('Single-Arm Dumbbell Rows', 'DB Rows')
    .replace('Lat Pulldowns', 'Pulldowns')
    .replace('Hanging Knee Raises or Ab Wheel Rollouts', 'Hanging knees');
}

function pct(now: number, prior: number | null) {
  if (prior == null || !prior) return null;
  return Math.round(((now - prior) / prior) * 1000) / 10;
}

function roll(list: SetRow[]) {
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
    weightSum: Math.round(weightSum),
    weightAvg: sets ? Math.round(weightSum / sets) : 0,
    repSum: Math.round(repSum),
    repAvg: sets ? Math.round((repSum / sets) * 10) / 10 : 0,
    volume: Math.round(volume),
    effective: Math.round(effective),
  };
}

function spikeItem(
  id: string,
  label: string,
  now: ReturnType<typeof roll>,
  prior: ReturnType<typeof roll> | null
) {
  return {
    id,
    label,
    w: now.weightAvg,
    r: now.repAvg,
    v: now.volume,
    e: now.effective,
    wPct: prior ? pct(now.weightAvg, prior.weightAvg) : null,
    rPct: prior ? pct(now.repAvg, prior.repAvg) : null,
    vPct: prior ? pct(now.volume, prior.volume) : null,
    ePct: prior ? pct(now.effective, prior.effective) : null,
  };
}

async function main() {
  const sets = await query(
    `SELECT ws.id as session_id, ws.workout_type,
       COALESCE(ws.completed_at, ws.ended_at, ws.started_at) as completed_at,
       es.exercise_name, es.weight_lbs, es.actual_reps, es.hardness, es.target_reps, es.set_number
     FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE ws.user_id = 1 AND ws.is_completed = 1 AND es.is_completed = 1
     ORDER BY COALESCE(ws.completed_at, ws.ended_at) ASC, es.id`
  );
  const all = (sets.rows as SetRow[]).filter(
    (r) => r.weight_lbs != null && r.actual_reps != null && isMechanical(r.target_reps, r.exercise_name)
  );

  const periods: PerformancePeriod[] = ['t', 't-1', 't-7', 't-15', 't-30', 'all'];
  const workouts = ['all', 'ua', 'la', 'ub', 'lb'] as const;
  const board: Record<string, unknown> = {};

  for (const period of periods) {
    const window = performancePeriodWindow(period);
    const inPeriod = all.filter((r) => inPeriodWindow(r.completed_at, window));
    for (const wo of workouts) {
      const type = WO[wo];
      const rows = wo === 'all' ? inPeriod : inPeriod.filter((r) => r.workout_type === type);
      const totals = roll(rows);

      const bySession = new Map<number, SetRow[]>();
      for (const r of rows) {
        const list = bySession.get(r.session_id) || [];
        list.push(r);
        bySession.set(r.session_id, list);
      }
      const sessions = [...bySession.entries()]
        .map(([id, list]) => ({
          id,
          type: list[0].workout_type,
          when: list[0].completed_at,
          roll: roll(list),
        }))
        .sort((a, b) => String(a.when).localeCompare(String(b.when)));
      const lastByType = new Map<string, ReturnType<typeof roll>>();
      const sessionSpikes = sessions.map((s) => {
        const prior = lastByType.get(s.type) || null;
        lastByType.set(s.type, s.roll);
        const day = String(s.when || '').slice(5, 10);
        return spikeItem(
          `s${s.id}`,
          `${s.type.replace(' Body ', ' ')} ${day}`,
          s.roll,
          prior
        );
      });

      const byEx = new Map<string, Map<number, SetRow[]>>();
      for (const r of rows) {
        const sessionsMap = byEx.get(r.exercise_name) || new Map();
        const list = sessionsMap.get(r.session_id) || [];
        list.push(r);
        sessionsMap.set(r.session_id, list);
        byEx.set(r.exercise_name, sessionsMap);
      }
      const exerciseSpikes = [...byEx.entries()]
        .map(([name, sessionsMap]) => {
          const ordered = [...sessionsMap.entries()]
            .map(([id, list]) => ({ id, when: list[0].completed_at, roll: roll(list) }))
            .sort((a, b) => String(a.when).localeCompare(String(b.when)));
          const now = ordered[ordered.length - 1];
          const prior = ordered[ordered.length - 2] || null;
          return spikeItem(`e${now.id}-${name.slice(0, 12)}`, shortName(name), now.roll, prior ? prior.roll : null);
        })
        .sort((a, b) => (b.vPct ?? -999) - (a.vPct ?? -999));

      const latestSession = sessions[sessions.length - 1];
      const setSpikes = latestSession
        ? (bySession.get(latestSession.id) || []).map((r, i) => {
            const vol = Number(r.weight_lbs) * Number(r.actual_reps);
            const eff = vol * effortPct(r.hardness);
            const prev = (bySession.get(latestSession.id) || [])[i - 1];
            const prior =
              prev && prev.exercise_name === r.exercise_name
                ? {
                    sets: 1,
                    weightSum: Number(prev.weight_lbs),
                    weightAvg: Number(prev.weight_lbs),
                    repSum: Number(prev.actual_reps),
                    repAvg: Number(prev.actual_reps),
                    volume: Number(prev.weight_lbs) * Number(prev.actual_reps),
                    effective:
                      Number(prev.weight_lbs) * Number(prev.actual_reps) * effortPct(prev.hardness),
                  }
                : null;
            return spikeItem(
              `set${latestSession.id}-${i}`,
              `${shortName(r.exercise_name)} s${r.set_number || i + 1}`,
              {
                sets: 1,
                weightSum: Number(r.weight_lbs),
                weightAvg: Number(r.weight_lbs),
                repSum: Number(r.actual_reps),
                repAvg: Number(r.actual_reps),
                volume: Math.round(vol),
                effective: Math.round(eff),
              },
              prior
                ? {
                    ...prior,
                    volume: Math.round(prior.volume),
                    effective: Math.round(prior.effective),
                  }
                : null
            );
          })
        : [];

      board[`${period}|${wo}`] = {
        totals,
        session: sessionSpikes.slice(-8),
        exercise: exerciseSpikes.slice(0, 10),
        set: setSpikes.slice(0, 12),
      };
    }
  }

  const out = join(process.cwd(), 'docs/samples/kpi-filter-board.json');
  writeFileSync(out, JSON.stringify(board));
  console.log('wrote', out, 'keys', Object.keys(board).length);
  console.log('t-15|all totals', (board['t-15|all'] as { totals: unknown }).totals);
  console.log('t|lb session', (board['t|lb'] as { session: unknown[] }).session);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
