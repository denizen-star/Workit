// Workout reminder settings shared by the menu's Reminders section and /api/push
// (docs/plans/PLAN_PUSH_REMINDERS.md). Client-safe: no server imports.

/** Mon→Sun, the order `users.reminder_days` stores ('1' = remind that day). */
export const REMINDER_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DEFAULT_REMINDER_DAYS = '1111111';
export const DEFAULT_REMINDER_TIME = '18:00';

/** The cron checks every 15 minutes, so times come in 15-minute steps. */
export const REMINDER_TIMES: readonly string[] = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export function isValidReminderTime(value: unknown): value is string {
  return typeof value === 'string' && REMINDER_TIMES.includes(value);
}

export function isValidReminderDays(value: unknown): value is string {
  return typeof value === 'string' && /^[01]{7}$/.test(value);
}

/** True when the zone is one this runtime's Intl understands (e.g. "America/New_York"). */
export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** "18:30" → "6:30 PM" for the time picker. */
export function formatReminderTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export type ReminderSettings = {
  on: boolean;
  time: string;
  timeZone: string | null;
  days: string;
  /** The ✕ folded the Reminders section to one line. */
  folded: boolean;
};
