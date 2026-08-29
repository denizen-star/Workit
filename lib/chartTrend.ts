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

function todayKey() {
  return workoutDateKey(new Date());
}

function shiftKey(key: string, days: number) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eachDay(start: string, end: string) {
  const days: string[] = [];
  if (!start || !end || start > end) return days;
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = shiftKey(cursor, 1);
    if (days.length > 800) break;
  }
  return days;
}

/** Every calendar day in the window, including rest days. */
export function trendAxis(dates: string[], range: TrendRange) {
  const keys = [...new Set(dates.map(workoutDateKey).filter(Boolean))].sort();
  const end = todayKey();
  if (range === 'all') {
    if (keys.length === 0) return [];
    return eachDay(keys[0], end < keys[keys.length - 1] ? keys[keys.length - 1] : end);
  }
  const start = cutoffKey(range);
  if (!start) return keys;
  return eachDay(start, end);
}

/** Rest days are 0 (daily) or held total (cumulative) so each line runs across the window. */
export function pointsOnAxis(
  axis: string[],
  byDate: Map<string, number>,
  mode: TrendMode
) {
  if (mode !== 'cumulative') {
    return axis.map((date) => {
      const value = byDate.get(date);
      return value != null && value > 0 ? value : 0;
    });
  }

  let sum = 0;
  return axis.map((date) => {
    const value = byDate.get(date);
    if (value != null && value > 0) sum += value;
    return sum;
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

/** One row per calendar day. Rest days stay on the line at 0 / held total. */
export function compactTrendRows(
  axis: string[],
  series: { key: string; values: (number | undefined)[] }[]
): TrendRow[] {
  return axis.map((key, index) => {
    const row: TrendRow = { date: formatChartDate(key) };
    for (const item of series) {
      const value = item.values[index];
      row[item.key] = value != null && Number.isFinite(value) ? value : 0;
    }
    return row;
  });
}
