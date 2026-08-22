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
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm" },
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
    weekNumber: 4,
    description: "Building - Continue progressive overload.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm" },
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
    weekNumber: 5,
    description: "Building - Continue progressive overload.",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body A",
        focus: "Push Focus",
        suggestedDay: "Monday",
        exercises: [
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm" },
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
          { name: "Barbell or Dumbbell Bench Press", sets: 3, reps: "8-10" },
          { name: "Single-Arm Dumbbell Rows", sets: 3, reps: "10-12 per arm" },
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
  }
];

export function getWeekPlan(weekNumber: number): WeekPlan | undefined {
  return workoutProgram.find(week => week.weekNumber === weekNumber);
}

export function getWorkoutDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const week = getWeekPlan(weekNumber);
  return week?.days.find(day => day.dayNumber === dayNumber);
}

export function applyWorkoutMode(day: WorkoutDay, mode: WorkoutMode | unknown): WorkoutDay {
  if (normalizeWorkoutMode(mode) !== 'travel') return day;
  return {
    ...day,
    exercises: day.exercises.map(toTravelExercise),
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
