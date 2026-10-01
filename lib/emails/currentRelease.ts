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
  version: '11.4.0',
  title: 'Less talk. More lifting.',
  subject: 'Less talk. More lifting — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Real talk: we coaches were chattering way too much! A line after every single rest adds up to thirty-plus a workout, and that is noise, not coaching. You are doing the work. You deserve a coach who knows when to let you lift.',
  mid: 'So now when rest ends, the screen just says Next. Once per exercise, partway into a set, I will jump in with a little fire. And when you finish an exercise you get one line: your new record if you set one, else the gain you made on last time, else how hard it felt.',
  close:
    'Fewer words, and every one of them counts. I believe in every rep you put in. Quit is the only thing that ever gets the last word.',
  lead: '',
  groups: [
    {
      heading: 'Changed',
      wins: [
        'Rest over — the screen says Next. Horn and buzz, no talking.',
        'Pep talk — once per exercise, partway into a set.',
        'Finishing an exercise — one line: new record, else a gain, else how hard it felt.',
        'Total — about 14 coach lines a workout, down from up to 37.',
      ],
    },
    {
      heading: 'Gone',
      wins: ['Set down — a weaker set than last time no longer gets a coach line.'],
    },
  ],
  wins: [],
  also: [],
};
