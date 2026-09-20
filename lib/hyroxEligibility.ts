/** Locked weeks in the normal 48-week program required before Hyrox Training unlocks. */
export const HYROX_ELIGIBLE_LOCKED_WEEKS = 6;

/** `lockedWeeks` is the persisted count from `locked_weeks` (see lib/lockedWeeks.ts),
 * not a live recompute — so a later schedule_days_per_week change can't make an
 * already-Hyrox-eligible athlete lose eligibility from history that already happened. */
export function hyroxEligible(lockedWeeks: number): boolean {
  return lockedWeeks >= HYROX_ELIGIBLE_LOCKED_WEEKS;
}
