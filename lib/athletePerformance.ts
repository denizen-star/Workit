import { query } from '@/lib/db';
import { SQL_EXCLUDE_TEST_USER } from '@/lib/householdUsers';
import { exerciseCanonicalName, exerciseHistoryKey } from '@/lib/exerciseKey';
import { getExerciseKind, setVolume } from '@/lib/exerciseKind';
import { DAY_TYPE_ORDER } from '@/lib/feedback';
import { effortFromVolume, parseHardness } from '@/lib/hardness';
import { bestLoggedSet, loadDelta, setDirection, tailHoldStreak } from '@/lib/setHistory';
import {
  normalizePerformancePeriod,
  pctChange,
  type AthletePerformanceBoard,
  type ExerciseTrend,
  type HardMuscleRow,
  type PerformanceFlags,
  type PerformancePeriod,
  type PerformanceResult,
  type PerformanceSummary,
  type WorkoutExerciseTrend,
  type SetTrend,
  type WindowKpis,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
import { muscleGuess } from '@/lib/muscleGuess';
import { inPeriodWindow, performancePeriodWindow, priorPeriodWindow } from '@/lib/performancePeriod';
import { workoutDateKey } from '@/lib/statsHousehold';
import { performanceFlagsForSessions, type FlagSessionRow } from '@/lib/performanceFlags';
import {
  emptySnapshotRow,
  householdScoreboardForPerformance,
  performanceSnapshot,
  snapshotFromRows,
} from '@/lib/scoreboard';
import { emptyWindowLine, type PerformanceSnapshot } from '@/lib/scoreboardTypes';

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
  normalizePerformancePeriod,
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
  duration_seconds?: number | string | null;
  session_stars?: number | string | null;
};

type LoggedSet = {
  set_number: number;
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
  effort: number;
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

function liftEffort(name: string, sets: LoggedSet[]) {
  return sets.reduce((sum, set) => {
    const raw = setVolume(name, set.target_reps, set.weight_lbs, set.actual_reps);
    return sum + effortFromVolume(raw, set.hardness);
  }, 0);
}

function effortResult(current: number, prior: number | null): PerformanceResult {
  if (prior == null) return 'first';
  if (current > prior) return 'gain';
  if (current < prior) return 'loss';
  return 'held';
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

function inWindow(doneAt: string | null, period: PerformancePeriod): boolean {
  return inPeriodWindow(doneAt, performancePeriodWindow(period));
}

function isMechanicalSet(name: string, targetReps: string | null | undefined) {
  const kind = getExerciseKind(name, targetReps || '');
  return kind !== 'timed' && kind !== 'distance';
}

/** Sum every completed mechanical set in an Eastern window. Sparks are last 8 days. */
function tallyWindow(
  sessions: Array<{
    doneAt: string | null;
    lifts: Map<string, { name: string; sets: LoggedSet[] }>;
  }>,
  window: { startMs: number | null; endMs: number | null }
) {
  let setCount = 0;
  let weightSum = 0;
  let repSum = 0;
  let volume = 0;
  let effective = 0;
  const byDay = new Map<string, { weight: number; reps: number; volume: number; effective: number }>();
  const muscles = new Map<string, number>();

  for (const session of sessions) {
    if (!inPeriodWindow(session.doneAt, window)) continue;
    const day = session.doneAt ? workoutDateKey(session.doneAt) : '';
    for (const lift of session.lifts.values()) {
      for (const set of lift.sets) {
        if (!isMechanicalSet(lift.name, set.target_reps)) continue;
        const weight = set.weight_lbs ?? 0;
        const reps = set.actual_reps ?? 0;
        const vol = setVolume(lift.name, set.target_reps, set.weight_lbs, set.actual_reps);
        setCount += 1;
        weightSum += weight;
        repSum += reps;
        volume += vol;
        effective += effortFromVolume(vol, set.hardness);
        if (day) {
          const point = byDay.get(day) || { weight: 0, reps: 0, volume: 0, effective: 0 };
          point.weight += weight;
          point.reps += reps;
          point.volume += vol;
          point.effective += effortFromVolume(vol, set.hardness);
          byDay.set(day, point);
        }
        const hardness = parseHardness(set.hardness);
        if (hardness != null && hardness >= 4) {
          const name = muscleGuess(lift.name);
          muscles.set(name, (muscles.get(name) || 0) + 1);
        }
      }
    }
  }

  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
  return {
    setCount,
    weightSum,
    repSum,
    volume,
    effective,
    sparkWeight: days.map(([, point]) => point.weight),
    sparkReps: days.map(([, point]) => point.reps),
    sparkVolume: days.map(([, point]) => point.volume),
    sparkEffective: days.map(([, point]) => point.effective),
    muscles: [...muscles.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

function windowKpisForPeriod(
  sessions: Array<{
    doneAt: string | null;
    lifts: Map<string, { name: string; sets: LoggedSet[] }>;
  }>,
  period: PerformancePeriod
): { window: WindowKpis; hardMuscles: HardMuscleRow[] } {
  const currentWindow = performancePeriodWindow(period);
  const current = tallyWindow(sessions, currentWindow);
  const priorWin = priorPeriodWindow(currentWindow);
  const prior = priorWin ? tallyWindow(sessions, priorWin) : null;
  return {
    window: {
      setCount: current.setCount,
      weightSum: current.weightSum,
      repSum: current.repSum,
      volume: current.volume,
      effective: current.effective,
      priorSetCount: prior ? prior.setCount : null,
      priorWeightSum: prior ? prior.weightSum : null,
      priorRepSum: prior ? prior.repSum : null,
      priorVolume: prior ? prior.volume : null,
      priorEffective: prior ? prior.effective : null,
      sparkWeight: current.sparkWeight,
      sparkReps: current.sparkReps,
      sparkVolume: current.sparkVolume,
      sparkEffective: current.sparkEffective,
    },
    hardMuscles: current.muscles,
  };
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

function sessionEffort(session: { lifts: Map<string, { name: string; sets: LoggedSet[] }> }) {
  let total = 0;
  for (const lift of session.lifts.values()) {
    total += liftEffort(lift.name, lift.sets);
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
  rawPeriod: PerformancePeriod | string
): Promise<AthletePerformanceBoard> {
  const sessionCols = `ws.id as session_id, ws.week_number, ws.day_number, ws.workout_type,
            COALESCE(ws.completed_at, ws.created_at) as done_at,
            TIMESTAMPDIFF(SECOND, ws.started_at, COALESCE(ws.ended_at, ws.completed_at)) as duration_seconds,
            (SELECT MAX(sr.stars) FROM session_ratings sr WHERE sr.session_id = ws.id) as session_stars`;
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
  const period = normalizePerformancePeriod(rawPeriod);

  type SessionBucket = {
    sessionId: number;
    workoutType: string;
    weekNumber: number;
    dayNumber: number;
    doneAt: string | null;
    durationSeconds: number | null;
    sessionStars: number | null;
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
        durationSeconds: row.duration_seconds == null ? null : toNumber(row.duration_seconds) || null,
        sessionStars: row.session_stars == null ? null : toNumber(row.session_stars) || null,
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
      set_number: Number(row.set_number || lift.sets.length + 1),
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
        effort: liftEffort(lift.name, lift.sets),
        hardnessSum: hardnessValues.reduce((sum, value) => sum + value, 0),
        hardnessCount: hardnessValues.length,
      });
    }
  }

  const exercises: ExerciseTrend[] = [];
  let perceptionSum = 0;
  let perceptionCount = 0;

  for (const [key, row] of byExercise) {
    const windowHistory = row.history.filter((item) => inWindow(item.doneAt, period));
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
    const effortHistory = volumes.map((item) => ({ volume: item.effort }));
    const rawHistory = volumes.map((item) => ({ volume: item.volume }));
    const volume = volumeMetrics(
      effortHistory,
      currentIndex,
      current.effort,
      prior ? prior.effort : null
    );
    const raw = volumeMetrics(
      rawHistory,
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
      currentVolume: current.volume,
      priorWeight: prior ? prior.weight : null,
      priorReps: prior ? prior.reps : null,
      priorVolume: prior ? prior.volume : null,
      effortVolume: current.effort,
      priorEffortVolume: prior ? prior.effort : null,
      weightChangePct: pctChange(current.weight, prior ? prior.weight : null),
      volumeChangePct: volume.volumeChangePct,
      progressionPct: volume.progressionPct,
      rawVolumeChangePct: raw.volumeChangePct,
      rawProgressionPct: raw.progressionPct,
      spark: volume.spark,
      sparkRaw: raw.spark,
      sparkWeight: sparkSeries(
        volumes.map((item) => ({ volume: item.weight })),
        currentIndex
      ),
      sparkReps: sparkSeries(
        volumes.map((item) => ({ volume: item.reps })),
        currentIndex
      ),
      weightDelta: classified.weightDelta,
      repsDelta: classified.repsDelta,
      result: effortResult(current.effort, prior ? prior.effort : null),
      rawResult: effortResult(current.volume, prior ? prior.volume : null),
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
    const windowSessions = history.filter((session) => inWindow(session.doneAt, period));
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
            effort: liftEffort(lift.name, lift.sets),
          };
        })
        .filter(
          (
            item
          ): item is {
            sessionId: number;
            weight: number;
            reps: number;
            volume: number;
            effort: number;
          } => item != null
        );

      const liftIndex = liftHistory.findIndex((item) => item.sessionId === current.sessionId);
      if (liftIndex < 0) continue;
      const liftCurrent = liftHistory[liftIndex];
      const liftPrior = liftIndex > 0 ? liftHistory[liftIndex - 1] : null;
      const volume = volumeMetrics(
        liftHistory.map((item) => ({ volume: item.effort })),
        liftIndex,
        liftCurrent.effort,
        liftPrior ? liftPrior.effort : null
      );
      const raw = volumeMetrics(
        liftHistory.map((item) => ({ volume: item.volume })),
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
        currentVolume: liftCurrent.volume,
        priorWeight: liftPrior ? liftPrior.weight : null,
        priorReps: liftPrior ? liftPrior.reps : null,
        priorVolume: liftPrior ? liftPrior.volume : null,
        effortVolume: liftCurrent.effort,
        priorEffortVolume: liftPrior ? liftPrior.effort : null,
        weightChangePct: pctChange(liftCurrent.weight, liftPrior ? liftPrior.weight : null),
        volumeChangePct: volume.volumeChangePct,
        progressionPct: volume.progressionPct,
        rawVolumeChangePct: raw.volumeChangePct,
        rawProgressionPct: raw.progressionPct,
        spark: volume.spark,
        sparkRaw: raw.spark,
        sparkWeight: sparkSeries(
          liftHistory.map((item) => ({ volume: item.weight })),
          liftIndex
        ),
        sparkReps: sparkSeries(
          liftHistory.map((item) => ({ volume: item.reps })),
          liftIndex
        ),
        result: effortResult(liftCurrent.effort, liftPrior ? liftPrior.effort : null),
        rawResult: effortResult(liftCurrent.volume, liftPrior ? liftPrior.volume : null),
        perception: avg(
          hardnessValues.reduce((sum, value) => sum + value, 0),
          hardnessValues.length
        ),
      });
    }
    workoutExercises.sort((a, b) => a.name.localeCompare(b.name));

    const sessionEfforts = history.map((session) => ({ volume: sessionEffort(session) }));
    const currentVol = sessionVolume(current);
    const priorVol = prior ? sessionVolume(prior) : null;
    const currentEffort = sessionEffort(current);
    const priorEffort = prior ? sessionEffort(prior) : null;
    const volume = volumeMetrics(sessionEfforts, currentIndex, currentEffort, priorEffort);
    const sessionRaws = history.map((session) => ({ volume: sessionVolume(session) }));
    const raw = volumeMetrics(sessionRaws, currentIndex, currentVol, priorVol);
    const currentWeight = sessionBestWeight(current);
    const priorWeight = prior ? sessionBestWeight(prior) : null;
    const currentReps = workoutExercises.reduce((sum, item) => sum + item.currentReps, 0);
    const priorReps = prior
      ? workoutExercises.every((item) => item.priorReps == null)
        ? null
        : workoutExercises.reduce((sum, item) => sum + Number(item.priorReps || 0), 0)
      : null;

    workouts.push({
      name: workoutType,
      workoutType,
      currentWeight,
      currentReps,
      priorReps,
      currentVolume: currentVol,
      priorWeight,
      priorVolume: priorVol,
      effortVolume: currentEffort,
      priorEffortVolume: priorEffort,
      weightChangePct: pctChange(currentWeight, priorWeight),
      volumeChangePct: volume.volumeChangePct,
      progressionPct: volume.progressionPct,
      rawVolumeChangePct: raw.volumeChangePct,
      rawProgressionPct: raw.progressionPct,
      spark: volume.spark,
      sparkRaw: raw.spark,
      sparkWeight: sparkSeries(
        history.map((session) => ({ volume: sessionBestWeight(session) })),
        currentIndex
      ),
      sparkReps: sparkSeries(
        history.map((session) => ({
          volume: [...session.lifts.values()].reduce((sum, lift) => {
            const best = bestLoggedSet(lift.sets);
            return sum + (best?.actual_reps ?? 0);
          }, 0),
        })),
        currentIndex
      ),
      result: volumeResult(currentEffort, priorEffort),
      rawResult: volumeResult(currentVol, priorVol),
      perception: avg(
        workoutExercises.reduce((sum, item) => sum + (item.perception || 0), 0),
        workoutExercises.filter((item) => item.perception != null).length
      ),
      currentDate: current.doneAt,
      priorDate: prior?.doneAt ?? null,
      weekNumber: current.weekNumber || null,
      durationSeconds: current.durationSeconds,
      sessionStars: current.sessionStars,
      gains: workoutExercises.filter((item) => item.result === 'gain').length,
      losses: workoutExercises.filter((item) => item.result === 'loss').length,
      exercises: workoutExercises,
    });
  }

  workouts.sort(workoutSort);

  const sets: SetTrend[] = [];
  for (const [key, row] of byExercise) {
    const windowHistory = row.history.filter((item) => inWindow(item.doneAt, period));
    if (!windowHistory.length) continue;
    const currentLift = windowHistory[windowHistory.length - 1];
    const currentIndex = row.history.findIndex((item) => item.sessionId === currentLift.sessionId);
    const priorLift = currentIndex > 0 ? row.history[currentIndex - 1] : null;
    const currentSession = sessions.get(currentLift.sessionId);
    const priorSession = priorLift ? sessions.get(priorLift.sessionId) : undefined;
    const currentSets = currentSession?.lifts.get(key)?.sets || [];
    const priorSets = priorSession?.lifts.get(key)?.sets || [];
    currentSets.forEach((set, index) => {
      const priorSet =
        priorSets.find((item) => item.set_number === set.set_number) || priorSets[index] || null;
      const name = currentSession?.lifts.get(key)?.name || row.name;
      const weight = set.weight_lbs ?? 0;
      const reps = set.actual_reps ?? 0;
      const volume = setVolume(name, set.target_reps, set.weight_lbs, set.actual_reps);
      const effort = effortFromVolume(volume, set.hardness);
      const priorWeight = priorSet ? priorSet.weight_lbs ?? 0 : null;
      const priorReps = priorSet ? priorSet.actual_reps ?? 0 : null;
      const priorVolume = priorSet
        ? setVolume(name, priorSet.target_reps, priorSet.weight_lbs, priorSet.actual_reps)
        : null;
      const priorEffort = priorSet
        ? effortFromVolume(priorVolume || 0, priorSet.hardness)
        : null;
      sets.push({
        name: `${name} · set ${set.set_number}`,
        key: `${key}-${set.set_number}`,
        exerciseName: name,
        workoutType: currentLift.workoutType,
        setNumber: set.set_number,
        currentWeight: weight,
        currentReps: reps,
        currentVolume: volume,
        priorWeight,
        priorReps,
        priorVolume,
        effortVolume: effort,
        priorEffortVolume: priorEffort,
        weightChangePct: pctChange(weight, priorWeight),
        volumeChangePct: pctChange(effort, priorEffort),
        progressionPct: null,
        rawVolumeChangePct: pctChange(volume, priorVolume),
        rawProgressionPct: null,
        spark: priorEffort != null ? [priorEffort, effort] : [effort],
        sparkRaw: priorVolume != null ? [priorVolume, volume] : [volume],
        sparkWeight: priorWeight != null ? [priorWeight, weight] : [weight],
        sparkReps: priorReps != null ? [priorReps, reps] : [reps],
        result: volumeResult(effort, priorEffort),
        rawResult: volumeResult(volume, priorVolume),
        perception: set.hardness,
      });
    });
  }

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

  const { window, hardMuscles } = windowKpisForPeriod(orderedSessions, period);
  return { period, summary, exercises, workouts, sets, window, hardMuscles };
}

export type HouseholdPerformanceRow = AthletePerformanceBoard & {
  userId: number;
  name: string;
  flags: PerformanceFlags;
  snapshot?: PerformanceSnapshot;
};

async function loadFlagSessions(userId: number): Promise<FlagSessionRow[]> {
  const result = await query(
    `SELECT week_number, day_number, workout_type, is_completed, completed_at,
            warmup_completed_at, cooldown_completed_at
     FROM workout_sessions
     WHERE user_id = ?`,
    [userId]
  );
  return result.rows as FlagSessionRow[];
}

/** Admin Athletes: finished sessions, Test out. Performance filter: every profile, Test in. */
export async function householdAthletePerformance(
  period: PerformancePeriod,
  options?: { includeTest?: boolean }
): Promise<HouseholdPerformanceRow[]> {
  const resolved = normalizePerformancePeriod(period);
  const users = options?.includeTest
    ? await query('SELECT id, name FROM users ORDER BY name ASC, id ASC')
    : await query(
        `SELECT DISTINCT u.id, u.name
         FROM users u
         INNER JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = 1
         WHERE ${SQL_EXCLUDE_TEST_USER}
         ORDER BY u.name ASC`
      );

  const boardRows = users.rows as { id: number; name: string }[];
  let house: Awaited<ReturnType<typeof householdScoreboardForPerformance>> = [];
  try {
    house = await householdScoreboardForPerformance(resolved);
  } catch (error) {
    console.error('Error getting performance snapshots:', error);
  }

  return Promise.all(
    boardRows.map(async (row) => {
      const userId = Number(row.id);
      const [board, sessions] = await Promise.all([
        athletePerformance(userId, resolved),
        loadFlagSessions(userId),
      ]);
      let snapshot: PerformanceSnapshot | undefined;
      try {
        snapshot =
          snapshotFromRows(userId, row.name, house) || {
            row: await emptySnapshotRow(userId, row.name, resolved),
            place: null,
            line: emptyWindowLine(row.name),
          };
        if (snapshot) {
          snapshot = {
            ...snapshot,
            row: { ...snapshot.row, perception: board.summary.perception },
          };
        }
      } catch (error) {
        console.error('Error getting performance snapshot:', error);
      }
      return {
        ...board,
        userId,
        name: row.name,
        flags: performanceFlagsForSessions(sessions, resolved),
        snapshot,
      };
    })
  );
}

export async function athletePerformanceWithSnapshot(
  userId: number,
  name: string,
  rawPeriod: PerformancePeriod | string
) {
  const board = await athletePerformance(userId, rawPeriod);
  try {
    const snapshot = await performanceSnapshot(userId, name, normalizePerformancePeriod(rawPeriod));
    return {
      ...board,
      snapshot: {
        ...snapshot,
        row: { ...snapshot.row, perception: board.summary.perception },
      },
    };
  } catch (error) {
    console.error('Error getting performance snapshot:', error);
    return board;
  }
}
