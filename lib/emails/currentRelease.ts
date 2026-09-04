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
  version: '5.7.0',
  title: 'The board. The six. The prize.',
  subject: 'The board. The six. The prize.',
  signer: 'Master Tom Iron',
  tone: 'master',
  intro:
    'Three things landed, man. Your face on the board. Six holds you pick the heat for. A prize I pay or withhold. Quit does not get a share.',
  mid: 'I use your first name. I pay in growth, lean, definition, power, stamina, mobility. The rest of Your performance is still there. I did not take it.',
  close: 'Hard-refresh. Home or Your performance. Read the tile. Open a session if you owe one. Stretch or Core. Then Easy, Medium, or Hard.',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: true,
  lead: '',
  groups: [
    {
      heading: 'Your tile',
      wins: [
        'First on Home and Your performance — the same house card.',
        'Rank, name, total lb, last workout.',
        'Workouts, sets, heaviest, best day, time, medals, belt.',
        'The hunt line — still under it.',
        'T / T-1 / T-7 / T-15 / T-30 / All — the tile follows the pill.',
        'Nothing in the window — you still show. Zeros. The board moved without you.',
        'You vs last time — still under the tile. Nothing came off the page.',
      ],
    },
    {
      heading: 'Optional stretch and core',
      wins: [
        'Stretch or Core — then Easy, Medium, or Hard.',
        'Six holds — stills, a clip, and how to do it.',
        'Upper day — arms and spine.',
        'Lower day — hips and legs.',
        'Easy — gym mobility you can talk through.',
        'Medium and Hard — a short pilates or yoga class.',
        'Last Done — still +500. Run and bike did not change.',
      ],
    },
    {
      heading: 'What you earn',
      wins: [
        'Growth — the muscle keeps the hour.',
        'Lean — sweat is the receipt.',
        'Definition — the last third cuts it in.',
        'Power — the bar remembers.',
        'Stamina — stay and it sticks.',
        'Mobility — clean shape under load.',
        'First name — not a greeting.',
        'Leave a session open — the growth already started without you.',
        'Miss last week — the power and the lean took it off with you.',
      ],
    },
  ],
  kevin: {
    intro:
      'Same three things, man. Tile first. Six holds. The prize. Check a name when you want more than you.',
    mid: 'Empty filter is empty. The cards still add. The tile does not replace the rest.',
    close: 'Hard-refresh. Open Your performance. Read your tile. Then pick who you want.',
  },
  wins: [],
  also: [],
};
