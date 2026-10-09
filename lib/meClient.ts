/**
 * One `/api/me` read shared by Home and the menu (`AppMenu`), which mount together and
 * both need the profile. Mirrors lib/scoreboardClient.ts: an in-flight request is
 * shared, and a result stays fresh for a few seconds so the menu (which mounts once
 * Home's read lands) reuses it. A profile save calls `forgetMe()`.
 */

export type MeResult = { ok: boolean; status: number; data: any | null };

const FRESH_MS = 5000;
let cached: { at: number; result: MeResult } | null = null;
let pending: Promise<MeResult> | null = null;

export function forgetMe() {
  cached = null;
}

/** Seed the cache with a `/api/me`-shaped body another call already returned
 * (GET /api/home), so the menu doesn't fetch it again. */
export function primeMe(data: unknown) {
  cached = { at: Date.now(), result: { ok: true, status: 200, data } };
}

export function fetchMe(): Promise<MeResult> {
  if (cached && Date.now() - cached.at < FRESH_MS) return Promise.resolve(cached.result);
  if (pending) return pending;
  const promise = fetch('/api/me')
    .then(async (res) => {
      const result: MeResult = { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
      if (res.ok) cached = { at: Date.now(), result };
      return result;
    })
    .catch(() => ({ ok: false, status: 0, data: null }))
    .finally(() => {
      if (pending === promise) pending = null;
    });
  pending = promise;
  return promise;
}
