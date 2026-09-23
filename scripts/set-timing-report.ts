// Run with: npx tsx --env-file=.env.local scripts/set-timing-report.ts
//
// Two reports:
//
// 1. Set timing, by athlete + workout + exercise (and rolled up by athlete + workout).
//    exercise_sets has no per-set start/stop timestamp, only `updated_at` (stamped when
//    the set is marked complete). So "time per set" here = elapsed seconds between one
//    completed set's updated_at and the NEXT completed set's updated_at, within the same
//    session + exercise, ordered by set_number. That gap is work + rest combined — it
//    cannot be split further with the data that's actually stored. rest_timer_seconds is
//    the *configured target* rest (60s + the athlete's rest_extra_minutes), not a measured
//    actual rest — reported separately, for reference only. Gaps over 30 minutes are
//    dropped as outliers (athlete left the app / paused). The first set of an exercise has
//    no previous set to diff against, so it's excluded from the per-set averages.
//
// 2. Current program week per athlete — reuses the exact same logic Home/Select Workout
//    use (`defaultSelectWeek` in lib/nextWorkout.ts), not a guess from raw week numbers,
//    so it matches what each athlete actually sees. Athletes active on the Hyrox track
//    are reported by their Hyrox week (namespaced at 101+ in the DB; displayed 1-16) instead.

import { query } from '../lib/db';
import { defaultSelectWeek, type WorkoutSessionRow } from '../lib/nextWorkout';
import { hyroxProgram, HYROX_WEEK_OFFSET } from '../lib/hyroxProgram';

const TIMING_SQL = `
WITH ordered_sets AS (
  SELECT
    es.workout_session_id,
    es.exercise_name,
    es.set_number,
    es.updated_at,
    es.rest_timer_seconds,
    ws.user_id,
    ws.workout_type,
    LAG(es.updated_at) OVER (
      PARTITION BY es.workout_session_id, es.exercise_name
      ORDER BY es.set_number
    ) AS prev_updated_at
  FROM exercise_sets es
  JOIN workout_sessions ws ON ws.id = es.workout_session_id
  WHERE es.is_completed = 1
),
gaps AS (
  SELECT
    user_id,
    workout_type,
    exercise_name,
    rest_timer_seconds,
    TIMESTAMPDIFF(SECOND, prev_updated_at, updated_at) AS seconds_since_prev_set
  FROM ordered_sets
  WHERE prev_updated_at IS NOT NULL
    AND TIMESTAMPDIFF(SECOND, prev_updated_at, updated_at) BETWEEN 0 AND 1800
)
SELECT
  u.name AS athlete,
  g.workout_type,
  g.exercise_name,
  COUNT(*) AS set_gaps_counted,
  ROUND(AVG(g.seconds_since_prev_set)) AS avg_seconds_between_sets,
  ROUND(AVG(g.rest_timer_seconds)) AS avg_target_rest_seconds,
  SUM(g.seconds_since_prev_set) AS total_seconds_between_sets
FROM gaps g
JOIN users u ON u.id = g.user_id
GROUP BY u.name, g.workout_type, g.exercise_name
ORDER BY u.name, g.workout_type, g.exercise_name;
`;

const ROLLUP_BY_WORKOUT_SQL = `
WITH ordered_sets AS (
  SELECT
    es.workout_session_id,
    es.exercise_name,
    es.set_number,
    es.updated_at,
    ws.user_id,
    ws.workout_type,
    LAG(es.updated_at) OVER (
      PARTITION BY es.workout_session_id, es.exercise_name
      ORDER BY es.set_number
    ) AS prev_updated_at
  FROM exercise_sets es
  JOIN workout_sessions ws ON ws.id = es.workout_session_id
  WHERE es.is_completed = 1
),
gaps AS (
  SELECT
    user_id,
    workout_type,
    TIMESTAMPDIFF(SECOND, prev_updated_at, updated_at) AS seconds_since_prev_set
  FROM ordered_sets
  WHERE prev_updated_at IS NOT NULL
    AND TIMESTAMPDIFF(SECOND, prev_updated_at, updated_at) BETWEEN 0 AND 1800
)
SELECT
  u.name AS athlete,
  g.workout_type,
  COUNT(*) AS set_gaps_counted,
  ROUND(AVG(g.seconds_since_prev_set)) AS avg_seconds_between_sets,
  SUM(g.seconds_since_prev_set) AS total_seconds_between_sets
FROM gaps g
JOIN users u ON u.id = g.user_id
GROUP BY u.name, g.workout_type
ORDER BY u.name, g.workout_type;
`;

function fmtMinSec(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}m ${s}s`;
}

async function printTimingReport() {
  console.log('=== Set timing: by athlete + workout + exercise ===');
  const byExercise = await query(TIMING_SQL);
  for (const row of byExercise.rows as any[]) {
    console.log(
      `${row.athlete} | ${row.workout_type} | ${row.exercise_name} | ` +
        `sets=${row.set_gaps_counted} | avg between sets=${row.avg_seconds_between_sets}s ` +
        `(${fmtMinSec(row.avg_seconds_between_sets)}) | avg target rest=${row.avg_target_rest_seconds}s | ` +
        `total=${fmtMinSec(row.total_seconds_between_sets)}`
    );
  }

  console.log('\n=== Set timing: by athlete + workout (rolled up across exercises) ===');
  const byWorkout = await query(ROLLUP_BY_WORKOUT_SQL);
  for (const row of byWorkout.rows as any[]) {
    console.log(
      `${row.athlete} | ${row.workout_type} | sets=${row.set_gaps_counted} | ` +
        `avg between sets=${row.avg_seconds_between_sets}s (${fmtMinSec(row.avg_seconds_between_sets)}) | ` +
        `total=${fmtMinSec(row.total_seconds_between_sets)}`
    );
  }
}

async function printCurrentWeekReport() {
  console.log('\n=== Current week, by athlete ===');

  const usersResult = await query('SELECT id, name FROM users ORDER BY name');
  const users = usersResult.rows as { id: number; name: string }[];

  const sessionsResult = await query(
    `SELECT id, user_id, week_number, day_number, workout_type, is_completed,
            started_at, created_at, completed_at, ended_at, program_track
     FROM workout_sessions`
  );
  const allSessions = sessionsResult.rows as (WorkoutSessionRow & {
    user_id: number;
    program_track: string;
  })[];

  const hyroxResult = await query('SELECT user_id, active FROM hyrox_state');
  const activeHyroxUserIds = new Set(
    (hyroxResult.rows as { user_id: number; active: number | boolean }[])
      .filter((row) => Number(row.active))
      .map((row) => row.user_id)
  );

  for (const user of users) {
    const sessions = allSessions.filter((s) => s.user_id === user.id);

    if (activeHyroxUserIds.has(user.id)) {
      const hyroxSessions = sessions.filter((s) => s.program_track === 'hyrox');
      const week = defaultSelectWeek(hyroxSessions, hyroxProgram);
      if (week == null) {
        console.log(`${user.name} | Hyrox track complete (16/16)`);
      } else {
        console.log(`${user.name} | Hyrox week ${week - HYROX_WEEK_OFFSET} of 16`);
      }
      continue;
    }

    const mainSessions = sessions.filter((s) => s.program_track !== 'hyrox');
    const week = defaultSelectWeek(mainSessions);
    if (week == null) {
      console.log(`${user.name} | Program complete (48/48)`);
    } else {
      console.log(`${user.name} | Week ${week} of 48`);
    }
  }
}

async function main() {
  await printTimingReport();
  await printCurrentWeekReport();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
