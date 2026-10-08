import { HYROX_WEEK_OFFSET, hyroxDisplayWeek, hyroxProgram } from '@/lib/hyroxProgram';
import { isOverloadWeek, overloadDisplayWeek, overloadProgram, overloadWeekPlan } from '@/lib/overloadProgram';
import { workoutProgram, type WeekPlan } from '@/lib/workoutData';

/** `workout_sessions.program_track` values. */
export type ProgramTrack = 'main' | 'hyrox' | 'overload';

/** The opt-in tracks that replace Home while active. */
export type OptInTrack = Exclude<ProgramTrack, 'main'>;

/** The track a week_number belongs to — derived server-side, never trusted from the
 * client. Bands: main 0-48, Hyrox 101-200 (lib/hyroxProgram.ts), Overload
 * Progressions 201+ (lib/overloadProgram.ts). */
export function programTrackForWeek(weekNumber: number): ProgramTrack {
  if (isOverloadWeek(weekNumber)) return 'overload';
  if (Number(weekNumber) > HYROX_WEEK_OFFSET) return 'hyrox';
  return 'main';
}

/** The main 48-week program's weeks (week 0 is Test Drive, outside the program). */
export const MAIN_PROGRAM_WEEKS = { first: 1, last: 48 } as const;

/**
 * Everything that differs by track, in one place, so callers ask the track instead of
 * branching on week-number bands. Program builders are functions (never values read
 * at module load) so this file stays safe to import from anywhere.
 */
export type TrackSpec = {
  /** The weeks Select Workout and "what's next" walk. `run` only matters for Overload. */
  program: (run: number, scheduleDays: number) => WeekPlan[];
  /** One week's plan by its stored week_number. */
  weekPlan: (weekNumber: number, scheduleDays: number) => WeekPlan | undefined;
  /** Stored week_number → the week the athlete sees (Hyrox 101 → 1, Overload 211 → 1). */
  displayWeek: (weekNumber: number) => number;
  /** The athlete's days-per-week reshapes this track's weeks (full-body days, Your
   * pick slots). Off where the week is already built for them (Overload) or fixed (Hyrox). */
  reshapesWeek: boolean;
  /** A week that crosses its bar is recorded in `locked_weeks` (belts, badges, board). */
  locksWeeks: boolean;
  /** Your pick sessions and the Test Drive block are offered. */
  yourPick: boolean;
  testDrive: boolean;
  /** Add / remove exercises (lib/exerciseEdits.ts) can be offered. */
  editExercises: boolean;
  /** The live card's Aim-for box (lib/nextLoad.ts). */
  aimBox: boolean;
};

export const TRACKS: Record<ProgramTrack, TrackSpec> = {
  main: {
    program: () => workoutProgram,
    weekPlan: (weekNumber) => workoutProgram.find((week) => week.weekNumber === weekNumber),
    displayWeek: (weekNumber) => weekNumber,
    reshapesWeek: true,
    locksWeeks: true,
    yourPick: true,
    testDrive: true,
    editExercises: true,
    aimBox: false,
  },
  hyrox: {
    program: () => hyroxProgram,
    weekPlan: (weekNumber) => hyroxProgram.find((week) => week.weekNumber === weekNumber),
    displayWeek: hyroxDisplayWeek,
    reshapesWeek: false,
    // Hyrox tracks its own weeks (lib/hyroxState.ts); they never reach `locked_weeks`.
    locksWeeks: false,
    yourPick: false,
    testDrive: false,
    editExercises: false,
    aimBox: false,
  },
  overload: {
    program: (run, scheduleDays) => overloadProgram(run, scheduleDays),
    weekPlan: (weekNumber, scheduleDays) => overloadWeekPlan(weekNumber, scheduleDays),
    displayWeek: overloadDisplayWeek,
    reshapesWeek: false,
    locksWeeks: true,
    yourPick: false,
    testDrive: false,
    editExercises: false,
    aimBox: true,
  },
};

/** The track spec a stored week_number belongs to. */
export function trackForWeek(weekNumber: number): TrackSpec {
  return TRACKS[programTrackForWeek(weekNumber)];
}
