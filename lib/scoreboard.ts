import { lockedWeeksByUser } from '@/lib/beltHousehold';
import { displayBelt } from '@/lib/belts';
import { bonusTypeSql } from '@/lib/bonusDay';
import { query } from '@/lib/db';
import { sqlSetEffortVolume, sqlSetVolume } from '@/lib/exerciseKind';
import { sqlInHousehold } from '@/lib/household';
import { SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { sqlSessionOptionalVolume, sqlUserOptionalVolume } from '@/lib/optionals';
import {
  performancePeriodWindow,
  priorPeriodWindow,
  sqlPeriodWindow,
  type SqlWindow,
} from '@/lib/performancePeriod';
import { workoutDateKey } from '@/lib/statsHousehold';
import {
  emptyWindowLine,
  tomScoreboardLine,
  type BonusHonorRow,
  type HouseholdScoreboardRow,
  type PerformanceSnapshot,
  type ScoreboardDailyPoint,
  type ScoreboardPeriod,
} from '@/lib/scoreboardTypes';
import { normalizePerformancePeriod, type PerformancePeriod } from '@/lib/athletePerformanceTypes';

function periodFilter(period: ScoreboardPeriod, column: string): SqlWindow {
  if (period === 'all') return { sql: '', params: [] };
  const days = period === '30' ? 30 : 7;
  return {
    sql: ` AND ${column} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`,
    params: [],
  };
}

/** Same length as the current house window, immediately before it. All = none. */
function priorPeriodFilter(period: ScoreboardPeriod, column: string): SqlWindow | null {
  if (period === 'all') return null;
  const days = period === '30' ? 30 : 7;
  return {
    sql: ` AND ${column} >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days * 2} DAY) AND ${column} < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${days} DAY)`,
    params: [],
  };
}

type LastRow = { week_number: number; workout_type: string; completed_at: string };

function toScoreboardRow(
  row: {
    id: number;
    name: string;
    workouts: number;
    volume: number;
    sets: number;
    heaviest: number;
    avg_seconds: number | null;
    perception?: number | null;
    effort_volume?: number;
    weight_sum?: number;
    reps_sum?: number;
    raw_volume?: number;
    effort_sets?: number;
    prior_weight_sum?: number | null;
    prior_reps_sum?: number | null;
    prior_raw_volume?: number | null;
    prior_effort_sets?: number | null;
  },
  lastByUser: Map<number, LastRow>,
  bestByUser: Map<number, number>,
  effortBestByUser: Map<number, number>,
  badgesByUser: Map<number, number>,
  lockedByUser: Map<number, number>
): HouseholdScoreboardRow {
  const lastRow = lastByUser.get(Number(row.id));
  const belt = displayBelt(lockedByUser.get(Number(row.id)) || 0);
  return {
    id: Number(row.id),
    name: row.name,
    workouts: Number(row.workouts || 0),
    volume: Number(row.volume || 0),
    sets: Number(row.sets || 0),
    heaviest: Number(row.heaviest || 0),
    avgSeconds: row.avg_seconds == null ? null : Number(row.avg_seconds),
    bestSessionVolume: bestByUser.get(Number(row.id)) || 0,
    badges: badgesByUser.get(Number(row.id)) || 0,
    beltName: belt.name,
    beltFill: belt.fill,
    lastWorkout: lastRow ? `Week ${lastRow.week_number} · ${lastRow.workout_type}` : null,
    lastAt: lastRow?.completed_at || null,
    perception: row.perception == null ? null : Number(row.perception),
    effortVolume: Number(row.effort_volume || 0),
    bestSessionEffort: effortBestByUser.get(Number(row.id)) || 0,
    weightSum: Number(row.weight_sum || 0),
    repsSum: Number(row.reps_sum || 0),
    rawVolume: Number(row.raw_volume || 0),
    effortSets: Number(row.effort_sets || 0),
    priorWeightSum: row.prior_weight_sum == null ? null : Number(row.prior_weight_sum),
    priorRepSum: row.prior_reps_sum == null ? null : Number(row.prior_reps_sum),
    priorRawVolume: row.prior_raw_volume == null ? null : Number(row.prior_raw_volume),
    priorEffortSets: row.prior_effort_sets == null ? null : Number(row.prior_effort_sets),
  };
}

async function lastWorkoutByUser() {
  const last = await query(
    `SELECT ws.user_id, ws.week_number, ws.workout_type, ws.completed_at
     FROM workout_sessions ws
     INNER JOIN (
       SELECT user_id, MAX(completed_at) as last_at
       FROM workout_sessions
       WHERE is_completed = 1
       GROUP BY user_id
     ) latest ON latest.user_id = ws.user_id AND ws.completed_at = latest.last_at
     WHERE ws.is_completed = 1`
  );
  const lastByUser = new Map<number, LastRow>();
  for (const row of last.rows as (LastRow & { user_id: number })[]) {
    lastByUser.set(Number(row.user_id), row);
  }
  return lastByUser;
}

async function householdScoreboardFiltered(
  sessionWindow: SqlWindow,
  optionalWindow: SqlWindow,
  badgeWindow: SqlWindow,
  priorSessionWindow: SqlWindow | null = null,
  householdId?: number | null
): Promise<HouseholdScoreboardRow[]> {
  const house = sqlInHousehold('u.id', householdId);
  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(DISTINCT ws.id) as workouts,
       COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${sqlUserOptionalVolume(
         'u.id',
         `AND optws.is_completed = 1${optionalWindow.sql}`
       )} as volume,
       COALESCE(SUM(${sqlSetVolume('es')}), 0) as raw_volume,
       COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) as effort_sets,
       COUNT(CASE WHEN es.is_completed = 1 THEN es.id END) as sets,
       COALESCE(MAX(es.weight_lbs), 0) as heaviest,
       COALESCE(SUM(es.weight_lbs), 0) as weight_sum,
       COALESCE(SUM(es.actual_reps), 0) as reps_sum,
       AVG(CASE WHEN es.hardness IS NOT NULL THEN es.hardness END) as perception,
       COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) + ${sqlUserOptionalVolume(
         'u.id',
         `AND optws.is_completed = 1${optionalWindow.sql}`
       )} as effort_volume,
       AVG(CASE WHEN ws.started_at IS NOT NULL AND ws.ended_at IS NOT NULL
         THEN TIMESTAMPDIFF(SECOND, ws.started_at, ws.ended_at) END) as avg_seconds
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 ${sessionWindow.sql}
     LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
     WHERE 1=1 ${house.sql}
     GROUP BY u.id, u.name
     HAVING COUNT(DISTINCT ws.id) > 0
     ORDER BY workouts DESC, volume DESC, u.name ASC`,
    [...optionalWindow.params, ...optionalWindow.params, ...sessionWindow.params, ...house.params]
  );

  const rows = result.rows as {
    id: number;
    name: string;
    workouts: number;
    volume: number;
    sets: number;
    heaviest: number;
    avg_seconds: number | null;
    perception: number | null;
    effort_volume: number;
    weight_sum: number;
    reps_sum: number;
    raw_volume: number;
    effort_sets: number;
  }[];

  if (rows.length === 0) return [];

  const priorByUser = new Map<
    number,
    { prior_weight_sum: number; prior_reps_sum: number; prior_raw_volume: number; prior_effort_sets: number }
  >();
  if (priorSessionWindow) {
    const prior = await query(
      `SELECT
         u.id,
         COALESCE(SUM(es.weight_lbs), 0) as prior_weight_sum,
         COALESCE(SUM(es.actual_reps), 0) as prior_reps_sum,
         COALESCE(SUM(${sqlSetVolume('es')}), 0) as prior_raw_volume,
         COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) as prior_effort_sets
       FROM users u
       INNER JOIN workout_sessions ws
         ON ws.user_id = u.id AND ws.is_completed = 1 ${priorSessionWindow.sql}
       LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
       WHERE 1=1 ${house.sql}
       GROUP BY u.id`,
      [...priorSessionWindow.params, ...house.params]
    );
    for (const row of prior.rows as {
      id: number;
      prior_weight_sum: number;
      prior_reps_sum: number;
      prior_raw_volume: number;
      prior_effort_sets: number;
    }[]) {
      priorByUser.set(Number(row.id), {
        prior_weight_sum: Number(row.prior_weight_sum || 0),
        prior_reps_sum: Number(row.prior_reps_sum || 0),
        prior_raw_volume: Number(row.prior_raw_volume || 0),
        prior_effort_sets: Number(row.prior_effort_sets || 0),
      });
    }
  }

  const [lockedByUser, lastByUser, best, effortBest, badges] = await Promise.all([
    lockedWeeksByUser(),
    lastWorkoutByUser(),
    query(
      `SELECT user_id, MAX(session_volume) as best_session
       FROM (
         SELECT
           ws.user_id,
           COALESCE(SUM(${sqlSetVolume('es')}), 0) + ${sqlSessionOptionalVolume('ws')} as session_volume
         FROM workout_sessions ws
         LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
         WHERE ws.is_completed = 1 ${sessionWindow.sql}
         GROUP BY ws.user_id, ws.id
       ) session_totals
       GROUP BY user_id`,
      [...sessionWindow.params]
    ),
    query(
      `SELECT user_id, MAX(session_volume) as best_session
       FROM (
         SELECT
           ws.user_id,
           COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) + ${sqlSessionOptionalVolume('ws')} as session_volume
         FROM workout_sessions ws
         LEFT JOIN exercise_sets es ON es.workout_session_id = ws.id AND es.is_completed = 1
         WHERE ws.is_completed = 1 ${sessionWindow.sql}
         GROUP BY ws.user_id, ws.id
       ) session_totals
       GROUP BY user_id`,
      [...sessionWindow.params]
    ),
    query(
      `SELECT user_id, COUNT(*) as badges
       FROM user_badges ub
       WHERE 1=1 ${badgeWindow.sql}
       GROUP BY user_id`,
      [...badgeWindow.params]
    ),
  ]);

  const bestByUser = new Map<number, number>();
  for (const row of best.rows as { user_id: number; best_session: number }[]) {
    bestByUser.set(Number(row.user_id), Number(row.best_session || 0));
  }

  const effortBestByUser = new Map<number, number>();
  for (const row of effortBest.rows as { user_id: number; best_session: number }[]) {
    effortBestByUser.set(Number(row.user_id), Number(row.best_session || 0));
  }

  const badgesByUser = new Map<number, number>();
  for (const row of badges.rows as { user_id: number; badges: number }[]) {
    badgesByUser.set(Number(row.user_id), Number(row.badges || 0));
  }

  return rows
    .map((row) =>
      toScoreboardRow(
        { ...row, ...priorByUser.get(Number(row.id)) },
        lastByUser,
        bestByUser,
        effortBestByUser,
        badgesByUser,
        lockedByUser
      )
    )
    .sort(
      (a, b) =>
        b.workouts - a.workouts ||
        b.volume - a.volume ||
        b.bestSessionVolume - a.bestSessionVolume ||
        b.heaviest - a.heaviest ||
        a.name.localeCompare(b.name) ||
        a.id - b.id
    );
}

export async function householdScoreboard(
  period: ScoreboardPeriod,
  householdId?: number | null
): Promise<HouseholdScoreboardRow[]> {
  return householdScoreboardFiltered(
    periodFilter(period, 'COALESCE(ws.completed_at, ws.started_at, ws.created_at)'),
    periodFilter(period, 'COALESCE(optws.completed_at, optws.started_at, optws.created_at)'),
    periodFilter(period, 'ub.earned_at'),
    priorPeriodFilter(period, 'COALESCE(ws.completed_at, ws.started_at, ws.created_at)'),
    householdId
  );
}

export async function householdScoreboardForPerformance(
  period: PerformancePeriod,
  householdId?: number | null
): Promise<HouseholdScoreboardRow[]> {
  const window = performancePeriodWindow(normalizePerformancePeriod(period));
  const prior = priorPeriodWindow(window);
  return householdScoreboardFiltered(
    sqlPeriodWindow('COALESCE(ws.completed_at, ws.started_at, ws.created_at)', window),
    sqlPeriodWindow('COALESCE(optws.completed_at, optws.started_at, optws.created_at)', window),
    sqlPeriodWindow('ub.earned_at', window),
    prior ? sqlPeriodWindow('COALESCE(ws.completed_at, ws.started_at, ws.created_at)', prior) : null,
    householdId
  );
}

export async function emptySnapshotRow(
  userId: number,
  name: string,
  period: PerformancePeriod
): Promise<HouseholdScoreboardRow> {
  const window = performancePeriodWindow(normalizePerformancePeriod(period));
  const badgeWindow = sqlPeriodWindow('ub.earned_at', window);
  const [lockedByUser, lastByUser, badges] = await Promise.all([
    lockedWeeksByUser(),
    lastWorkoutByUser(),
    query(
      `SELECT COUNT(*) as badges FROM user_badges ub WHERE ub.user_id = ?${badgeWindow.sql}`,
      [userId, ...badgeWindow.params]
    ),
  ]);
  const belt = displayBelt(lockedByUser.get(userId) || 0);
  const lastRow = lastByUser.get(userId);
  return {
    id: userId,
    name,
    workouts: 0,
    volume: 0,
    sets: 0,
    heaviest: 0,
    avgSeconds: null,
    bestSessionVolume: 0,
    badges: Number((badges.rows as { badges: number }[])[0]?.badges || 0),
    beltName: belt.name,
    beltFill: belt.fill,
    lastWorkout: lastRow ? `Week ${lastRow.week_number} · ${lastRow.workout_type}` : null,
    lastAt: lastRow?.completed_at || null,
    perception: null,
    effortVolume: 0,
    bestSessionEffort: 0,
    weightSum: 0,
    repsSum: 0,
    rawVolume: 0,
    effortSets: 0,
  };
}

export function snapshotFromRows(
  userId: number,
  _name: string,
  rows: HouseholdScoreboardRow[]
): PerformanceSnapshot | null {
  const index = rows.findIndex((row) => Number(row.id) === userId);
  if (index < 0) return null;
  return {
    row: rows[index],
    place: index + 1,
    line: tomScoreboardLine(rows[index], index, rows),
  };
}

export async function performanceSnapshot(
  userId: number,
  name: string,
  period: PerformancePeriod,
  householdId?: number | null
): Promise<PerformanceSnapshot> {
  const rows = await householdScoreboardForPerformance(period, householdId);
  return (
    snapshotFromRows(userId, name, rows) || {
      row: await emptySnapshotRow(userId, name, period),
      place: null,
      line: emptyWindowLine(name),
    }
  );
}

export async function householdBonusHonor(
  period: ScoreboardPeriod,
  householdId?: number | null
): Promise<BonusHonorRow[]> {
  const sessionWindow = periodFilter(
    period,
    'COALESCE(ws.completed_at, ws.started_at, ws.created_at)'
  );
  const house = sqlInHousehold('u.id', householdId);
  const result = await query(
    `SELECT
       u.id,
       u.name,
       COUNT(DISTINCT ws.week_number) as bonus_weeks
     FROM users u
     INNER JOIN workout_sessions ws
       ON ws.user_id = u.id AND ws.is_completed = 1 AND ${bonusTypeSql('ws')} ${sessionWindow.sql}
     WHERE ${SQL_EXCLUDE_TEST_USER} ${house.sql}
     GROUP BY u.id, u.name
     HAVING COUNT(DISTINCT ws.week_number) > 0
     ORDER BY bonus_weeks DESC, u.name ASC`,
    [...sessionWindow.params, ...house.params]
  );

  return (result.rows as { id: number; name: string; bonus_weeks: number }[]).map((row) => ({
    id: Number(row.id),
    name: row.name,
    bonusWeeks: Number(row.bonus_weeks || 0),
  }));
}

/** Per-athlete daily volume for the scoreboard chart. Test stays in the lines; avg drops Test in the chart. */
export async function householdWeightSeries(
  period: ScoreboardPeriod,
  householdId?: number | null
): Promise<ScoreboardDailyPoint[]> {
  const day = 'DATE(COALESCE(ws.completed_at, ws.created_at))';
  const dateWindow = periodFilter(period, day);
  const house = sqlInHousehold('u.id', householdId);
  const [sets, optionals] = await Promise.all([
    query(
      `SELECT ws.user_id, u.name, ${day} as workout_date,
              COALESCE(SUM(${sqlSetEffortVolume('es')}), 0) as weight
       FROM exercise_sets es
       INNER JOIN workout_sessions ws ON ws.id = es.workout_session_id
       INNER JOIN users u ON u.id = ws.user_id
       WHERE ws.is_completed = 1
         AND es.is_completed = 1
         ${dateWindow.sql} ${house.sql}
       GROUP BY ws.user_id, u.name, ${day}`,
      [...dateWindow.params, ...house.params]
    ),
    query(
      `SELECT ws.user_id, u.name, ${day} as workout_date,
              COALESCE(SUM(${sqlSessionOptionalVolume('ws')}), 0) as weight
       FROM workout_sessions ws
       INNER JOIN users u ON u.id = ws.user_id
       WHERE ws.is_completed = 1
         ${dateWindow.sql} ${house.sql}
       GROUP BY ws.user_id, u.name, ${day}`,
      [...dateWindow.params, ...house.params]
    ),
  ]);

  const map = new Map<string, ScoreboardDailyPoint>();
  for (const row of [
    ...(sets.rows as { user_id: number; name: string; workout_date: unknown; weight: number }[]),
    ...(optionals.rows as { user_id: number; name: string; workout_date: unknown; weight: number }[]),
  ]) {
    const workout_date = workoutDateKey(row.workout_date);
    const key = `${Number(row.user_id)}:${workout_date}`;
    const current = map.get(key);
    if (current) current.weight += Number(row.weight || 0);
    else {
      map.set(key, {
        userId: Number(row.user_id),
        name: row.name,
        workout_date,
        weight: Number(row.weight || 0),
      });
    }
  }

  return [...map.values()]
    .filter((row) => row.weight > 0)
    .sort((a, b) => a.workout_date.localeCompare(b.workout_date) || a.name.localeCompare(b.name));
}
