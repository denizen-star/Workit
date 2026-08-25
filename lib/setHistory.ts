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
