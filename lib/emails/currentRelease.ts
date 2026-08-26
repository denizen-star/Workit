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
  version: 'Count it',
  title: 'I count while you work. Gym or hotel, per lift.',
  subject: 'I put a meter on the iron, man.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. You open a session and I am already on you. This workout. All-time. Gold numbers sitting under the header so you cannot pretend you are just warming up. And if the hotel is the gym today, you do not have to throw the whole day into Travel. You flip the lift that needs it. One movement. Then you get under it.',
  groups: [
    {
      heading: 'On the floor',
      wins: [
        'Sticky bar under the title. This workout is the lbs you already logged, plus the +500 if you actually did the warmup or cooldown. Reps skip the timed and distance junk. All-time is everything you have ever moved, including this session, without counting it twice.',
        'Gym / Travel lives on each exercise now. Select Workout still picks the day default. Then each card has its own pill. Name, notes, pictures, video — they follow the switch. The second you complete a set on that movement, I lock the pill. You picked. Live with it.',
        'Hotel stills that were lying to you are fixed. Single-leg RDL is a one-leg hinge, not a dead link. Hamstring floor slides are heels on a towel, not a gym curl machine. Look at the pictures and do what they say.',
      ],
    },
    {
      heading: 'Home, after you lock the week',
      wins: [
        'Under the four day tiles: week performance. Same chrome. More load. More reps. Less drop. Less cut. This week versus the last time you touched those lifts. First pass is dashed. That is me telling you there is nothing to beat yet. Beat it next time.',
        'Your performance is on for every man in this house, including the test profile. You vs the leader still is not. I am not putting a dummy on the hunt board.',
        'Type is bigger on Home and The house. I want a 50-year-old thumb to hit the gold without squinting.',
      ],
    },
    {
      heading: 'The log',
      wins: [
        'Closed session card: gold check, then lbs, reps, and time. Gym or Travel. Date. Set count. Best day if you earned it. Same card on Select Workout when the day is already done.',
        'Week folds do the same math. Week 1 totals every finished day in that week, open or shut. Four required days done and I put a check on the week. You wanted the closed card to tell the truth. Now the week does too.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. If the live session has no meter under the title, you are on the old one.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom. I want that gold Start in your dock, man.',
  ],
};
