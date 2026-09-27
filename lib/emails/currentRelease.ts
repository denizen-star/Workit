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
  version: '10.2.0',
  title: 'Every new face starts on the same page.',
  subject: 'Before you join — 18+, your pace, and a code we all train by',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Quick one today, and it is about the people who come next. The house is growing, and every new face deserves to walk in knowing exactly what this place is.',
  mid: 'So anyone joining now gets one clear screen before they sign up. Adults only. Your body, your pace, your call. We plan the work. You own how hard you push it. That is the deal it has always been. Now it is written down where everyone sees it first.',
  close:
    'You set the tone for everyone who walks in after you, and I know you are going to make them want to keep up. Go train. Growth, power, stamina. They are waiting for you. Quit is the only thing not welcome here.',
  lead: '',
  groups: [
    {
      heading: 'Joining Work-It',
      wins: [
        'New screen — before signing up, everyone confirms they are 18 or older.',
        'Your pace, your risk — workouts and weights are suggestions. Know your injuries and health limits.',
        'Invite links too — friends you invite see the same screen.',
        'Under 18 — that phone cannot sign up. Tapped it by mistake? Send one request from that screen.',
      ],
    },
    {
      heading: 'Code of Conduct',
      wins: [
        'New in the waiver — treat people with respect, no harassment.',
        'Log real work — only training you actually did.',
        'Privacy — do not share other people\'s photos or info.',
        'One account each — and keep your PIN to yourself.',
        'Already signed up? Nothing to do. Your signature stands.',
      ],
    },
  ],
  wins: [],
  also: [],
};
