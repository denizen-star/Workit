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
  kevin?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '13.0.3',
  title: 'Calmer Home, smarter next step.',
  subject: 'Home got calmer — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Quick one, and it's all about keeping you moving! Home is calmer now, and your next workout is the same wherever you look.",
  mid:
    "When there's news for you on Home, like a medal, a check-in or a note from me, it now comes one screen at a time instead of piling up. And if you've tried Hyrox Training or Overload Progressions and come back, your reminders and workout emails now point to exactly where you left off.",
  close:
    "One screen, one next step, one more rep. I believe in you. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Calmer Home',
      wins: [
        'Medals, check-ins, notes — one at a time, each waits its turn.',
        'Everything — a little quicker to open.',
      ],
    },
    {
      heading: 'Right next step',
      wins: [
        'Back from Hyrox or Overload — reminders and emails point to your real next workout.',
        'Hyrox — Select Workout opens your current week.',
        'Hyrox weeks — no belt shows up that you did not earn.',
        'Program complete — only after the full 48 weeks.',
        'Awards after a Yoga, Core or Run pick — the right belt color.',
      ],
    },
  ],
  wins: [],
  also: [],
};
