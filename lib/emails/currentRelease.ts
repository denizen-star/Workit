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
  version: '5.8.0',
  title: 'Hold the line. Read Effort.',
  subject: 'Hold the line. Read Effort.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'The number changed, man. The lb you see is after How hard. Place still goes to the iron. Quit does not get a new scale.',
  mid: 'Home tells you what to hold. Your performance reads as a sentence, then the lifts. Stronger is more iron while Effort holds or drops. If the total rose only because Effort rose, you pushed. That is not the same thing.',
  close: 'Hard-refresh. Home. Read the hold line. Open Your performance. Start WO if you owe one.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  lead: '',
  groups: [
    {
      heading: 'The number',
      wins: [
        'Lb on the boards — after Effort.',
        'How hard 1–5 — skip counts as Fair, 60%.',
        'Optional +500 — still raw. Not scaled.',
        'Place and week medals — still the raw iron.',
        'Live Today bar — still what you typed.',
        'Effort on a tile — 4.3 · 86%.',
        'Stronger — more iron, or the same, while Effort holds or drops.',
      ],
    },
    {
      heading: 'Home',
      wins: [
        'Title — W3 - Lower B.',
        'One row — Start WO, Select WO, Invite.',
        'Hold line — last same day, heaviest set, Effort you voted. The whole sentence.',
        'First time — log the iron and Effort.',
        'Daily line — cream is Effort lb. The wash is How hard that day.',
      ],
    },
    {
      heading: 'Your performance',
      wins: [
        'Summary — the read. Not a dump.',
        'Details — your tile and the flags.',
        'Progression — up, down, held, every lift.',
        'One lift — weight, reps, total. Then Weight, Reps, Total, Effort on one row.',
      ],
    },
    {
      heading: 'In the room',
      wins: [
        'Phone — tries to stay portrait while you lift.',
        'Rest and the set clock — a chime when it hits.',
        'Stretch and Core — a still for each hold.',
      ],
    },
  ],
  kevin: {
    intro:
      'Same letter, man. Boards show Effort. Rank stays raw. Home is quiet. Your performance is Summary, Details, Progression.',
    mid: 'Pills stay on one row. The house tile sits in Details. Admin Athletes is still the old stack.',
    close: 'Hard-refresh. Home first. Then Your performance. Do not start a session as you.',
  },
  wins: [],
  also: [],
};
