export type ExerciseKind = "weighted" | "bodyweight" | "timed" | "distance";

export function getExerciseKind(name: string, reps: string): ExerciseKind {
  const n = name.toLowerCase();
  const r = reps.toLowerCase();

  if (r.includes("second") || n.includes("plank")) return "timed";
  if (r.includes("meter") || r.includes("walk") || n.includes("carry")) return "distance";
  if (n.includes("push-up") || r === "max") return "bodyweight";
  return "weighted";
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
