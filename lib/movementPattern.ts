/**
 * Push / Pull / Legs / Core pill for every exercise (docs/plans/PLAN_YOUR_PICK.md).
 *
 * Keyed by exact exercise name — program combo names ("X or Y"), their travel
 * substitutes, Alt Exercise options, Hyrox, Your pick packs, and the Library's atomic
 * names. Coverage is checked by `scripts/check-movement-pattern-coverage.ts`.
 * Cardio, conditioning (burpees, AMRAPs) and mobility/yoga have no pattern — no pill.
 *
 * Judgment calls: loaded carries are Core (they're trained as anti-lean bracing here);
 * sled push and wall balls are Legs (both are leg-driven).
 */

export type MovementPattern = 'Push' | 'Pull' | 'Legs' | 'Core';

export const MOVEMENT_PATTERNS: MovementPattern[] = ['Push', 'Pull', 'Legs', 'Core'];

const PUSH = [
  'Barbell Bench Press',
  'Barbell or Dumbbell Bench Press',
  'Dumbbell Bench Press',
  'Incline Dumbbell Bench Press',
  'Push-Ups',
  'Incline Push-Ups',
  'Push-Ups / Incline Push-Ups',
  'Close-Grip Push-Ups',
  'Close-Grip Push-Ups or Backpack Skull Crushers',
  'Pike Push-Ups',
  'Overhead Dumbbell Shoulder Press',
  'Dumbbell Lateral Raises',
  'Wall Lateral ISO Raises',
  'Wall Lateral ISO Raises or Backpack Raises',
  'Backpack Raises',
  'Bench Dips',
  'Bench Dips or Bodyweight Triceps Extensions',
  'Bodyweight Triceps Extensions',
  'Backpack Skull Crushers',
  'Lying Triceps Extensions (Skull Crushers)',
  'Triceps Cable Pushdowns',
  'Triceps Cable Pushdowns or Overhead Extensions',
  'Overhead Extensions',
];

const PULL = [
  'Barbell Rows',
  'Barbell or Chest-Supported Rows',
  'Chest-Supported Rows',
  'Cable Rows',
  'Seated Cable Row',
  'Single-Arm Dumbbell Rows',
  'Lat Pulldown',
  'Lat Pulldowns',
  'Lat Pulldowns or Cable Rows',
  'Straight-Arm Pulldowns',
  'Straight-Arm Pulldowns or Dumbbell Pullovers',
  'Dumbbell Pullovers',
  'Floor Pullovers',
  'Floor Pullovers or Towel Straight-Arm Pulls',
  'Towel Straight-Arm Pulls',
  'Towel Door Rows',
  'Towel Door Rows or Table Inverted Rows',
  'Table Inverted Rows',
  'Doorframe Towel Rows',
  'Doorframe Towel Rows or Sliding Floor Lat Pulls',
  'Sliding Floor Lat Pulls',
  'Face Pulls',
  'Doorframe Rear Delt Flyes',
  'Doorframe Rear Delt Flyes / Prone Y-T-W Raises',
  'Prone Y-T-W Raises',
  'Dumbbell Biceps Curls',
  'Hammer Curls',
  'Backpack Hammer Curls',
  'Doorframe ISO Curls',
  'Doorframe ISO Curls or Loaded Backpack Curls',
  'Loaded Backpack Curls',
  'Reverse Wrist Curls',
  'Backpack Reverse Wrist Curls',
  'Dumbbell or Barbell Shrugs',
  'Dumbbell Shrugs',
  'Barbell Shrugs',
  'Backpack Shrugs',
];

const LEGS = [
  'Barbell Back Squats',
  'Barbell Back Squats or Goblet Squats',
  'Goblet Squats',
  'Barbell Front Squat',
  'Barbell Front Squat or Goblet Squat',
  'Goblet Squat',
  'Bodyweight Squats',
  'Bodyweight Squats or Tempo Squats',
  'Tempo Squats',
  'Sissy Squats',
  'Bodyweight Step-Ups',
  'Bodyweight Step-Ups or Sissy Squats',
  'Goblet Step-Ups',
  'Bulgarian Split Squats',
  'Bodyweight Bulgarian Split Squats',
  'Walking Lunges',
  'Reverse Lunges',
  'Bodyweight Walking Lunges',
  'Bodyweight Walking or Reverse Lunges',
  'Leg Press',
  'Single-Leg Press',
  'Leg Extension Machine',
  'Leg Extension Machine or Goblet Step-Ups',
  'Leg Curl Machine',
  'Leg Curl Machine or Swiss Ball Hamstring Curls',
  'Swiss Ball Hamstring Curls',
  'Hamstring Walkouts',
  'Romanian Deadlifts (RDLs)',
  'Bodyweight Single-Leg RDLs',
  'Trap Bar Deadlifts',
  'Barbell Conventional Deadlifts',
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts',
  'Heavy Object Deadlifts',
  'Single-Leg Good Mornings',
  'Single-Leg Good Mornings or Heavy Object Deadlifts',
  'Barbell Hip Thrusts',
  'Glute Bridges',
  'Barbell Hip Thrusts or Glute Bridges',
  'Single-Leg Glute Bridges',
  'Standing Calf Raises',
  'Single-Leg Bodyweight Calf Raises',
  'Floor Plate Push (Sled Push Substitute)',
  'Wall Balls',
];

const CORE = [
  'Dead Bugs',
  'Plank Hold',
  'Side Plank',
  'Side Plank or Towel ISO Press',
  'Towel ISO Press',
  'Pallof Press',
  'Hanging Knee Raises',
  'Ab Wheel Rollouts',
  'Hanging Knee Raises or Ab Wheel Rollouts',
  'Floor Leg Raises',
  'Bodyweight Wall Rollouts',
  'Floor Leg Raises or Bodyweight Wall Rollouts',
  "Farmer's Carries",
  'Backpack Carries',
  'Loaded Water Jug Carries',
  'Loaded Water Jug / Backpack Carries',
];

const PATTERN_BY_NAME = new Map<string, MovementPattern>([
  ...PUSH.map((name) => [name, 'Push'] as const),
  ...PULL.map((name) => [name, 'Pull'] as const),
  ...LEGS.map((name) => [name, 'Legs'] as const),
  ...CORE.map((name) => [name, 'Core'] as const),
]);

/** Library muscle groups that imply a pattern for names not in the map above (pilates
 * core holds, glute work in the core circuits). Chest/Back/Shoulders/Arms need the
 * explicit map (arms split into push and pull); Full Body/Cardio/Mobility get no pill. */
const PATTERN_BY_MUSCLE: Record<string, MovementPattern> = {
  Core: 'Core',
  Glutes: 'Legs',
  Quads: 'Legs',
  Hamstrings: 'Legs',
  Calves: 'Legs',
};

/** The movement's pattern, or null when it has none (cardio, conditioning, mobility). */
export function movementPattern(name: string, muscleGroup?: string | null): MovementPattern | null {
  return PATTERN_BY_NAME.get(name) ?? (muscleGroup ? PATTERN_BY_MUSCLE[muscleGroup] ?? null : null);
}

/** Names with an explicit pattern — for the coverage script. */
export function hasExplicitPattern(name: string): boolean {
  return PATTERN_BY_NAME.has(name);
}
