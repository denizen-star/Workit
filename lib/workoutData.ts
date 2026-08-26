// Complete 6-week workout program data structure

import { toTravelExercise } from '@/lib/travelExercises';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  videoUrl?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  focus: string;
  suggestedDay: string;
  exercises: Exercise[];
  /** Optional extra day. Never a nudge / Home "Today" target after the week is locked. */
  bonus?: boolean;
}

const COMPOUND_BUILD = 'Add 2.5-5 lb or 1-2 reps';
const COMPOUND_PEAK = 'Match or beat week 4';
const TEMPO_LOWER = '2-second pause or slow lower';

function bonusUpper(core: Exercise): WorkoutDay {
  return {
    dayNumber: 5,
    name: 'Bonus Upper',
    focus: 'Traps, Arms & Core',
    suggestedDay: 'Saturday',
    bonus: true,
    exercises: [
      { name: 'Dumbbell or Barbell Shrugs', sets: 3, reps: '12-15' },
      { name: 'Straight-Arm Pulldowns or Dumbbell Pullovers', sets: 3, reps: '10-12' },
      { name: 'Lying Triceps Extensions (Skull Crushers)', sets: 3, reps: '10-12' },
      { name: 'Hammer Curls', sets: 3, reps: '10-12' },
      { name: 'Reverse Wrist Curls', sets: 3, reps: '12-15' },
      core,
    ],
  };
}

export interface WeekPlan {
  weekNumber: number;
  description: string;
  days: WorkoutDay[];
}

export const workoutProgram: WeekPlan[] = [
  // Weeks 1-2: Adaptation
  {
    weekNumber: 1,
    description: "Adaptation - Use conservative weights. Focus on learning rhythm and form.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: "Focus on controlled movement" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: "Engage back muscles" },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10" },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 3, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "45 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10" },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10" },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg" },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 3, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "12 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10" },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 3, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "10-12" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8" },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg" },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12" },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 3, reps: "40-meter walk" }
        ]
      }
    ]
  },
  {
    weekNumber: 2,
    description: "Adaptation - Continue conservative weights. Focus on form.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: "Focus on controlled movement" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: "Engage back muscles" },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10" },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 3, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "45 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10" },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10" },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg" },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 3, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "12 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10" },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 3, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "10-12" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8" },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg" },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12" },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 3, reps: "40-meter walk" }
        ]
      }
    ]
  },
  // Weeks 3-4: Building
  {
    weekNumber: 3,
    description: "Building - Add 2.5-5 lbs to compound lifts or 1-2 reps per set.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: COMPOUND_BUILD },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 3, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "60 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg" },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 3, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "15 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 3, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "12-15" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8", notes: COMPOUND_BUILD },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg", notes: COMPOUND_BUILD },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12", notes: COMPOUND_BUILD },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 3, reps: "50-meter walk" }
        ]
      },
      bonusUpper({ name: "Dead Bugs", sets: 3, reps: "8 per side" })
    ]
  },
  {
    weekNumber: 4,
    description: "Building - Continue progressive overload.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: COMPOUND_BUILD },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 4, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "60 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg" },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 4, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "15 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 4, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "12-15" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8", notes: COMPOUND_BUILD },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg", notes: COMPOUND_BUILD },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12", notes: COMPOUND_BUILD },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 4, reps: "50-meter walk" }
        ]
      },
      bonusUpper({ name: "Dead Bugs", sets: 3, reps: "8 per side" })
    ]
  },
  {
    weekNumber: 5,
    description: "Building - Continue progressive overload.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: COMPOUND_BUILD },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 3, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "60 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10", notes: TEMPO_LOWER },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10", notes: TEMPO_LOWER },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg", notes: TEMPO_LOWER },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 3, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "15 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10", notes: COMPOUND_BUILD },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 3, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "12-15" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8", notes: COMPOUND_BUILD },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg", notes: TEMPO_LOWER },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12", notes: COMPOUND_BUILD },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 3, reps: "50-meter walk" }
        ]
      },
      bonusUpper({ name: "Side Plank", sets: 3, reps: "30 seconds" })
    ]
  },
  // Week 6: Peak
  {
    weekNumber: 6,
    description: "Peak & Baseline - Aim to match or beat Week 4 strength levels.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm", notes: COMPOUND_PEAK },
          { name: "Overhead Dumbbell Shoulder Press", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Lat Pulldowns or Cable Rows", sets: 3, reps: "10-12" },
          { name: "Triceps Cable Pushdowns or Overhead Extensions", sets: 3, reps: "12-15" },
          { name: "Plank Hold", sets: 3, reps: "60 seconds" }
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body A",
        focus: "Quad & Glute Focus",
        suggestedDay: "Tuesday",
        exercises: [
          { name: "Barbell Back Squats or Goblet Squats", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Romanian Deadlifts (RDLs)", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Walking Lunges", sets: 3, reps: "10 steps per leg" },
          { name: "Leg Curl Machine or Swiss Ball Hamstring Curls", sets: 3, reps: "12-15" },
          { name: "Standing Calf Raises", sets: 3, reps: "15" },
          { name: "Pallof Press", sets: 3, reps: "15 per side" }
        ]
      },
      {
        dayNumber: 3,
        name: "Upper Body B",
        focus: "Pull & Shoulder Focus",
        suggestedDay: "Thursday",
        exercises: [
          { name: "Incline Dumbbell Bench Press", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Barbell or Chest-Supported Rows", sets: 3, reps: "8-10", notes: COMPOUND_PEAK },
          { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15" },
          { name: "Face Pulls", sets: 3, reps: "12-15" },
          { name: "Dumbbell Biceps Curls", sets: 3, reps: "12" },
          { name: "Hanging Knee Raises or Ab Wheel Rollouts", sets: 3, reps: "12-15" }
        ]
      },
      {
        dayNumber: 4,
        name: "Lower Body B",
        focus: "Posterior Chain & Unilateral",
        suggestedDay: "Friday",
        exercises: [
          { name: "Trap Bar Deadlifts or Barbell Conventional Deadlifts", sets: 3, reps: "6-8", notes: COMPOUND_PEAK },
          { name: "Bulgarian Split Squats", sets: 3, reps: "8-10 per leg", notes: COMPOUND_PEAK },
          { name: "Barbell Hip Thrusts or Glute Bridges", sets: 3, reps: "10-12", notes: COMPOUND_PEAK },
          { name: "Leg Extension Machine or Goblet Step-Ups", sets: 3, reps: "12-15" },
          { name: "Farmer's Carries", sets: 3, reps: "50-meter walk" }
        ]
      },
      bonusUpper({ name: "Side Plank", sets: 3, reps: "45 seconds" })
    ]
  }
];

export function getWeekPlan(weekNumber: number): WeekPlan | undefined {
  return workoutProgram.find(week => week.weekNumber === weekNumber);
}

export function getWorkoutDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const week = getWeekPlan(weekNumber);
  return week?.days.find(day => day.dayNumber === dayNumber);
}

export function applyExerciseMode(exercise: Exercise, mode: WorkoutMode | unknown): Exercise {
  return normalizeWorkoutMode(mode) === 'travel' ? toTravelExercise(exercise) : exercise;
}

export function applyWorkoutMode(day: WorkoutDay, mode: WorkoutMode | unknown): WorkoutDay {
  if (normalizeWorkoutMode(mode) !== 'travel') return day;
  return {
    ...day,
    exercises: day.exercises.map((exercise) => applyExerciseMode(exercise, 'travel')),
  };
}

export function getWorkoutDayForMode(
  weekNumber: number,
  dayNumber: number,
  mode: WorkoutMode | unknown
): WorkoutDay | undefined {
  const day = getWorkoutDay(weekNumber, dayNumber);
  return day ? applyWorkoutMode(day, mode) : undefined;
}
