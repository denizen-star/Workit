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
  version: '12.3.0',
  title: 'Every minute you run counts.',
  subject: 'Run longer, earn more — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "You picked 20 minutes, felt good, and kept going to 35? That's what I'm talking about. And now every one of those minutes counts.",
  mid:
    "Runs and rides now earn for the time you actually put in: 50 lb a minute, never less than the length you picked. Your warmup and cooldown run and bike work this way, and so does a Run in Your pick. Once the countdown hits zero, the clock shows what you've earned so far, so you can watch it climb.",
  close:
    "Your stamina is building every time you go. Go a little further, and leave quit at the door. I believe in you.",
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: [
        'Run and bike — earn 50 lb for every minute you actually go, never less than what you picked.',
        'Live clock — shows the pounds you have earned so far once you pass your pick.',
      ],
    },
  ],
  wins: [],
  also: [],
};
