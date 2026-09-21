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
  version: '8.2.0',
  title: 'Dark Premium Medals.',
  subject: 'Dark Premium Medals.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Man, the old cartoons were fine for a minute, but they did not match the house. We fixed that.',
  mid: 'Badges, belts, and week medals now look like they belong here. Dark metal, crisp borders, and a glow that actually looks like a prize. Your chest is upgraded.',
  close: 'The metal looks better. Now go earn more of it. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: [
        'Redesigned Medals — Badges, belts, and week podium medals have been completely redesigned with a sleek, dark premium UI aesthetic. They now feature deep metallic backgrounds, crisp colored borders, glowing line-art icons, and glassmorphic highlights.',
      ],
    },
  ],
  wins: [],
  also: [],
};
