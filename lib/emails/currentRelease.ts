/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Written in Eli Sparks's voice (every athlete gets
 * the same letter, whoever their coach is). Household tone only — no Netlify, env vars, or admin tooling.
 */

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
  version: '11.2.1',
  title: 'Nobody gets lost on the way in.',
  subject: 'Nobody gets lost on the way in — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Every person who walks up to the door matters to me! Until now, if someone typed in their name and email and then stepped away before picking a PIN, we lost them. Not anymore.',
  mid: 'The moment they tap Next, we hold their spot. If they come back with the same email, they pick up right where they left off. Their account stays quiet until they set a PIN and confirm their email, so nothing shows up on the board early.',
  close:
    'Getting started is the hardest rep of all, and I want every new face to make it through. Quit is the only thing that ever really loses anyone.',
  lead: '',
  groups: [
    {
      heading: 'Fixed',
      wins: [
        'Joining — your details are saved the moment you tap Next.',
        'Coming back — same email picks up where you stopped.',
        'Privacy — nothing shows on the house board until the PIN is set and the email is confirmed.',
      ],
    },
  ],
  wins: [],
  also: [],
};
