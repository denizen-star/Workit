import { workoutDateKey } from '@/lib/statsHousehold';
import { TONE_HOUSE, TONE_YOU } from '@/lib/uiTone';

/** You. Cream. Gold is for actions, not the line. */
export const CHART_YOU = TONE_YOU;
/** The house. Copper dashed. */
export const CHART_HOUSE = TONE_HOUSE;

const PACK_STROKES = [
  '#f6f1e3',
  '#fb923c',
  '#a78bfa',
  '#38bdf8',
  '#f0abfc',
  '#94a3b8',
  '#2dd4bf',
  '#e2d5b8',
];

export type TrendMode = 'daily' | 'cumulative';
export type TrendRange = '7' | '30' | 'all';

export type RawDailyPoint = {
  userId: number;
  name: string;
  workout_date: string;
  weight: number;
};

export type TrendLine = {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
  thick?: boolean;
};

function cutoffKey(range: TrendRange): string | null {
  if (range === 'all') return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (range === '7' ? 7 : 30));
  return workoutDateKey(date);
}

/** Stroke for a pack athlete. Viewer always gold. */
export function athleteStroke(userId: number, highlightUserId: number | null) {
  if (highlightUserId != null && Number(userId) === Number(highlightUserId)) {
    return CHART_YOU;
  }
  const index = Math.abs(Number(userId) || 0) % PACK_STROKES.length;
  const color = PACK_STROKES[index];
  return color === CHART_YOU ? PACK_STROKES[0] : color;
}

export function inRange(date: string, range: TrendRange) {
  const key = workoutDateKey(date);
  const start = cutoffKey(range);
  if (!start) return Boolean(key);
  return key >= start;
}

export function earliestKey(dates: Array<string | null | undefined>) {
  const keys = dates.map((value) => workoutDateKey(value)).filter(Boolean).sort();
  return keys[0] || null;
}

/** Lift days in range, never before the program's first lift. */
export function trendAxis(
  dates: string[],
  range: TrendRange,
  notBefore?: string | null
) {
  const floor = workoutDateKey(notBefore || '') || null;
  return [...new Set(dates.map(workoutDateKey).filter(Boolean))]
    .filter((key) => inRange(key, range) && (!floor || key >= floor))
    .sort();
}

/** Values on lift days. Daily is that day's lb. Cumulative sums across those days. */
export function pointsOnAxis(
  axis: string[],
  byDate: Map<string, number>,
  mode: TrendMode
) {
  if (mode !== 'cumulative') {
    return axis.map((date) => {
      const value = byDate.get(date);
      return value != null && value > 0 ? value : null;
    });
  }

  let sum = 0;
  return axis.map((date) => {
    const value = byDate.get(date);
    if (value != null && value > 0) sum += value;
    return sum > 0 ? sum : null;
  });
}

export function addWeight(map: Map<string, number>, date: string, weight: number) {
  const key = workoutDateKey(date);
  const value = Number(weight);
  if (!key || !Number.isFinite(value) || value <= 0) return;
  map.set(key, value);
}

export function formatChartDate(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export type TrendRow = Record<string, string | number | null>;

/** One row per lift day. Missing series stay null so the line skips rest. */
export function compactTrendRows(
  axis: string[],
  series: { key: string; values: (number | null | undefined)[] }[]
): TrendRow[] {
  return axis.map((key, index) => {
    const row: TrendRow = { date: formatChartDate(key) };
    for (const item of series) {
      const value = item.values[index];
      row[item.key] = value != null && Number.isFinite(value) ? value : null;
    }
    return row;
  });
}
