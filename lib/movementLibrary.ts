/** The Library (`/library`, docs — see CLAUDE.md) — every distinct movement across the app,
 * grouped by muscle group, computed once at module load the same way `lib/workoutData.ts`
 * computes `workoutProgram` — not recomputed per request.
 *
 * This is a finer-grained catalog than `lib/muscleGroups.ts` (which only tags the 47 raw
 * program `Exercise.name`s for Alt Exercise). Combined "X or Y" program entries are split
 * into their two real movements here, each shown as its own card pointing back to its pair —
 * the same split table Alt Exercise's content was cross-checked against, promoted from
 * `scripts/export-full-catalog.ts` to a shared module so nothing keeps two copies of it.
 */
import { programWithRetiredDays } from './workoutData';
import { hyroxProgram } from './hyroxProgram';
import { toTravelExercise } from './travelExercises';
import { getExerciseImages } from './exerciseImages';
import { getExerciseMedia } from './exerciseMedia';
import { guidedOptionalCircuit, guidedYogaCircuit, absCircuit } from './optionalCircuits';
import type { OptionalLevel, OptionalRegion, OptionalSlot } from './optionals';

export type MovementGroup = 'main' | 'hyrox' | 'optional-stretch-core' | 'optional-yoga' | 'optional-abs';
export type MovementMode = 'gym' | 'travel' | 'bodyweight';

/** Same 12-group taxonomy as lib/muscleGroups.ts's `MuscleGroup`, but this file tags every
 * atomic movement name (180 of them), not just the 47 raw program exercise names. */
export type LibraryMuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Glutes'
  | 'Quads'
  | 'Hamstrings'
  | 'Calves'
  | 'Full Body'
  | 'Cardio'
  | 'Mobility';

export type MovementEntry = {
  name: string;
  group: MovementGroup;
  mode: MovementMode;
  muscleGroup: LibraryMuscleGroup;
  category: string;
  pairedWith: string | null;
  occurrences: number;
  start: string;
  end?: string;
};

/** Every "X or Y" / "X / Y" combo name in the program, split into its two real movements —
 * hand-verified against the live data (scripts/list-combo-names.ts), not a guessed regex:
 * a generic "shared suffix" heuristic mis-splits "Barbell Hip Thrusts or Glute Bridges" (two
 * already-complete names) differently than "Barbell or Dumbbell Bench Press" (a bare
 * equipment prefix needing the suffix from its pair). */
export const COMBO_SPLITS: Record<string, [string, string]> = {
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
  'Easy Bike or Walk': ['Easy Bike', 'Easy Walk'],
  'Easy Row (SkiErg or Rower)': ['Easy Row (SkiErg)', 'Easy Row (Rower)'],
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

function splitAtomic(name: string): [string, string | null][] {
  const pair = COMBO_SPLITS[name];
  if (!pair) return [[name, null]];
  return [
    [pair[0], pair[1]],
    [pair[1], pair[0]],
  ];
}

/** Muscle group per atomic movement name (180 entries — every split half, optional-circuit
 * hold, yoga pose, and Hyrox-only movement). Separate from `lib/muscleGroups.ts`'s 47-entry,
 * combo-level map, which Alt Exercise uses — different granularity, different consumer. */
const ATOMIC_MUSCLE_GROUP: Record<string, LibraryMuscleGroup> = {
  '12-Min AMRAP': 'Full Body', '15-Min AMRAP': 'Full Body', '5K Continuous Run': 'Cardio',
  'Barbell Front Squat': 'Quads', 'Burpee Broad Jumps': 'Full Body', 'Burpees': 'Full Body',
  'Continuous Easy Run': 'Cardio', 'Easy Bike': 'Cardio', 'Easy Row (Rower)': 'Cardio',
  'Easy Row (SkiErg)': 'Cardio', 'Easy Walk': 'Cardio',
  'Floor Plate Push (Sled Push Substitute)': 'Full Body', 'Foam Rolling + Mobility Flow': 'Mobility',
  'Goblet Squat': 'Quads', 'Lat Pulldown': 'Back', 'Leg Press': 'Quads', 'Run': 'Cardio',
  'Seated Cable Row': 'Back', 'Single-Leg Press': 'Quads', 'Wall Balls': 'Full Body',
  'Ab Wheel Rollouts': 'Core', 'Backpack Carries': 'Full Body', 'Backpack Hammer Curls': 'Arms',
  'Backpack Raises': 'Shoulders', 'Backpack Reverse Wrist Curls': 'Arms', 'Backpack Shrugs': 'Back',
  'Backpack Skull Crushers': 'Arms', 'Barbell Back Squats': 'Quads', 'Barbell Bench Press': 'Chest',
  'Barbell Conventional Deadlifts': 'Hamstrings', 'Barbell Hip Thrusts': 'Glutes', 'Barbell Rows': 'Back',
  'Barbell Shrugs': 'Back', 'Bench Dips': 'Arms', 'Bodyweight Bulgarian Split Squats': 'Quads',
  'Bodyweight Single-Leg RDLs': 'Hamstrings', 'Bodyweight Squats': 'Quads', 'Bodyweight Step-Ups': 'Quads',
  'Bodyweight Triceps Extensions': 'Arms', 'Bodyweight Walking Lunges': 'Quads', 'Bodyweight Wall Rollouts': 'Core',
  'Bulgarian Split Squats': 'Quads', 'Cable Rows': 'Back', 'Chest-Supported Rows': 'Back',
  'Close-Grip Push-Ups': 'Arms', 'Dead Bugs': 'Core', 'Doorframe ISO Curls': 'Arms',
  'Doorframe Rear Delt Flyes': 'Shoulders', 'Doorframe Towel Rows': 'Back', 'Dumbbell Bench Press': 'Chest',
  'Dumbbell Biceps Curls': 'Arms', 'Dumbbell Lateral Raises': 'Shoulders', 'Dumbbell Pullovers': 'Back',
  'Dumbbell Shrugs': 'Back', 'Face Pulls': 'Shoulders', "Farmer's Carries": 'Full Body',
  'Floor Leg Raises': 'Core', 'Floor Pullovers': 'Back', 'Glute Bridges': 'Glutes', 'Goblet Squats': 'Quads',
  'Goblet Step-Ups': 'Quads', 'Hammer Curls': 'Arms', 'Hamstring Walkouts': 'Hamstrings',
  'Hanging Knee Raises': 'Core', 'Heavy Object Deadlifts': 'Hamstrings', 'Incline Dumbbell Bench Press': 'Chest',
  'Incline Push-Ups': 'Chest', 'Lat Pulldowns': 'Back', 'Leg Curl Machine': 'Hamstrings',
  'Leg Extension Machine': 'Quads', 'Loaded Backpack Curls': 'Arms', 'Loaded Water Jug Carries': 'Full Body',
  'Lying Triceps Extensions (Skull Crushers)': 'Arms', 'Overhead Dumbbell Shoulder Press': 'Shoulders',
  'Overhead Extensions': 'Arms', 'Pallof Press': 'Core', 'Pike Push-Ups': 'Shoulders', 'Plank Hold': 'Core',
  'Prone Y-T-W Raises': 'Shoulders', 'Push-Ups': 'Chest', 'Reverse Lunges': 'Quads',
  'Reverse Wrist Curls': 'Arms', 'Romanian Deadlifts (RDLs)': 'Hamstrings', 'Side Plank': 'Core',
  'Single-Arm Dumbbell Rows': 'Back', 'Single-Leg Bodyweight Calf Raises': 'Calves',
  'Single-Leg Glute Bridges': 'Glutes', 'Single-Leg Good Mornings': 'Hamstrings', 'Sissy Squats': 'Quads',
  'Sliding Floor Lat Pulls': 'Back', 'Standing Calf Raises': 'Calves', 'Straight-Arm Pulldowns': 'Back',
  'Swiss Ball Hamstring Curls': 'Hamstrings', 'Table Inverted Rows': 'Back', 'Tempo Squats': 'Quads',
  'Towel Door Rows': 'Back', 'Towel ISO Press': 'Core', 'Towel Straight-Arm Pulls': 'Back',
  'Trap Bar Deadlifts': 'Hamstrings', 'Triceps Cable Pushdowns': 'Arms', 'Walking Lunges': 'Quads',
  'Wall Lateral ISO Raises': 'Shoulders',
  'Bicycle Crunches': 'Core', 'Forearm Plank': 'Core', 'Reverse Crunches': 'Core', 'Russian Twists': 'Core',
  'Adductors': 'Quads', 'Bear hold': 'Core', 'Bird dog': 'Core', 'Boat': 'Core', 'Breathe down': 'Core',
  'Butterfly': 'Mobility', 'Calves': 'Calves', 'Cat-cow': 'Mobility', 'Chest': 'Chest',
  "Child's pose": 'Mobility', 'Clams': 'Glutes', 'Cow-face arms': 'Shoulders', 'Criss-cross': 'Core',
  'Dead bug': 'Core', 'Double-leg stretch': 'Core', 'Down dog': 'Mobility', 'Down dog to puppy': 'Mobility',
  'Eagle arms': 'Shoulders', 'Easy hollow': 'Core', 'Easy side plank': 'Core', 'Figure-four': 'Glutes',
  'Frog to fold': 'Mobility', 'Glute bridge': 'Glutes', 'Half split': 'Hamstrings', 'Hamstrings': 'Hamstrings',
  'Heel taps': 'Core', 'Hip flexors': 'Quads', 'Lats': 'Back', 'Lizard': 'Mobility', 'Long puppy': 'Mobility',
  'Low lunge': 'Mobility', 'Low lunge reach': 'Mobility', 'Marching bridge': 'Glutes', 'Mermaid': 'Mobility',
  'Neck': 'Mobility', 'Pigeon': 'Glutes', 'Pilates breath': 'Core', 'Puppy pose': 'Mobility', 'Quads': 'Quads',
  'Reclined pigeon': 'Glutes', 'Rest': 'Mobility', 'Roll-up': 'Core', 'Saw': 'Core', 'Shoulder bridge': 'Glutes',
  'Shoulders': 'Shoulders', 'Side kick series': 'Glutes', 'Side-lying hold': 'Core', 'Side-lying kick': 'Glutes',
  'Single-leg bridge': 'Glutes', 'Single-leg stretch': 'Core', 'Supine twist': 'Mobility', 'Teaser prep': 'Core',
  'The hundred': 'Core', 'Thoracic': 'Back', 'Thread-the-needle': 'Mobility', 'Toe taps': 'Core', 'Wrists': 'Arms',
  'Cat-Cow': 'Mobility', 'Chair Pose Pulses': 'Mobility', "Child's Pose": 'Mobility',
  'Down Dog to Low Lunge Flow': 'Mobility', 'Downward-Facing Dog': 'Mobility',
  'Dynamic Low Lunge with Arm Reaches': 'Mobility', 'Happy Baby Pose': 'Mobility',
  'Legs-Up-the-Wall': 'Mobility', 'Low Lunge Flow': 'Mobility',
  'Reclining Pigeon Pose (Thread the Needle)': 'Mobility', 'Seated Forward Fold': 'Mobility',
  'Standing Figure-Four': 'Mobility', 'Standing Forward Fold with Ragdoll Sway': 'Mobility',
  'Sun Salutation A Flow': 'Mobility', 'Supine Figure-Four Twist': 'Mobility', 'Supine Spinal Twist': 'Mobility',
  'Wide-Leg Forward Fold': 'Mobility',
};

function buildLibrary(): MovementEntry[] {
  const rows = new Map<string, MovementEntry>();

  function addExercise(originalName: string, group: MovementGroup, mode: MovementMode, category: string) {
    for (const [atomicName, pairedWith] of splitAtomic(originalName)) {
      const existing = rows.get(atomicName);
      if (existing) {
        existing.occurrences += 1;
        continue;
      }
      const muscleGroup = ATOMIC_MUSCLE_GROUP[atomicName] ?? 'Full Body';
      const fx = getExerciseImages(atomicName) ?? getExerciseImages(originalName);
      if (fx) {
        rows.set(atomicName, {
          name: atomicName,
          group,
          mode,
          muscleGroup,
          category,
          pairedWith,
          occurrences: 1,
          start: fx.start,
          end: fx.end,
        });
        continue;
      }
      const media = getExerciseMedia(atomicName);
      rows.set(atomicName, {
        name: atomicName,
        group,
        mode,
        muscleGroup,
        category,
        pairedWith,
        occurrences: 1,
        start: media.images[0],
      });
    }
  }

  // Retired days too (bonus, Extra Upper): their movements live on in Your pick packs.
  for (const week of programWithRetiredDays) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        addExercise(exercise.name, 'main', 'gym', day.name);
        const travel = toTravelExercise(exercise);
        if (travel.name !== exercise.name) {
          addExercise(travel.name, 'main', 'travel', day.name);
        }
      }
    }
  }

  for (const week of hyroxProgram) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        addExercise(exercise.name, 'hyrox', 'gym', day.name);
      }
    }
  }

  const slots: OptionalSlot[] = ['warmup', 'cooldown'];
  const regions: OptionalRegion[] = ['upper', 'lower'];
  const levels: OptionalLevel[] = ['easy', 'medium', 'hard'];
  const dayNames = ['Upper Body A', 'Upper Body B', 'Lower Body A', 'Lower Body B'];

  for (const track of ['stretch', 'core'] as const) {
    for (const slot of slots) {
      for (const region of regions) {
        for (const level of levels) {
          for (const dayName of dayNames) {
            const steps = guidedOptionalCircuit(slot, track, region, level, dayName);
            for (const step of steps) {
              const existing = rows.get(step.title);
              if (existing) {
                existing.occurrences += 1;
                continue;
              }
              rows.set(step.title, {
                name: step.title,
                group: 'optional-stretch-core',
                mode: 'bodyweight',
                muscleGroup: ATOMIC_MUSCLE_GROUP[step.title] ?? 'Mobility',
                category: `${track === 'stretch' ? 'Stretch' : 'Core'} · ${region === 'upper' ? 'Upper' : 'Lower'}`,
                pairedWith: null,
                occurrences: 1,
                start: step.start ?? '',
                end: step.end,
              });
            }
          }
        }
      }
    }
  }

  for (const slot of slots) {
    for (const region of regions) {
      const steps = guidedYogaCircuit(slot, region);
      for (const step of steps) {
        const existing = rows.get(step.title);
        if (existing) {
          existing.occurrences += 1;
          continue;
        }
        rows.set(step.title, {
          name: step.title,
          group: 'optional-yoga',
          mode: 'bodyweight',
          muscleGroup: 'Mobility',
          category: `Yoga · ${slot === 'warmup' ? 'Warmup' : 'Cooldown'} · ${region === 'upper' ? 'Upper' : 'Lower'}`,
          pairedWith: null,
          occurrences: 1,
          start: step.start ?? '',
          end: step.end,
        });
      }
    }
  }

  for (const step of absCircuit()) {
    const existing = rows.get(step.title);
    if (existing) {
      existing.occurrences += 1;
      continue;
    }
    rows.set(step.title, {
      name: step.title,
      group: 'optional-abs',
      mode: 'bodyweight',
      muscleGroup: 'Core',
      category: 'Abs',
      pairedWith: null,
      occurrences: 1,
      start: step.start ?? '',
      end: step.end,
    });
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const MOVEMENT_LIBRARY: MovementEntry[] = buildLibrary();

export const LIBRARY_MUSCLE_GROUPS: LibraryMuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves',
  'Full Body',
  'Cardio',
  'Mobility',
];
