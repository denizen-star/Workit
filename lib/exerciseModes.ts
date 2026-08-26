import { exerciseCanonicalName, exerciseHistoryKey } from '@/lib/exerciseKey';
import { normalizeWorkoutMode, type WorkoutMode } from '@/lib/workoutMode';

export type ExerciseModeMap = Record<string, WorkoutMode>;

export function parseExerciseModes(raw: unknown): ExerciseModeMap {
  if (raw == null || raw === '') return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: ExerciseModeMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const name = String(key || '').trim();
      if (!name) continue;
      out[name] = normalizeWorkoutMode(value);
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeExerciseModes(modes: ExerciseModeMap): string {
  return JSON.stringify(modes);
}

export function modeForExercise(gymName: string, modes: ExerciseModeMap, fallback: WorkoutMode): WorkoutMode {
  return (
    modes[gymName] ||
    modes[exerciseCanonicalName(gymName)] ||
    modes[exerciseHistoryKey(gymName)] ||
    fallback
  );
}
