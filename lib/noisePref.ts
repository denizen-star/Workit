/** How often post-set/post-vote flash takeovers show up during a live session. */
export type NoiseLevel = 'set' | 'exercise' | 'off';
export const NOISE_LEVELS: NoiseLevel[] = ['set', 'exercise', 'off'];

export function normalizeNoiseLevel(value: unknown): NoiseLevel {
  return value === 'exercise' || value === 'off' ? value : 'set';
}

export function normalizeShowPrs(value: unknown): boolean {
  if (value === false || value === 0 || value === '0' || value === 'off' || value === 'false') {
    return false;
  }
  return true;
}
