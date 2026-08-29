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
  onlyAthletes?: string[];
  lead?: string;
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '4.5.0',
  title: 'Gold is the order. Learn the colors, man.',
  subject: 'Gold means move. Green means you did it.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. I painted the board so you stop guessing. Gold is the thing I want you to do. Green is done. Red is still a problem. Copper is the house. Cream is you. If you cannot read that, you are not looking.',
  groups: [
    {
      heading: 'What you will do with it',
      wins: [
        'Home week lock: gold tile is start here. Green is finished. Dashed is still owed. The legend sits there. Do not play dumb.',
        'Week performance: green is more load or more reps. Red is you dropped weight or cut reps. I wrote the meaning on the tiles. Tap if you forgot.',
        'Your line on the chart is cream. The house is copper dashed. I do not paint you gold. Gold is an order, not a trophy.',
        'Invite a friend is gold with a plus. Restart stays quiet gray. Bring a man who will actually train.',
      ],
    },
    {
      heading: 'Where the extra work lives',
      wins: [
        'Bonus and Optional flags moved to Your performance. Home stays quiet. Open the fold or the page and look at your Extra credit and Easy work.',
        'How hard sits on those cards and the Home fold charts. I want to see if you are working or posing.',
        'Daily weight and pack charts start on the first day you finished a session. Days before you existed on this program are gone. Rest days stay off the line. That was not a rest day. That was you not in the program yet.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. Then open Home and read the week lock like an adult.',
    'Put Work-It on your iPhone home screen. Safari only. Steps at the bottom. Gold Start in the dock, man.',
  ],
};
