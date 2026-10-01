/**
 * One in-flight house request per period. You vs, the pack, and the weekday
 * rows all read this, so the weekday block does not wait on a second copy
 * of the same payload.
 */

let cached: { period: string; data: unknown } | null = null;
let pending: { period: string; promise: Promise<unknown> } | null = null;

export function peekScoreboard(period: string): unknown | null {
  return cached?.period === period ? cached.data : null;
}

export function fetchScoreboard(period: string): Promise<unknown> {
  const hit = peekScoreboard(period);
  if (hit) return Promise.resolve(hit);
  if (pending?.period === period) return pending.promise;
  const promise = fetch('/api/scoreboard?period=' + encodeURIComponent(period))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data) cached = { period, data };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      if (pending?.promise === promise) pending = null;
    });
  pending = { period, promise };
  return promise;
}
