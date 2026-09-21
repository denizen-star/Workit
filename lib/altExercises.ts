/** Curated Alt Exercise shortlists (docs/plans/PLAN_ALT_EXERCISES.md) — a first draft by Claude,
 * pending Kevin's review, not yet verified against real equipment/difficulty parity.
 *
 * Each entry is 3-5 alternatives in the same `lib/muscleGroups.ts` group as the key, drawn from
 * other real movement names already in the main program or Hyrox catalog (so every alt already
 * has form photos via `lib/exerciseImages.ts` / `lib/exerciseMedia.ts` and needs no new content).
 * A combined "X or Y" key excludes its own two halves from its own alt list — picking the other
 * half of your own exercise isn't a real alternative.
 *
 * Cardio and Mobility exercises (runs, bikes, foam rolling) and fixed-format conditioning blocks
 * (the AMRAPs) intentionally have no entry here — nothing to meaningfully swap a timed protocol
 * for. `altsForExercise` returns `[]` for those, and the UI hides the Alt control when it does.
 *
 * Glutes and Calves are thin pools in the current program (2-3 movements total) — worth Kevin
 * expanding before this ships, since some entries below only have one real alternative to offer.
 */

export const ALT_EXERCISES: Record<string, string[]> = {
  'Barbell Back Squats or Goblet Squats': ['Bulgarian Split Squats', 'Leg Press', 'Leg Extension Machine', 'Walking Lunges', 'Bodyweight Squats'],
  'Barbell Front Squat or Goblet Squat': ['Barbell Back Squats', 'Bulgarian Split Squats', 'Leg Press', 'Walking Lunges', 'Bodyweight Squats'],
  'Barbell Hip Thrusts or Glute Bridges': ['Single-Leg Glute Bridges'],
  'Barbell or Chest-Supported Rows': ['Single-Arm Dumbbell Rows', 'Cable Rows', 'Seated Cable Row', 'Lat Pulldowns', 'Towel Door Rows'],
  'Barbell or Dumbbell Bench Press': ['Incline Dumbbell Bench Press', 'Push-Ups', 'Incline Push-Ups'],
  'Bulgarian Split Squats': ['Barbell Back Squats', 'Leg Press', 'Walking Lunges', 'Reverse Lunges'],
  'Burpee Broad Jumps': ['Burpees', 'Wall Balls', "Farmer's Carries", 'Loaded Water Jug Carries'],
  Burpees: ['Burpee Broad Jumps', 'Wall Balls', "Farmer's Carries", 'Loaded Water Jug Carries'],
  'Dead Bugs': ['Plank Hold', 'Side Plank', 'Pallof Press', 'Hanging Knee Raises'],
  'Dumbbell Biceps Curls': ['Hammer Curls', 'Doorframe ISO Curls', 'Loaded Backpack Curls', 'Backpack Hammer Curls'],
  'Dumbbell Lateral Raises': ['Wall Lateral ISO Raises', 'Backpack Raises', 'Face Pulls', 'Overhead Dumbbell Shoulder Press'],
  'Dumbbell or Barbell Shrugs': ['Backpack Shrugs', 'Lat Pulldowns', 'Single-Arm Dumbbell Rows'],
  'Face Pulls': ['Dumbbell Lateral Raises', 'Doorframe Rear Delt Flyes', 'Prone Y-T-W Raises', 'Overhead Dumbbell Shoulder Press'],
  "Farmer's Carries": ['Loaded Water Jug Carries', 'Backpack Carries', 'Wall Balls'],
  'Floor Plate Push (Sled Push Substitute)': ['Wall Balls', 'Burpees', "Farmer's Carries", 'Loaded Water Jug Carries'],
  'Hammer Curls': ['Dumbbell Biceps Curls', 'Doorframe ISO Curls', 'Loaded Backpack Curls', 'Backpack Hammer Curls'],
  'Hanging Knee Raises or Ab Wheel Rollouts': ['Plank Hold', 'Dead Bugs', 'Side Plank', 'Pallof Press'],
  'Incline Dumbbell Bench Press': ['Barbell Bench Press', 'Dumbbell Bench Press', 'Push-Ups'],
  'Lat Pulldown': ['Straight-Arm Pulldowns', 'Seated Cable Row', 'Cable Rows', 'Single-Arm Dumbbell Rows', 'Towel Door Rows'],
  'Lat Pulldowns or Cable Rows': ['Seated Cable Row', 'Single-Arm Dumbbell Rows', 'Barbell Rows', 'Chest-Supported Rows', 'Towel Door Rows'],
  'Leg Curl Machine or Swiss Ball Hamstring Curls': ['Romanian Deadlifts (RDLs)', 'Trap Bar Deadlifts', 'Hamstring Walkouts', 'Bodyweight Single-Leg RDLs'],
  'Leg Extension Machine or Goblet Step-Ups': ['Barbell Back Squats', 'Leg Press', 'Bulgarian Split Squats', 'Walking Lunges', 'Bodyweight Squats'],
  'Leg Press': ['Barbell Back Squats', 'Bulgarian Split Squats', 'Leg Extension Machine', 'Single-Leg Press', 'Bodyweight Squats'],
  'Lying Triceps Extensions (Skull Crushers)': ['Triceps Cable Pushdowns', 'Overhead Extensions', 'Bench Dips', 'Close-Grip Push-Ups'],
  'Overhead Dumbbell Shoulder Press': ['Pike Push-Ups', 'Dumbbell Lateral Raises', 'Face Pulls', 'Wall Lateral ISO Raises'],
  'Pallof Press': ['Plank Hold', 'Side Plank', 'Dead Bugs', 'Towel ISO Press'],
  'Plank Hold': ['Side Plank', 'Dead Bugs', 'Pallof Press', 'Hanging Knee Raises'],
  'Reverse Wrist Curls': ['Backpack Reverse Wrist Curls', 'Dumbbell Biceps Curls', 'Hammer Curls'],
  'Romanian Deadlifts (RDLs)': ['Trap Bar Deadlifts', 'Leg Curl Machine', 'Single-Leg Good Mornings', 'Hamstring Walkouts'],
  'Seated Cable Row': ['Lat Pulldown', 'Single-Arm Dumbbell Rows', 'Cable Rows', 'Barbell Rows', 'Towel Door Rows'],
  'Side Plank': ['Plank Hold', 'Dead Bugs', 'Pallof Press', 'Hanging Knee Raises'],
  'Single-Arm Dumbbell Rows': ['Cable Rows', 'Seated Cable Row', 'Barbell Rows', 'Chest-Supported Rows', 'Towel Door Rows'],
  'Single-Leg Press': ['Leg Press', 'Barbell Back Squats', 'Bulgarian Split Squats', 'Walking Lunges', 'Bodyweight Squats'],
  'Standing Calf Raises': ['Single-Leg Bodyweight Calf Raises'],
  'Straight-Arm Pulldowns or Dumbbell Pullovers': ['Lat Pulldowns', 'Cable Rows', 'Single-Arm Dumbbell Rows', 'Seated Cable Row', 'Towel Door Rows'],
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts': ['Romanian Deadlifts (RDLs)', 'Leg Curl Machine', 'Single-Leg Good Mornings', 'Hamstring Walkouts'],
  'Triceps Cable Pushdowns or Overhead Extensions': ['Lying Triceps Extensions (Skull Crushers)', 'Bench Dips', 'Close-Grip Push-Ups', 'Backpack Skull Crushers'],
  'Walking Lunges': ['Reverse Lunges', 'Bulgarian Split Squats', 'Barbell Back Squats', 'Leg Press'],
  'Wall Balls': ['Burpees', 'Burpee Broad Jumps', "Farmer's Carries", 'Loaded Water Jug Carries'],
};

export function altsForExercise(name: string): string[] {
  return ALT_EXERCISES[name] ?? [];
}
