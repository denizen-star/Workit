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
  version: '7.6.0',
  title: 'The board stopped repeating itself.',
  subject: 'The board stopped repeating itself.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'Man, the medal screen had a glitch. Win a week, and the board should tell you once. Instead it kept telling you — new phone, new browser, same news, over and over. Fixed. It tells you once, then it lets you work.',
  mid: 'Also cleaned up the live card. Mid-set, the numbers used to just add up today’s work. Now one tile shows what you moved the last time you ran this exact lift, so you know what you are actually chasing. And the row under the exercise name — sets, Gym or Travel, Lb or Kg, thumbs — fits on one line now, even on a phone. No more hunting for the second thumb.',
  close: 'None of this changes the work. It just gets out of the way of it faster. Open the app and see it, man.',
  lead: '',
  groups: [
    {
      heading: 'Medal takeover',
      wins: [
        'Shows once per week now, not every login.',
        'Same result whether you open it from your phone’s home screen or a browser.',
      ],
    },
    {
      heading: 'Live workout card',
      wins: [
        'One tile now shows your last time on this exact lift, not just today’s sum.',
        'Sets, Gym/Travel, Lb/Kg, and the thumbs all sit on one line — no more wrapping.',
      ],
    },
  ],
  wins: [],
  also: [],
};
