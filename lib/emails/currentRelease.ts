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
  version: '6.0.0',
  title: 'Then. Now. Do not miss a beat.',
  subject: 'Then. Now. Do not miss a beat.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'The close of a day changed, man. Before: stars, a shout, medals in a pile, Home. Easy to skip a beat. Quit still got a score. That is done.',
  mid: 'Now the beats are fixed. You will feel each one. The numbers have names. Effective is the work times how hard it sat. Place is still the iron. Read this. Then finish a day and walk the new close.',
  close: 'Hard-refresh. Open Home. When you owe a session, Finish it. Recap. Then the line. Then what you earned. Quit does not get a score. Get under the bar.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  lead: '',
  groups: [
    {
      heading: 'Then · now',
      wins: [
        'Finish — was a shout, then medals, then Home. Now recap, then the coach line, then awards, then Home.',
        'Leave early — used to ask for stars. Now the day does not get a score.',
        'Awards — YOU EARNED IT in your belt color. Full diploma card if you unlocked one. Next diploma named under it. New badges in a row.',
        'The four numbers — Weight, Reps, Volume, Effective. Same tiles on Home, in the room, and on the recap.',
        'Effective — Volume × how hard it felt. Fair is even. Hard pays. Easy costs. Skip How hard = Fair.',
        '% — vs last time those same lifts ran. Not vs last week on the calendar.',
        'Place — still the raw iron. How hard does not buy rank.',
      ],
    },
    {
      heading: 'Home',
      wins: [
        'Today — four numbers for the last 15 days vs last time those lifts ran.',
        'Session stories — last session, best lift, what did not move, this week vs last time.',
        'You vs — last 7 days vs the person one place up. Rank is finished days, then Volume.',
      ],
    },
    {
      heading: 'After you train',
      wins: [
        'Stars — 1 to 5, then Complete it. That is the only way the day gets a score.',
        'Recap — this workout vs last time you ran that day. Continue.',
        'Coach — one line. Workout, bonus, or optional. Tap.',
        'Awards — the title, the diploma if it unlocked, the next one named, the badges. Then Home.',
      ],
    },
  ],
  kevin: {
    intro:
      'Same beats, man. Then was shout then medals then Home. Now recap, line, awards. Leave early does not score.',
    mid: 'Boards name Weight, Reps, Volume, Effective. Place stays raw. Do not start a session as you.',
    close: 'Hard-refresh. Home first. Walk a finish as Test if you need to see the stack.',
  },
  wins: [],
  also: [],
};
