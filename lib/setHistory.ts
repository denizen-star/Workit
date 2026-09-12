import { DEFAULT_HARDNESS, effortFromVolume, parseHardness } from './hardness';

export type LoggedLoad = {
  weight_lbs: number | null;
  actual_reps: number | null;
};

/** Heaviest set; ties go to the set with more reps / seconds / meters. */
export function bestLoggedSet<T extends LoggedLoad>(sets: T[]): T | null {
  if (!sets.length) return null;
  return sets.reduce((best, set) => {
    const weight = set.weight_lbs ?? 0;
    const reps = set.actual_reps ?? 0;
    const bestWeight = best.weight_lbs ?? 0;
    const bestReps = best.actual_reps ?? 0;
    if (weight > bestWeight || (weight === bestWeight && reps > bestReps)) return set;
    return best;
  });
}

/**
 * Gain: weight up (any reps), or same weight with more reps.
 * Loss: weight the same or lower, and reps lower.
 * Silent: same load, weight down with reps up, or weight down with reps held.
 */
export function setDirection(
  current: LoggedLoad,
  prior: LoggedLoad | null | undefined
): 'up' | 'down' | null {
  if (!prior) return null;

  const currentWeight = current.weight_lbs ?? 0;
  const priorWeight = prior.weight_lbs ?? 0;
  const currentReps = current.actual_reps ?? 0;
  const priorReps = prior.actual_reps ?? 0;

  const weightUp = currentWeight > priorWeight;
  const weightSame = currentWeight === priorWeight;
  const repsUp = currentReps > priorReps;
  const repsDown = currentReps < priorReps;

  if (weightUp || (weightSame && repsUp)) return 'up';
  if (repsDown && !weightUp) return 'down';
  return null;
}

export function loadDelta(current: number, prior: number): 'up' | 'down' | 'held' {
  if (current > prior) return 'up';
  if (current < prior) return 'down';
  return 'held';
}

/** Consecutive latest steps where the value did not drop versus the session before. */
export function tailHoldStreak(values: number[]): number {
  let streak = 0;
  for (let i = values.length - 1; i >= 1; i -= 1) {
    if (values[i] >= values[i - 1]) streak += 1;
    else break;
  }
  return streak;
}

/** How "Set N" of one exercise has gone across sessions — averages behind the live KPI grid. */
export type SetNumberStats = {
  count: number;
  weightAvg: number;
  repAvg: number;
  /** Raw 1–5 average; an unset vote defaults to Fair (3), same as a skip everywhere else. */
  hardnessAvg: number;
  /** Average of each set's own (weight × reps × effort factor) — not derived from the rounded averages above. */
  effectiveAvg: number;
};

/** `setNumberHistory[exerciseHistoryKey][set_number]`, as returned by `GET /api/exercises?history=1`. */
export type SetNumberHistory = Record<string, Record<number, SetNumberStats>>;

/**
 * Folds one more logged set into a Set-N historical average. Reused two ways: server-side,
 * to build the aggregate row by row from every past session; client-side, to fold today's
 * own just-completed set into that average live (LiveSetKpis' History / Avg Effective tiles).
 */
export function foldSetIntoHistory(
  base: SetNumberStats | null,
  set: { weight_lbs: number | null; actual_reps: number | null; hardness?: number | null }
): SetNumberStats | null {
  if (set.actual_reps == null) return base;
  const weight = Number(set.weight_lbs ?? 0);
  const reps = Number(set.actual_reps);
  const score = parseHardness(set.hardness) ?? DEFAULT_HARDNESS;
  const effective = effortFromVolume(weight * reps, score);
  const priorCount = base?.count ?? 0;
  const count = priorCount + 1;
  return {
    count,
    weightAvg: ((base?.weightAvg ?? 0) * priorCount + weight) / count,
    repAvg: ((base?.repAvg ?? 0) * priorCount + reps) / count,
    hardnessAvg: ((base?.hardnessAvg ?? 0) * priorCount + score) / count,
    effectiveAvg: ((base?.effectiveAvg ?? 0) * priorCount + effective) / count,
  };
}

/**
 * Set-N stats for the live KPI grid, with an extras fallback: an extra set beyond the
 * planned count (Set 4, 5, ...) with no history of its own borrows the last planned set's
 * average, since it's "more of the same" work rather than a new position to track alone.
 */
export function setNumberStatsFor(
  history: SetNumberHistory,
  key: string,
  setNumber: number,
  plannedSets: number
): SetNumberStats | null {
  const byNumber = history[key];
  if (!byNumber) return null;
  if (byNumber[setNumber]) return byNumber[setNumber];
  return setNumber > plannedSets ? byNumber[plannedSets] ?? null : null;
}

/** Same extras fallback as `setNumberStatsFor`, for a single session's set list (the "Best" tile). */
export function lastSpotFor<T extends { set_number: number }>(
  sets: T[],
  setNumber: number,
  plannedSets: number
): T | undefined {
  const exact = sets.find((item) => item.set_number === setNumber);
  if (exact) return exact;
  return setNumber > plannedSets ? sets.find((item) => item.set_number === plannedSets) : undefined;
}

export type TileDelta = { direction: 'up' | 'down'; value: number } | null;

/** Signed ▲/▼ badge value for a live KPI tile. `null` when there's nothing to compare yet. */
export function tileDelta(after: number, before: number | null | undefined): TileDelta {
  if (before == null || !Number.isFinite(before)) return null;
  const diff = Math.round((after - before) * 10) / 10;
  if (diff === 0) return null;
  return { direction: diff > 0 ? 'up' : 'down', value: diff };
}
