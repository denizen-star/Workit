/** Which movement names need no gym equipment at all (docs/plans/PLAN_ALT_EXERCISES.md) — the
 * plane-icon flag on Alt Exercise's takeover and exercise card. Two sources, unioned:
 *
 * 1. Every atomic travel-substitute name from `lib/travelExercises.ts`'s `BY_GYM_NAME` (the
 *    Gym/Travel toggle's own substitution map) — derived, not retyped, via
 *    `scripts/check-alt-travel-coverage.ts`.
 * 2. A short hand-picked set of movements that are already equipment-free in their normal
 *    ("gym") form — they never got a distinct travel substitute name because there was
 *    nothing to substitute.
 */
const EXPLICIT_TRAVEL_SUBSTITUTE_NAMES = [
  'Backpack Carries',
  'Backpack Hammer Curls',
  'Backpack Raises',
  'Backpack Reverse Wrist Curls',
  'Backpack Shrugs',
  'Backpack Skull Crushers',
  'Bench Dips',
  'Bodyweight Bulgarian Split Squats',
  'Bodyweight Single-Leg RDLs',
  'Bodyweight Squats',
  'Bodyweight Step-Ups',
  'Bodyweight Triceps Extensions',
  'Bodyweight Walking Lunges',
  'Bodyweight Wall Rollouts',
  'Close-Grip Push-Ups',
  'Doorframe ISO Curls',
  'Doorframe Rear Delt Flyes',
  'Doorframe Towel Rows',
  'Floor Leg Raises',
  'Floor Pullovers',
  'Hamstring Walkouts',
  'Heavy Object Deadlifts',
  'Incline Push-Ups',
  'Loaded Backpack Curls',
  'Loaded Water Jug Carries',
  'Pike Push-Ups',
  'Prone Y-T-W Raises',
  'Push-Ups',
  'Reverse Lunges',
  'Side Plank',
  'Single-Leg Bodyweight Calf Raises',
  'Single-Leg Glute Bridges',
  'Single-Leg Good Mornings',
  'Sissy Squats',
  'Sliding Floor Lat Pulls',
  'Table Inverted Rows',
  'Tempo Squats',
  'Towel Door Rows',
  'Towel ISO Press',
  'Towel Straight-Arm Pulls',
  'Wall Lateral ISO Raises',
];

const ALREADY_BODYWEIGHT_NAMES = ['Plank Hold', 'Dead Bugs', 'Hanging Knee Raises'];

export const TRAVEL_FRIENDLY_EXERCISE_NAMES = new Set([
  ...EXPLICIT_TRAVEL_SUBSTITUTE_NAMES,
  ...ALREADY_BODYWEIGHT_NAMES,
]);

export function isTravelFriendly(name: string): boolean {
  return TRAVEL_FRIENDLY_EXERCISE_NAMES.has(name);
}
