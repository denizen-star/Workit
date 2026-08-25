import { query } from '@/lib/db';
import { exerciseCanonicalName, exerciseHistoryKey } from '@/lib/exerciseKey';
import { setVolume } from '@/lib/exerciseKind';
import { DAY_TYPE_ORDER } from '@/lib/feedback';
import { parseHardness } from '@/lib/hardness';
import { bestLoggedSet, loadDelta, setDirection, tailHoldStreak } from '@/lib/setHistory';
import {
  pctChange,
  type AthletePerformanceBoard,
  type ExerciseTrend,
  type PerformancePeriod,
  type PerformanceSummary,
  type WorkoutExerciseTrend,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';

export type {
  AthletePerformanceBoard,
  ExerciseTrend,
  PerformancePeriod,
  PerformanceSummary,
  WorkoutExerciseTrend,
  WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
export {
  PERFORMANCE_PERIODS,
  isPerformancePeriod,
  performanceRangeLabel,
} from '@/lib/athletePerformanceTypes';

type SetRow = {
  exercise_name: string;
  set_number: number;
  target_reps: string | null;
  weight_lbs: number | string | null;
  actual_reps: number | string | null;
  hardness: number | string | null;
  session_id: number;
  week_number: number;
  day_number: number;
  workout_type: string;
  done_at: string | Date | null;
};

type LoggedSet = {
  weight_lbs: number | null;
  actual_reps: number | null;
  hardness: number | null;
  target_reps: string | null;
};

type SessionLift = {
  sessionId: number;
  workoutType: string;
  weekNumber: number;
  dayNumber: number;
  doneAt: string | null;
  weight: number;
  reps: number;
  volume: number;
  hardnessSum: number;
  hardnessCount: number;
};

const SPARK_CAP = 12;

function liftVolume(name: string, sets: LoggedSet[]) {
  return sets.reduce(
    (sum, set) => sum + setVolume(name, set.target_reps, set.weight_lbs, set.actual_reps),
    0
  );
}

function sparkSeries(history: { volume: number }[], endIndex: number) {
  const start = Math.max(0, endIndex + 1 - SPARK_CAP);
  return history.slice(start, endIndex + 1).map((item) => item.volume);
}

function volumeMetrics(
  history: { volume: number }[],
  endIndex: number,
  currentVolume: number,
  priorVolume: number | null
) {
  const spark = sparkSeries(history, endIndex);
  const firstVolume = spark.length ? spark[0] : null;
  return {
    currentVolume,
    priorVolume,
    volumeChangePct: pctChange(currentVolume, priorVolume),
    progressionPct: spark.length > 1 ? pctChange(currentVolume, firstVolume) : null,
    spark,
  };
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function periodStartMs(period: PerformancePeriod): number | null {
  if (period === 'all') return null;
  const days = period === '30' ? 30 : 15;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function inWindow(doneAt: string | null, startMs: number | null): boolean {
  if (startMs == null) return true;
  if (!doneAt) return false;
  const time = new Date(doneAt).getTime();
  return Number.isFinite(time) && time >= startMs;
}

function classify(current: { weight: number; reps: number }, prior: { weight: number; reps: number } | null) {
  if (!prior) {
    return {
      weightDelta: 'first' as const,
      repsDelta: 'first' as const,
      result: 'first' as const,
    };
  }
  const weightDelta = loadDelta(current.weight, prior.weight);
  const repsDelta = loadDelta(current.reps, prior.reps);
  const direction = setDirection(
    { weight_lbs: current.weight, actual_reps: current.reps },
    { weight_lbs: prior.weight, actual_reps: prior.reps }
  );
  let result: 'gain' | 'loss' | 'mixed' | 'held' = 'held';
  if (direction === 'up') result = 'gain';
  else if (direction === 'down') result = 'loss';
  else if (weightDelta === 'down' && repsDelta === 'up') result = 'mixed';
  else if (weightDelta === 'down') result = 'loss';
  return { weightDelta, repsDelta, result };
}

function workoutSort(a: WorkoutTrend, b: WorkoutTrend): number {
  const order = [...DAY_TYPE_ORDER, 'Bonus Upper'];
  const ai = order.indexOf(a.workoutType as (typeof order)[number]);
  const bi = order.indexOf(b.workoutType as (typeof order)[number]);
  const aRank = ai === -1 ? order.length : ai;
  const bRank = bi === -1 ? order.length : bi;
  if (aRank !== bRank) return aRank - bRank;
  return a.workoutType.localeCompare(b.workoutType);
}

function sessionVolume(session: { lifts: Map<string, { name: string; sets: LoggedSet[] }> }) {
  let total = 0;
  for (const lift of session.lifts.values()) {
    total += liftVolume(lift.name, lift.sets);
  }
  return total;
}

function sessionBestWeight(session: { lifts: Map<string, { name: string; sets: LoggedSet[] }> }) {
  let best = 0;
  for (const lift of session.lifts.values()) {
    const set = bestLoggedSet(lift.sets);
    best = Math.max(best, set?.weight_lbs ?? 0);
  }
  return best;
}

function volumeResult(current: number, prior: number | null): WorkoutTrend['result'] {
  if (prior == null) return 'first';
  if (current > prior) return 'gain';
  if (current < prior) return 'loss';
  return 'held';
}

function avg(sum: number, count: number): number | null {
  if (count <= 0) return null;
  return Math.round((sum / count) * 10) / 10;
}

export async function athletePerformance(
  userId: number,
  period: PerformancePeriod
): Promise<AthletePerformanceBoard> {
  const sessionCols = `ws.id as session_id, ws.week_number, ws.day_number, ws.workout_type,
            COALESCE(ws.completed_at, ws.created_at) as done_at`;
  const fromWhere = `FROM exercise_sets es
     JOIN workout_sessions ws ON ws.id = es.workout_session_id
     WHERE ws.user_id = ? AND es.is_completed = 1 AND ws.is_completed = 1
     ORDER BY done_at ASC, ws.id ASC, es.set_number ASC`;

  let rows: SetRow[] = [];
  try {
    const result = await query(
      `SELECT es.exercise_name, es.set_number, es.target_reps, es.weight_lbs, es.actual_reps, es.hardness,
              ${sessionCols}
       ${fromWhere}`,
      [userId]
    );
    rows = result.rows as SetRow[];
  } catch {
    const result = await query(
      `SELECT es.exercise_name, es.set_number, es.target_reps, es.weight_lbs, es.actual_reps,
              ${sessionCols}
       ${fromWhere}`,
      [userId]
    );
    rows = (result.rows as SetRow[]).map((row) => ({ ...row, hardness: null }));
  }
  const startMs = periodStartMs(period);

  type SessionBucket = {
    sessionId: number;
    workoutType: string;
    weekNumber: number;
    dayNumber: number;
    doneAt: string | null;
    lifts: Map<string, { name: string; sets: LoggedSet[] }>;
  };

  const sessions = new Map<number, SessionBucket>();
  for (const row of rows) {
    const sessionId = Number(row.session_id);
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        workoutType: String(row.workout_type || 'Workout'),
        weekNumber: Number(row.week_number || 0),
        dayNumber: Number(row.day_number || 0),
        doneAt: isoDate(row.done_at),
        lifts: new Map(),
      };
      sessions.set(sessionId, session);
    }
    const key = exerciseHistoryKey(row.exercise_name);
    let lift = session.lifts.get(key);
    if (!lift) {
      lift = { name: exerciseCanonicalName(row.exercise_name), sets: [] };
      session.lifts.set(key, lift);
    }
    lift.sets.push({
      weight_lbs: row.weight_lbs == null ? null : toNumber(row.weight_lbs),
      actual_reps: row.actual_reps == null ? null : toNumber(row.actual_reps),
      hardness: parseHardness(row.hardness),
      target_reps: row.target_reps == null ? null : String(row.target_reps),
    });
  }

  const byExercise = new Map<string, { name: string; history: SessionLift[] }>();
  const orderedSessions = [...sessions.values()].sort((a, b) => {
    const at = a.doneAt ? new Date(a.doneAt).getTime() : 0;
    const bt = b.doneAt ? new Date(b.doneAt).getTime() : 0;
    return at - bt || a.sessionId - b.sessionId;
  });

  for (const session of orderedSessions) {
    for (const [key, lift] of session.lifts) {
      const best = bestLoggedSet(lift.sets);
      if (!best) continue;
      let row = byExercise.get(key);
      if (!row) {
        row = { name: lift.name, history: [] };
        byExercise.set(key, row);
      }
      const hardnessValues = lift.sets.map((set) => set.hardness).filter((value): value is number => value != null);
      row.history.push({
        sessionId: session.sessionId,
        workoutType: session.workoutType,
        weekNumber: session.weekNumber,
        dayNumber: session.dayNumber,
        doneAt: session.doneAt,
        weight: best.weight_lbs ?? 0,
        reps: best.actual_reps ?? 0,
        volume: liftVolume(lift.name, lift.sets),
        hardnessSum: hardnessValues.reduce((sum, value) => sum + value, 0),
        hardnessCount: hardnessValues.length,
      });
    }
  }

  const exercises: ExerciseTrend[] = [];
  let perceptionSum = 0;
  let perceptionCount = 0;

  for (const [key, row] of byExercise) {
    const windowHistory = row.history.filter((item) => inWindow(item.doneAt, startMs));
    if (!windowHistory.length) continue;

    const current = windowHistory[windowHistory.length - 1];
    const currentIndex = row.history.findIndex((item) => item.sessionId === current.sessionId);
    const prior = currentIndex > 0 ? row.history[currentIndex - 1] : null;
    const classified = classify(
      { weight: current.weight, reps: current.reps },
      prior ? { weight: prior.weight, reps: prior.reps } : null
    );
    const volumes = row.history.slice(0, currentIndex + 1);
    const weights = volumes.map((item) => item.weight);
    const reps = volumes.map((item) => item.reps);
    const volume = volumeMetrics(
      volumes,
      currentIndex,
      current.volume,
      prior ? prior.volume : null
    );
    const windowPerceptionSum = windowHistory.reduce((sum, item) => sum + item.hardnessSum, 0);
    const windowPerceptionCount = windowHistory.reduce((sum, item) => sum + item.hardnessCount, 0);
    perceptionSum += windowPerceptionSum;
    perceptionCount += windowPerceptionCount;

    exercises.push({
      key,
      name: row.name,
      currentWeight: current.weight,
      currentReps: current.reps,
      currentVolume: volume.currentVolume,
      priorWeight: prior ? prior.weight : null,
      priorReps: prior ? prior.reps : null,
      priorVolume: volume.priorVolume,
      weightChangePct: pctChange(current.weight, prior ? prior.weight : null),
      volumeChangePct: volume.volumeChangePct,
      progressionPct: volume.progressionPct,
      spark: volume.spark,
      weightDelta: classified.weightDelta,
      repsDelta: classified.repsDelta,
      result: classified.result,
      weightStreak: tailHoldStreak(weights),
      repsStreak: tailHoldStreak(reps),
      perception: avg(windowPerceptionSum, windowPerceptionCount),
      perceptionCount: windowPerceptionCount,
      currentDate: current.doneAt,
      priorDate: prior?.doneAt ?? null,
    });
  }

  exercises.sort((a, b) => {
    const rank = { gain: 0, loss: 1, mixed: 2, held: 3, first: 4 };
    if (rank[a.result] !== rank[b.result]) return rank[a.result] - rank[b.result];
    return a.name.localeCompare(b.name);
  });

  const byWorkout = new Map<string, SessionBucket[]>();
  for (const session of orderedSessions) {
    const list = byWorkout.get(session.workoutType) || [];
    list.push(session);
    byWorkout.set(session.workoutType, list);
  }

  const workouts: WorkoutTrend[] = [];
  for (const [workoutType, history] of byWorkout) {
    const windowSessions = history.filter((session) => inWindow(session.doneAt, startMs));
    if (!windowSessions.length) continue;
    const current = windowSessions[windowSessions.length - 1];
    const currentIndex = history.findIndex((session) => session.sessionId === current.sessionId);
    const prior = currentIndex > 0 ? history[currentIndex - 1] : null;

    const keys = new Set<string>([...current.lifts.keys(), ...(prior ? prior.lifts.keys() : [])]);
    const workoutExercises: WorkoutExerciseTrend[] = [];
    for (const key of keys) {
      const currentLift = current.lifts.get(key);
      if (!currentLift) continue;
      const currentBest = bestLoggedSet(currentLift.sets);
      if (!currentBest) continue;

      const liftHistory = history
        .map((session) => {
          const lift = session.lifts.get(key);
          if (!lift) return null;
          const best = bestLoggedSet(lift.sets);
          if (!best) return null;
          return {
            sessionId: session.sessionId,
            weight: best.weight_lbs ?? 0,
            reps: best.actual_reps ?? 0,
            volume: liftVolume(lift.name, lift.sets),
          };
        })
        .filter((item): item is { sessionId: number; weight: number; reps: number; volume: number } => item != null);

      const liftIndex = liftHistory.findIndex((item) => item.sessionId === current.sessionId);
      if (liftIndex < 0) continue;
      const liftCurrent = liftHistory[liftIndex];
      const liftPrior = liftIndex > 0 ? liftHistory[liftIndex - 1] : null;
      const classified = classify(
        { weight: liftCurrent.weight, reps: liftCurrent.reps },
        liftPrior ? { weight: liftPrior.weight, reps: liftPrior.reps } : null
      );
      const volume = volumeMetrics(
        liftHistory,
        liftIndex,
        liftCurrent.volume,
        liftPrior ? liftPrior.volume : null
      );
      const hardnessValues = currentLift.sets
        .map((set) => set.hardness)
        .filter((value): value is number => value != null);
      workoutExercises.push({
        name: currentLift.name,
        currentWeight: liftCurrent.weight,
        currentReps: liftCurrent.reps,
        currentVolume: volume.currentVolume,
        priorWeight: liftPrior ? liftPrior.weight : null,
        priorReps: liftPrior ? liftPrior.reps : null,
        priorVolume: volume.priorVolume,
        weightChangePct: pctChange(liftCurrent.weight, liftPrior ? liftPrior.weight : null),
        volumeChangePct: volume.volumeChangePct,
        progressionPct: volume.progressionPct,
        spark: volume.spark,
        result: classified.result,
        perception: avg(
          hardnessValues.reduce((sum, value) => sum + value, 0),
          hardnessValues.length
        ),
      });
    }
    workoutExercises.sort((a, b) => a.name.localeCompare(b.name));

    const sessionVolumes = history.map((session) => ({ volume: sessionVolume(session) }));
    const currentVol = sessionVolume(current);
    const priorVol = prior ? sessionVolume(prior) : null;
    const volume = volumeMetrics(sessionVolumes, currentIndex, currentVol, priorVol);
    const currentWeight = sessionBestWeight(current);
    const priorWeight = prior ? sessionBestWeight(prior) : null;

    workouts.push({
      name: workoutType,
      workoutType,
      currentWeight,
      currentVolume: volume.currentVolume,
      priorWeight,
      priorVolume: volume.priorVolume,
      weightChangePct: pctChange(currentWeight, priorWeight),
      volumeChangePct: volume.volumeChangePct,
      progressionPct: volume.progressionPct,
      spark: volume.spark,
      result: volumeResult(currentVol, priorVol),
      perception: avg(
        workoutExercises.reduce((sum, item) => sum + (item.perception || 0), 0),
        workoutExercises.filter((item) => item.perception != null).length
      ),
      currentDate: current.doneAt,
      priorDate: prior?.doneAt ?? null,
      weekNumber: current.weekNumber || null,
      gains: workoutExercises.filter((item) => item.result === 'gain').length,
      losses: workoutExercises.filter((item) => item.result === 'loss').length,
      exercises: workoutExercises,
    });
  }

  workouts.sort(workoutSort);

  const summary: PerformanceSummary = {
    gains: exercises.filter((item) => item.result === 'gain').length,
    losses: exercises.filter((item) => item.result === 'loss').length,
    mixed: exercises.filter((item) => item.result === 'mixed').length,
    held: exercises.filter((item) => item.result === 'held').length,
    first: exercises.filter((item) => item.result === 'first').length,
    weightClimbing: exercises.filter((item) => item.weightDelta === 'up').length,
    weightDropping: exercises.filter((item) => item.weightDelta === 'down').length,
    repsClimbing: exercises.filter((item) => item.repsDelta === 'up').length,
    repsDropping: exercises.filter((item) => item.repsDelta === 'down').length,
    perception: avg(perceptionSum, perceptionCount),
    perceptionCount,
  };

  return { period, summary, exercises, workouts };
}
