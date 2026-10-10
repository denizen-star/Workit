import type { ReleaseDef } from '@/lib/emails/currentRelease';

/**
 * v14.0.0 release notes, kept by name so any agent can send them again:
 *   npm run mail:release -- --release=training-focus-v14            # Kevin only
 *   npm run mail:release -- --release=training-focus-v14 --house    # household, only when Kevin asks
 * (`/release` rewrites lib/emails/currentRelease.ts for each new version; this copy stays.)
 */
export const TRAINING_FOCUS_V14: ReleaseDef = {
  version: '14.0.0',
  title: 'Train your way.',
  subject: 'Train your way — new focuses, Pilates and Home workouts — Work-It',
  onlyAthletesWithWorkouts: true,
  activeInDays: 14,
  includeNewAthletes: false,
  intro:
    "Big one, and it's all about you! You can now pick how you train: the gym, a mat, two dumbbells at home, or no equipment at all. Pick one, or mix them.",
  mid:
    "Open Home and the new setup screen is waiting. Choose your focus, tap the days you'll train, and you're set. Already happy with your program? Tap Continue as is and nothing changes. You can change your mind any time from Training focus in the menu. Whatever you pick, every workout counts toward your week, your belts and your medals the same way.",
  close:
    "Pick your days, pick your focus, show up. I believe in you. Leave quit at the door. Let's go!",
  lead: '',
  groups: [
    {
      heading: 'Pick your focus',
      wins: [
        'Build muscle · Gym — the program you know.',
        'Core Inspired — Pilates, yoga and core on a mat.',
        'Home · 2 Dumbbells — two full-body days that alternate.',
        'No equipment · Travel — bodyweight workouts anywhere.',
        'Pick more than one — your week alternates between them.',
      ],
    },
    {
      heading: 'Pick your days',
      wins: [
        'Seven buttons, M–S — tap the days you train.',
        'Your commitment drives — the days you pick set your weekly number. One day means one workout locks the week, two days means two.',
        '9am reminder on those days if notifications are on.',
        'Back-to-back full-body days — we warn you, because muscles rebuild on the rest day.',
      ],
    },
    {
      heading: 'Change it any time',
      wins: [
        'Training focus in the menu — change your focus and days whenever you like.',
        'Home chip — pick a different focus for just next week.',
        'Locked weeks — a week you already locked stays locked.',
      ],
    },
    {
      heading: 'New workouts',
      wins: [
        'Pilates A and B — 30-minute mat routines, every move with a video.',
        'Home Full-Body 1 and 2 — Floor Press, Sumo Deadlift, Renegade Row, Arnold Press, Floor Flyes, Single-Leg Deadlift with Row, Woodchoppers.',
        'Your pick — filters for Upper, Lower, Full body, Core, Run, Pilates, Home and Travel.',
        'The Library — new Pilates and Home sections.',
        'Swaps — the new moves show up as Alt choices on the lifts they replace.',
      ],
    },
  ],
  wins: [],
  also: [],
};
