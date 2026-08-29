import { BELT_ACTIVITY_OPTIONS } from '@/lib/belts';

export function normalizeActivityLabel(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = BELT_ACTIVITY_OPTIONS.find((item) => item.toLowerCase() === raw.toLowerCase());
  return match || raw.slice(0, 40);
}

/** Stored on workout_sessions.workout_type so it still counts as bonus. */
export function bonusActivityType(label: string) {
  return 'Bonus · ' + normalizeActivityLabel(label);
}

export function isBonusActivityType(workoutType: string | null | undefined) {
  return /^bonus\s*·/i.test(String(workoutType || ''));
}
