import { loadDelta } from '@/lib/setHistory';
import type { WorkoutTrend } from '@/lib/athletePerformanceTypes';

export type WeekKpiKey = 'loadUp' | 'repsUp' | 'loadDown' | 'repsDown';

export type WeekKpi = {
  key: WeekKpiKey;
  label: string;
  count: number;
  /** Earth green = good. Earth red = bad. Dashed = nothing to compare. */
  state: 'good' | 'bad' | 'open';
  status: string;
};

export type WeekPerformanceCounts = {
  compared: number;
  loadUp: number;
  repsUp: number;
  loadDown: number;
  repsDown: number;
};

/** This program week vs the last time they did those lifts. */
export function weekPerformanceCounts(
  workouts: WorkoutTrend[],
  weekNumber: number
): WeekPerformanceCounts {
  const thisWeek = workouts.filter((workout) => Number(workout.weekNumber) === weekNumber);
  const counts: WeekPerformanceCounts = {
    compared: 0,
    loadUp: 0,
    repsUp: 0,
    loadDown: 0,
    repsDown: 0,
  };

  for (const workout of thisWeek) {
    for (const lift of workout.exercises) {
      if (lift.priorWeight == null && lift.priorReps == null) continue;
      counts.compared += 1;
      const weight = loadDelta(lift.currentWeight, lift.priorWeight ?? 0);
      const reps = loadDelta(lift.currentReps, lift.priorReps ?? 0);
      if (weight === 'up') counts.loadUp += 1;
      if (weight === 'down') counts.loadDown += 1;
      if (reps === 'up') counts.repsUp += 1;
      if (reps === 'down') counts.repsDown += 1;
    }
  }

  return counts;
}

function moreState(count: number, compared: number): Pick<WeekKpi, 'state' | 'status'> {
  if (compared === 0) return { state: 'open', status: '—' };
  if (count > 0) return { state: 'good', status: String(count) };
  return { state: 'bad', status: '0' };
}

function lessState(count: number, compared: number): Pick<WeekKpi, 'state' | 'status'> {
  if (compared === 0) return { state: 'open', status: '—' };
  if (count === 0) return { state: 'good', status: '0' };
  return { state: 'bad', status: String(count) };
}

export function weekPerformanceKpis(counts: WeekPerformanceCounts): WeekKpi[] {
  return [
    { key: 'loadUp', label: 'More load', count: counts.loadUp, ...moreState(counts.loadUp, counts.compared) },
    { key: 'repsUp', label: 'More reps', count: counts.repsUp, ...moreState(counts.repsUp, counts.compared) },
    {
      key: 'loadDown',
      label: 'Less drop',
      count: counts.loadDown,
      ...lessState(counts.loadDown, counts.compared),
    },
    {
      key: 'repsDown',
      label: 'Less cut',
      count: counts.repsDown,
      ...lessState(counts.repsDown, counts.compared),
    },
  ];
}
