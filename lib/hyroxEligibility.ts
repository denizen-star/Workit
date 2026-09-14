import { lockedWeekCount } from '@/lib/belts';

/** Locked weeks in the normal 48-week program required before Hyrox Training unlocks. */
export const HYROX_ELIGIBLE_LOCKED_WEEKS = 6;

export function hyroxEligible(
  sessions: Array<{ week_number?: number; is_completed?: unknown }>
): boolean {
  return lockedWeekCount(sessions) >= HYROX_ELIGIBLE_LOCKED_WEEKS;
}
