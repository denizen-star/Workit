import { AB_CORE_POOL } from '@/lib/abCoreRotation';
import { muscleGroupForExercise, type MuscleGroup } from '@/lib/muscleGroups';
import { programWithRetiredDays, type Exercise } from '@/lib/workoutData';

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
export const LAST_EDITABLE_WEEK = 48;
/** Cap on added cards per session, so a session can't grow without limit. */
export const MAX_ADDED_EXERCISES = 4;

/** Main program weeks 7–48. Not weeks 1–6 (the saddle), Test Drive, Hyrox or Overload. */
export function canEditExercises(weekNumber: number): boolean {
  return weekNumber >= FIRST_EDITABLE_WEEK && weekNumber <= LAST_EDITABLE_WEEK;
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

export type AddableGroup = { group: MuscleGroup | 'Other'; exercises: AddedExercise[] };

const GROUP_ORDER: Array<MuscleGroup | 'Other'> = [
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
  'Other',
];

/** Every lifting movement in the main program (first definition wins for sets × reps), so an
 * added card keeps that movement's own history and video. Cardio / Mobility are left out. */
function buildCatalog(): Map<string, AddedExercise & { group: MuscleGroup | 'Other' }> {
  const out = new Map<string, AddedExercise & { group: MuscleGroup | 'Other' }>();
  const add = (exercise: Exercise) => {
    if (out.has(exercise.name) || exercise.circuitGroup) return;
    const group = muscleGroupForExercise(exercise.name) ?? 'Other';
    if (group === 'Cardio' || group === 'Mobility') return;
    out.set(exercise.name, { name: exercise.name, sets: exercise.sets, reps: exercise.reps, group });
  };
  for (const week of programWithRetiredDays) {
    for (const day of week.days) day.exercises.forEach(add);
  }
  AB_CORE_POOL.forEach(add);
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
