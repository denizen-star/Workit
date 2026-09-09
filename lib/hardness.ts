export const HARDNESS_SCORES = [1, 2, 3, 4, 5] as const;
export type HardnessScore = (typeof HARDNESS_SCORES)[number];

export const HARDNESS_LABELS: Record<HardnessScore, string> = {
  1: 'Easy',
  2: 'Light',
  3: 'Fair',
  4: 'Hard',
  5: 'Max',
};

export function parseHardness(value: unknown): HardnessScore | null {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) return null;
  return score as HardnessScore;
}

export function hardnessLabel(value: unknown): string | null {
  const score = parseHardness(value);
  return score == null ? null : HARDNESS_LABELS[score];
}

/** Skipped How hard counts as Fair. Factor: Easy 0.80 · Fair 1.00 · Max 1.20. */
export const DEFAULT_HARDNESS: HardnessScore = 3;

export function formatHardnessAvg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}

/** 1.0 = 20% … 5.0 = 100%. 4.3 = 86%. */
export function hardnessPercent(value: number): number {
  return Math.round(Number(value) * 20);
}

/** Fair = 1.00. 1→0.80 … 5→1.20. Averages interpolate (4.3 → 1.13). */
export function effortFactorFromScore(score: number): number {
  return (7 + Number(score)) / 10;
}

/** `4.3 · 1.13` — How hard average · volume multiplier. */
export function formatHardnessWithPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const score = Math.round(value * 10) / 10;
  return `${score.toFixed(1)} · ${effortFactorFromScore(score).toFixed(2)}`;
}

export function hardnessEffortFactor(value: unknown): number {
  return effortFactorFromScore(parseHardness(value) ?? DEFAULT_HARDNESS);
}

export function effortFromVolume(volume: number, hardness: unknown): number {
  return Number(volume || 0) * hardnessEffortFactor(hardness);
}
