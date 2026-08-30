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
  version: '5.0.0',
  title: 'A year. Belts. You earn the paper.',
  subject: 'New orders. 48 weeks. Diplomas.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro: 'Do not skim. These are orders. Read them. I do not repeat myself for quit.',
  mid: 'I put the year on paper. Stay on it.',
  close: 'Hard-refresh. Open Home. Then get under the bar.',
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
      heading: 'Home',
      wins: [
        'Three belts — the one you hold, the one you are filling, the next one.',
      ],
    },
    {
      heading: 'Who',
      wins: [
        'Solid — you earned that belt',
        'Aiming — you have not locked it yet',
      ],
    },
    {
      heading: 'The session',
      wins: [
        'Last lift — scrolls you to Easy cooldown',
        'Finish it — under that card, phone and desktop',
        'Header — does not close the day',
      ],
    },
  ],
  wins: [],
  also: [],
};
