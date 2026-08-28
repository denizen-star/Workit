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
  version: 'Invite a friend',
  title: 'Bring someone who will actually lift, man.',
  subject: 'Bring a friend who will actually lift, man.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. I opened the roster. You do not get to keep this house to yourself. Full name. Email. Send. They create their PIN from the mail. Then they stand on the board next to you. I want bodies in this program, not spectators.',
  groups: [
    {
      heading: 'How you do it',
      wins: [
        'Open Home. Invite a friend sits under Start, same small link as Restart. Or open the hamburger. On your phone Invite sits at the bottom with Edit profile and Switch profile so you can actually tap it. Do not hunt.',
        'Full name. Real email. Send invite. They get mail from me. They open the link. They make a 4-digit PIN and confirm it. Then they show on Who and on The house with you. Same program. Same scoreboard. Same me watching.',
        'Lost the mail? Open Invite a friend again. Waiting guests get Resend. That kills the old link. One hundred guests is the cap. I will not take a name or email already on the roster. Differentiate or pick someone else.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. If you cannot see Invite a friend, you are on the old one.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom. I want that gold Start in your dock, man.',
  ],
};
