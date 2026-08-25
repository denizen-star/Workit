import { workoutDateKey } from '@/lib/statsHousehold';

/** You / the person looking. */
export const CHART_YOU = '#e8c547';
/** House avg. Copper, not cream — cream disappeared on the dark page. */
export const CHART_HOUSE = '#c08457';

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

/** Sorted union of dates that actually have weight. */
export function trendAxis(dates: string[], range: TrendRange) {
  return [...new Set(dates.map(workoutDateKey).filter((key) => inRange(key, range)))].sort();
}

/** Value only on days this series actually lifted. No padding, no zeros. */
export function pointsOnAxis(
  axis: string[],
  byDate: Map<string, number>,
  mode: TrendMode
) {
  if (mode !== 'cumulative') {
    return axis.map((date) => {
      const value = byDate.get(date);
      return value != null && value > 0 ? value : undefined;
    });
  }

  const totals = new Map<string, number>();
  let sum = 0;
  for (const date of axis) {
    const value = byDate.get(date);
    if (value == null || value <= 0) continue;
    sum += value;
    if (sum > 0) totals.set(date, sum);
  }
  return axis.map((date) => totals.get(date));
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

/**
 * Keep a day only if someone actually lifted.
 * Missing athletes get `null` (Recharts gap) — omitting the key plots as 0.
 */
export function compactTrendRows(
  axis: string[],
  series: { key: string; values: (number | undefined)[] }[]
): TrendRow[] {
  return axis.flatMap((key, index) => {
    const row: TrendRow = { date: formatChartDate(key) };
    let hasValue = false;
    for (const item of series) {
      const value = item.values[index];
      if (value == null || !Number.isFinite(value) || value <= 0) {
        row[item.key] = null;
        continue;
      }
      row[item.key] = value;
      hasValue = true;
    }
    return hasValue ? [row] : [];
  });
}
