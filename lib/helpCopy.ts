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
  'Effective = Volume × Perceived Effort. Easy 0.8 · Light 0.9 · Fair 1.0 · Hard 1.1 · Max 1.2. In-between interpolate. Skip = Fair. Fair Effective matches Volume.',
  'Effort on tiles is How hard · that factor (`4.3 · 1.13`), not a percent.',
  '% is vs last time those same lifts ran, not vs the last calendar window.',
] as const;

export const HOME_TODAY_HELP = {
  title: 'Today',
  lead: 'This card is the next move. Gold starts or resumes the day. Select WO opens the list. The four numbers are last 15 days vs last time those lifts ran — not a rest-day score when the week is locked.',
  bullets: KPI_CALC_BULLETS,
} as const;

export const HOME_WEEK_LOCK_HELP = {
  title: 'Week lock',
  lead: 'Four required days. Four greens lock the week. Volume sits on each tile.',
  bullets: [
    'Gold = start here. Green = done. Dashed = still open.',
    'Done tiles show this day’s volume and % vs last time that day ran.',
    'Open tiles show last time that day ran.',
    'Under the row: optionals n/8, optional lbs, and bonus for this program week.',
  ],
} as const;

export const HOME_WEEK_PERF_HELP = {
  title: 'Week performance',
  lead: 'This program week vs last time you did those lifts.',
  bullets: [
    'Each lift this program week is compared to the last time you did that lift.',
    'The tile shows count / compared lifts, and that share as a percent.',
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
  lead: 'Last session is This | Last per lift. What moved is last session volume, best lift, lifts down, and week volume.',
  bullets: ['This = this session or this week.', 'Last = last time those lifts ran.'],
} as const;

export const HOME_TROPHIES_HELP = {
  title: 'Your trophies',
  lead: 'The belt you hold, the one you are filling, and the one after that. Tap the slots to open Belts.',
} as const;

export const HOME_YOU_VS_HELP = {
  title: 'You vs',
  lead: '7d / 30d / All time. Next is this house only (everyone in, Test out), not who trained this week.',
  bullets: [
    'Place and Best day sit in the table.',
    'Last is the last time you posted these numbers, not a week window.',
    '% under You is vs Last. % under them is you vs them.',
    'Next is this house only. Switch house in the menu to see The OG.',
    'Bonus, optionals, optional lbs, and run + bike sit in the table.',
  ],
} as const;
