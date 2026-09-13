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
  version: '7.11.0',
  title: 'Every set gets its say now — and you can change it.',
  subject: 'Every set gets its say now — and you can change it.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  includeNewAthletes: false,
  intro:
    "Man, a bug had you skipping past rating a set sometimes — move to the next one and the last one folded up before you got a say. That is fixed. Every set gets its moment now.",
  mid: "And once you rate it, you are not locked in. Open a finished set back up and change how hard it was, if you called it wrong the first time. The slide starts empty too, nothing filled in until you actually drag it — it will never look rated when it isn't. Rate it and the set folds down smooth now, one clean move instead of two.",
  close: "Finish the exercise and the card holds its gold a beat longer — long enough to feel earned, not rushed by. Nothing borrowed, nothing hurried. That is growth counted right, man.",
  lead: '',
  groups: [
    {
      heading: 'Rating a set',
      wins: [
        'Every set now gets its chance to be rated — a bug that skipped it sometimes is fixed.',
        'You can reopen a finished set and change how hard it was.',
      ],
    },
    {
      heading: 'The slide',
      wins: [
        'Starts empty until you actually rate it — it never looks pre-filled anymore.',
      ],
    },
    {
      heading: 'Finishing an exercise',
      wins: [
        'The gold flash holds a beat longer, and the card cleans itself up once every set is done.',
      ],
    },
    {
      heading: 'Rest',
      wins: [
        'Rest between sets is bigger and plainer to read.',
      ],
    },
  ],
  wins: [],
  also: [],
};
