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
  version: '11.0.1',
  title: 'Your mail is back.',
  subject: 'Your Work-It emails are back',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'Quick one, and a good one. For a few days, some of our emails were not reaching you. That is fixed. Your reminders, your scoreboard and your recaps are coming through again.',
  mid: 'If you have a friend who tried to join and never got their sign-up email, have them try again. It will land now. The house is only better with more people in it.',
  close:
    'Nothing else changes for you. Keep training, keep locking weeks. Quit is still the only thing that never gets an email from me.',
  lead: '',
  groups: [
    {
      heading: 'Back on',
      wins: [
        'Sign-up — new athletes get their verify and welcome email again.',
        'Invites — the friends you invite get their invite.',
        'Forgot PIN — the reset email arrives.',
        'Reminders and the weekly scoreboard — back in your inbox.',
        'Missed something — anything from Sep 24 on may not have reached you.',
      ],
    },
  ],
  wins: [],
  also: [],
};
