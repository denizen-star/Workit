import { resolveFullBodyDay } from '@/lib/scheduleDays';
import { resolveTestDriveDay } from '@/lib/testDrive';
import { getWorkoutDay, type WorkoutDay } from '@/lib/workoutData';
import { resolveYourPickDay } from '@/lib/yourPick';

/**
 * The `WorkoutDay` behind any main-program session row, whichever family it came
 * from: a static program day (or a retired bonus day, via `getWorkoutDay`), a 1-3
 * day athlete's full-body day (6-8), a Your pick day (20-24), or a Test Drive day
 * (week 0, 30-32 — checked first so week 0 never reaches the program resolvers). Use this anywhere a
 * `week.days.find(dayNumber)` lookup would otherwise miss the synthesized days and
 * silently blank a Start/resume/render.
 */
export function resolveSessionDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const week = Number(weekNumber);
  const day = Number(dayNumber);
  return resolveTestDriveDay(week, day) ?? getWorkoutDay(week, day) ?? resolveFullBodyDay(week, day) ?? resolveYourPickDay(week, day);
}
