// Next-load suggestion + Aim line on every live lift card, main program and
// Overload Progressions alike (docs/plans/PLAN_OVERLOAD_PROGRESSIONS.md).
// Suggest only: nothing here changes prefill (lib/setHistory.ts still seeds set 1).
//
// Double progression: keep a weight until every set reaches the top of the rep
// range at Hard or easier, then add the step and drop back to the bottom of the range.
import { DEFAULT_HARDNESS, HARDNESS_LABELS, parseHardness, type HardnessScore } from '@/lib/hardness';
import type { ExerciseKind } from '@/lib/exerciseKind';
import { movementPattern } from '@/lib/movementPattern';
import { kgFromLbs, type WeightUnit } from '@/lib/weightUnit';

/** Rep range from a program reps string: "6-8" → 6..8, "10" → 10..10 (a single
 * number is the top of the range). Anything else ("30 seconds", "AMRAP") → null. */
export function parseRepRange(reps: string): { min: number; max: number } | null {
  const text = String(reps || '').trim();
  const range = text.match(/^(\d+)\s*[-–]\s*(\d+)\b/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = text.match(/^(\d+)(?:\s*(?:reps?|each|per)\b.*)?$/i);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return null;
}

/** Light single-joint dumbbell work — too light for a 5 lb jump. Cable/machine
 * isolation takes the regular upper-body step. */
const DUMBBELL_ISOLATION = /\b(curls?|lateral raises?|front raises?|rear delt|skull crushers|triceps extensions?|kickbacks?|shrugs)\b/i;

/** Step in lb: Legs +10, dumbbell isolation +2.5, every other upper-body lift +5. */
export function weightStepLbs(name: string): number {
  if (movementPattern(name) === 'Legs') return 10;
  if (DUMBBELL_ISOLATION.test(name) && !/\b(cable|machine)\b/i.test(name)) return 2.5;
  return 5;
}

/** kg athletes see a rounded kg step: +2.5 lb → +1, +5 lb → +2.5, +10 lb → +5. */
const KG_STEP: Record<number, number> = { 2.5: 1, 5: 2.5, 10: 5 };

type LoggedSet = { weight_lbs: number | null; actual_reps: number | null; hardness?: number | null };

export type NextLoad = {
  action: 'add' | 'reps' | 'drop';
  /** Last session's working weight, in lb — kg athletes step from its kg value. */
  workingLbs: number;
  /** Suggested working weight, in lb. */
  weightLbs: number;
  stepLbs: number;
  /** What to aim for at that weight, e.g. "6-8" or "9". */
  repTarget: string;
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * The suggestion for next time, from the last session this lift ran (every set of
 * it). Null when there's nothing to go on: no history, a timed/bodyweight/distance
 * lift, or a reps string with no number range.
 */
export function nextLoadFor(input: {
  name: string;
  reps: string;
  kind: ExerciseKind;
  lastSets: LoggedSet[];
}): NextLoad | null {
  if (input.kind !== 'weighted') return null;
  const range = parseRepRange(input.reps);
  if (!range) return null;
  const sets = input.lastSets.filter((set) => Number(set.weight_lbs) > 0 && set.actual_reps != null);
  if (!sets.length) return null;

  // The working weight is the heaviest one used; judge the sets done at it.
  const working = Math.max(...sets.map((set) => Number(set.weight_lbs)));
  const workSets = sets.filter((set) => Number(set.weight_lbs) === working);
  const reps = workSets.map((set) => Number(set.actual_reps));
  const avgEffort =
    workSets.reduce((sum, set) => sum + (parseHardness(set.hardness) ?? DEFAULT_HARDNESS), 0) / workSets.length;
  const step = weightStepLbs(input.name);
  const rangeLabel = range.min === range.max ? String(range.max) : `${range.min}-${range.max}`;

  if (reps.every((value) => value >= range.max) && avgEffort <= 4) {
    return { action: 'add', workingLbs: working, weightLbs: working + step, stepLbs: step, repTarget: rangeLabel };
  }
  if (avgEffort >= 5 && reps.some((value) => value < range.min)) {
    // Drop about 7.5% (the 5-10% band), rounded to a loadable step and at least one
    // full step down. Too light to drop a step → fall through to "one more rep".
    const dropped = Math.min(roundTo(working * 0.925, step), working - step);
    if (dropped >= step) return { action: 'drop', workingLbs: working, weightLbs: dropped, stepLbs: step, repTarget: rangeLabel };
  }
  const bestReps = Math.max(...reps);
  return { action: 'reps', workingLbs: working, weightLbs: working, stepLbs: step, repTarget: String(Math.min(range.max, bestReps + 1)) };
}

/** The suggested weight in the card's unit. kg athletes step from their own kg
 * working weight by the rounded kg step, so the numbers match their plates. */
function suggestedLoad(next: NextLoad, unit: WeightUnit): string {
  if (unit !== 'kg') return `${next.weightLbs} lb`;
  const working = roundTo(kgFromLbs(next.workingLbs), 0.5);
  const step = KG_STEP[next.stepLbs] ?? kgFromLbs(next.stepLbs);
  const kg =
    next.action === 'add'
      ? working + step
      : next.action === 'drop'
        ? Math.min(roundTo(working * 0.925, step), working - step)
        : working;
  return `${kg} kg`;
}

/** One line for the card, in the athlete's unit for this lift. */
export function nextLoadLabel(next: NextLoad, unit: WeightUnit): { title: string; detail: string } {
  const title = `Next: ${suggestedLoad(next, unit)} × ${next.repTarget}`;
  const step = unit === 'kg' ? `${KG_STEP[next.stepLbs] ?? kgFromLbs(next.stepLbs)} kg` : `${next.stepLbs} lb`;
  if (next.action === 'add') return { title, detail: `You earned +${step}` };
  if (next.action === 'drop') return { title, detail: 'Drop the weight and own the range' };
  return { title, detail: 'Same weight, one more rep' };
}

const REPS_LEFT: Record<HardnessScore, string> = {
  1: '5+ reps left',
  2: 'about 4 reps left',
  3: 'about 3 reps left',
  4: 'about 2 reps left',
  5: '0-1 reps left',
};

/** Target effort when a lift doesn't set one (the whole main program). */
export const DEFAULT_TARGET_EFFORT: HardnessScore = 4;

/** "Aim: Hard · about 2 reps left" (+ an optional last-set cue). */
export function aimLine(targetEffort?: number | null, lastSetCue?: string | null): string {
  const score = parseHardness(targetEffort) ?? DEFAULT_TARGET_EFFORT;
  const base = `Aim: ${HARDNESS_LABELS[score]} · ${REPS_LEFT[score]}`;
  return lastSetCue ? `${base} · ${lastSetCue}` : base;
}
