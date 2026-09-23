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
  version: '9.1.0',
  title: 'The finish is spoken.',
  subject: 'The finish is spoken.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'The end of the session was a silent card. That is finished. When a man completes the work, I say the line, and my face is on the screen, large, so there is no question who is talking.',
  mid: 'Finish it and you hear the complete line. Try to leave early and you hear the quit line, with the close face staring back. Same two switches as the rest of the session. Coach voices and Workout sound both have to be on. Turn the speech off and the words stay. The chimes stay on their own switch. The belt and the badges still come after, on their own screen. They are the prize, not another speech.',
  close:
    'Hear the last line. Then go earn the next one. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'You will hear',
      wins: [
        'Workout complete — the finish line is spoken, with a large celebrating coach face.',
        'Quit — the early-exit line is spoken, with a large close face.',
        'Both switches — Coach voices and Workout sound have to be on. One without the other and the voice stays quiet.',
      ],
    },
  ],
  wins: [],
  also: [],
};
