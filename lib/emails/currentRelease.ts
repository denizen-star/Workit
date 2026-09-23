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
  /** Luna's letter when this release has its own words. Otherwise she gets the shared copy. */
  luna?: ReleaseCopy;
  wins: string[];
  also: string[];
} = {
  version: '9.1.1',
  title: 'Christine was right.',
  subject: 'Christine was right about the cooldown and the slider.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: ['Christine', 'Kevin'],
  includeNewAthletes: false,
  intro:
    'Christine Widga wrote two notes on Monday night, after Lower Body B. The cooldown fought her. The How hard slider fought her. I opened that session. She was right.',
  mid: 'The level buttons sat under the coach. A second tap from the phone could start Easy, Medium, or Hard before she chose. Two copies of that same day opened at the same moment. She logged the real one. When the app quit, Resume opened the empty copy, so she typed every set again. The pictures for that Core circuit are fine. The page died before they could show. The slider moved, and the score waited for a click a phone often never sends. Complete Set stayed locked until that click landed.',
  close:
    'That quit is not welcome here. The work she already logged stays. The next Start opens the session that has her sets.',
  lead: '',
  groups: [
    {
      heading: 'What she reported',
      wins: [
        'Cooldown — she could not pick a level. One started on its own. The pictures never showed. The app quit. She had to log the workout again by hand.',
        'How hard — the slider stuck. She tapped it several times before the set would complete. She asked for the score to be optional.',
      ],
    },
    {
      heading: 'What I found',
      wins: [
        'Cooldown — Lower Body B, Monday night. She did save Core, Medium. The level buttons sat under the coach, so a leftover tap could start a level. Two copies of that day opened together. Resume came back on the empty one.',
        'Pictures — the Core stills are there. The app quit before they could show.',
        'How hard — the bar moved, and the score waited for a click. On her phone that click often never arrived, so Complete Set stayed shut.',
      ],
    },
    {
      heading: 'What I changed',
      wins: [
        'Levels — Easy, Medium, and Hard sit above the coach. A level starts only when you tap it.',
        'How hard — optional. Complete Set goes through once the weight and the reps are in. Skip still counts as Fair. One tap records the score.',
        'Start — a second tap opens the session that already has the sets. It will not make a blank copy.',
      ],
    },
  ],
  luna: {
    intro:
      'You wrote me Monday night, after Lower Body B. The cooldown would not let you choose a level. The slider would not let you finish a set. I looked at that session. You were right about both.',
    mid: 'The level buttons were sitting under me, so a second tap could start a level you had not chosen. Two copies of that day opened at once. You logged the real one. When the app quit, coming back opened the empty copy, and you had to type every set again. The pictures for that Core circuit are fine. The page died before they could show. The slider moved under your finger, and the score waited for a tap the phone often swallowed, so Complete Set stayed shut.',
    close:
      'A level starts only when you tap it, and those buttons sit above me. How hard is optional. Leave it and the set counts as Fair. Start again and you get the session that already has your work. Quit is still the only thing not welcome in here.',
    groups: [
      {
        heading: 'What you reported',
        wins: [
          'Cooldown — you could not pick a level. One started on its own. The pictures never showed. The app quit. You had to log the workout again by hand.',
          'How hard — the slider stuck. You tapped it several times before the set would complete. You asked for the score to be optional.',
        ],
      },
      {
        heading: 'What I found',
        wins: [
          'Cooldown — Lower Body B, Monday night. You did save Core, Medium. The level buttons sat under me, so a leftover tap could start a level. Two copies of that day opened together. Coming back opened the empty one.',
          'Pictures — the Core stills are there. The app quit before they could show.',
          'How hard — the bar moved, and the score waited for a click. On your phone that click often never arrived, so Complete Set stayed shut.',
        ],
      },
      {
        heading: 'What I changed',
        wins: [
          'Levels — Easy, Medium, and Hard sit above me. A level starts only when you tap it.',
          'How hard — optional. Complete Set goes through once the weight and the reps are in. Skip still counts as Fair. One tap records the score.',
          'Start — a second tap opens the session that already has your sets. It will not make a blank copy.',
        ],
      },
    ],
  },
  kevin: {
    intro:
      'Christine Widga wrote two notes on Monday night, after Lower Body B. The cooldown fought her. The How hard slider fought her. I opened that session. She was right.',
    mid: 'The level buttons sat under the coach. A second tap from the phone could start Easy, Medium, or Hard before she chose. Two copies of that same day opened at the same moment, 9:57pm. She logged the real one through about 10:17. The cooldown she saved was Core, Medium. When the app quit, Resume opened the empty copy, and she retyped all fifteen sets in under a minute. The pictures for that Core circuit are fine. The page died before they could show. The slider moved, and the score waited for a click a phone often never sends. Complete Set stayed locked until that click landed.',
    close:
      'That quit is not welcome here. The work she already logged stays. The next Start opens the session that has her sets.',
  },
  wins: [],
  also: [],
};
