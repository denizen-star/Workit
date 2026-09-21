import { ALT_EXERCISES } from '@/lib/altExercises';
import { muscleGroupForExercise } from '@/lib/muscleGroups';
import { toTravelExercise } from '@/lib/travelExercises';
import { workoutProgram } from '@/lib/workoutData';
import { hyroxProgram } from '@/lib/hyroxProgram';

// Same combo-split table used to build the movement catalog — the definitive list of which
// atomic names are "travel" (bodyweight/no-equipment) movements, derived the same way as
// docs/plans' Movement Library artifact, not retyped by hand.
const COMBO_SPLITS: Record<string, [string, string]> = {
  'Barbell Back Squats or Goblet Squats': ['Barbell Back Squats', 'Goblet Squats'],
  'Barbell Front Squat or Goblet Squat': ['Barbell Front Squat', 'Goblet Squat'],
  'Barbell Hip Thrusts or Glute Bridges': ['Barbell Hip Thrusts', 'Glute Bridges'],
  'Barbell or Chest-Supported Rows': ['Barbell Rows', 'Chest-Supported Rows'],
  'Barbell or Dumbbell Bench Press': ['Barbell Bench Press', 'Dumbbell Bench Press'],
  'Bench Dips or Bodyweight Triceps Extensions': ['Bench Dips', 'Bodyweight Triceps Extensions'],
  'Bodyweight Squats or Tempo Squats': ['Bodyweight Squats', 'Tempo Squats'],
  'Bodyweight Step-Ups or Sissy Squats': ['Bodyweight Step-Ups', 'Sissy Squats'],
  'Bodyweight Walking or Reverse Lunges': ['Bodyweight Walking Lunges', 'Reverse Lunges'],
  'Close-Grip Push-Ups or Backpack Skull Crushers': ['Close-Grip Push-Ups', 'Backpack Skull Crushers'],
  'Doorframe ISO Curls or Loaded Backpack Curls': ['Doorframe ISO Curls', 'Loaded Backpack Curls'],
  'Doorframe Rear Delt Flyes / Prone Y-T-W Raises': ['Doorframe Rear Delt Flyes', 'Prone Y-T-W Raises'],
  'Doorframe Towel Rows or Sliding Floor Lat Pulls': ['Doorframe Towel Rows', 'Sliding Floor Lat Pulls'],
  'Dumbbell or Barbell Shrugs': ['Dumbbell Shrugs', 'Barbell Shrugs'],
  'Floor Leg Raises or Bodyweight Wall Rollouts': ['Floor Leg Raises', 'Bodyweight Wall Rollouts'],
  'Floor Pullovers or Towel Straight-Arm Pulls': ['Floor Pullovers', 'Towel Straight-Arm Pulls'],
  'Hanging Knee Raises or Ab Wheel Rollouts': ['Hanging Knee Raises', 'Ab Wheel Rollouts'],
  'Lat Pulldowns or Cable Rows': ['Lat Pulldowns', 'Cable Rows'],
  'Leg Curl Machine or Swiss Ball Hamstring Curls': ['Leg Curl Machine', 'Swiss Ball Hamstring Curls'],
  'Leg Extension Machine or Goblet Step-Ups': ['Leg Extension Machine', 'Goblet Step-Ups'],
  'Loaded Water Jug / Backpack Carries': ['Loaded Water Jug Carries', 'Backpack Carries'],
  'Push-Ups / Incline Push-Ups': ['Push-Ups', 'Incline Push-Ups'],
  'Side Plank or Towel ISO Press': ['Side Plank', 'Towel ISO Press'],
  'Single-Leg Good Mornings or Heavy Object Deadlifts': ['Single-Leg Good Mornings', 'Heavy Object Deadlifts'],
  'Straight-Arm Pulldowns or Dumbbell Pullovers': ['Straight-Arm Pulldowns', 'Dumbbell Pullovers'],
  'Towel Door Rows or Table Inverted Rows': ['Towel Door Rows', 'Table Inverted Rows'],
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts': ['Trap Bar Deadlifts', 'Barbell Conventional Deadlifts'],
  'Triceps Cable Pushdowns or Overhead Extensions': ['Triceps Cable Pushdowns', 'Overhead Extensions'],
  'Wall Lateral ISO Raises or Backpack Raises': ['Wall Lateral ISO Raises', 'Backpack Raises'],
};

function splitAtomic(name: string): string[] {
  return COMBO_SPLITS[name] ?? [name];
}

const travelNames = new Set<string>();
for (const week of workoutProgram) {
  for (const day of week.days) {
    for (const exercise of day.exercises) {
      const travel = toTravelExercise(exercise);
      if (travel.name !== exercise.name) {
        for (const atomic of splitAtomic(travel.name)) travelNames.add(atomic);
      }
    }
  }
}

process.stdout.write('TRAVEL_FRIENDLY_NAMES:\n' + [...travelNames].sort().join('\n') + '\n\n');

for (const [key, alts] of Object.entries(ALT_EXERCISES)) {
  const group = muscleGroupForExercise(key);
  const hasTravel = alts.some((a) => travelNames.has(a));
  if (!hasTravel) {
    process.stdout.write(`MISSING (${group}): ${key} -> [${alts.join(', ')}]\n`);
  }
}
