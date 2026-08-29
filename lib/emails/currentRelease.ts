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
  groups: ReleaseGroup[];
  wins: string[];
  also: string[];
} = {
  version: '5.0.0',
  title: 'Belts. A year. You earn the paper.',
  subject: 'Diplomas. 48 weeks. Finish after cooldown.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 5,
  onlyAthletes: [],
  lead:
    'Man. This is not a six-week visit. It is a year. You lock a week with four finishes. Gaps count. I put a chest on Home so you see the belt you hold, the one you are filling, and the one after that. Who shows who already earned it and who is still aiming. Do not confuse the two.',
  groups: [
    {
      heading: 'The year',
      wins: [
        'Weeks 1 to 6 stay two lowers. That is the saddle.',
        'Week 7 on: one lower, A then B week to week. Friday is Extra Upper. Saturday bonus is core in the app, or a run or yoga you mark. That mark still counts toward the four.',
      ],
    },
    {
      heading: 'The belts',
      wins: [
        '2 weeks: Dipping your toes. 6: Got back in the saddle. 10: I see you getting stronger. 20: Steady. 24: Weigh-up sprint. 48: Arnold Status.',
        'Open Belts. Before, During, After. Your row is ringed. The house is on that page too.',
        'Mail: I tell you how many weeks you have locked. When you cross a belt I send the diploma. Medals still mail with the mark.',
      ],
    },
    {
      heading: 'Home and the session',
      wins: [
        'Last lift scrolls you to cooldown. Finish it sits under that. The header does not close the day.',
        'The sentence is this week, Monday to Sunday Eastern. A locked week stays through Sunday. Next week starts Monday.',
        'You vs the house is cream you, copper them. You / house is vs the average. Your performance is you vs last time. Learn the difference.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh. Open Home. Read the chest. Open Belts. If Who says Aiming, you have not locked it yet.',
    'Put Work-It on your iPhone home screen. Safari only. Steps at the bottom. Gold Start in the dock, man.',
  ],
};
