import { bonusCount } from '@/lib/bonusDay';
import { OPTIONAL_WEEK_SLOTS, sessionCooldownDone, sessionWarmupDone } from '@/lib/optionals';
import {
  emptyPerformanceFlags,
  type PerformanceFlags,
  type PerformancePeriod,
} from '@/lib/athletePerformanceTypes';
import { inPeriodWindow, performancePeriodWindow } from '@/lib/performancePeriod';

export type FlagSessionRow = {
  week_number?: number | null;
  day_number?: number | null;
  workout_type?: string | null;
  is_completed?: unknown;
  completed_at?: string | Date | null;
  warmup_completed_at?: string | Date | null;
  cooldown_completed_at?: string | Date | null;
};

function slotTimes(sessions: FlagSessionRow[], slot: 'warmup' | 'cooldown') {
  const times: number[] = [];
  for (const session of sessions) {
    const raw = slot === 'warmup' ? session.warmup_completed_at : session.cooldown_completed_at;
    if (!raw) continue;
    const time = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
    if (Number.isFinite(time)) times.push(time);
  }
  return times.sort((a, b) => a - b);
}

/** Weeks that reached 4 warmup + 4 cooldown, counted when the 4th pair lands in the window. */
function optionalWeeksFinishedInWindow(sessions: FlagSessionRow[], period: PerformancePeriod) {
  const window = performancePeriodWindow(period);
  const byWeek = new Map<number, FlagSessionRow[]>();
  for (const session of sessions) {
    const week = Number(session.week_number);
    if (!week) continue;
    const list = byWeek.get(week) || [];
    list.push(session);
    byWeek.set(week, list);
  }

  let count = 0;
  for (const weekSessions of byWeek.values()) {
    const warmups = slotTimes(weekSessions, 'warmup');
    const cooldowns = slotTimes(weekSessions, 'cooldown');
    if (warmups.length < OPTIONAL_WEEK_SLOTS || cooldowns.length < OPTIONAL_WEEK_SLOTS) continue;
    const finishedAt = Math.max(warmups[OPTIONAL_WEEK_SLOTS - 1], cooldowns[OPTIONAL_WEEK_SLOTS - 1]);
    if (inPeriodWindow(new Date(finishedAt), window)) count += 1;
  }
  return count;
}

/**
 * Bonus is all-time unique weeks per person.
 * Warmups, cooldowns, and optional weeks follow the Eastern period window.
 */
export function performanceFlagsForSessions(
  sessions: FlagSessionRow[],
  period: PerformancePeriod
): PerformanceFlags {
  const window = performancePeriodWindow(period);
  const flags = emptyPerformanceFlags();
  flags.bonusDays = bonusCount(
    sessions.map((session) => ({
      week_number: Number(session.week_number || 0),
      day_number: Number(session.day_number || 0),
      workout_type: session.workout_type ?? undefined,
      is_completed: session.is_completed,
      completed_at:
        session.completed_at instanceof Date
          ? session.completed_at.toISOString()
          : session.completed_at ?? null,
    }))
  );

  for (const session of sessions) {
    if (sessionWarmupDone(session) && inPeriodWindow(session.warmup_completed_at, window)) {
      flags.warmups += 1;
    }
    if (sessionCooldownDone(session) && inPeriodWindow(session.cooldown_completed_at, window)) {
      flags.cooldowns += 1;
    }
  }
  flags.optionalWeeks = optionalWeeksFinishedInWindow(sessions, period);
  return flags;
}
