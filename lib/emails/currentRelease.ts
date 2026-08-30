/**
 * User-facing release notes. `/document` rewrites this from CHANGELOG Unreleased,
 * then runs `npm run mail:release`. Household tone only — no Netlify, env vars, or admin tooling.
 */
import type { CoachTone } from '@/lib/coachTone';

export type ReleaseGroup = {
  heading: string;
  wins: string[];
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
  lead?: string;
  intro?: string;
  mid?: string;
  close?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '5.3.0',
  title: 'Who you are. How you lift.',
  subject: 'Who you are. How you lift.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro: 'You will know the door now. You will know the lift. I do not leave you guessing, man.',
  mid: 'Tap the mark. Read it. Then get under the bar. Quit stays outside.',
  close: 'Hard-refresh. Open Who if you forgot the PIN. Then report in.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  onlyAthletes: [],
  lead: '',
  groups: [
    {
      heading: 'Who',
      wins: [
        "What is Work-It? — tap the mark next to Who's working out. What the app is. Then four short points.",
        'Claim — three lines. Make the PIN. Gold Start is next.',
        'Home screen — on claim, a short mark. Safari. Share. Add.',
        'Forgot PIN — under the pad if that name has mail. I send a link. One hour. New four digits.',
      ],
    },
    {
      heading: 'The lift',
      wins: [
        'How — the mark on the name. Gym or travel. Plain trainer talk.',
        'The card — the long italic line is gone. Stills and video stay.',
      ],
    },
  ],
  wins: [],
  also: [],
};
