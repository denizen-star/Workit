/** Per-session Alt Exercise choices (docs/plans/PLAN_ALT_EXERCISES.md) — same JSON-column
 * shape as lib/exerciseModes.ts's Gym/Travel map, keyed by the original program exercise
 * name, but the value is a swapped-in exercise NAME (not a mode enum), since an Alt swap
 * replaces the whole movement rather than picking between two known variants of it. */

export type ExerciseAltMap = Record<string, string>;

export function parseExerciseAlts(raw: unknown): ExerciseAltMap {
  if (raw == null || raw === '') return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: ExerciseAltMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const name = String(key || '').trim();
      const alt = String(value || '').trim();
      if (!name || !alt) continue;
      out[name] = alt;
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeExerciseAlts(alts: ExerciseAltMap): string {
  return JSON.stringify(alts);
}
