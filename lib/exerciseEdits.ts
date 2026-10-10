import { AB_CORE_POOL } from '@/lib/abCoreRotation';
import { COMBO_SPLITS, MOVEMENT_LIBRARY, type LibraryMuscleGroup } from '@/lib/movementLibrary';
import { overloadProgram } from '@/lib/overloadProgram';
import { toTravelExercise } from '@/lib/travelExercises';
import { resolveYourPickDay, yourPickVariantGroups } from '@/lib/yourPick';
import { programWithRetiredDays, type Exercise } from '@/lib/workoutData';
import { trackForWeek } from '@/lib/programTrack';

/**
 * Add / remove exercises (main program weeks 7–48 only, at the athlete's own risk). A
 * per-session edit stored in `workout_sessions.exercise_edits` JSON — same shape idea as
 * lib/exerciseAlts.ts, and it resets next session the same way. `removed` is keyed by the
 * program exercise name (the card's `gym.name`); `added` cards append after the program's
 * own. Client-safe.
 */
export type AddedExercise = { name: string; sets: number; reps: string };
export type ExerciseEdits = { removed: string[]; added: AddedExercise[] };

export const EMPTY_EXERCISE_EDITS: ExerciseEdits = { removed: [], added: [] };
export const FIRST_EDITABLE_WEEK = 7;
/** Cap on added cards per session, so a session can't grow without limit. */
export const MAX_ADDED_EXERCISES = 4;

/** Main program weeks 7–48. Not weeks 1–6 (the saddle), Test Drive, Hyrox or Overload
 * (lib/programTrack.ts `editExercises`). */
export function canEditExercises(weekNumber: number): boolean {
  return trackForWeek(weekNumber).editExercises && weekNumber >= FIRST_EDITABLE_WEEK;
}

export function parseExerciseEdits(raw: unknown): ExerciseEdits {
  if (raw == null || raw === '') return { removed: [], added: [] };
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { removed: [], added: [] };
    const source = parsed as { removed?: unknown; added?: unknown };
    const removed = Array.isArray(source.removed)
      ? Array.from(new Set(source.removed.map((item) => String(item || '').trim()).filter(Boolean)))
      : [];
    const added: AddedExercise[] = [];
    if (Array.isArray(source.added)) {
      for (const item of source.added) {
        const entry = addableExercise(String((item as { name?: unknown })?.name || ''));
        if (entry && !added.some((existing) => existing.name === entry.name)) added.push(entry);
      }
    }
    return { removed, added: added.slice(0, MAX_ADDED_EXERCISES) };
  } catch {
    return { removed: [], added: [] };
  }
}

export function serializeExerciseEdits(edits: ExerciseEdits): string {
  return JSON.stringify(edits);
}

export type AddableGroup = { group: LibraryMuscleGroup; exercises: AddedExercise[] };

const GROUP_ORDER: LibraryMuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves',
  'Full Body',
];

/** Sets × reps for a movement an athlete didn't get from this day's program. */
const DEFAULT_SETS = 3;
const DEFAULT_REPS = '10-12';

/** First definition of every name the app programs anywhere (main + travel, retired days,
 * ab-core pool, Your pick packs, Overload) — so an added card keeps that movement's own
 * sets × reps. Alt-only movements fall back to 3 × 10-12. */
function buildDefinitions(): Map<string, Exercise> {
  const out = new Map<string, Exercise>();
  const add = (exercise: Exercise) => {
    if (!out.has(exercise.name)) out.set(exercise.name, exercise);
    const travel = toTravelExercise(exercise);
    if (!out.has(travel.name)) out.set(travel.name, travel);
  };
  for (const week of programWithRetiredDays) for (const day of week.days) day.exercises.forEach(add);
  AB_CORE_POOL.forEach(add);
  for (const group of yourPickVariantGroups()) {
    for (const variant of group.variants) {
      // Flows and circuits are not add-able lifts (circuit stations are existing program lifts or the run leg).
      if (['core', 'yoga', 'run', 'circuit', 'hiit'].includes(variant.type)) continue;
      (resolveYourPickDay(7, variant.dayNumber)?.exercises || []).forEach(add);
    }
  }
  for (const days of [3, 4, 5]) for (const day of overloadProgram(1, days)[0].days) day.exercises.forEach(add);
  return out;
}

/** The Add exercise list is The Library's main-program movements (gym + travel + Alt
 * options; lib/movementLibrary.ts), Cardio / Mobility out. The Library splits "X or Y"
 * names into two cards; here a half that the app never programs on its own folds back into
 * its "X or Y" name, so the added card logs under the name the athlete's history is on. */
function buildCatalog(): Map<string, AddedExercise & { group: LibraryMuscleGroup }> {
  const definitions = buildDefinitions();
  const comboOf = new Map<string, string>();
  for (const [combo, halves] of Object.entries(COMBO_SPLITS)) halves.forEach((half) => comboOf.set(half, combo));

  const out = new Map<string, AddedExercise & { group: LibraryMuscleGroup }>();
  for (const entry of MOVEMENT_LIBRARY) {
    if (entry.group !== 'main' || entry.muscleGroup === 'Cardio' || entry.muscleGroup === 'Mobility') continue;
    const name = definitions.has(entry.name) ? entry.name : (comboOf.get(entry.name) ?? entry.name);
    if (out.has(name)) continue;
    const definition = definitions.get(name);
    if (definition?.circuitGroup) continue;
    out.set(name, {
      name,
      sets: definition?.sets ?? DEFAULT_SETS,
      reps: definition?.reps ?? DEFAULT_REPS,
      group: entry.muscleGroup,
    });
  }
  return out;
}

const CATALOG = buildCatalog();

export function addableExercise(name: string): AddedExercise | null {
  const hit = CATALOG.get(name.trim());
  return hit ? { name: hit.name, sets: hit.sets, reps: hit.reps } : null;
}

/** The add picker's list, grouped by muscle, minus anything already on today's cards. */
export function addableGroups(exclude: string[]): AddableGroup[] {
  const skip = new Set(exclude);
  return GROUP_ORDER.map((group) => ({
    group,
    exercises: Array.from(CATALOG.values())
      .filter((item) => item.group === group && !skip.has(item.name))
      .map(({ name, sets, reps }) => ({ name, sets, reps }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((item) => item.exercises.length > 0);
}

/** Today's cards: the program's minus removed, plus added at the end. */
export function applyExerciseEdits(exercises: Exercise[], edits: ExerciseEdits): Exercise[] {
  const removed = new Set(edits.removed);
  const kept = exercises.filter((exercise) => !removed.has(exercise.name));
  const names = new Set(kept.map((exercise) => exercise.name));
  const added = edits.added
    .filter((item) => !names.has(item.name))
    .map((item) => ({ name: item.name, sets: item.sets, reps: item.reps }));
  return [...kept, ...added];
}

export function isAddedExercise(name: string, edits: ExerciseEdits): boolean {
  return edits.added.some((item) => item.name === name);
}
