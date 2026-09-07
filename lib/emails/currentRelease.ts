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
  version: '7.2.0',
  title: 'You decide how much I talk.',
  subject: 'You decide how much I talk.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: false,
  includeNewAthletes: false,
  intro:
    'I used to call every set, man. Good, bad, how hard — every single one. Some of you want that. Some of you want the bar and quiet. Fair enough. Now you pick.',
  mid: 'Open Edit profile and find Noise Control. Set the call after a set, and the call after you rate how hard it was, to Every set, Once per exercise, or Off. Vote on how hard it was every time either way — that part does not change. Turn the calls down and I still know. A new PR still lands in your inbox even with the screen off. Quit does not get quieter. Only I do.',
  close: 'Open a session, set it the way you want it, and get under the bar. The work does not care how loud I am.',
  lead: '',
  groups: [
    {
      heading: 'Noise Control',
      wins: [
        'New: Edit profile > Noise Control.',
        'Set-result screens: Every set, Once per exercise, or Off.',
        'How-hard-result screens: same three choices, voting stays every set.',
        'New PR screen: your own on/off. Still in your recap email either way.',
      ],
    },
    {
      heading: 'On the set itself',
      wins: [
        'The set you are on now gets a gold outline.',
        'How hard glows gold the first time it shows up.',
        'Stop on a plank or hold finishes the set — no extra tap.',
        'Last time now shows the effort you logged, not just the weight.',
      ],
    },
    {
      heading: 'More room to lift',
      wins: [
        'Scroll down mid-session and the header folds up out of the way.',
        'Scroll back up and it is there again.',
        'Rest clock pulses gold and buzzes the last 5 seconds. You will feel it end.',
      ],
    },
  ],
  wins: [],
  also: [],
};
