/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
};

export type ReleaseCopy = {
  intro?: string;
  mid?: string;
  close?: string;
  groups?: ReleaseGroup[];
};

export const CURRENT_RELEASE: {
  version: string;
  title: string;
  subject?: string;
  signer?: string;
  tone?: CoachTone;
  onlyAthletesWithWorkouts?: boolean;
  activeInDays?: number;
  onlyAthletes?: string[];
  includeNewAthletes?: boolean;
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  /** Extra / replacement copy for Kevin only. Athletes never see this. */
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '7.10.0',
  title: 'The card lights up gold when you’ve earned it.',
  subject: 'The card lights up gold when you’ve earned it.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  includeNewAthletes: false,
  intro:
    "Man, when you finish a lift now, the card knows it. Rate that last set and gold sweeps across it, a mark lands by the name — your work counted right in front of you, not buried in a menu.",
  mid: "How hard used to be five buttons. Now it is a slide — drag it, gold marks light up as you go, and once you rate it the set folds down to one clean line instead of sitting there cluttering the card. Between lifts, the rest clock got bigger too — it tells you plainly to catch your breath, counts down loud, and does not let you miss it.",
  close: "And Best on that card is now your best ever on that lift, not just what you did last time. Nothing borrowed, nothing softened. Quit never sees any of it. That is growth counted right, man.",
  lead: '',
  groups: [
    {
      heading: 'Finishing a lift',
      wins: [
        'The exercise card flashes gold and marks itself the moment you rate your last set.',
      ],
    },
    {
      heading: 'Rating a set',
      wins: [
        'How hard is now a slider you drag, and a rated set folds down to one clean line.',
      ],
    },
    {
      heading: 'Between sets',
      wins: [
        'The rest clock is bigger, plainer, and impossible to miss.',
      ],
    },
    {
      heading: 'Your best',
      wins: [
        'Best now shows your all-time best on that lift, not just last session’s number.',
      ],
    },
  ],
  wins: [],
  also: [],
};
