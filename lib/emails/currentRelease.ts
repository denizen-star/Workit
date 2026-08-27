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
  version: 'Phone floor',
  title: 'I stole the header so you can see the iron, man.',
  subject: 'Your phone just got out of the way, man.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. I packed the live session so the work sits in your face, not the chrome. Clock on the top row. Title centered under it. Finish it waits at the bottom until you have actually done the day. Rest now tells you how many sets you still owe me. Look at it. Then get under the next one.',
  groups: [
    {
      heading: 'On the phone',
      wins: [
        'Top row is Exit, Restart, the clock, and sound. Four slots. I spread them so you can hit them with a thumb. Week name and focus sit centered under that, full width. I cut the height so the first lift is not hiding under a novel.',
        'Finish it is not floating on your face anymore. On the phone it lives at the end of the session, after cooldown. You scroll the work. Then you tap. Stars still required. Desktop still has Finish it in the header. I did not forget you on a big screen.',
        'Under the title: Today and All-time. Tight. Today is this session — completed-set lbs plus the +500 if you actually did warmup or cooldown. All-time is everything you have ever moved, including today, counted once. I do not need a parade of capital letters to tell you what you lifted.',
      ],
    },
    {
      heading: 'While you rest',
      wins: [
        'Complete a set and the rest bar still sits on the floor. Clock on the left. Skip on the right. Progress in the middle: how many sets you have banked over the whole day. Read it. Then Skip when you are done sitting.',
        'I darkened that glass. You could see through it before. Now you can read the numbers without the squat pictures bleeding through. That is not decoration. That is me making sure you know where you are.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. If Finish it is still a gold chip in the phone header, you are on the old one.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom. I want that gold Start in your dock, man.',
  ],
};
