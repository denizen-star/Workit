import type { Exercise, WeekPlan, WorkoutDay } from '@/lib/workoutData';

/**
 * Rotating ab/core pool for the main program, starting at week 4.
 * Fixed sets/reps per move (no week-based progression) — same spec every time
 * a move lands in the rotation, regardless of which week it falls in.
 * Ordered so neighbours differ in kind (hold, crunch, anti-rotation, hanging, twist),
 * which keeps a slot's week-to-week sequence varied.
 */
export const AB_CORE_POOL: Exercise[] = [
  { name: 'Plank Hold', sets: 3, reps: '60 seconds' },
  { name: 'Reverse Crunches', sets: 3, reps: '12-15' },
  { name: 'Pallof Press', sets: 3, reps: '15 per side' },
  { name: 'Crunches', sets: 3, reps: '15-20' },
  { name: 'Side Plank', sets: 3, reps: '45 seconds' },
  { name: 'Hanging Knee Raises', sets: 3, reps: '12-15' },
  { name: 'Russian Twists', sets: 3, reps: '12 per side' },
  { name: 'Dead Bugs', sets: 3, reps: '8 per side' },
  { name: 'Cable Woodchops', sets: 3, reps: '10 per side' },
  { name: 'Hanging Leg Raises', sets: 3, reps: '8-12' },
  { name: 'Bicycle Crunches', sets: 3, reps: '12 per side' },
  { name: 'Ab Wheel Rollouts', sets: 3, reps: '8-12' },
];

/** Pool moves plus the old combined pair the pool replaced, so a day's built-in move
 * (weeks 1–6 source days carry one) is always found and swapped out. */
const AB_CORE_NAMES = new Set([
  ...AB_CORE_POOL.map((exercise) => exercise.name),
  'Hanging Knee Raises or Ab Wheel Rollouts',
]);

const ROTATION_START_WEEK = 4;

/** Gap between visible days in the same week. 12 moves / at most 4 visible days a week
 * = 3, so no two days in one week ever share a move. */
const SLOT_STRIDE = 3;

/**
 * One ab/core move per visible day, from week 4 on. Each day is placed by its week and
 * its slot (0-based position among that week's visible days):
 *
 *   move  = pool[(w + SLOT_STRIDE·slot) mod 12]   where w = week − 4
 *   start = (w + slot) is odd, else end
 *
 * So each slot steps one move per week (all 12 over 12 weeks), days in a week stay
 * SLOT_STRIDE apart, and every slot flips start/end every week.
 *
 * `isSkipped` days (retired: the old bonus days and Extra Upper) are left untouched and
 * take no slot — counting them is what used to freeze each day onto the same move.
 * Whatever ab/core move an eligible day already has is removed first, wherever it sits.
 */
export function applyAbCoreRotation(
  weeks: WeekPlan[],
  isSkipped: (day: WorkoutDay) => boolean
): WeekPlan[] {
  return weeks.map((week) => {
    if (week.weekNumber < ROTATION_START_WEEK) return week;
    const w = week.weekNumber - ROTATION_START_WEEK;
    let slot = 0;
    return {
      ...week,
      days: week.days.map((day) => {
        if (isSkipped(day)) return day;

        const exercise = AB_CORE_POOL[(w + SLOT_STRIDE * slot) % AB_CORE_POOL.length];
        const placeAtStart = (w + slot) % 2 === 1;
        slot += 1;

        const withoutExisting = day.exercises.filter((existing) => !AB_CORE_NAMES.has(existing.name));
        const exercises = placeAtStart
          ? [exercise, ...withoutExisting]
          : [...withoutExisting, exercise];

        return { ...day, exercises };
      }),
    };
  });
}
