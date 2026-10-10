import type { Exercise, WorkoutDay } from '@/lib/workoutData';

/**
 * Circuits family (docs/plans/PLAN_CIRCUITS.md): a Your pick of rounds of stations.
 *  - superset  2 moves back to back, rest, repeat (a day can chain more than one pair)
 *  - circuit   3+ moves in a round, a timed run leg allowed
 *  - hiit      easy timed work/rest intervals, no weights
 *
 * Superset and circuit are lifting sessions: each station logs normal `exercise_sets`
 * rows under its own movement name (so history, PRs and the Library keep working) and
 * every station carries `circuitGroup`, which already exempts it from the 25s skip rule
 * (lib/skippedSets.ts `isSkipExempt`). HIIT logs nothing — it earns Yoga/Core-style
 * credit at Finish (lib/yourPickCredit.ts).
 *
 * Templates are static and resolved from a session row's day number (150-169), never
 * part of the program array — go through `resolveSessionDay` (lib/resolveDay.ts).
 * Append only: a template's position is its day number, so reordering shifts open sessions.
 */

export type CircuitKind = 'superset' | 'circuit' | 'hiit';

/** A group of stations repeated for `rounds`; rest fires once, after each round's last station. */
export type CircuitBlock = {
  /** Shown on the station header, and the `circuitGroup` tying the cards together. */
  label: string;
  rounds: number;
  restSeconds: number;
  stations: Pick<Exercise, 'name' | 'reps' | 'notes'>[];
};

type TemplateBase = { label: string; description: string };

export type LiftCircuitTemplate = TemplateBase & { kind: 'superset' | 'circuit'; blocks: CircuitBlock[] };

export type HiitMove = { title: string; body: string };

export type HiitTemplate = TemplateBase & {
  kind: 'hiit';
  rounds: number;
  workSeconds: number;
  restSeconds: number;
  moves: HiitMove[];
};

export type CircuitTemplate = LiftCircuitTemplate | HiitTemplate;

/** First circuit `day_number`; clear of Your pick 20-27, Test Drive 30-32, packs 40-99 and focus 110-146. */
export const CIRCUIT_DAY_BASE = 150;
const CIRCUIT_SPAN = 20;

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    kind: 'superset',
    label: 'Superset · Push / Pull',
    description: 'Two pairs of a push and a pull back to back. Rest after each pair, three rounds each.',
    blocks: [
      {
        label: 'Superset A',
        rounds: 3,
        restSeconds: 90,
        stations: [
          { name: 'Barbell or Dumbbell Bench Press', reps: '8-10' },
          { name: 'Single-Arm Dumbbell Rows', reps: '10-12 per arm' },
        ],
      },
      {
        label: 'Superset B',
        rounds: 3,
        restSeconds: 75,
        stations: [
          { name: 'Overhead Dumbbell Shoulder Press', reps: '8-10' },
          { name: 'Lat Pulldowns or Cable Rows', reps: '10-12' },
        ],
      },
    ],
  },
  {
    kind: 'superset',
    label: 'Superset · Legs',
    description: 'A squat and a hinge back to back, then a curl and a calf raise. Three rounds each.',
    blocks: [
      {
        label: 'Superset A',
        rounds: 3,
        restSeconds: 90,
        stations: [
          { name: 'Barbell Back Squats or Goblet Squats', reps: '8-10' },
          { name: 'Romanian Deadlifts (RDLs)', reps: '8-10' },
        ],
      },
      {
        label: 'Superset B',
        rounds: 3,
        restSeconds: 60,
        stations: [
          { name: 'Leg Curl Machine or Swiss Ball Hamstring Curls', reps: '10-12' },
          { name: 'Standing Calf Raises', reps: '15' },
        ],
      },
    ],
  },
  {
    kind: 'circuit',
    label: 'Circuit · Run + lifts',
    description: 'Each round: an easy 3 minute run, then lunges, then rows. Four rounds.',
    blocks: [
      {
        label: 'Run + lifts',
        rounds: 4,
        restSeconds: 90,
        stations: [
          { name: 'Easy run', reps: '3 minutes', notes: 'Soft pace. You could talk the whole time.' },
          { name: 'Walking Lunges', reps: '10 steps per leg' },
          { name: 'Single-Arm Dumbbell Rows', reps: '10-12 per arm' },
        ],
      },
    ],
  },
  {
    kind: 'circuit',
    label: 'Circuit · Full body',
    description: 'Four moves in a row with no rest between them. Rest after the round, three rounds.',
    blocks: [
      {
        label: 'Full body',
        rounds: 3,
        restSeconds: 90,
        stations: [
          { name: 'Romanian Deadlifts (RDLs)', reps: '10' },
          { name: 'Overhead Dumbbell Shoulder Press', reps: '10' },
          { name: 'Single-Arm Dumbbell Rows', reps: '10-12 per arm' },
          { name: 'Walking Lunges', reps: '10 steps per leg' },
        ],
      },
    ],
  },
  {
    kind: 'hiit',
    label: 'Easy HIIT',
    description: 'Five easy moves, 40 seconds on and 20 off, four rounds. About 20 minutes. Keep it conversational.',
    rounds: 4,
    workSeconds: 40,
    restSeconds: 20,
    moves: [
      { title: 'High knees', body: 'Light and quick. Drive the knees to hip height, stay tall.' },
      { title: 'Squat reach', body: 'Sit back into a squat, reach up as you stand. Smooth, no rush.' },
      { title: 'Step jacks', body: 'Jumping jacks without the jump. Step one foot out at a time.' },
      { title: 'Slow mountain climbers', body: 'Hands under shoulders, flat back, knees in one at a time.' },
      { title: 'Skater steps', body: 'Step side to side, sweeping the back leg behind. Soft landings.' },
    ],
  },
];

export const CIRCUIT_PICK_TYPES = ['circuit', 'hiit'] as const;
export type CircuitPickType = (typeof CIRCUIT_PICK_TYPES)[number];

export function isCircuitPickType(value: unknown): value is CircuitPickType {
  return CIRCUIT_PICK_TYPES.includes(value as CircuitPickType);
}

/** The Your pick type a template starts as: HIIT is its own flow, supersets and circuits are lifting. */
export function circuitPickType(template: CircuitTemplate): CircuitPickType {
  return template.kind === 'hiit' ? 'hiit' : 'circuit';
}

/** The template stored on a day number, or undefined for any other number. */
export function circuitTemplateForDay(dayNumber: number): CircuitTemplate | undefined {
  const index = Number(dayNumber) - CIRCUIT_DAY_BASE;
  return index >= 0 && index < CIRCUIT_SPAN ? CIRCUIT_TEMPLATES[index] : undefined;
}

export function circuitDayNumber(template: CircuitTemplate): number {
  return CIRCUIT_DAY_BASE + CIRCUIT_TEMPLATES.indexOf(template);
}

/** Dropdown rows for the Your pick sheet (one "Circuits" group). */
export function circuitVariants() {
  return CIRCUIT_TEMPLATES.map((template) => ({
    type: circuitPickType(template),
    label: template.label,
    description: template.description,
    dayNumber: circuitDayNumber(template),
  }));
}

/** First template of a pick type — what a bare `yourPickDay(week, 'circuit' | 'hiit')` falls back to. */
export function defaultCircuitTemplate(type: CircuitPickType): CircuitTemplate {
  return CIRCUIT_TEMPLATES.find((template) => circuitPickType(template) === type) ?? CIRCUIT_TEMPLATES[0];
}

/** A lifting template as program exercises: one row per station, `sets` = rounds, grouped by block. */
export function circuitExercises(template: LiftCircuitTemplate): Exercise[] {
  return template.blocks.flatMap((block) =>
    block.stations.map((station, index) => ({
      name: station.name,
      sets: block.rounds,
      reps: station.reps,
      notes: station.notes,
      circuitGroup: block.label,
      // The round's last station is the only one that rests (see CircuitFlow).
      noRestAfter: index < block.stations.length - 1,
    }))
  );
}

/** One row per HIIT move, so Select Workout can list it and estimate its length. */
export function hiitExercises(template: HiitTemplate): Exercise[] {
  return template.moves.map((move) => ({
    name: move.title,
    sets: template.rounds,
    reps: `${template.workSeconds} seconds`,
    estimatedMinutes: (template.rounds * (template.workSeconds + template.restSeconds)) / 60,
  }));
}

const resolvedDays = new Map<number, WorkoutDay | undefined>();

/**
 * The WorkoutDay behind a circuit day number. Cached: the live session re-resolves on
 * every render, and a fresh `exercises` array each time would reload the tracker.
 */
export function resolveCircuitDay(dayNumber: number): WorkoutDay | undefined {
  const day = Number(dayNumber);
  if (resolvedDays.has(day)) return resolvedDays.get(day);
  const template = circuitTemplateForDay(day);
  const resolved: WorkoutDay | undefined = template
    ? {
        dayNumber: day,
        name: `Your pick · ${template.label}`,
        focus: template.kind === 'hiit' ? 'Easy intervals' : template.kind === 'superset' ? 'Supersets' : 'Circuit',
        suggestedDay: '',
        pick: circuitPickType(template),
        exercises: template.kind === 'hiit' ? hiitExercises(template) : circuitExercises(template),
      }
    : undefined;
  resolvedDays.set(day, resolved);
  return resolved;
}

/* ---------------------------------------------------------------------------
 * Step sequencing — the one rule for "what comes next" in a lifting circuit,
 * shared by the live view and anything that needs to count progress.
 * ------------------------------------------------------------------------- */

export type CircuitStep = {
  /** Unique within the session: `${exercise name}#${set number}`. */
  key: string;
  name: string;
  reps: string;
  notes?: string;
  /** Set number this step logs (= the round within its block). */
  setNumber: number;
  round: number;
  rounds: number;
  /** Position of the station in its round, and how many stations the round has. */
  station: number;
  stations: number;
  blockLabel: string;
  /** The round's last station: rest fires after it. */
  roundEnd: boolean;
  /** Rest after this round, in seconds (0 when it isn't a round end). */
  restSeconds: number;
  /** Next station, for the preview (null on the very last step). */
  nextName: string | null;
};

export function stepKey(name: string, setNumber: number): string {
  return `${name}#${setNumber}`;
}

/**
 * Flattens a lifting day into the order it is worked: for each block, round 1's stations in
 * order, then round 2's, and so on; then the next block. Blocks are the runs of consecutive
 * exercises sharing a `circuitGroup`. An ungrouped exercise is a one-station block.
 */
export function circuitSteps(exercises: Exercise[], restFor: (blockLabel: string) => number): CircuitStep[] {
  const blocks: Exercise[][] = [];
  for (const exercise of exercises) {
    const last = blocks[blocks.length - 1];
    if (last && exercise.circuitGroup && last[0].circuitGroup === exercise.circuitGroup) last.push(exercise);
    else blocks.push([exercise]);
  }
  const steps: Omit<CircuitStep, 'nextName'>[] = [];
  for (const block of blocks) {
    const rounds = block[0].sets;
    const label = block[0].circuitGroup ?? block[0].name;
    for (let round = 1; round <= rounds; round += 1) {
      block.forEach((exercise, index) => {
        const roundEnd = index === block.length - 1;
        steps.push({
          key: stepKey(exercise.name, round),
          name: exercise.name,
          reps: exercise.reps,
          notes: exercise.notes,
          setNumber: round,
          round,
          rounds,
          station: index + 1,
          stations: block.length,
          blockLabel: label,
          roundEnd,
          restSeconds: roundEnd ? restFor(label) : 0,
        });
      });
    }
  }
  return steps.map((step, index) => ({ ...step, nextName: steps[index + 1]?.name ?? null }));
}

/** Rest for a block of a lifting template (the day's `circuitGroup` label → its `restSeconds`). */
export function restForBlock(template: LiftCircuitTemplate | undefined) {
  return (blockLabel: string) => template?.blocks.find((block) => block.label === blockLabel)?.restSeconds ?? 60;
}
