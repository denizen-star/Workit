/** Tom copy for /who help and PIN reset. Claim is before they pick a coach. */

export const WHO_CLAIM_LINES = [
  'Four digits. You tap them next time you report in, man.',
  'Confirm it and you land on Home.',
  'Gold Start is the work.',
] as const;

export const WHAT_IS_WORKIT_TITLE = 'What is Work-It?';

export const WHAT_IS_WORKIT_LEAD =
  'Work-It is a 48-week strength log for this house. Four training days lock a week. You pick your name, set a PIN, and record the work.';

export const WHAT_IS_WORKIT_BULLETS = [
  'Four days a week. That locks the week.',
  'Gold is the move. Start. Log the set. Finish it.',
  'Your numbers stay on your name.',
  'Put it on the home screen. Not a Safari tab.',
] as const;

export const HOME_SCREEN_LINE = 'Add Work-It to your home screen.';

export const HOME_SCREEN_TITLE = 'Home screen';

export const HOME_SCREEN_BEATS = [
  'Open it in Safari. Mail tabs do not count.',
  'Tap Share. Square, arrow up.',
  'Add to Home Screen. Then Add.',
] as const;

export const DEAD_CLAIM_LINE =
  'That invite link is dead, man. Ask for a resend. Then open the new one.';

export const DEAD_RESET_LINE =
  'That reset link is dead, man. Open your name. Tap Forgot PIN. Then use the new mail.';

export const FORGOT_PIN_NOTICE =
  'If that profile has mail, I sent it. Check the inbox, man.';

export const RESET_PIN_LINES = [
  'New four digits. Same pad.',
  'Confirm it. Then you are in.',
] as const;

export const KPI_CALC_BULLETS = [
  'Weight = sum of completed-set load (lb).',
  'Reps = sum of completed-set reps.',
  'Volume = reps × weight on completed mechanical sets. Timed and distance stay out.',
  'Effective = Volume × Perceived Effort. Fair = 1.0. Easy 0.6 · Light 0.8 · Hard 1.2 · Max 1.4. Skip = Fair.',
  '% is vs last time those same lifts ran, not vs the last calendar window.',
] as const;

export const HOME_TODAY_HELP = {
  title: 'Today',
  lead: 'This card is the next move. Gold starts or resumes the day. Select WO opens the list. The four numbers are last 15 days vs last time those lifts ran — not a rest-day score when the week is locked.',
  bullets: KPI_CALC_BULLETS,
} as const;

export const HOME_WEEK_LOCK_HELP = {
  title: 'Week lock',
  lead: 'Four required days. Four greens lock the week.',
  bullets: ['Gold = start here.', 'Green = done.', 'Dashed = still open.'],
} as const;

export const HOME_WEEK_PERF_HELP = {
  title: 'Week performance',
  lead: 'This program week vs last time you did those lifts.',
  bullets: [
    'Each lift this program week is compared to the last time you did that lift.',
    'More load = how many lifts added weight. More reps = how many added reps. Green if at least one. 0 is red.',
    'Less drop = how many lifts cut weight. Less cut = how many cut reps. 0 is green. Any cut is red.',
    'Dashed = no last time yet.',
  ],
} as const;

export const HOME_DAILY_WEIGHT_HELP = {
  title: 'Daily weight',
  lead: 'Cream is your Effort lb that day. Copper is the pack average that day.',
  bullets: [
    'Cream = that day’s Effort lb: Volume × Perceived Effort, plus raw optional +500.',
    'Copper = pack average Effort lb that day (last-7 finishers, Test out). A miss is 0.',
    'The wash is your average How hard that day (1–5), not the house.',
    'Cumulative still paints that day’s Effort wash. Stronger is more cream while the wash holds or drops.',
  ],
} as const;

export const HOME_PERFORMANCE_HELP = {
  title: 'Your performance',
  lead: 'The next workout, or the last one the day after you trained or when the week is locked. Open Analytics with that day, T-15, and workout grain already set.',
  bullets: KPI_CALC_BULLETS,
} as const;

export const HOME_STORIES_HELP = {
  title: 'Session stories',
  lead: 'Last session, best lift, what did not move, and this week vs last time.',
  bullets: ['Same four KPIs as Today.', 'Effective = Volume × Perceived Effort.'],
} as const;

export const HOME_TROPHIES_HELP = {
  title: 'Your trophies',
  lead: 'The belt you hold, the one you are filling, and the one after that. Tap the slots to open Belts.',
} as const;

export const HOME_YOU_VS_HELP = {
  title: 'You vs',
  lead: 'Last 7 days vs the person one place up, or one down if you are first.',
  bullets: ['Rank is finished days, then Volume.', 'Effective = Volume × Perceived Effort.'],
} as const;
