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

export function formatHardnessAvg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(1);
}
