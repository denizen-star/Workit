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
  version: '7.0.0',
  title: 'The door changed. The work did not.',
  subject: 'The door changed. The work did not.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: false,
  includeNewAthletes: false,
  intro:
    'The name list is gone, man. You report in with the mail and four digits. That is the door now. Quit is not a way around it.',
  mid: 'A new house can walk in through Join. They accept the waiver. They prove the inbox. Then they train. You already had a name here. First Home asks you to confirm it and accept the same terms. First plus last is the full name. I call the alias if you have one.',
  close: 'Hard-refresh. Open login. If you already train, that is your door. Get under the bar.',
  lead: '',
  groups: [
    {
      heading: 'The door',
      wins: [
        'Log in — email and a four-digit PIN. No tapping a name.',
        'Join — intro, your details, the waiver, then PIN.',
        'New people — open the mail once. Home waits until they do.',
        'Forgot PIN — still mail. Same four digits is allowed.',
      ],
    },
    {
      heading: 'The house',
      wins: [
        'Two packs — The OG and Gowanus. Same year. Same four days to lock a week.',
        'Invite stays in the house that sent it.',
        'If you are in both, switch in the menu. The board follows.',
      ],
    },
    {
      heading: 'You',
      wins: [
        'First and last name. Full name updates from those two.',
        'Alias if you want one. I use that, or your first name.',
        'Photo, phone, weight in lb — optional.',
        'Waiver — check it. The text you accepted is kept.',
        'How to use — on Home until you finish five days.',
      ],
    },
  ],
  kevin: {
    intro:
      'This letter is yours only, man. The house does not get it. Same facts as below. The door is login. Join is for the new house.',
    mid: 'You already had a name here. First Home asks you to confirm it and accept the terms. First plus last is the full name.',
    close: 'Hard-refresh. Open login. Then the bar.',
  },
  wins: [],
  also: [],
};
