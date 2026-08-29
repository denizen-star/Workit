/** Extra minutes added to every rest break. 0 = stock 60 seconds. */
export const REST_EXTRA_MIN_MINUTES = 0;
export const REST_EXTRA_MAX_MINUTES = 10;

export function normalizeRestExtraMinutes(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return REST_EXTRA_MIN_MINUTES;
  return Math.min(REST_EXTRA_MAX_MINUTES, Math.max(REST_EXTRA_MIN_MINUTES, n));
}

export function restSecondsWithExtra(extraMinutes: unknown, baseSeconds: number) {
  return Math.max(baseSeconds, baseSeconds + normalizeRestExtraMinutes(extraMinutes) * 60);
}
