import { addDays } from 'date-fns';
import { addEasternCalendarDays, easternMidnightUtc, easternYmd } from '@/lib/analyticsTime';
import { normalizePerformancePeriod, type PerformancePeriod } from '@/lib/athletePerformanceTypes';

/** Inclusive start / exclusive end in UTC ms. Both null = All. */
export type PeriodWindow = {
  startMs: number | null;
  endMs: number | null;
};

/**
 * Eastern calendar windows for performance pills.
 * T = today; T-1 = yesterday only; T-N = last N Eastern days including today.
 */
export function performancePeriodWindow(period: PerformancePeriod, now = new Date()): PeriodWindow {
  const resolved = normalizePerformancePeriod(period);
  if (resolved === 'all') return { startMs: null, endMs: null };

  const today = easternYmd(now);
  const todayStart = easternMidnightUtc(today);
  const tomorrowMs = addDays(todayStart, 1).getTime();

  if (resolved === 't') {
    return { startMs: todayStart.getTime(), endMs: tomorrowMs };
  }
  if (resolved === 't-1') {
    const yesterday = addEasternCalendarDays(today, -1);
    return { startMs: easternMidnightUtc(yesterday).getTime(), endMs: todayStart.getTime() };
  }

  const days = resolved === 't-7' ? 7 : resolved === 't-30' ? 30 : 15;
  const startYmd = addEasternCalendarDays(today, -(days - 1));
  return { startMs: easternMidnightUtc(startYmd).getTime(), endMs: tomorrowMs };
}

export type SqlWindow = {
  sql: string;
  params: unknown[];
};

/** Bind an Eastern performance window onto a datetime column. */
export function sqlPeriodWindow(column: string, window: PeriodWindow): SqlWindow {
  if (window.startMs == null && window.endMs == null) return { sql: '', params: [] };
  const parts: string[] = [];
  const params: unknown[] = [];
  if (window.startMs != null) {
    parts.push(`${column} >= ?`);
    params.push(new Date(window.startMs).toISOString().slice(0, 19).replace('T', ' '));
  }
  if (window.endMs != null) {
    parts.push(`${column} < ?`);
    params.push(new Date(window.endMs).toISOString().slice(0, 19).replace('T', ' '));
  }
  return { sql: ` AND ${parts.join(' AND ')}`, params };
}

export function inPeriodWindow(
  doneAt: string | Date | null | undefined,
  window: PeriodWindow
): boolean {
  if (window.startMs == null && window.endMs == null) return true;
  if (!doneAt) return false;
  const time = doneAt instanceof Date ? doneAt.getTime() : new Date(doneAt).getTime();
  if (!Number.isFinite(time)) return false;
  if (window.startMs != null && time < window.startMs) return false;
  if (window.endMs != null && time >= window.endMs) return false;
  return true;
}
