// Workout reminder pushes (docs/plans/PLAN_PUSH_REMINDERS.md): the athlete's settings,
// their device subscriptions, and the 15-minute cron run that sends due reminders.
import { query } from '@/lib/db';
import { pickReminderCopy } from '@/lib/coachLines';
import { asCoachTone } from '@/lib/coachTone';
import { owedWorkoutToday, todayIn } from '@/lib/emails/nudge';
import { SQL_NOT_BLOCKED_USER } from '@/lib/householdUsers';
import { athleteCallName } from '@/lib/profile';
import { sendToUser, type PushPayload } from '@/lib/push';
import { trackServerEvent } from '@/lib/trackServerEvent';
import { DEFAULT_REMINDER_DAYS, DEFAULT_REMINDER_TIME, type ReminderSettings } from '@/lib/reminderPrefs';

/** A late cron run still sends within this long after the chosen time, never later. */
const SEND_WINDOW_MINUTES = 60;

type ReminderUserRow = {
  id: number;
  name: string;
  display_name?: string | null;
  first_name?: string | null;
  coach_tone?: string | null;
  schedule_days_per_week?: number | null;
  created_at?: string | Date | null;
  reminders_on?: number | null;
  reminder_time?: string | null;
  reminder_tz?: string | null;
  reminder_days?: string | null;
  reminder_banner_dismissed_at?: string | Date | null;
};

export async function loadReminderSettings(userId: number): Promise<ReminderSettings> {
  const row = (
    await query(
      'SELECT reminders_on, reminder_time, reminder_tz, reminder_days, reminder_banner_dismissed_at FROM users WHERE id = ?',
      [userId]
    )
  ).rows[0] as ReminderUserRow | undefined;
  return {
    on: Number(row?.reminders_on) === 1,
    time: row?.reminder_time || DEFAULT_REMINDER_TIME,
    timeZone: row?.reminder_tz || null,
    days: row?.reminder_days || DEFAULT_REMINDER_DAYS,
    folded: Boolean(row?.reminder_banner_dismissed_at),
  };
}

/** Caller validates (lib/reminderPrefs.ts). Turning off keeps the time and days. */
export async function saveReminderSettings(
  userId: number,
  settings: { on: boolean; time: string; timeZone: string; days: string }
) {
  await query('UPDATE users SET reminders_on = ?, reminder_time = ?, reminder_tz = ?, reminder_days = ? WHERE id = ?', [
    settings.on ? 1 : 0,
    settings.time,
    settings.timeZone,
    settings.days,
    userId,
  ]);
}

/** ✕ folds the menu's Reminders section to one line; tapping that line opens it again. */
export async function setRemindersFolded(userId: number, folded: boolean) {
  await query(
    `UPDATE users SET reminder_banner_dismissed_at = ${folded ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`,
    [userId]
  );
}

/** One row per device, keyed by its push endpoint (a re-subscribe moves it to this athlete). */
export async function saveSubscription(userId: number, subscription: { endpoint: string }) {
  await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, subscription) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), subscription = VALUES(subscription)`,
    [userId, subscription.endpoint, JSON.stringify(subscription)]
  );
}

export async function deleteSubscription(userId: number, endpoint: string) {
  await query('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', [userId, endpoint]);
}

/** The coach line for a reminder. An open session says pick it back up and opens /workout. */
function reminderPayload(user: ReminderUserRow, kind: 'start' | 'resume'): PushPayload {
  const { title, body } = pickReminderCopy(kind, asCoachTone(user.coach_tone), athleteCallName(user));
  return { title, body, url: kind === 'resume' ? '/workout' : '/home' };
}

/** "Send a test": today's real reminder (resume if a session is open), sent right now. */
export async function sendTestReminder(userId: number) {
  const user = (
    await query(
      'SELECT id, name, display_name, first_name, coach_tone, schedule_days_per_week, created_at FROM users WHERE id = ?',
      [userId]
    )
  ).rows[0] as ReminderUserRow | undefined;
  if (!user) return { sent: 0, failed: 0 };
  const owed = await owedWorkoutToday(user);
  const kind = !('skipped' in owed) && owed.target.type === 'resume' ? 'resume' : 'start';
  return sendToUser(userId, reminderPayload(user, kind));
}

/** Local weekday index (Mon = 0) and minutes since midnight in a time zone. */
function localClock(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(part('weekday'));
  return { dayIndex, minutes: Number(part('hour')) * 60 + Number(part('minute')) };
}

/** Due = today is a checked day and the chosen time passed less than an hour ago. */
function reminderDue(user: ReminderUserRow, timeZone: string): boolean {
  const { dayIndex, minutes } = localClock(timeZone);
  if ((user.reminder_days || DEFAULT_REMINDER_DAYS)[dayIndex] !== '1') return false;
  const [hours, mins] = (user.reminder_time || DEFAULT_REMINDER_TIME).split(':').map(Number);
  const since = minutes - (hours * 60 + mins);
  return since >= 0 && since < SEND_WINDOW_MINUTES;
}

/**
 * Cron run (every 15 minutes, `/api/cron/mail?task=push`). Sends each due athlete's
 * reminder at most once per local date, and only if they still owe a workout today
 * (same rule as the nudge mail). The push_log claim is released if no device was reached
 * because of an error, so the next run inside the window can retry.
 */
export async function sendDueReminders() {
  const users = (
    await query(
      `SELECT u.id, u.name, u.display_name, u.first_name, u.coach_tone, u.schedule_days_per_week, u.created_at,
              u.reminders_on, u.reminder_time, u.reminder_tz, u.reminder_days
       FROM users u
       WHERE u.reminders_on = 1 AND u.reminder_time IS NOT NULL AND ${SQL_NOT_BLOCKED_USER}
         AND EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = u.id)`
    )
  ).rows as ReminderUserRow[];

  const results = [];
  for (const user of users) {
    const timeZone = user.reminder_tz || 'America/New_York';
    if (!reminderDue(user, timeZone)) continue;

    const owed = await owedWorkoutToday(user, timeZone);
    if ('skipped' in owed) {
      results.push({ userId: user.id, sent: false, skipped: owed.skipped });
      continue;
    }

    const { date } = todayIn(timeZone);
    const claim = await query('INSERT IGNORE INTO push_log (user_id, for_date) VALUES (?, ?)', [user.id, date]);
    if (!claim.rowsAffected) {
      results.push({ userId: user.id, sent: false, skipped: 'already-sent' });
      continue;
    }

    const outcome = await sendToUser(user.id, reminderPayload(user, owed.target.type === 'resume' ? 'resume' : 'start'));
    if (!outcome.sent && outcome.failed) {
      await query('DELETE FROM push_log WHERE user_id = ? AND for_date = ?', [user.id, date]).catch(() => null);
    }
    if (outcome.sent) {
      // Cron has no session, so the athlete id rides in article_context.
      void trackServerEvent({ eventType: 'push_sent', pageCategory: 'push', ctaType: owed.target.type, articleContext: 'user:' + user.id });
    }
    results.push({ userId: user.id, sent: outcome.sent > 0, devices: outcome.sent, failed: outcome.failed });
  }
  return results;
}
