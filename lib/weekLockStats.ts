import { formatCompact, formatPct, pctChange, type WorkoutTrend } from '@/lib/athletePerformanceTypes';

export function shortWorkoutType(name: string) {
  return name.replace(' Body ', ' ');
}

function sameWorkout(left: string, right: string) {
  return shortWorkoutType(left) === shortWorkoutType(right);
}

function latestOther(workouts: WorkoutTrend[], weekNumber: number, dayName: string) {
  const others = workouts.filter(
    (row) => sameWorkout(row.workoutType, dayName) && Number(row.weekNumber) !== weekNumber
  );
  others.sort((left, right) => String(right.currentDate || '').localeCompare(String(left.currentDate || '')));
  return others[0] || null;
}

export type DayVolumeStats = {
  volume: number | null;
  lastVolume: number | null;
  pct: number | null;
  volumeLabel: string;
  lastLabel: string;
};

/** This program week if logged; otherwise last time that day ran in the board window. */
export function dayVolumeStats(
  workouts: WorkoutTrend[],
  weekNumber: number,
  dayName: string,
  done: boolean
): DayVolumeStats {
  const thisWeek =
    workouts.find(
      (row) => Number(row.weekNumber) === weekNumber && sameWorkout(row.workoutType, dayName)
    ) || null;
  const lastFromWeek = thisWeek?.priorVolume ?? null;
  const lastFromHistory = latestOther(workouts, weekNumber, dayName)?.currentVolume ?? null;
  const lastVolume = lastFromWeek != null ? lastFromWeek : lastFromHistory;
  const volume = done ? thisWeek?.currentVolume ?? null : null;
  return {
    volume,
    lastVolume,
    pct: volume != null ? pctChange(volume, lastVolume) : null,
    volumeLabel: volume != null ? formatCompact(volume) : '—',
    lastLabel: lastVolume != null ? `last ${formatCompact(lastVolume)}` : '—',
  };
}

export function weekDoneVolume(workouts: WorkoutTrend[], weekNumber: number, dayNames: string[]) {
  let total = 0;
  let any = false;
  for (const name of dayNames) {
    const row = workouts.find(
      (item) => Number(item.weekNumber) === weekNumber && sameWorkout(item.workoutType, name)
    );
    if (row) {
      total += row.currentVolume;
      any = true;
    }
  }
  return any ? formatCompact(total) : null;
}

export function dayPctLabel(pct: number | null) {
  if (pct == null) return null;
  return `${formatPct(pct)} vs last`;
}
