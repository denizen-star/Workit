export const TONE_COOKIE = 'workit_coach_tone';

export const COACH_TONES = ['master', 'james', 'luna'] as const;

export type CoachTone = (typeof COACH_TONES)[number];

export const COACH_TONE_OPTIONS: Array<{
  id: CoachTone;
  label: string;
  blurb: string;
}> = [
  {
    id: 'master',
    label: 'Master Tom Iron',
    blurb:
      'Direct. I own the hour. Quit is not a name I use. The prize is growth, lean, definition, power, stamina, mobility.',
  },
  {
    id: 'james',
    label: 'James Grey',
    blurb: 'Grey. Private. He wants you present. The hour has to show on the body.',
  },
  {
    id: 'luna',
    label: 'Luna Meadows',
    blurb: 'Calm. Soft. She holds you in the hard part until the strength stays.',
  },
];

/** Maps stored/cookie ids, including the old Luna slot `sergeant`. */
export function asCoachTone(value: unknown): CoachTone | null {
  if (value === 'luna' || value === 'sergeant') return 'luna';
  if (value === 'master' || value === 'james') return value;
  return null;
}

export function isCoachTone(value: unknown): value is CoachTone {
  return value === 'master' || value === 'james' || value === 'luna';
}

export function normalizeCoachTone(value: unknown): CoachTone {
  return asCoachTone(value) ?? 'master';
}

export function coachDisplayName(tone: CoachTone) {
  if (tone === 'luna') return 'Luna Meadows';
  if (tone === 'james') return 'James Grey';
  return 'Master Tom Iron';
}
