import type { Exercise } from '@/lib/workoutData';

/**
 * Home · 2 Dumbbells (docs/plans/PLAN_FOCUS_ONBOARDING.md): two full-body days that need
 * two dumbbells and a chair or bench — nothing else. Names reuse the program's own
 * (Romanian Deadlifts (RDLs), Single-Arm Dumbbell Rows, Overhead Dumbbell Shoulder Press,
 * Bulgarian Split Squats, Farmer's Carries) wherever the movement is the same, so an
 * athlete's history and PRs carry over; the rest are new names with their own history.
 *
 * Do not reorder: the focus rotation (lib/focusRotation.ts) alternates A/B by index.
 */
export const HOME_PACKS: Exercise[][] = [
  // Full-Body 1.
  [
    { name: 'Goblet Squats', sets: 3, reps: '10-12' },
    { name: 'Romanian Deadlifts (RDLs)', sets: 3, reps: '10-12' },
    { name: 'Dumbbell Floor Press', sets: 3, reps: '8-12' },
    { name: 'Single-Arm Dumbbell Rows', sets: 3, reps: '10-12 per arm' },
    { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '8-10' },
    { name: 'Reverse Lunges', sets: 3, reps: '10 per leg' },
    { name: "Farmer's Carries", sets: 3, reps: '45-60 seconds' },
  ],
  // Full-Body 2.
  [
    { name: 'Bulgarian Split Squats', sets: 3, reps: '8-10 per leg' },
    { name: 'Dumbbell Sumo Deadlifts', sets: 3, reps: '10-12' },
    { name: 'Renegade Row to Push-Ups', sets: 3, reps: '6-8 per side' },
    { name: 'Dumbbell Arnold Press', sets: 3, reps: '10-12' },
    { name: 'Dumbbell Floor Flyes', sets: 3, reps: '10-12' },
    { name: 'Dumbbell Single-Leg Deadlifts with Row', sets: 3, reps: '8 per leg' },
    { name: 'Dumbbell Woodchoppers', sets: 3, reps: '10-12 per side' },
  ],
];

export const HOME_PACK_LABELS = ['Full-Body 1', 'Full-Body 2'] as const;
