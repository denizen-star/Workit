export type WorkoutMode = 'gym' | 'travel';

export function normalizeWorkoutMode(value: unknown): WorkoutMode {
  return String(value || '').trim().toLowerCase() === 'travel' ? 'travel' : 'gym';
}

export function workoutModeLabel(mode: WorkoutMode): string {
  return mode === 'travel' ? 'Travel' : 'Gym';
}
