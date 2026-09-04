import { DAY_TYPE_ORDER } from '@/lib/feedback';
import { loadDelta, setDirection } from '@/lib/setHistory';
import {
  pctChange,
  type AthletePerformanceBoard,
  type ExerciseTrend,
  type PerformanceLine,
  type PerformancePeriod,
  type PerformanceResult,
  type PerformanceSummary,
  type WorkoutExerciseTrend,
  type WorkoutTrend,
} from '@/lib/athletePerformanceTypes';

function addNullable(left: number | null, right: number | null): number | null {
  if (left == null && right == null) return null;
  return (left ?? 0) + (right ?? 0);
}

function laterDate(left: string | null, right: string | null): string | null {
  if (!left) return right;
  if (!right) return left;
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

/** Align sparks from the latest session so combined volume reads as one series. */
function addSparks(left: number[], right: number[]): number[] {
  const length = Math.max(left.length, right.length);
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const leftValue = left[left.length - length + i] ?? 0;
    const rightValue = right[right.length - length + i] ?? 0;
    out.push(leftValue + rightValue);
  }
  return out;
}

function packResult(
  currentWeight: number,
  currentReps: number,
  priorWeight: number | null,
  priorReps: number | null,
  currentVolume: number,
  priorVolume: number | null
): PerformanceResult {
  if (priorWeight == null && priorVolume == null) return 'first';
  if (priorVolume != null && currentVolume > priorVolume) return 'gain';
  if (priorVolume != null && currentVolume < priorVolume) return 'loss';
  if (priorVolume != null) return 'held';
  const direction = setDirection(
    { weight_lbs: currentWeight, actual_reps: currentReps },
    priorWeight == null ? null : { weight_lbs: priorWeight, actual_reps: priorReps ?? 0 }
  );
  if (direction === 'up') return 'gain';
  if (direction === 'down') return 'loss';
  return 'held';
}

function mergePerception(
  left: { perception: number | null; count: number },
  right: { perception: number | null; count: number }
) {
  const count = left.count + right.count;
  const sum =
    (left.perception == null ? 0 : left.perception * left.count) +
    (right.perception == null ? 0 : right.perception * right.count);
  return {
    perception: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
    count,
  };
}

function mergeLineBase<T extends PerformanceLine>(left: T, right: T): T {
  const currentWeight = left.currentWeight + right.currentWeight;
  const currentVolume = left.currentVolume + right.currentVolume;
  const priorWeight = addNullable(left.priorWeight, right.priorWeight);
  const priorVolume = addNullable(left.priorVolume, right.priorVolume);
  const spark = addSparks(left.spark, right.spark);
  const sparkRaw = addSparks(left.sparkRaw || left.spark, right.sparkRaw || right.spark);
  const effortVolume = (left.effortVolume ?? left.currentVolume) + (right.effortVolume ?? right.currentVolume);
  const priorEffortVolume = addNullable(
    left.priorEffortVolume ?? left.priorVolume,
    right.priorEffortVolume ?? right.priorVolume
  );
  return {
    ...left,
    currentWeight,
    currentVolume,
    priorWeight,
    priorVolume,
    effortVolume,
    priorEffortVolume,
    weightChangePct: pctChange(currentWeight, priorWeight),
    volumeChangePct: pctChange(effortVolume, priorEffortVolume),
    progressionPct: spark.length > 1 ? pctChange(effortVolume, spark[0]) : null,
    rawVolumeChangePct: pctChange(currentVolume, priorVolume),
    rawProgressionPct: sparkRaw.length > 1 ? pctChange(currentVolume, sparkRaw[0]) : null,
    spark,
    sparkRaw,
    rawResult: packResult(
      currentWeight,
      0,
      priorWeight,
      0,
      currentVolume,
      priorVolume
    ),
  };
}

function mergeWorkoutExercise(left: WorkoutExerciseTrend, right: WorkoutExerciseTrend): WorkoutExerciseTrend {
  const merged = mergeLineBase(left, right);
  const currentReps = left.currentReps + right.currentReps;
  const priorReps = addNullable(left.priorReps, right.priorReps);
  const hard = mergePerception(
    { perception: left.perception, count: left.perception != null ? 1 : 0 },
    { perception: right.perception, count: right.perception != null ? 1 : 0 }
  );
  return {
    ...merged,
    currentReps,
    priorReps,
    perception: hard.perception,
    result: packResult(
      merged.currentWeight,
      currentReps,
      merged.priorWeight,
      priorReps,
      merged.effortVolume,
      merged.priorEffortVolume
    ),
  };
}

function mergeExercise(left: ExerciseTrend, right: ExerciseTrend): ExerciseTrend {
  const merged = mergeLineBase(left, right);
  const currentReps = left.currentReps + right.currentReps;
  const priorReps = addNullable(left.priorReps, right.priorReps);
  const hard = mergePerception(
    { perception: left.perception, count: left.perceptionCount },
    { perception: right.perception, count: right.perceptionCount }
  );
  return {
    ...merged,
    currentReps,
    priorReps,
    perception: hard.perception,
    perceptionCount: hard.count,
    currentDate: laterDate(left.currentDate, right.currentDate),
    priorDate: laterDate(left.priorDate, right.priorDate),
    weightDelta: merged.priorWeight == null ? 'first' : loadDelta(merged.currentWeight, merged.priorWeight),
    repsDelta: priorReps == null ? 'first' : loadDelta(currentReps, priorReps),
    weightStreak: 0,
    repsStreak: 0,
    result: packResult(
      merged.currentWeight,
      currentReps,
      merged.priorWeight,
      priorReps,
      merged.effortVolume,
      merged.priorEffortVolume
    ),
  };
}

function mergeWorkout(left: WorkoutTrend, right: WorkoutTrend): WorkoutTrend {
  const merged = mergeLineBase(left, right);
  const hard = mergePerception(
    { perception: left.perception, count: left.perception != null ? 1 : 0 },
    { perception: right.perception, count: right.perception != null ? 1 : 0 }
  );
  const byName = new Map<string, WorkoutExerciseTrend>();
  for (const row of [...left.exercises, ...right.exercises]) {
    const existing = byName.get(row.name);
    byName.set(row.name, existing ? mergeWorkoutExercise(existing, row) : row);
  }
  const exercises = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    ...merged,
    perception: hard.perception,
    currentDate: laterDate(left.currentDate, right.currentDate),
    priorDate: laterDate(left.priorDate, right.priorDate),
    weekNumber: laterDate(left.currentDate, right.currentDate) === right.currentDate ? right.weekNumber : left.weekNumber,
    gains: left.gains + right.gains,
    losses: left.losses + right.losses,
    result: packResult(
      merged.currentWeight,
      0,
      merged.priorWeight,
      0,
      merged.effortVolume,
      merged.priorEffortVolume
    ),
    exercises,
  };
}

function addSummary(left: PerformanceSummary, right: PerformanceSummary): PerformanceSummary {
  const hard = mergePerception(
    { perception: left.perception, count: left.perceptionCount },
    { perception: right.perception, count: right.perceptionCount }
  );
  return {
    gains: left.gains + right.gains,
    losses: left.losses + right.losses,
    mixed: left.mixed + right.mixed,
    held: left.held + right.held,
    first: left.first + right.first,
    weightClimbing: left.weightClimbing + right.weightClimbing,
    weightDropping: left.weightDropping + right.weightDropping,
    repsClimbing: left.repsClimbing + right.repsClimbing,
    repsDropping: left.repsDropping + right.repsDropping,
    perception: hard.perception,
    perceptionCount: hard.count,
  };
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

const EMPTY_SUMMARY: PerformanceSummary = {
  gains: 0,
  losses: 0,
  mixed: 0,
  held: 0,
  first: 0,
  weightClimbing: 0,
  weightDropping: 0,
  repsClimbing: 0,
  repsDropping: 0,
  perception: null,
  perceptionCount: 0,
};

/** Fold selected athlete boards into one card set. Empty list stays empty. */
export function mergeAthletePerformanceBoards(
  boards: AthletePerformanceBoard[],
  period: PerformancePeriod
): AthletePerformanceBoard | null {
  if (boards.length === 0) return null;
  if (boards.length === 1) return { ...boards[0], period };

  const exercises = new Map<string, ExerciseTrend>();
  const workouts = new Map<string, WorkoutTrend>();
  let summary = { ...EMPTY_SUMMARY };

  for (const board of boards) {
    summary = addSummary(summary, board.summary);
    for (const row of board.exercises) {
      const existing = exercises.get(row.key);
      exercises.set(row.key, existing ? mergeExercise(existing, row) : row);
    }
    for (const row of board.workouts) {
      const existing = workouts.get(row.workoutType);
      workouts.set(row.workoutType, existing ? mergeWorkout(existing, row) : row);
    }
  }

  const exerciseList = [...exercises.values()].sort((a, b) => {
    const rank = { gain: 0, loss: 1, mixed: 2, held: 3, first: 4 };
    if (rank[a.result] !== rank[b.result]) return rank[a.result] - rank[b.result];
    return a.name.localeCompare(b.name);
  });

  return {
    period,
    summary,
    exercises: exerciseList,
    workouts: [...workouts.values()].sort(workoutSort),
  };
}
