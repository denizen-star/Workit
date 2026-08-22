import { query } from '@/lib/db';

export type HouseholdHomeStats = {
  workoutsCompleted: number;
  currentStreak: number;
  totalWeightLifted: number;
  badgesEarned: number;
  lastWorkoutSeconds: number | null;
  avgSeconds: number | null;
  maxSeconds: number | null;
  totalSeconds: number | null;
  daily: { workout_date: string; avg_weight: number }[];
  weekly: { week_number: number; avg_completed_days: number }[];
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function workoutDateKey(value: unknown): string {
  if (typeof value === 'string' && value) {
    return value.slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value || '').slice(0, 10);
}

export function countCurrentStreak(workoutDates: unknown[]): number {
  if (workoutDates.length === 0) return 0;

  const dates = workoutDates.map((value) => new Date(value as string | Date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    date.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (date.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
}

function placeholders(ids: number[]) {
  return {
    sql: ids.map(() => '?').join(', '),
    params: ids,
  };
}

export async function householdHomeStats(
  userId: number,
  athleteDailyDates: unknown[]
): Promise<HouseholdHomeStats | null> {
  const active = await query(
    `SELECT DISTINCT ws.user_id as id
     FROM workout_sessions ws
     WHERE ws.is_completed = 1
       AND ws.user_id != ?
       AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`,
    [userId]
  );

  const ids = (active.rows as { id: number }[])
    .map((row) => Number(row.id))
    .filter((id) => id > 0);
  if (ids.length === 0) return null;

  const { sql, params } = placeholders(ids);
  const dailyDates = athleteDailyDates.map(workoutDateKey).filter(Boolean);

  const [overall, timing, lastSessions, badges, weekly, streakDates, daily] = await Promise.all([
    query(
      `SELECT
         ws.user_id,
         COUNT(DISTINCT CASE WHEN ws.is_completed THEN ws.id END) as completed_workouts,
         COALESCE(SUM(CASE WHEN es.weight_lbs IS NOT NULL AND es.actual_reps IS NOT NULL
           THEN es.weight_lbs * es.actual_reps ELSE 0 END), 0) as total_weight_lifted
       FROM workout_sessions ws
       LEFT JOIN exercise_sets es ON ws.id = es.workout_session_id
       WHERE ws.user_id IN (${sql})
       GROUP BY ws.user_id`,
      params
    ),
    query(
      `SELECT
         user_id,
         AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_seconds,
         MAX(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as max_seconds,
         SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds
       FROM workout_sessions
       WHERE user_id IN (${sql})
         AND is_completed = 1
         AND started_at IS NOT NULL
         AND ended_at IS NOT NULL
       GROUP BY user_id`,
      params
    ),
    query(
      `SELECT TIMESTAMPDIFF(SECOND, ws.started_at, ws.ended_at) as duration_seconds
       FROM workout_sessions ws
       INNER JOIN (
         SELECT user_id, MAX(ended_at) as last_ended
         FROM workout_sessions
         WHERE user_id IN (${sql})
           AND is_completed = 1
           AND started_at IS NOT NULL
           AND ended_at IS NOT NULL
         GROUP BY user_id
       ) latest ON latest.user_id = ws.user_id AND ws.ended_at = latest.last_ended
       WHERE ws.is_completed = 1
         AND ws.started_at IS NOT NULL
         AND ws.ended_at IS NOT NULL`,
      params
    ),
    query(
      `SELECT user_id, COUNT(*) as badges
       FROM user_badges
       WHERE user_id IN (${sql})
       GROUP BY user_id`,
      params
    ),
    query(
      `SELECT user_id, week_number, COUNT(CASE WHEN is_completed THEN 1 END) as completed_days
       FROM workout_sessions
       WHERE user_id IN (${sql})
       GROUP BY user_id, week_number`,
      params
    ),
    query(
      `SELECT user_id, workout_date
       FROM daily_stats
       WHERE user_id IN (${sql})
         AND total_exercises_completed > 0
       ORDER BY user_id, workout_date DESC`,
      params
    ),
    dailyDates.length > 0
      ? query(
          `SELECT workout_date, AVG(total_weight_lifted) as avg_weight
           FROM daily_stats
           WHERE user_id IN (${sql})
             AND total_weight_lifted > 0
             AND workout_date IN (${dailyDates.map(() => '?').join(', ')})
           GROUP BY workout_date`,
          [...params, ...dailyDates]
        )
      : Promise.resolve({ rows: [] as { workout_date: unknown; avg_weight: number }[] }),
  ]);

  const overallRows = overall.rows as {
    completed_workouts: number;
    total_weight_lifted: number;
  }[];
  const timingRows = timing.rows as {
    avg_seconds: number | null;
    max_seconds: number | null;
    total_seconds: number | null;
  }[];

  const badgesByUser = new Map<number, number>();
  for (const row of badges.rows as { user_id: number; badges: number }[]) {
    badgesByUser.set(Number(row.user_id), Number(row.badges || 0));
  }

  const datesByUser = new Map<number, unknown[]>();
  for (const row of streakDates.rows as { user_id: number; workout_date: unknown }[]) {
    const id = Number(row.user_id);
    const list = datesByUser.get(id) || [];
    list.push(row.workout_date);
    datesByUser.set(id, list);
  }

  const completedByUserWeek = new Map<string, number>();
  for (const row of weekly.rows as { user_id: number; week_number: number; completed_days: number }[]) {
    completedByUserWeek.set(
      `${Number(row.user_id)}-${Number(row.week_number)}`,
      Number(row.completed_days || 0)
    );
  }

  const maxValues = timingRows
    .map((row) => (row.max_seconds == null ? null : Number(row.max_seconds)))
    .filter((value): value is number => value != null);

  return {
    workoutsCompleted: mean(overallRows.map((row) => Number(row.completed_workouts || 0))) ?? 0,
    currentStreak: mean(ids.map((id) => countCurrentStreak(datesByUser.get(id) || []))) ?? 0,
    totalWeightLifted: mean(overallRows.map((row) => Number(row.total_weight_lifted || 0))) ?? 0,
    badgesEarned: mean(ids.map((id) => badgesByUser.get(id) || 0)) ?? 0,
    lastWorkoutSeconds: mean(
      (lastSessions.rows as { duration_seconds: number | null }[])
        .map((row) => (row.duration_seconds == null ? null : Number(row.duration_seconds)))
        .filter((value): value is number => value != null)
    ),
    avgSeconds: mean(
      timingRows
        .map((row) => (row.avg_seconds == null ? null : Number(row.avg_seconds)))
        .filter((value): value is number => value != null)
    ),
    maxSeconds: maxValues.length ? Math.max(...maxValues) : null,
    totalSeconds: mean(
      timingRows
        .map((row) => (row.total_seconds == null ? null : Number(row.total_seconds)))
        .filter((value): value is number => value != null)
    ),
    daily: (daily.rows as { workout_date: unknown; avg_weight: number }[]).map((row) => ({
      workout_date: workoutDateKey(row.workout_date),
      avg_weight: Number(row.avg_weight || 0),
    })),
    weekly: [1, 2, 3, 4, 5, 6].map((week_number) => ({
      week_number,
      avg_completed_days:
        ids.reduce((sum, id) => sum + (completedByUserWeek.get(`${id}-${week_number}`) || 0), 0) /
        ids.length,
    })),
  };
}
