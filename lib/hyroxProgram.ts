// Hyrox Training: opt-in 16-week program. Only Phase 1 (weeks 1-4) + Milestone 1 are
// authored here; Phases 2-4 (weeks 5-16) are a later content-only pass using the
// same WeekPlan/WorkoutDay shape as the normal program (see lib/workoutData.ts).
//
// Each Hyrox week has exactly 5 training days, numbered 1-5 and mapped onto a
// Monday-start calendar week: Day1=Mon (run), Day2=Tue (lower + sled), Day3=Wed
// (active recovery), Day4=Thu (upper + compromised run), Day5=Sat (full body
// conditioning). Fri/Sun are the only true rest days and aren't represented.
//
// Week numbers are namespaced at 101+ (Phase 1 = 101-104) so they can never collide
// with the normal 48-week program's 1-48 in shared week_number-keyed queries
// (workout_sessions is disambiguated by program_track, but week_number itself is a
// plain int column with no track prefix). HYROX_WEEK_OFFSET converts to/from the
// 1-based "Week N" an athlete actually sees.
//
// Every movement here is its own loggable Exercise (sets you can actually complete
// one at a time) — never a circuit description packed into one reps string. Where a
// movement is the same pattern the normal 48-week program already uses, it keeps
// that program's exact exercise name (Barbell Back Squats or Goblet Squats, Romanian
// Deadlifts (RDLs), Farmer's Carries, Plank Hold, etc.) so weight history, "last
// time" chips, and video/image lookup carry over instead of starting from zero.
import type { Exercise, WeekPlan, WorkoutDay } from '@/lib/workoutData';

const SLED_PUSH_NOTES =
  'Heavy bumper plate on smooth rubber flooring, hands low, arms locked, lean 45°, short driving steps. ' +
  'No open floor? Sub 45-75s pushing an unpowered (OFF) treadmill belt under your own leg power.';

const FLUSH_SETTLE_NOTES =
  'Flush & Settle: run the first 200m ~10-15s/km slower than target pace with short, quick steps, then settle into pace.';

/** Tags every item but the last with noRestAfter (they flow straight into the next
 * movement of the same round) and stamps the shared circuitGroup label everyone
 * gets so the live session boxes them together under one "Circuit" header. */
function circuit(label: string, movements: Exercise[]): Exercise[] {
  return movements.map((movement, index) => ({
    ...movement,
    circuitGroup: label,
    noRestAfter: index < movements.length - 1,
  }));
}

/** One movement per Sled Push Alt station, each its own loggable exercise over `rounds` sets. */
function sledMovements(rounds: number, pushMeters: number, lunges: number, carryMeters: number): Exercise[] {
  const movements: Exercise[] = [
    {
      name: 'Floor Plate Push (Sled Push Substitute)',
      sets: rounds,
      reps: `${pushMeters}-meter push`,
      notes: SLED_PUSH_NOTES,
    },
    { name: 'Walking Lunges', sets: rounds, reps: `${lunges}` },
  ];
  if (carryMeters > 0) {
    movements.push({ name: "Farmer's Carries", sets: rounds, reps: `${carryMeters}-meter walk` });
  }
  return circuit('Sled Push Alt Circuit', movements);
}

/** The run plus each station movement of a Compromised Run circuit, each its own
 * loggable exercise over `rounds` sets. */
function compromisedMovements(
  rounds: number,
  runMeters: number,
  movements: { name: string; reps: string }[]
): Exercise[] {
  return circuit('Compromised Run Circuit', [
    { name: 'Run', sets: rounds, reps: `${runMeters}-meter run`, notes: FLUSH_SETTLE_NOTES },
    ...movements.map((movement) => ({ ...movement, sets: rounds })),
  ]);
}

/** AMRAPs are one continuous timed block, not discrete sets — logged with the same
 * Start-timer/Stop-completes clock as a Plank Hold (reps carries the "N min" that
 * lib/exerciseKind.ts reads), with the station rotation described in notes. */
function amrap(minutes: number, work: string): Exercise {
  return { name: `${minutes}-Min AMRAP`, sets: 1, reps: `${minutes} min`, notes: work, estimatedMinutes: minutes };
}

/** Finisher = `rounds` of Wall Balls + a Plank Hold, each its own loggable exercise. */
function finisherMovements(rounds: number, wallBalls: number, plankSeconds: number): Exercise[] {
  return circuit('Finisher', [
    { name: 'Wall Balls', sets: rounds, reps: `${wallBalls}` },
    { name: 'Plank Hold', sets: rounds, reps: `${plankSeconds} seconds` },
  ]);
}

function aerobicRun(km: number): WorkoutDay {
  // ~6:30/km conversational easy pace. Logged by time (Start timer/Stop
  // completes-set, same flow as a Plank Hold — see lib/exerciseKind.ts), not
  // weight×reps; the km target stays in notes for context.
  const minutes = Math.round(km * 6.5);
  return {
    dayNumber: 1,
    name: 'Aerobic Base Run',
    focus: 'Zone 2 Continuous Distance',
    suggestedDay: 'Monday',
    exercises: [
      {
        name: 'Continuous Easy Run',
        sets: 1,
        reps: `${minutes} min`,
        notes: `${km} km at a conversational Zone 2 pace, no walking breaks.`,
        estimatedMinutes: minutes,
      },
    ],
  };
}

function activeRecovery(): WorkoutDay {
  return {
    dayNumber: 3,
    name: 'Active Recovery',
    focus: 'Mobility & Easy Movement',
    suggestedDay: 'Wednesday',
    exercises: [
      {
        name: 'Easy Bike or Walk',
        sets: 1,
        reps: '20 min',
        notes: 'Very light effort — blood flow, not training stress.',
        estimatedMinutes: 20,
      },
      { name: 'Foam Rolling + Mobility Flow', sets: 1, reps: '10 min', estimatedMinutes: 10 },
      { name: 'Dead Bugs', sets: 2, reps: '12' },
    ],
  };
}

const WEEK_1: WeekPlan = {
  weekNumber: 101,
  description: 'Phase 1: Aerobic & Tissue Base. Build running volume and introduce Hyrox station movements.',
  days: [
    aerobicRun(4),
    {
      dayNumber: 2,
      name: 'Lower Body Strength + Sled Push',
      focus: 'Quad Drive & Grip',
      suggestedDay: 'Tuesday',
      exercises: [
        { name: 'Barbell Back Squats or Goblet Squats', sets: 4, reps: '8' },
        { name: 'Romanian Deadlifts (RDLs)', sets: 4, reps: '8' },
        { name: 'Leg Press', sets: 3, reps: '12' },
        ...sledMovements(3, 30, 20, 40),
      ],
    },
    activeRecovery(),
    {
      dayNumber: 4,
      name: 'Upper Body Strength + Compromised Run',
      focus: 'Push/Pull & Engine',
      suggestedDay: 'Thursday',
      exercises: [
        { name: 'Barbell or Dumbbell Bench Press', sets: 4, reps: '8-10' },
        { name: 'Lat Pulldown', sets: 4, reps: '10-12' },
        { name: 'Seated Cable Row', sets: 3, reps: '12' },
        ...compromisedMovements(4, 600, [
          { name: 'Wall Balls', reps: '15' },
          { name: 'Burpees', reps: '15' },
        ]),
      ],
    },
    {
      dayNumber: 5,
      name: 'Full Body Conditioning',
      focus: 'Engine Burnout',
      suggestedDay: 'Saturday',
      exercises: [
        { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '10' },
        { name: 'Hanging Knee Raises or Ab Wheel Rollouts', sets: 3, reps: '12' },
        amrap(12, '500m Row → 20 Burpee Broad Jumps → 100m Heavy Farmer\'s Carry'),
        ...finisherMovements(3, 15, 45),
      ],
    },
  ],
};

const WEEK_2: WeekPlan = {
  weekNumber: 102,
  description: 'Phase 1: Aerobic & Tissue Base. Progress distance and station volume.',
  days: [
    aerobicRun(4.5),
    {
      dayNumber: 2,
      name: 'Lower Body Strength + Sled Push',
      focus: 'Quad Drive & Grip',
      suggestedDay: 'Tuesday',
      exercises: [
        { name: 'Barbell Front Squat or Goblet Squat', sets: 4, reps: '8' },
        { name: 'Romanian Deadlifts (RDLs)', sets: 4, reps: '10' },
        { name: 'Single-Leg Press', sets: 3, reps: '10 per leg' },
        ...sledMovements(3, 40, 24, 50),
      ],
    },
    activeRecovery(),
    {
      dayNumber: 4,
      name: 'Upper Body Strength + Compromised Run',
      focus: 'Push/Pull & Engine',
      suggestedDay: 'Thursday',
      exercises: [
        { name: 'Incline Dumbbell Bench Press', sets: 4, reps: '8-10' },
        { name: 'Lat Pulldown', sets: 4, reps: '10' },
        { name: 'Face Pulls', sets: 3, reps: '15' },
        ...compromisedMovements(4, 800, [
          { name: 'Wall Balls', reps: '20' },
          { name: 'Burpees', reps: '20' },
        ]),
      ],
    },
    {
      dayNumber: 5,
      name: 'Full Body Conditioning',
      focus: 'Engine Burnout',
      suggestedDay: 'Saturday',
      exercises: [
        { name: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: '10' },
        { name: 'Hanging Knee Raises or Ab Wheel Rollouts', sets: 3, reps: '12' },
        amrap(15, '600m Row → 25 Burpee Broad Jumps → 150m Heavy Farmer\'s Carry'),
        ...finisherMovements(3, 20, 45),
      ],
    },
  ],
};

const WEEK_3: WeekPlan = {
  weekNumber: 103,
  description: 'Phase 1: Aerobic & Tissue Base. Heavier lower body, longer compromised circuits.',
  days: [
    aerobicRun(5),
    {
      dayNumber: 2,
      name: 'Lower Body Strength + Sled Push',
      focus: 'Quad Drive & Grip',
      suggestedDay: 'Tuesday',
      exercises: [
        { name: 'Barbell Back Squats or Goblet Squats', sets: 4, reps: '6', notes: 'Increase weight from Week 1.' },
        { name: 'Romanian Deadlifts (RDLs)', sets: 4, reps: '8' },
        { name: 'Leg Press', sets: 4, reps: '10' },
        ...sledMovements(4, 40, 24, 50),
      ],
    },
    activeRecovery(),
    {
      dayNumber: 4,
      name: 'Upper Body Strength + Compromised Run',
      focus: 'Push/Pull & Engine',
      suggestedDay: 'Thursday',
      exercises: [
        { name: 'Barbell or Dumbbell Bench Press', sets: 4, reps: '8' },
        { name: 'Seated Cable Row', sets: 4, reps: '10' },
        { name: 'Triceps Cable Pushdowns or Overhead Extensions', sets: 3, reps: '12' },
        { name: 'Dumbbell Biceps Curls', sets: 3, reps: '12' },
        ...compromisedMovements(4, 800, [
          { name: 'Wall Balls', reps: '25' },
          { name: 'Burpee Broad Jumps', reps: '20' },
        ]),
      ],
    },
    {
      dayNumber: 5,
      name: 'Full Body Conditioning',
      focus: 'Engine Burnout',
      suggestedDay: 'Saturday',
      exercises: [
        { name: 'Overhead Dumbbell Shoulder Press', sets: 4, reps: '8' },
        { name: 'Hanging Knee Raises or Ab Wheel Rollouts', sets: 3, reps: '15' },
        amrap(15, '750m Row → 30 Burpee Broad Jumps → 150m Heavy Farmer\'s Carry'),
        ...finisherMovements(4, 20, 60),
      ],
    },
  ],
};

const WEEK_4: WeekPlan = {
  weekNumber: 104,
  description: 'Phase 1 deload + Milestone 1: confirm your aerobic base and tissue resilience before Phase 2.',
  days: [
    aerobicRun(5),
    {
      dayNumber: 2,
      name: 'Lower Body Light Strength',
      focus: 'Deload',
      suggestedDay: 'Tuesday',
      exercises: [
        { name: 'Barbell Back Squats or Goblet Squats', sets: 3, reps: '6', notes: 'Moderate weight.' },
        { name: 'Leg Press', sets: 3, reps: '10' },
        ...sledMovements(2, 30, 20, 0),
      ],
    },
    activeRecovery(),
    {
      dayNumber: 4,
      name: 'Milestone 1: Aerobic & Tissue Base Check',
      focus: 'Benchmark Test',
      suggestedDay: 'Thursday',
      milestone: 1,
      exercises: [
        {
          name: '5K Continuous Run',
          sets: 1,
          reps: '33 min',
          notes: '5 km at a steady Zone 2 pace, no walking breaks.',
          estimatedMinutes: 33,
        },
        {
          name: 'Wall Balls',
          sets: 1,
          reps: '50',
          notes: 'Within 5 minutes of finishing the run. Unbroken or a max of 2 sets, no joint pain.',
        },
        {
          name: 'Walking Lunges',
          sets: 1,
          reps: '40-meter walk',
          notes: 'Immediately after the wall balls. Unbroken or a max of 2 sets, no joint pain.',
        },
      ],
    },
    {
      dayNumber: 5,
      name: 'Upper Body & Light Conditioning',
      focus: 'Deload',
      suggestedDay: 'Saturday',
      exercises: [
        { name: 'Lat Pulldown', sets: 3, reps: '10' },
        { name: 'Barbell or Dumbbell Bench Press', sets: 3, reps: '10' },
        { name: 'Easy Row (SkiErg or Rower)', sets: 1, reps: '10 min easy', estimatedMinutes: 10 },
      ],
    },
  ],
};

/** Phase 1 (weeks 1-4). Phases 2-4 (weeks 5-16) are a later content pass. */
export const hyroxProgram: WeekPlan[] = [WEEK_1, WEEK_2, WEEK_3, WEEK_4];

export function getHyroxWorkoutDay(weekNumber: number, dayNumber: number): WorkoutDay | null {
  const week = hyroxProgram.find((item) => item.weekNumber === weekNumber);
  return week?.days.find((item) => item.dayNumber === dayNumber) ?? null;
}

/** Highest week this build has content for. Reaching it without a next phase means "hold". */
export const HYROX_PHASE_1_LAST_WEEK = WEEK_4.weekNumber;

export const HYROX_WEEK_OFFSET = 100;

export function hyroxDisplayWeek(weekNumber: number): number {
  return weekNumber - HYROX_WEEK_OFFSET;
}

function repsFor(day: WorkoutDay, exerciseName: string): string {
  return day.exercises.find((item) => item.name === exerciseName)?.reps ?? '';
}

const MILESTONE_1_DAY = WEEK_4.days.find((day) => day.milestone === 1)!;

/** Self-report checklist criteria shown on each milestone's pass/fail takeover.
 * Quantities are pulled from the milestone day's actual exercises (not
 * re-typed) so the two can't silently drift apart when the program content changes. */
export const HYROX_MILESTONE_CRITERIA: Record<number, { title: string; checks: string[] }> = {
  1: {
    title: MILESTONE_1_DAY.name,
    checks: [
      'Finished the run without stopping to walk',
      `Finished the ${repsFor(MILESTONE_1_DAY, 'Wall Balls')} Wall Balls unbroken, or in 2 sets max`,
      `Finished the ${repsFor(MILESTONE_1_DAY, 'Walking Lunges')} Walking Lunges unbroken, or in 2 sets max`,
      'No knee, ankle, or joint pain during any of it',
    ],
  },
};
