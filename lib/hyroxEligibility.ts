import { PROGRAM_UNLOCK_LOCKED_WEEKS } from '@/lib/programUnlock';

/** Locked weeks in the normal 48-week program required before Hyrox Training unlocks —
 * the same rule as every More program (lib/programUnlock.ts). */
export const HYROX_ELIGIBLE_LOCKED_WEEKS = PROGRAM_UNLOCK_LOCKED_WEEKS;

/** `lockedWeeks` is the persisted count from `locked_weeks` (see lib/lockedWeeks.ts),
 * not a live recompute — so a later schedule_days_per_week change can't make an
 * already-Hyrox-eligible athlete lose eligibility from history that already happened. */
export function hyroxEligible(lockedWeeks: number): boolean {
  return lockedWeeks >= HYROX_ELIGIBLE_LOCKED_WEEKS;
}
