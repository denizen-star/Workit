import type {
  AthletePerformanceBoard,
  PerformanceLine,
  WorkoutTrend,
} from '@/lib/athletePerformanceTypes';
import { pctChange } from '@/lib/athletePerformanceTypes';

export function boardSummaryLine(board: AthletePerformanceBoard): WorkoutTrend | null {
  if (!board.workouts.length) return null;
  const head = board.workouts[0];
  const currentWeight = board.workouts.reduce((sum, row) => sum + row.currentWeight, 0);
  const currentVolume = board.workouts.reduce((sum, row) => sum + row.currentVolume, 0);
  const effortVolume = board.workouts.reduce((sum, row) => sum + row.effortVolume, 0);
  const currentReps = board.workouts.reduce((sum, row) => sum + row.currentReps, 0);
  const priorWeight = board.workouts.every((row) => row.priorWeight == null)
    ? null
    : board.workouts.reduce((sum, row) => sum + Number(row.priorWeight || 0), 0);
  const priorVolume = board.workouts.every((row) => row.priorVolume == null)
    ? null
    : board.workouts.reduce((sum, row) => sum + Number(row.priorVolume || 0), 0);
  const priorEffort = board.workouts.every((row) => row.priorEffortVolume == null)
    ? null
    : board.workouts.reduce((sum, row) => sum + Number(row.priorEffortVolume || 0), 0);
  const priorReps = board.workouts.every((row) => row.priorReps == null)
    ? null
    : board.workouts.reduce((sum, row) => sum + Number(row.priorReps || 0), 0);
  return {
    ...head,
    name: 'ITD',
    workoutType: 'ITD',
    currentWeight,
    currentVolume,
    effortVolume,
    currentReps,
    priorWeight,
    priorVolume,
    priorEffortVolume: priorEffort,
    priorReps,
    weightChangePct: pctChange(currentWeight, priorWeight),
    volumeChangePct: pctChange(effortVolume, priorEffort),
    rawVolumeChangePct: pctChange(currentVolume, priorVolume),
  };
}

export function latestWorkout(board: AthletePerformanceBoard): WorkoutTrend | null {
  return (
    [...board.workouts].sort((a, b) => {
      const at = a.currentDate ? new Date(a.currentDate).getTime() : 0;
      const bt = b.currentDate ? new Date(b.currentDate).getTime() : 0;
      return bt - at;
    })[0] || null
  );
}

export function liftStory(row: PerformanceLine) {
  const weight =
    row.priorWeight == null || row.priorWeight === row.currentWeight
      ? `${Math.round(row.currentWeight)} lb ${row.priorWeight == null ? '' : 'held'}`.trim()
      : `${Math.round(row.priorWeight)} → ${Math.round(row.currentWeight)} lb`;
  const currentReps = 'currentReps' in row ? Number((row as { currentReps?: number }).currentReps || 0) : null;
  const priorReps =
    'priorReps' in row && typeof (row as { priorReps?: number | null }).priorReps === 'number'
      ? (row as { priorReps: number }).priorReps
      : null;
  const reps =
    currentReps == null
      ? null
      : priorReps == null || priorReps === currentReps
        ? `reps ${Math.round(currentReps * 10) / 10}`
        : `reps ${Math.round(priorReps * 10) / 10} → ${Math.round(currentReps * 10) / 10}`;
  const volume =
    row.priorVolume == null
      ? `Volume ${Math.round(row.currentVolume).toLocaleString()}`
      : `Volume ${Math.round(row.priorVolume).toLocaleString()} → ${Math.round(row.currentVolume).toLocaleString()}`;
  return [weight, reps, volume].filter(Boolean).join(' · ');
}

export function volumePct(row: { rawVolumeChangePct?: number | null; volumeChangePct: number | null }) {
  return row.rawVolumeChangePct ?? row.volumeChangePct;
}

export function bestProgress<T extends PerformanceLine>(lifts: T[]) {
  return [...lifts]
    .filter((row) => volumePct(row) != null && (volumePct(row) || 0) > 0)
    .sort((a, b) => (volumePct(b) || 0) - (volumePct(a) || 0))[0];
}

export function heldOrFirst<T extends PerformanceLine>(lifts: T[]) {
  return lifts.find((row) => row.result === 'held' || row.result === 'first');
}

export function gainers(board: AthletePerformanceBoard) {
  return [...board.exercises]
    .filter((row) => row.result === 'gain')
    .sort((a, b) => (volumePct(b) || 0) - (volumePct(a) || 0));
}

export function losers(board: AthletePerformanceBoard) {
  return [...board.exercises]
    .filter((row) => row.result === 'loss')
    .sort((a, b) => (volumePct(a) || 0) - (volumePct(b) || 0));
}

export function hasPrior(row: { priorVolume?: number | null; priorWeight?: number | null }) {
  return row.priorVolume != null || row.priorWeight != null;
}

export function boardHasActivity(board: AthletePerformanceBoard) {
  return Boolean(board.window?.setCount || board.exercises.length || board.workouts.length);
}

export function heldLifts(board: AthletePerformanceBoard) {
  return board.exercises.filter(
    (row) => row.result === 'held' || row.result === 'first' || row.result === 'mixed'
  );
}

export function formatWhen(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function sessionMinutes(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds / 60));
}

export function sessionSrpe(stars: number | null | undefined, seconds: number | null | undefined) {
  const minutes = sessionMinutes(seconds);
  if (stars == null || minutes == null || !Number.isFinite(stars)) return null;
  return Math.round(stars * minutes);
}

export function lastSessionTitle(workout: WorkoutTrend) {
  const when = formatWhen(workout.currentDate);
  const minutes = sessionMinutes(workout.durationSeconds);
  const srpe = sessionSrpe(workout.sessionStars, workout.durationSeconds);
  return [when, minutes != null ? `${minutes} min` : null, srpe != null ? `sRPE ${srpe}` : null]
    .filter(Boolean)
    .join(' · ');
}

export function lastSessionSub(workout: WorkoutTrend) {
  const prior = formatWhen(workout.priorDate);
  const stars = workout.sessionStars;
  const minutes = sessionMinutes(workout.durationSeconds);
  const bits = [
    prior ? `Vs ${prior}` : null,
    stars != null && minutes != null ? `Session stars ${stars} × minutes.` : null,
  ].filter(Boolean);
  return bits.join('. ') || null;
}

/** This program week’s finished days vs last time those lifts ran. */
export function weekVsLast(board: AthletePerformanceBoard, weekNumber: number | null | undefined) {
  const week = weekNumber == null ? [] : board.workouts.filter((row) => Number(row.weekNumber) === weekNumber);
  const rows = week.length ? week : [];
  if (!rows.length) return null;
  const currentWeight = rows.reduce((sum, row) => sum + row.currentWeight, 0);
  const currentVolume = rows.reduce((sum, row) => sum + row.currentVolume, 0);
  const effortVolume = rows.reduce((sum, row) => sum + row.effortVolume, 0);
  const currentReps = rows.reduce((sum, row) => sum + row.currentReps, 0);
  const priorWeight = rows.every((row) => row.priorWeight == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorWeight || 0), 0);
  const priorVolume = rows.every((row) => row.priorVolume == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorVolume || 0), 0);
  const priorEffort = rows.every((row) => row.priorEffortVolume == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorEffortVolume || 0), 0);
  const priorReps = rows.every((row) => row.priorReps == null)
    ? null
    : rows.reduce((sum, row) => sum + Number(row.priorReps || 0), 0);
  const head = rows[0];
  return {
    ...head,
    name: 'This week',
    currentWeight,
    currentVolume,
    effortVolume,
    currentReps,
    priorWeight,
    priorVolume,
    priorEffortVolume: priorEffort,
    priorReps,
    weightChangePct: pctChange(currentWeight, priorWeight),
    volumeChangePct: pctChange(effortVolume, priorEffort),
    rawVolumeChangePct: pctChange(currentVolume, priorVolume),
  } satisfies WorkoutTrend;
}
