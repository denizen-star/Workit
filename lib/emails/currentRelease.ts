/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
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
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '5.2.0',
  title: 'A year. Belts. You pick the voice.',
  subject: 'New orders. 48 weeks. Diplomas.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro: 'Do not skim. The year is on paper. You pick who owns the hour. I do not repeat myself for quit.',
  mid: 'I put the year and the voices on paper. Stay on them, man.',
  close: 'Hard-refresh. Open Edit profile if you want a different coach. Then get under the bar.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  lead: '',
  groups: [
    {
      heading: 'The year',
      wins: [
        'Weeks 1 to 6 — two lower days. That is the start.',
        'Week 7 on — one lower, A then B.',
        'Friday — Extra Upper.',
        'Saturday bonus — core in the app, or a run or class you mark.',
        'Lock a week — four finishes. Missed days still count.',
      ],
    },
    {
      heading: 'The belts',
      wins: [
        '2 weeks — Dipping your toes',
        '6 weeks — Got back in the saddle',
        '10 weeks — I see you getting stronger',
        '20 weeks — Steady',
        '24 weeks — Weigh-up sprint',
        '48 weeks — Arnold Status',
      ],
    },
    {
      heading: 'Home and Who',
      wins: [
        'Home — the belt you hold, the one you are filling, the next one.',
        'Solid — you earned that belt.',
        'Aiming — you have not locked it yet.',
      ],
    },
    {
      heading: 'The session',
      wins: [
        'Last lift — scrolls you to Easy cooldown.',
        'Finish it — under that card, phone and desktop.',
      ],
    },
    {
      heading: 'The coaches',
      wins: [
        'James Grey — British. Private. He wants you present.',
        'Luna Meadows — Calm. Soft. She still holds the hard part.',
        'Master Tom Iron — I own the session. Quit is not a name I use.',
      ],
    },
    {
      heading: 'After you finish',
      wins: [
        'Recover tip — water and food, under the shout and in the recap.',
        'Letters — they follow the coach you pick.',
      ],
    },
  ],
  wins: [],
  also: [],
};
