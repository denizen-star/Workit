export const SCOREBOARD_PERIODS = ['7', '30', 'all'] as const;

export type ScoreboardPeriod = (typeof SCOREBOARD_PERIODS)[number];

export type HouseholdScoreboardRow = {
  id: number;
  name: string;
  workouts: number;
  volume: number;
};

export function isScoreboardPeriod(value: unknown): value is ScoreboardPeriod {
  return value === '7' || value === '30' || value === 'all';
}

export function scoreboardRangeLabel(period: ScoreboardPeriod) {
  if (period === '30') return 'last 30 days';
  if (period === 'all') return 'all time';
  return 'last 7 days';
}
