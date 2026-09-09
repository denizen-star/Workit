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
  version: '7.5.0',
  title: 'Fair work is still itself.',
  subject: 'Fair work is still itself.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'The board got honest. Fair work still counts as itself. Soft work pays less. Max pays more. That is growth, man.',
  mid: 'You vs is a table now: you, last time you posted those numbers, and the person next to you in this house — or the house average. Pick 7d, 30d, or all time. Same window on The house. Finish recap is each lift versus last time that lift ran, warmup and cooldown included. Cards under Daily weight start folded. Open what you need.',
  close:
    'Look at Last. Then beat it. Quit stays on the floor if you leave the work there. Open the app and report in.',
  lead: '',
  groups: [
    {
      heading: 'You vs',
      wins: [
        'You — Last — them. Them is Next in this house, or House if you are alone.',
        '7d / 30d / All time. One row on The house drives the whole board.',
        'Place, best day, bonus, optionals, and run + bike sit in the table.',
      ],
    },
    {
      heading: 'Finish recap',
      wins: [
        'Each lift versus last time that lift ran.',
        'Warmup, cooldown, and optional lbs on that same table.',
      ],
    },
    {
      heading: 'Effort',
      wins: [
        'Fair is 1.0 — Effective matches Volume.',
        'Easy 0.8 · Light 0.9 · Hard 1.1 · Max 1.2. In between interpolates.',
        'The number next to How hard is that factor (`4.3 · 1.13`), not a percent.',
      ],
    },
    {
      heading: 'Home',
      wins: [
        'Week lock tiles show that day’s volume versus last time.',
        'Cards under Daily weight start folded.',
      ],
    },
  ],
  wins: [],
  also: [],
};
