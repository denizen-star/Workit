export const PERFORMANCE_PERIODS = ['15', '30', 'all'] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

export function isPerformancePeriod(value: unknown): value is PerformancePeriod {
  return value === '15' || value === '30' || value === 'all';
}

export function performanceRangeLabel(period: PerformancePeriod) {
  if (period === '30') return 'last 30 days';
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
};

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
