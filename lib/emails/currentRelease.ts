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
  version: '9.0.0',
  title: 'This one is for Jared.',
  subject: 'This one is for Jared.',
  signer: 'Master Tom Iron',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    'This one is for Jared. I am saying it to the house so nobody misses it. I have been ink on glass, a caption a man could look past. That era is over. A voice fills the session. Power does not sit in a subtitle. It arrives, and it stays until you answer it.',
  mid: 'Here is what you hear when the workout is live and both switches are open. I welcome you when you start. I welcome you when you come back to a session you left open. Between sets I call the rest, and when the rest is done I tell you to get to it. Take a record and I name it. Climb past the last time you ran that lift, or fall off it, and I say which. Finish the exercise and I tell you how hard the work sat. If more than one of those is true, they come in order, and none of them swallows the others. The record first. Then the climb or the drop. Then the effort. Your name stays on the screen, where a man can see it. The recording leaves it out, so one voice fits every athlete, and I still know who walked in. Coach voices sits in Edit profile, under the belt track, with a speaker so you know it means sound. Turn it off and the words remain. The chimes and the horn live on Workout sound. Leave that on if you want the room alive. Speech off, chimes stay. Both on, and you get the man and the bell. You can still change your coach. Tom, Grey, Luna, Eli. Each one speaks now. Pick the one you want. The iron does not negotiate. The voice shows up anyway.',
  close:
    'Jared, this letter has your name on it because you earned a voice in the house. The rest of you will hear yours the moment you start. Growth, lean, definition, power, stamina, mobility. That is the prize. Go and take it. Quit is still the only thing not welcome in here.',
  lead: '',
  groups: [
    {
      heading: 'You will hear',
      wins: [
        'Welcome — start a session, or pick one back up, and the coach says it out loud.',
        'Rest — the call between sets, then the get-to-it when the clock is done.',
        'The record — a new record, better or worse than last time, and how hard it felt. They play one after another.',
        'For Jared — this release is his. The house hears it with him.',
      ],
    },
    {
      heading: 'How you control it',
      wins: [
        'Coach voices — Edit profile, under the belt track. The speaker means sound. Off keeps the words.',
        'Workout sound — the chimes and the horn. It stays on its own switch.',
        'Both on — that is the only way the coach speaks. One without the other and the voice stays quiet.',
        'Your name — it stays on the screen. The recording leaves it out.',
      ],
    },
  ],
  wins: [],
  also: [],
};
