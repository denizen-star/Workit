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

/** 1.0 = 20% … 5.0 = 100%. 4.3 = 86%. */
export function hardnessPercent(value: number): number {
  return Math.round(Number(value) * 20);
}

export function formatHardnessWithPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const score = Math.round(value * 10) / 10;
  return `${score.toFixed(1)} · ${hardnessPercent(score)}%`;
}

/** Skipped How hard counts as Fair. 1=20% · 2=40% · 3=60% · 4=80% · 5=100%. */
export const DEFAULT_HARDNESS: HardnessScore = 3;

export function hardnessEffortFactor(value: unknown): number {
  const score = parseHardness(value) ?? DEFAULT_HARDNESS;
  return score * 0.2;
}

export function effortFromVolume(volume: number, hardness: unknown): number {
  return Number(volume || 0) * hardnessEffortFactor(hardness);
}
