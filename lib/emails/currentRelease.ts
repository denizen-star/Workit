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
  version: '10.4.1',
  title: 'Everything that shipped today.',
  subject: "Today's releases — 18+ join, Test Drive, and your nightly onboarding report",
  onlyAthletesWithWorkouts: false,
  onlyAthletes: ['Kevin'],
  includeNewAthletes: false,
  intro:
    'Big day, so here it is all in one place. Four releases went out today, v10.2.0 through v10.4.1. Two of them change how new people join and start. Two are just for you.',
  mid: 'The short version. Every new face now confirms they are an adult and own their pace before they sign up. Anyone who joins mid-week gets a Test Drive instead of waiting for Monday, and it never touches the board. And every night at 8 you get a report on who joined, who is stuck, and who is flying.',
  close:
    'The house is growing and the door is set up right. Go train. Growth, power, stamina. Quit is the only thing not welcome here.',
  lead: '',
  groups: [
    {
      heading: 'Joining Work-It · 10.2.0',
      wins: [
        'New screen — before signing up, everyone confirms they are 18 or older and train at their own risk. Invite links too.',
        'Under 18 / Pass — that browser cannot sign up. It can send you one access request, cleared in Admin → Users → Blocks.',
        'Block an account — Admin → Users has Block / Unblock. Blocked athletes are signed out, see only a dumbbell, get no automated mail, and stay on the boards.',
        'Code of Conduct — new §8 in the waiver: respect, real work only, privacy, one account each. Earlier signers keep their signature.',
      ],
    },
    {
      heading: 'Test Drive · 10.3.0',
      wins: [
        'Joined mid-week — start the same day. 3 workouts from Tuesday, 2 Wednesday to Friday, 1 on the weekend.',
        'Countdown on Home until Week 1, confetti and a workouts · pounds · time summary once done.',
        'Counts for them — totals, stats, badges, lift history. Never week locks, belts, the house board or medals.',
        'Monday — leftover Test Drive days disappear and their coach welcomes them to Week 1.',
      ],
    },
    {
      heading: 'Finishing a workout · 10.3.0',
      wins: [
        'Complete it shows Saving, Calculating, Checking while the numbers land.',
        'One tap — tapping twice will not save the workout twice. Same for Yoga, Core and the Hyrox milestone.',
      ],
    },
    {
      heading: 'Nightly onboarding report (just you) · 10.4.0',
      wins: [
        'Every night at 8pm Eastern — today\'s counts and a 7-day join funnel per house, split QR / link / invite.',
        'Drop-offs — people who left the join steps partway, and invites nobody has claimed.',
        'Every athlete from the last 14 days — verified → signed in → started → finished, with a stuck / watch / on-track flag.',
        'Preview it live or send it by hand in Admin → Mail. New QR codes are tagged so they count separately from links.',
      ],
    },
    {
      heading: 'Fix · 10.4.1',
      wins: [
        'The onboarding report now sends from the main mailbox. Zoho was rejecting the info@ group address, so it would never have arrived.',
      ],
    },
  ],
  wins: [],
  also: [],
};
