// Client-safe body-weight rules + copy (docs/plans/PLAN_BODY_WEIGHT.md), shared by the
// API routes and the forms. Copy is plain and neutral on purpose: body weight is
// sensitive, so no coach voice and no judgment of up or down.

/**
 * Form input → lb. `null` = left blank (allowed, weight is optional); `undefined` =
 * not a usable number, so the caller answers "Weight must be a number in lb".
 */
export function parseBodyWeightInput(value: unknown): number | null | undefined {
  if (value == null || value === '') return null;
  const lb = Number(value);
  if (!Number.isFinite(lb) || lb <= 0 || lb > 999) return undefined;
  return Math.round(lb * 10) / 10;
}

export const BODY_WEIGHT_INVALID = 'Weight must be a number in lb';

/** Under every weight field (join, Edit profile, check-in) and on the missing-weight banner. */
export const BODY_WEIGHT_WHY =
  'We use your weight to count bodyweight moves like push-ups and dips. Anything you add on top counts extra. Only you and Kevin see it.';

export const BODY_WEIGHT_BANNER_TITLE = 'Add your weight';
export const BODY_WEIGHT_BANNER_CTA = 'Add weight';

/** The one confirmation a save gets. */
export function weightSavedLabel(lb: number): string {
  return `Weight saved · ${Math.round(lb * 10) / 10} lb`;
}

/** "182 lb (saved Sep 3)" — the weight on file and when it was saved. */
export function bodyWeightOnFile(lb: number, savedAt: string | null): string {
  const weight = `${Math.round(lb * 10) / 10} lb`;
  const date = savedAt ? new Date(savedAt) : null;
  if (!date || Number.isNaN(date.getTime())) return weight;
  const when = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  return `${weight} (saved ${when})`;
}

/** Recap / email line for the weight a session's bodyweight sets used. */
export function bodyWeightUsedLine(lb: number, savedAt: string | null): string {
  return `Body weight used: ${bodyWeightOnFile(lb, savedAt)}`;
}

/** 6-week check-in email line: confirm the weight on file, or ask for one. */
export function bodyWeightCheckinLine(lb: number | null, savedAt: string | null): string {
  return lb == null
    ? 'Add your weight in Edit profile. We use it to count bodyweight moves like push-ups and dips.'
    : `Your weight on file: ${bodyWeightOnFile(lb, savedAt)}. If it changed, update it in Edit profile. We use it to count bodyweight moves like push-ups and dips.`;
}

/** Recap / email nudge when bodyweight sets earned no credit because no weight is on file. */
export const BODY_WEIGHT_MISSING_LINE =
  'Add your weight in Edit profile so push-ups, dips and other bodyweight moves count toward your pounds.';

/**
 * Missing-weight banner window starts here (8pm Eastern on ship day, 2026-09-27 — just
 * after the last session logged before it shipped). Workouts started before it don't
 * use up the athlete's 3 banner showings.
 */
export const BODY_WEIGHT_BANNER_SINCE = '2026-09-28T00:00:00Z';
export const BODY_WEIGHT_BANNER_WORKOUTS = 3;

/**
 * Derived, never stored (same idea as Test Drive): the banner (Home + live workout)
 * shows while no weight is on file and the athlete has started at most 3 workouts
 * since BODY_WEIGHT_BANNER_SINCE, counting one open now — so it is up on Home before
 * the next workout and through the 3rd. Saving a weight hides it at once.
 */
export function bodyWeightBannerDue(
  bodyWeightLb: number | null,
  sessions: Array<{ created_at?: string | null; started_at?: string | null }>
): boolean {
  if (bodyWeightLb != null) return false;
  const since = new Date(BODY_WEIGHT_BANNER_SINCE).getTime();
  const started = sessions.filter((session) => {
    const at = new Date(session.created_at || session.started_at || 0).getTime();
    return Number.isFinite(at) && at >= since;
  }).length;
  return started <= BODY_WEIGHT_BANNER_WORKOUTS;
}

/**
 * A jump this big from the last weigh-in is more likely a typo (20 for 200) than real,
 * so the form asks once before saving it. 20% either way.
 */
export function isBigWeightJump(previousLb: number | null | undefined, nextLb: number): boolean {
  if (previousLb == null || !(previousLb > 0)) return false;
  return Math.abs(nextLb - previousLb) / previousLb > 0.2;
}
