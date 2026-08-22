export const SCOREBOARD_PERIODS = ['7', '30', 'all'] as const;

export type ScoreboardPeriod = (typeof SCOREBOARD_PERIODS)[number];

export type HouseholdScoreboardRow = {
  id: number;
  name: string;
  workouts: number;
  volume: number;
  sets: number;
  heaviest: number;
  avgSeconds: number | null;
  bestSessionVolume: number;
  badges: number;
  lastWorkout: string | null;
  lastAt: string | null;
};

export function isScoreboardPeriod(value: unknown): value is ScoreboardPeriod {
  return value === '7' || value === '30' || value === 'all';
}

export function scoreboardRangeLabel(period: ScoreboardPeriod) {
  if (period === '30') return 'last 30 days';
  if (period === 'all') return 'all time';
  return 'last 7 days';
}

export function firstName(name: string) {
  return String(name || '').trim().split(/\s+/)[0] || 'You';
}

export function tomScoreboardLine(
  row: HouseholdScoreboardRow,
  index: number,
  rows: HouseholdScoreboardRow[]
): string {
  const name = firstName(row.name);
  const leader = rows[0];
  const volumeGap = Math.round((leader?.volume || 0) - row.volume);
  const workoutGap = (leader?.workouts || 0) - row.workouts;

  if (rows.length === 1) {
    return `${name}, you are the only body who showed up. Lonely at the top is still the top.`;
  }

  if (index === 0) {
    const hunter = rows[1];
    if (hunter && hunter.workouts === row.workouts && volumeGap === 0) {
      return `${name} is tied for first. I do not do ties. Break it.`;
    }
    if (hunter && workoutGap === 0) {
      return `${name} holds first by iron, not by days. The pack can still take this.`;
    }
    return `${name} owns this board. The rest of you are decorating it.`;
  }

  if (index === 1) {
    if (workoutGap <= 1 && volumeGap < 2000) {
      return `${name} is breathing on first. One honest session and this board flips.`;
    }
    return `${name}, second is a participation trophy. ${volumeGap.toLocaleString()} lb off the lead. Hunt.`;
  }

  if (index === rows.length - 1) {
    return `${name} is last. The iron noticed. So did I.`;
  }

  if (row.heaviest >= (leader?.heaviest || 0) && row.heaviest > 0) {
    return `${name} is not first, but that ${Math.round(row.heaviest)} lb single was not cute.`;
  }

  return `${name} is in the mix. Not first. Not last. That is a choice, not a fate.`;
}
