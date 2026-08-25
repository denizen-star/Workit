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
  version: 'Home Quiet',
  title: 'Home is quiet now. The rest of the house has rooms.',
  subject: 'Home is quiet. Open it, man.',
  signer: 'Master Workit',
  tone: 'master',
  onlyAthletesWithWorkouts: true,
  onlyAthletes: [],
  lead:
    'Man. This is the big one. I took Home apart and put it back as a launch pad. You open the app and the first thing you see is today: dark glass, gold Start sitting fat in the middle of the screen, Select outlined next to it, Restart a small quiet link if you already started and want to throw it away. No scoreboard pile. No medal wall. No completed log chewing the scroll. One job. Get under the bar. Everything else lives in the menu now, in its own room, waiting for you when you are done sweating.',
  groups: [
    {
      heading: 'What you see when you walk in',
      wins: [
        'Black screen. Gold dumbbell. Work-It. Menu on the right. That is the whole header. I stripped the extra Start and Select out of the top so your thumb is not hunting.',
        'The hero is a gold-edged card. Tiny gold kicker: Today, or Pick back up if you left a session open. Then the week and the day in huge white type. The focus line under it. How long I think it will take, in gold. Then the gold brick: Start Workout or Resume Workout. Select Workout next to it, gold outline, dark inside. Restart is not a fourth brick. It is a whisper under them. Use it when you mean it.',
        'Under that, one sentence. How many of the 24 days you have finished. How many pounds you have moved all-time. If the last 7 days is a different number, I say so. If it is the same number, I tell you that too. Then the week lock.',
      ],
    },
    {
      heading: 'Four tiles. Lock the week',
      wins: [
        'Four required days. Not five. Bonus is still extra credit and it still can count as one of the four, but the lock is four.',
        'Done is solid gold, dark type, a check. That tile is finished. It looks like a medal you already earned.',
        'Now is a gold outline on dark. That is the first unpaid required day. That is where I want your body. Not the day you already did. Not a Do Again. The one you still owe.',
        'Open is a dashed empty box and a dash. Nothing happened there yet. Fill it or live with the gap.',
      ],
    },
    {
      heading: 'The gold line. The copper house',
      wins: [
        'Daily weight lives on Home now. Gold is you. Thick. Copper dashed is the house average. Cream vanished on the dark page so I gave the house copper you can actually see.',
        'Daily or Cumulative. Last 7. Last 30. All. Tap what you want to feel.',
        'I will not draw a ghost day. If you did not lift, that date is not on the axis. If Mike lifted and you did not, his line is there and yours is not. The tooltip only names men who actually moved iron. No blank. No fake zero hugging the floor.',
        'The house page has the pack chart. Every man is a line. You are gold. House average is copper dashed, and I left Test out of that average. Same rule: no empty days, no empty names in the tooltip.',
      ],
    },
    {
      heading: 'The rest of the house. Open the menu',
      wins: [
        'Hamburger. Your performance — you versus the last time you touched that lift. Hidden if you are Test. The house — the pack, the chart, the honor rolls, who you lead and who you chase. Completed log — every finished session, every set. Medals. About program — the week as five tiles, Wednesday Rest sitting dimmer, bonus card, how the overload is supposed to feel from week 1 to week 6.',
        'Home still has a folded Your performance if you want the scan without leaving. Under that, folded You / house: your pounds, your days, the house next to you. Bonus and Optional are flags now, not fat cards. If you have nothing to show, they disappear.',
        'You vs the man who owns the 7-day board sits on Home as one card. Hunt him or hold him. That card stays off for Test.',
      ],
    },
  ],
  wins: [],
  also: [
    'Hard-refresh so you are on this build. If Home still looks like a junk drawer, you are on the old one.',
    'Put Work-It on your iPhone home screen. Safari only. The steps are at the bottom. I want that gold Start in your dock, man.',
  ],
};
