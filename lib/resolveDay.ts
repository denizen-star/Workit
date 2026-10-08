import { getHyroxWorkoutDay } from '@/lib/hyroxProgram';
import { getOverloadWorkoutDay } from '@/lib/overloadProgram';
import { programTrackForWeek } from '@/lib/programTrack';
import { resolveFullBodyDay } from '@/lib/scheduleDays';
import { resolveTestDriveDay } from '@/lib/testDrive';
import { getWorkoutDay, type WorkoutDay } from '@/lib/workoutData';
import { resolveYourPickDay } from '@/lib/yourPick';

/**
 * The `WorkoutDay` behind any session row, whichever track or family it came from:
 * a Hyrox day (weeks 101-200, lib/hyroxProgram.ts), a Test Drive day (week 0, 30-32 —
 * checked first so week 0 never reaches the program resolvers), an Overload
 * Progressions day (weeks 201+, lib/overloadProgram.ts), a static program day (or a
 * retired bonus day, via `getWorkoutDay`), a Your pick day (20-27) or a 1-3 day
 * athlete's full-body day (6-8). Every day lookup goes through here — never a plain
 * `week.days.find(dayNumber)`, which misses the synthesized days and silently blanks
 * a Start / resume / render. Each resolver returns cached objects, so the same row
 * always resolves to the same `WorkoutDay`.
 */
export function resolveSessionDay(weekNumber: number, dayNumber: number): WorkoutDay | undefined {
  const week = Number(weekNumber);
  const day = Number(dayNumber);
  if (programTrackForWeek(week) === 'hyrox') return getHyroxWorkoutDay(week, day) ?? undefined;
  return (
    resolveTestDriveDay(week, day) ??
    getOverloadWorkoutDay(week, day) ??
    getWorkoutDay(week, day) ??
    // Your pick (20-27) before full body: resolveFullBodyDay only owns 6-8, but
    // checking picks first keeps a Lower/Upper pick from ever rendering as full body.
    resolveYourPickDay(week, day) ??
    resolveFullBodyDay(week, day)
  );
}
