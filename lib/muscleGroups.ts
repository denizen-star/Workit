/** Coarse muscle-group taxonomy for the Alt Exercise picker (docs/plans/PLAN_ALT_EXERCISES.md).
 *
 * Keyed by the exact program `Exercise.name` (lib/workoutData.ts / lib/hyroxProgram.ts) — the
 * same identity `ExerciseTracker` already uses for Gym/Travel mode, weight units, and history
 * lookups (the `gym.name` variable there), so this drops straight into that existing pattern.
 *
 * Deliberately a separate, finer taxonomy from `lib/muscleGuess.ts` (which stays untouched —
 * it backs one unrelated "hard sets by muscle" stat and only needs a coarse guess from a name).
 * This one needs to be exact, since it drives which exercises are offered as swap-in alternatives.
 */

export type MuscleGroup =
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

/** Every muscle group that Alt Exercise actually offers swaps within. Cardio and Mobility
 * exercises (runs, bikes, foam rolling) have nothing sensible to "swap" — same reasoning the
 * exercise never gets an Alt list in lib/altExercises.ts. */
export const ALT_ELIGIBLE_GROUPS: MuscleGroup[] = [
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
];

const MUSCLE_GROUP_BY_EXERCISE: Record<string, MuscleGroup> = {
  '12-Min AMRAP': 'Full Body',
  '15-Min AMRAP': 'Full Body',
  '5K Continuous Run': 'Cardio',
  'Barbell Back Squats or Goblet Squats': 'Quads',
  'Barbell Front Squat or Goblet Squat': 'Quads',
  'Barbell Hip Thrusts or Glute Bridges': 'Glutes',
  'Barbell or Chest-Supported Rows': 'Back',
  'Barbell or Dumbbell Bench Press': 'Chest',
  'Bulgarian Split Squats': 'Quads',
  'Burpee Broad Jumps': 'Full Body',
  Burpees: 'Full Body',
  'Continuous Easy Run': 'Cardio',
  'Dead Bugs': 'Core',
  'Dumbbell Biceps Curls': 'Arms',
  'Dumbbell Lateral Raises': 'Shoulders',
  'Dumbbell or Barbell Shrugs': 'Back',
  'Easy Bike or Walk': 'Cardio',
  'Easy Row (SkiErg or Rower)': 'Cardio',
  'Face Pulls': 'Shoulders',
  "Farmer's Carries": 'Full Body',
  'Floor Plate Push (Sled Push Substitute)': 'Full Body',
  'Foam Rolling + Mobility Flow': 'Mobility',
  'Hammer Curls': 'Arms',
  'Hanging Knee Raises or Ab Wheel Rollouts': 'Core',
  'Incline Dumbbell Bench Press': 'Chest',
  'Lat Pulldown': 'Back',
  'Lat Pulldowns or Cable Rows': 'Back',
  'Leg Curl Machine or Swiss Ball Hamstring Curls': 'Hamstrings',
  'Leg Extension Machine or Goblet Step-Ups': 'Quads',
  'Leg Press': 'Quads',
  'Lying Triceps Extensions (Skull Crushers)': 'Arms',
  'Overhead Dumbbell Shoulder Press': 'Shoulders',
  'Pallof Press': 'Core',
  'Plank Hold': 'Core',
  'Reverse Wrist Curls': 'Arms',
  'Romanian Deadlifts (RDLs)': 'Hamstrings',
  Run: 'Cardio',
  'Seated Cable Row': 'Back',
  'Side Plank': 'Core',
  'Single-Arm Dumbbell Rows': 'Back',
  'Single-Leg Press': 'Quads',
  'Standing Calf Raises': 'Calves',
  'Straight-Arm Pulldowns or Dumbbell Pullovers': 'Back',
  'Trap Bar Deadlifts or Barbell Conventional Deadlifts': 'Hamstrings',
  'Triceps Cable Pushdowns or Overhead Extensions': 'Arms',
  'Walking Lunges': 'Quads',
  'Wall Balls': 'Full Body',
};

export function muscleGroupForExercise(name: string): MuscleGroup | null {
  return MUSCLE_GROUP_BY_EXERCISE[name] ?? null;
}

/** Which `body-muscles` (npm) region ids to highlight for each alt-eligible group, on the
 * anatomical body diagram shown per alternative in the Alt Exercise takeover — the "gym
 * equipment placard" muscle picture. `body-muscles` ships 70+ individually-pathed regions
 * (front + back view) under an Apache-2.0 license; we only need its raw path data
 * (`FRONT_MUSCLES`/`BACK_MUSCLES`), rendered by `components/MuscleDiagram.tsx`, not its
 * bundled interactive `BodyChart` class. "Full Body" highlights every region in both views —
 * there's no single subset that reads as "whole body" otherwise. */
export const MUSCLE_GROUP_HIGHLIGHT_IDS: Record<MuscleGroup, string[]> = {
  Chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  Back: [
    'lats-upper-left',
    'lats-mid-left',
    'lats-lower-left',
    'lats-upper-right',
    'lats-mid-right',
    'lats-lower-right',
    'lower-back-erectors-left',
    'lower-back-ql-left',
    'lower-back-erectors-right',
    'lower-back-ql-right',
  ],
  Shoulders: [
    'shoulder-front-left',
    'shoulder-side-left',
    'shoulder-front-right',
    'shoulder-side-right',
    'deltoid-rear-left',
    'deltoid-rear-right',
    'traps-upper-left',
    'traps-mid-left',
    'traps-lower-left',
    'traps-upper-right',
    'traps-mid-right',
    'traps-lower-right',
  ],
  Arms: [
    'biceps-left',
    'biceps-right',
    'forearm-left',
    'forearm-right',
    'triceps-long-left',
    'triceps-lateral-left',
    'triceps-long-right',
    'triceps-lateral-right',
    'forearm-flexors-left',
    'forearm-extensors-left',
    'forearm-flexors-right',
    'forearm-extensors-right',
  ],
  Core: [
    'abs-upper-left',
    'abs-upper-right',
    'abs-lower-left',
    'abs-lower-right',
    'obliques-left',
    'obliques-right',
    'serratus-anterior-left',
    'serratus-anterior-right',
  ],
  Glutes: ['gluteus-medius-left', 'gluteus-maximus-left', 'gluteus-medius-right', 'gluteus-maximus-right'],
  Quads: ['quads-left', 'quads-right', 'adductors-left', 'adductors-right'],
  Hamstrings: ['hamstrings-medial-left', 'hamstrings-lateral-left', 'hamstrings-medial-right', 'hamstrings-lateral-right'],
  Calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-lateral-left',
    'calves-soleus-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-right',
    'calves-soleus-right',
    'tibialis-anterior-left',
    'tibialis-anterior-right',
  ],
  'Full Body': [], // resolved to "every region" by MuscleDiagram directly
  Cardio: [],
  Mobility: [],
};
