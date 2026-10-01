import { effortFromVolume } from '@/lib/hardness';
import { bodyweightShare } from '@/lib/bodyweightShare';

export type ExerciseKind = "weighted" | "bodyweight" | "timed" | "distance";

export function getExerciseKind(name: string, reps: string): ExerciseKind {
  const n = name.toLowerCase();
  const r = reps.toLowerCase();

  // "min"/"minutes" catches continuous cardio (runs, easy bike, mobility flows)
  // logged by time rather than weight×reps — same Start-timer/Stop-completes
  // flow as a Plank Hold, just with a longer target.
  if (r.includes("second") || /\bmin(ute)?s?\b/.test(r) || (n.includes("plank") && !n.includes("iso"))) return "timed";
  if (r.includes("meter") || r.includes("walk") || n.includes("carry")) return "distance";
  // A barbell or machine option makes it a loaded lift even when its "or" half matches a
  // bodyweight word below (Barbell Hip Thrusts or Glute Bridges, Leg Extension Machine or
  // Goblet Step-Ups) — docs/plans/PLAN_BODY_WEIGHT.md.
  if (n.includes("barbell") || n.includes("machine")) return "weighted";
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

/** Hold length in seconds. Only duration copy counts ("45 seconds", "10 min", or a
 * bare number). Rep schemes like "8 per side" must not become an 8-second clock —
 * that happens when Alt Exercise swaps onto a plank and keeps the old reps string. */
export function parseTimedTarget(reps: string, name = ''): number {
  const lower = reps.toLowerCase();
  const secondsMatch = lower.match(/(\d+(?:\.\d+)?)\s*seconds?/);
  if (secondsMatch) return Math.max(1, Math.round(Number(secondsMatch[1])));
  const minutesMatch = lower.match(/(\d+(?:\.\d+)?)\s*min(?:ute)?s?\b/);
  if (minutesMatch) return Math.max(1, Math.round(Number(minutesMatch[1]) * 60));
  const bare = lower.trim().match(/^(\d+(?:\.\d+)?)$/);
  if (bare) {
    const value = Number(bare[1]);
    if (Number.isFinite(value) && value > 0) return Math.max(1, Math.round(value));
  }
  const n = name.toLowerCase();
  if (n.includes('side plank')) return 45;
  if (n.includes('plank')) return 60;
  return 45;
}

export function primaryFieldLabel(kind: ExerciseKind): string {
  if (kind === "timed") return "Seconds";
  if (kind === "distance") return "Meters";
  return "Reps";
}

/** Weight input label. A movement that counts body weight (lib/bodyweightShare.ts) asks for extra load only. */
export function weightFieldLabel(kind: ExerciseKind, name?: string, unit: "lb" | "kg" = "lb"): string {
  if (bodyweightShare(name) != null) return unit === "kg" ? "Extra weight kg (optional)" : "Extra weight (optional)";
  if (unit === "kg") return kind === "bodyweight" ? "Weight kg (0 = BW)" : "Weight (kg)";
  if (kind === "bodyweight") return "Weight (0 = BW)";
  if (kind === "timed" || kind === "distance") return "Weight (optional)";
  return "Weight (lbs)";
}

/** `bodyweightLb` = the set's stamped body-weight credit; shown as "134 lb body (+ extra) × reps". */
export function setLogLabel(
  kind: ExerciseKind,
  weightLbs: number | null,
  actualReps: number | null,
  bodyweightLb?: number | string | null
) {
  const reps = actualReps ?? 0;
  const weight = weightLbs ?? 0;
  const credit = Math.round(Number(bodyweightLb ?? 0) || 0);
  if (credit > 0 && kind !== "timed" && kind !== "distance") {
    return weight ? `${credit} lb body + ${weight} lb × ${reps}` : `${credit} lb body × ${reps}`;
  }
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

/**
 * Timed and distance count the load once, not seconds or meters. `bodyweightLb` is the
 * body-weight credit stamped on the set when it completed (exercise_sets.bodyweight_lb,
 * lib/bodyweightShare.ts); the logged weight is extra on top: (weight + credit) × reps.
 */
export function setVolume(
  name: string,
  targetReps: string | null | undefined,
  weightLbs: number | null | undefined,
  actualReps: number | null | undefined,
  bodyweightLb?: number | string | null
): number {
  const credit = Number(bodyweightLb ?? 0) || 0;
  if ((weightLbs == null && credit === 0) || actualReps == null) return 0;
  const weight = Number(weightLbs ?? 0) + credit;
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
    hardness?: number | null;
    bodyweight_lb?: number | string | null;
  }>
) {
  let lbs = 0;
  let reps = 0;
  let effort = 0;
  for (const set of sets) {
    if (!set.is_completed) continue;
    const volume = setVolume(set.exercise_name, set.target_reps, set.weight_lbs, set.actual_reps, set.bodyweight_lb);
    lbs += volume;
    effort += effortFromVolume(volume, set.hardness);
    const kind = getExerciseKind(set.exercise_name, set.target_reps || "");
    if (kind !== "timed" && kind !== "distance") {
      reps += Number(set.actual_reps || 0);
    }
  }
  return { lbs, reps, effort };
}

/**
 * Same timed/distance rules as getExerciseKind, for SUM() in SQL. Adds the set's stamped
 * body-weight credit (exercise_sets.bodyweight_lb) to the logged weight, same as setVolume.
 * Every caller reads exercise_sets directly (alias or bare), so the column is always there.
 */
export function sqlSetVolume(alias?: string): string {
  const col = (column: string) => (alias ? `${alias}.${column}` : column);
  const name = `LOWER(COALESCE(${col("exercise_name")}, ''))`;
  const reps = `LOWER(COALESCE(${col("target_reps")}, ''))`;
  const load = `(COALESCE(${col("weight_lbs")}, 0) + COALESCE(${col("bodyweight_lb")}, 0))`;
  return `CASE
    WHEN ${col("actual_reps")} IS NULL OR (${col("weight_lbs")} IS NULL AND ${col("bodyweight_lb")} IS NULL) THEN 0
    WHEN ${reps} LIKE '%second%'
      OR (${name} LIKE '%plank%' AND ${name} NOT LIKE '%iso%')
      OR ${reps} LIKE '%meter%'
      OR ${reps} LIKE '%walk%'
      OR ${name} LIKE '%carry%'
    THEN ${load}
    ELSE ${load} * ${col("actual_reps")}
  END`;
}

/** Volume × Perceived Effort. Easy 0.80 · Fair 1.00 · Max 1.20. Skip = Fair. */
export function sqlSetEffortVolume(alias?: string): string {
  const col = (column: string) => (alias ? `${alias}.${column}` : column);
  return `(${sqlSetVolume(alias)}) * ((7 + COALESCE(${col("hardness")}, 3)) / 10)`;
}
