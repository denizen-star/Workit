import type { Exercise, WeekPlan } from '@/lib/workoutData';

/**
 * Rotating ab/core pool for the main program, starting at week 4.
 * Fixed sets/reps per move (no week-based progression) — same spec every time
 * a move lands in the rotation, regardless of which week it falls in.
 */
export const AB_CORE_POOL: Exercise[] = [
  { name: 'Plank Hold', sets: 3, reps: '60 seconds' },
  { name: 'Pallof Press', sets: 3, reps: '15 per side' },
  { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  { name: 'Hanging Knee Raises or Ab Wheel Rollouts', sets: 3, reps: '12-15' },
  { name: 'Side Plank', sets: 3, reps: '45 seconds' },
];

const AB_CORE_NAMES = new Set(AB_CORE_POOL.map((exercise) => exercise.name));

const ROTATION_START_WEEK = 4;

/**
 * One ab/core move per eligible day, from week 4 on, cycling through AB_CORE_POOL
 * and alternating start/end placement off a single global counter. Bonus Core is
 * skipped (it's already all 4 pool moves). Whatever ab/core move a day already has
 * is removed first, wherever it sits, so every eligible day ends up with exactly one.
 */
export function applyAbCoreRotation(weeks: WeekPlan[]): WeekPlan[] {
  let counter = 0;
  return weeks.map((week) => {
    if (week.weekNumber < ROTATION_START_WEEK) return week;
    return {
      ...week,
      days: week.days.map((day) => {
        if (day.name === 'Bonus Core') return day;

        const exercise = AB_CORE_POOL[counter % AB_CORE_POOL.length];
        const placeAtStart = counter % 2 === 1;
        counter += 1;

        const withoutExisting = day.exercises.filter((existing) => !AB_CORE_NAMES.has(existing.name));
        const exercises = placeAtStart
          ? [exercise, ...withoutExisting]
          : [...withoutExisting, exercise];

        return { ...day, exercises };
      }),
    };
  });
}
