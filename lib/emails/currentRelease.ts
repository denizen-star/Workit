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
  version: '11.2.0',
  title: 'More programs, one tap away.',
  subject: 'More programs, one tap away — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Your menu just got a new home for the big stuff! Hyrox Training and Overload Progressions now live together under More programs, right at the top. No hunting. You always know where they are and how close you are.',
  mid: 'Not open yet? You will see a lock. Tap it and it tells you how many locked weeks you have. Six opens both. And your weight log got better too: add a weigh-in any time, and fix a typo with one tap.',
  close:
    'Six locked weeks is closer than you think. I have watched you show up week after week, and I know you get there. Quit is the only thing that never unlocks anything.',
  lead: '',
  groups: [
    {
      heading: 'New',
      wins: [
        'More programs — Hyrox Training and Overload Progressions, together at the top of the Home menu.',
        'Locked programs — show a lock. Tap to see how many locked weeks you have.',
        'Weight log — add a weigh-in any time, or remove one you mistyped.',
        'Body weight — now at the top of Your performance and under the weight field in Edit profile.',
      ],
    },
    {
      heading: 'Also',
      wins: [
        'Overload Progressions — opens at 6 locked weeks, same as Hyrox.',
        'Unlock banners on Home — show for 3 days, then step aside. Tap the ✕ to hide one sooner.',
      ],
    },
  ],
  wins: [],
  also: [],
};
