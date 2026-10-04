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
  version: '12.1.0',
  title: 'Your weekend work counts where it should.',
  subject: 'Weekend workouts count on your week — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Locked your week and still showed up on the weekend? That's the kind of hunger I love to see, and it deserves credit in the right place.",
  mid:
    "Now when you lock your week and add a Your pick on Saturday or Sunday, it counts on that week, not next week. Select Workout opens right on it. And every Your pick you finish now shows up in your Completed log, so you can look back at all of it.",
  close:
    "Extra work is still work. Keep stacking it, and leave quit at the door. I'm proud of you.",
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: ['Weekend Your pick — after your week locks, a Saturday or Sunday workout counts on that week.'],
    },
    {
      heading: 'Fixed',
      wins: ['Completed log — your Your pick workouts show up there now.'],
    },
  ],
  wins: [],
  also: [],
};
