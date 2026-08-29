import type { Exercise, WorkoutDay } from "./workoutData";
import { getExerciseKind } from "./exerciseKind";

/** Matches the in-app auto rest timer after each completed set. */
export const REST_SECONDS = 60;

/** Average seconds of effort per rep for lifting sets. */
const SECONDS_PER_REP = 3;

/** Bodyweight / max sets when no fixed count is listed. */
const DEFAULT_MAX_REPS = 12;

/** Carry / walk estimate when distance is listed without a clock. */
const DISTANCE_SET_SECONDS = 50;

function parseRepTarget(reps: string): number {
  const cleaned = reps.toLowerCase().trim();

  const secondsMatch = cleaned.match(/(\d+)\s*seconds?/);
  if (secondsMatch) return Number(secondsMatch[1]);

  const meterMatch = cleaned.match(/(\d+)\s*-?\s*meter/);
  if (meterMatch) return DISTANCE_SET_SECONDS;

  if (cleaned.includes("max")) return DEFAULT_MAX_REPS;

  // "10-12 per arm" / "8-10 per leg" / "10 steps per leg" → use high end * 2 for bilateral
  const perSide = /per (arm|leg|side)/.test(cleaned);
  const range = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const high = Number(range[2]);
    return perSide ? high * 2 : high;
  }

  const single = cleaned.match(/(\d+)/);
  if (single) {
    const value = Number(single[1]);
    return perSide ? value * 2 : value;
  }

  return 10;
}

function estimateSetWorkSeconds(exercise: Exercise): number {
  const kind = getExerciseKind(exercise.name, exercise.reps);
  const target = parseRepTarget(exercise.reps);

  if (kind === "timed") return target;
  if (kind === "distance") return Math.max(target, DISTANCE_SET_SECONDS);
  return target * SECONDS_PER_REP;
}

/** Estimated total session length in seconds (work + rest + transitions). */
export function estimateWorkoutSeconds(day: WorkoutDay, restSeconds = REST_SECONDS): number {
  const rest = Math.max(REST_SECONDS, restSeconds);
  let total = 0;

  day.exercises.forEach((exercise, index) => {
    const work = estimateSetWorkSeconds(exercise);
    const sets = exercise.sets;

    total += work * sets;

    const rests = index === day.exercises.length - 1 ? Math.max(0, sets - 1) : sets;
    total += rests * rest;
  });

  return Math.round(total);
}

export function formatEstimateMinutes(totalSeconds: number): string {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `~${hours}h` : `~${hours}h ${rem}m`;
}
