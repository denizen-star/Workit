export const PERFORMANCE_PERIODS = ['t', 't-1', 't-7', 't-15', 't-30', 'all'] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

export function isPerformancePeriod(value: unknown): value is PerformancePeriod {
  return (
    value === 't' ||
    value === 't-1' ||
    value === 't-7' ||
    value === 't-15' ||
    value === 't-30' ||
    value === 'all'
  );
}

/** Map query strings (including legacy 15 / 30) onto a pill period. */
export function normalizePerformancePeriod(value: unknown): PerformancePeriod {
  if (value === '15') return 't-15';
  if (value === '30') return 't-30';
  if (isPerformancePeriod(value)) return value;
  return 't';
}

export function performanceRangeLabel(period: PerformancePeriod) {
  if (period === 't') return 'today';
  if (period === 't-1') return 'yesterday';
  if (period === 't-7') return 'last 7 days';
  if (period === 't-30') return 'last 30 days';
  if (period === 'all') return 'all time';
  return 'last 15 days';
}

export type PerformanceResult = 'gain' | 'loss' | 'mixed' | 'held' | 'first';

export type PerformanceLine = {
  name: string;
  currentWeight: number;
  currentVolume: number;
  priorWeight: number | null;
  priorVolume: number | null;
  weightChangePct: number | null;
  volumeChangePct: number | null;
  progressionPct: number | null;
  result: PerformanceResult;
  spark: number[];
  perception: number | null;
};

export type ExerciseTrend = PerformanceLine & {
  key: string;
  currentReps: number;
  priorReps: number | null;
  weightDelta: 'up' | 'down' | 'held' | 'first';
  repsDelta: 'up' | 'down' | 'held' | 'first';
  weightStreak: number;
  repsStreak: number;
  perceptionCount: number;
  currentDate: string | null;
  priorDate: string | null;
};

export type WorkoutExerciseTrend = PerformanceLine & {
  currentReps: number;
  priorReps: number | null;
};

export type WorkoutTrend = PerformanceLine & {
  workoutType: string;
  currentDate: string | null;
  priorDate: string | null;
  weekNumber: number | null;
  gains: number;
  losses: number;
  exercises: WorkoutExerciseTrend[];
};

export type PerformanceSummary = {
  gains: number;
  losses: number;
  mixed: number;
  held: number;
  first: number;
  weightClimbing: number;
  weightDropping: number;
  repsClimbing: number;
  repsDropping: number;
  perception: number | null;
  perceptionCount: number;
};

export type AthletePerformanceBoard = {
  period: PerformancePeriod;
  summary: PerformanceSummary;
  exercises: ExerciseTrend[];
  workouts: WorkoutTrend[];
  snapshot?: import('@/lib/scoreboardTypes').PerformanceSnapshot;
};

export type PerformanceFlags = {
  bonusDays: number;
  warmups: number;
  cooldowns: number;
  optionalWeeks: number;
};

export function emptyPerformanceFlags(): PerformanceFlags {
  return { bonusDays: 0, warmups: 0, cooldowns: 0, optionalWeeks: 0 };
}

export function addPerformanceFlags(left: PerformanceFlags, right: PerformanceFlags): PerformanceFlags {
  return {
    bonusDays: left.bonusDays + right.bonusDays,
    warmups: left.warmups + right.warmups,
    cooldowns: left.cooldowns + right.cooldowns,
    optionalWeeks: left.optionalWeeks + right.optionalWeeks,
  };
}

export function pctChange(current: number, prior: number | null | undefined): number | null {
  if (prior == null) return null;
  if (prior === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - prior) / Math.abs(prior)) * 1000) / 10;
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

export function formatLbs(value: number | null | undefined): string {
  return Math.round(Number(value || 0)).toLocaleString();
}
