export type ExerciseKind = "weighted" | "bodyweight" | "timed" | "distance";

export function getExerciseKind(name: string, reps: string): ExerciseKind {
  const n = name.toLowerCase();
  const r = reps.toLowerCase();

  if (r.includes("second") || (n.includes("plank") && !n.includes("iso"))) return "timed";
  if (r.includes("meter") || r.includes("walk") || n.includes("carry")) return "distance";
  if (
    n.includes("push-up") ||
    n.includes("bodyweight") ||
    n.includes("towel") ||
    n.includes("doorframe") ||
    n.includes("floor slide") ||
    n.includes("hamstring floor") ||
    n.includes("walkout") ||
    n.includes("pike") ||
    n.includes("dip") ||
    n.includes("iso") ||
    n.includes("prone y") ||
    n.includes("leg raise") ||
    n.includes("glute bridge") ||
    n.includes("good morning") ||
    n.includes("sissy") ||
    n.includes("step-up") ||
    n.includes("tempo squat") ||
    n.includes("inverted row") ||
    n.includes("wall rollout") ||
    n.includes("backpack") ||
    n.includes("dead bug") ||
    r === "max"
  ) {
    return "bodyweight";
  }
  return "weighted";
}

export function parseTimedTarget(reps: string): number {
  const match = reps.toLowerCase().match(/(\d+)\s*seconds?/) || reps.match(/(\d+)/);
  const value = match ? Number(match[1]) : 45;
  return Number.isFinite(value) && value > 0 ? value : 45;
}

export function primaryFieldLabel(kind: ExerciseKind): string {
  if (kind === "timed") return "Seconds";
  if (kind === "distance") return "Meters";
  return "Reps";
}

export function weightFieldLabel(kind: ExerciseKind): string {
  if (kind === "bodyweight") return "Weight (0 = BW)";
  if (kind === "timed" || kind === "distance") return "Weight (optional)";
  return "Weight (lbs)";
}

export function setLogLabel(
  kind: ExerciseKind,
  weightLbs: number | null,
  actualReps: number | null
) {
  const reps = actualReps ?? 0;
  const weight = weightLbs ?? 0;
  if (kind === "timed") return `${reps}s`;
  if (kind === "distance") return weight ? `${reps}m @ ${weight} lb` : `${reps}m`;
  if (kind === "bodyweight" && weight === 0) return `${reps} reps`;
  return `${weight} lb × ${reps}`;
}

export function canCompleteSet(
  kind: ExerciseKind,
  actualReps: number | null,
  weightLbs: number | null
): boolean {
  if (actualReps == null || Number.isNaN(actualReps)) return false;

  if (kind === "timed" || kind === "distance") {
    return actualReps > 0;
  }

  if (kind === "bodyweight") {
    return actualReps > 0;
  }

  return actualReps > 0 && weightLbs != null && !Number.isNaN(weightLbs);
}

export function suggestedNextWeight(lastWeight: number): number {
  const bump = lastWeight >= 100 ? 5 : 2.5;
  return Math.round((lastWeight + bump) * 2) / 2;
}

/** Timed and distance count the load once, not seconds or meters. */
export function setVolume(
  name: string,
  targetReps: string | null | undefined,
  weightLbs: number | null | undefined,
  actualReps: number | null | undefined
): number {
  if (weightLbs == null || actualReps == null) return 0;
  const weight = Number(weightLbs);
  const reps = Number(actualReps);
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0;
  const kind = getExerciseKind(name, targetReps || "");
  if (kind === "timed" || kind === "distance") return weight;
  return weight * reps;
}

/** Completed-set totals for the live session bar. Reps skip timed/distance. */
export function sessionSetTotals(
  sets: Array<{
    exercise_name: string;
    target_reps?: string | null;
    weight_lbs: number | null;
    actual_reps: number | null;
    is_completed: boolean;
  }>
) {
  let lbs = 0;
  let reps = 0;
  for (const set of sets) {
    if (!set.is_completed) continue;
    lbs += setVolume(set.exercise_name, set.target_reps, set.weight_lbs, set.actual_reps);
    const kind = getExerciseKind(set.exercise_name, set.target_reps || "");
    if (kind !== "timed" && kind !== "distance") {
      reps += Number(set.actual_reps || 0);
    }
  }
  return { lbs, reps };
}

/** Same timed/distance rules as getExerciseKind, for SUM() in SQL. */
export function sqlSetVolume(alias?: string): string {
  const col = (column: string) => (alias ? `${alias}.${column}` : column);
  const name = `LOWER(COALESCE(${col("exercise_name")}, ''))`;
  const reps = `LOWER(COALESCE(${col("target_reps")}, ''))`;
  return `CASE
    WHEN ${col("weight_lbs")} IS NULL OR ${col("actual_reps")} IS NULL THEN 0
    WHEN ${reps} LIKE '%second%'
      OR (${name} LIKE '%plank%' AND ${name} NOT LIKE '%iso%')
      OR ${reps} LIKE '%meter%'
      OR ${reps} LIKE '%walk%'
      OR ${name} LIKE '%carry%'
    THEN ${col("weight_lbs")}
    ELSE ${col("weight_lbs")} * ${col("actual_reps")}
  END`;
}

/** Raw set volume × How hard. Skip How hard = Fair (60%). */
export function sqlSetEffortVolume(alias?: string): string {
  const col = (column: string) => (alias ? `${alias}.${column}` : column);
  return `(${sqlSetVolume(alias)}) * (COALESCE(${col("hardness")}, 3) * 0.2)`;
}
