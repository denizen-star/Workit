/**
 * Whether post-set/post-vote flash takeovers show up during a live session.
 * Was briefly a three-way Set / Exercise / Off dial; the "Exercise" (once per
 * exercise) level depended on fragile set-completion tracking across extra
 * sets, mode switches, and timing, so it was cut back to plain on/off. Any
 * stored "exercise" value from that period reads back as "set" (on).
 */
export type NoiseLevel = 'set' | 'off';
export const NOISE_LEVELS: NoiseLevel[] = ['set', 'off'];

export function normalizeNoiseLevel(value: unknown): NoiseLevel {
  return value === 'off' ? 'off' : 'set';
}

export function normalizeShowPrs(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'off' || value === 'false') {
    return false;
  }
  return true;
}
