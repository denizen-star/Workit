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
