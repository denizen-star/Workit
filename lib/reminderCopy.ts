// Copy for the menu's Reminders section (docs/plans/PLAN_PUSH_REMINDERS.md).
import { HOME_SCREEN_BEATS } from '@/lib/helpCopy';

export const REMINDER_SETUP_LINE = 'Get a reminder to train. Pick your time and days.';

/** The `?` helper: Home Screen first, and it's theirs to turn on or off. */
export const REMINDER_HELP = {
  title: 'Workout reminders',
  lead: 'Work-It has to be saved to your Home Screen for reminders to work. A Safari tab cannot get them.',
  bullets: [
    ...HOME_SCREEN_BEATS,
    'Open Work-It from the Home Screen, then tap Allow notifications.',
    'Turn reminders on or off here whenever you like.',
  ],
} as const;

export const REMINDER_HOME_SCREEN_LEAD = 'Save Work-It to your Home Screen first. Then open it from there.';

export const REMINDER_DENIED_LINE =
  'Notifications are blocked for Work-It. Turn them back on in Settings → Notifications → Work-It.';

export const REMINDER_UNSUPPORTED_LINE = 'This browser cannot get reminders.';

export const REMINDER_SKIP_NOTE = 'Skipped on days you already trained or your week is locked.';
