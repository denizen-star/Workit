export const TONE_COOKIE = 'workit_coach_tone';

export const COACH_TONES = ['master', 'sergeant'] as const;

export type CoachTone = (typeof COACH_TONES)[number];

export const COACH_TONE_OPTIONS: Array<{
  id: CoachTone;
  label: string;
  blurb: string;
}> = [
  {
    id: 'master',
    label: 'Master Challenge',
    blurb: 'The original voice. Direct. I own you. I call you sissy. Good man stays good man.',
  },
  {
    id: 'sergeant',
    label: 'Soft Encouragement',
    blurb: 'A warm, grounded guide. Present. Gentle. She keeps you in the work.',
  },
];

export function isCoachTone(value: unknown): value is CoachTone {
  return value === 'master' || value === 'sergeant';
}

export function normalizeCoachTone(value: unknown): CoachTone {
  return isCoachTone(value) ? value : 'master';
}

export function coachDisplayName(tone: CoachTone) {
  return tone === 'sergeant' ? 'Soft Encouragement' : 'Master Challenge';
}
