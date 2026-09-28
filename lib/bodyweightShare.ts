// Which movements count the athlete's body weight, and how much of it
// (docs/plans/PLAN_BODY_WEIGHT.md). Exact program/travel/Alt names only — no keyword
// matching, because getExerciseKind's name match also tags loaded lifts (Barbell Hip
// Thrusts or Glute Bridges, Leg Extension Machine or Goblet Step-Ups), backpack moves
// (the backpack is the load), ISO holds and arm-only moves. Anything not listed gets
// no body-weight credit. Client-safe (no DB).
//
// A set of a listed movement counts (share × body weight + logged weight) × reps; the
// logged weight is "extra" on top. Shares are first-draft estimates of how much of the
// body each rep actually moves — FOR KEVIN'S REVIEW before they're final.
export const BODYWEIGHT_SHARES: Record<string, number> = {
  // Push
  'Push-Ups': 0.64,
  'Incline Push-Ups': 0.45,
  'Push-Ups / Incline Push-Ups': 0.55,
  'Close-Grip Push-Ups': 0.64,
  'Pike Push-Ups': 0.7,
  'Bench Dips': 0.6,
  'Bench Dips or Bodyweight Triceps Extensions': 0.6,
  // Legs
  'Bodyweight Squats': 0.7,
  'Bodyweight Squats or Tempo Squats': 0.7,
  'Bodyweight Bulgarian Split Squats': 0.85,
  'Bodyweight Walking or Reverse Lunges': 0.8,
  'Bodyweight Step-Ups or Sissy Squats': 0.85,
  'Single-Leg Bodyweight Calf Raises': 1.0,
  // Hinge / hamstrings / glutes
  'Bodyweight Single-Leg RDLs': 0.5,
  'Single-Leg Good Mornings': 0.5,
  'Single-Leg Glute Bridges': 0.5,
  'Hamstring Walkouts': 0.4,
  'Lying Hamstring Floor Slides': 0.35,
  // Pull
  'Towel Door Rows or Table Inverted Rows': 0.5,
  'Doorframe Towel Rows or Sliding Floor Lat Pulls': 0.4,
  'Floor Pullovers or Towel Straight-Arm Pulls': 0.15,
  // Core
  'Floor Leg Raises or Bodyweight Wall Rollouts': 0.3,
  'Hanging Knee Raises or Ab Wheel Rollouts': 0.35,
};

/** Share of body weight one rep of this movement moves, or null when it earns no credit. */
export function bodyweightShare(exerciseName: string | null | undefined): number | null {
  if (!exerciseName) return null;
  return BODYWEIGHT_SHARES[exerciseName.trim()] ?? null;
}

/**
 * Pounds of body weight credited to one set: share × body weight, rounded to 0.1 lb.
 * 0 for an unlisted movement or no weight on file (then only the logged weight counts,
 * which is how every set worked before this change).
 */
export function bodyweightCreditLb(
  exerciseName: string | null | undefined,
  bodyWeightLb: number | null | undefined
): number {
  const share = bodyweightShare(exerciseName);
  if (share == null || bodyWeightLb == null || !(Number(bodyWeightLb) > 0)) return 0;
  return Math.round(share * Number(bodyWeightLb) * 10) / 10;
}
