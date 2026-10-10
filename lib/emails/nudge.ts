import { markScheduleDaysAsked } from '@/lib/auth';
import { SQL_NOT_BLOCKED_USER } from '@/lib/householdUsers';
import { testDriveState } from '@/lib/testDrive';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { query } from '@/lib/db';
import { loginUrl, whoUrl } from '@/lib/emailLayout';
import { formatEstimateMinutes, estimateWorkoutSeconds } from '@/lib/estimateDuration';
import { loadFocusLookup } from '@/lib/focusState';
import { mainProgramTarget, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { mainResumeFloor, mainResumeFloors } from '@/lib/overloadState';
import { claimAndSend } from '@/lib/emails/send';
import { buildNudgeEmail, buildScheduleDaysAskEmail } from '@/lib/emails/templates';
import { clampScheduleDays, isScheduleDaysAskWeek } from '@/lib/scheduleDays';
import { currentBodyWeight } from '@/lib/bodyWeight';

const TRAINING_DAYS = new Set(['Monday', 'Tuesday', 'Thursday', 'Friday']);

/** Today's weekday ("Monday") and date (YYYY-MM-DD) in a time zone. */
export function todayIn(timeZone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone,
  }).format(new Date());
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return { weekday, date };
}

export function todayInNewYork() {
  return todayIn('America/New_York');
}

function trainedToday(sessions: WorkoutSessionRow[], date: string, timeZone: string) {
  return sessions.some((session) => {
    if (!Number(session.is_completed)) return false;
    const stamp = session.started_at || session.created_at;
    if (!stamp) return false;
    const local = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(stamp));
    return local === date;
  });
}

export type OwedWorkoutUser = {
  id: number;
  schedule_days_per_week?: number | null;
  created_at?: string | Date | null;
};

/**
 * Does this athlete still owe a workout today? Shared by the daily nudge mail and the
 * reminder push (lib/pushReminders.ts). Skips Test Drive (nothing owed before Week 1's
 * Monday), a finished program, the weekend hold after a locked week, and a day they
 * already trained (unless a session is still open — that's a resume). `timeZone` decides
 * what "today" is: Eastern for mail, the athlete's own zone for push.
 */
const NUDGE_SESSION_COLUMNS =
  'id, user_id, week_number, day_number, workout_type, is_completed, skipped_heavy, started_at, created_at, pick_type, swap_for_day';

/** Every athlete's sessions in one read (the daily nudge run), keyed by user id. */
async function loadSessionsByUser(userIds: number[]): Promise<Map<number, WorkoutSessionRow[]>> {
  const byUser = new Map<number, WorkoutSessionRow[]>(userIds.map((id) => [id, []]));
  if (userIds.length === 0) return byUser;
  const result = await query(
    `SELECT ${NUDGE_SESSION_COLUMNS} FROM workout_sessions
     WHERE user_id IN (${userIds.map(() => '?').join(', ')}) ORDER BY week_number, day_number`,
    userIds
  );
  for (const row of result.rows as (WorkoutSessionRow & { user_id: number })[]) {
    byUser.get(Number(row.user_id))?.push(row);
  }
  return byUser;
}

export async function owedWorkoutToday(
  user: OwedWorkoutUser,
  timeZone = 'America/New_York',
  /** Already-loaded sessions + resume floor (the batched nudge run); read here when omitted. */
  preloaded?: { sessions: WorkoutSessionRow[]; resumeFloor: number }
) {
  const [sessions, resumeFloor] = preloaded
    ? [preloaded.sessions, preloaded.resumeFloor]
    : await Promise.all([
        loadSessionsByUser([user.id]).then((byUser) => byUser.get(user.id) ?? []),
        mainResumeFloor(user.id),
      ]);
  if (testDriveState(user.created_at, sessions)?.active) {
    return { skipped: 'test-drive-until-monday' } as const;
  }
  const { weekday, date } = todayIn(timeZone);
  const scheduleDays = clampScheduleDays(user.schedule_days_per_week);
  // Same position Home shows: main track, past any Hyrox / Overload resume floor.
  const target = mainProgramTarget(sessions, resumeFloor, scheduleDays, await loadFocusLookup(user.id));

  if (target.type === 'done') return { skipped: 'program-complete' } as const;
  if (target.type === 'hold') return { skipped: 'week-holds-until-monday' } as const;
  if (trainedToday(sessions, date, timeZone) && target.type !== 'resume') {
    return { skipped: 'already-trained' } as const;
  }
  return { target, weekday, date, scheduleDays };
}

export async function sendNudgesForUser(
  user: {
    id: number;
    name: string;
    email: string | null;
    schedule_days_per_week?: number | null;
    schedule_days_asked_week?: number | null;
    created_at?: string | Date | null;
  },
  preloaded?: { sessions: WorkoutSessionRow[]; resumeFloor: number }
) {
  if (!user.email) return { sent: false, skipped: 'no-address' };

  const owed = await owedWorkoutToday(user, undefined, preloaded);
  if ('skipped' in owed) return { sent: false, skipped: owed.skipped };
  const { target, weekday, date, scheduleDays } = owed;

  if (target.type === 'start' && !TRAINING_DAYS.has(weekday)) {
    return { sent: false, skipped: 'rest-day' };
  }

  if (!target.week || !target.day) {
    return { sent: false, skipped: 'no-target' };
  }

  // Same 6-week checkpoint as the Home takeover (ScheduleDaysAskTakeover) — fired
  // from the daily nudge run so it reaches them even on a day they don't open the
  // app. Dedupe key includes the user id: unlike the day-specific nudge below,
  // every athlete near this week number hits the same boundary at once.
  if (isScheduleDaysAskWeek(target.week.weekNumber) && user.schedule_days_asked_week !== target.week.weekNumber) {
    await loadCoachCatalogFromDb();
    const askEmail = buildScheduleDaysAskEmail({
      name: user.name,
      scheduleDaysPerWeek: scheduleDays,
      loginUrl: loginUrl(),
      bodyWeight: await currentBodyWeight(user.id),
    });
    const askResult = await claimAndSend({
      userId: user.id,
      athleteName: user.name,
      template: 'schedule_days_ask',
      dedupeKey: 'user:' + user.id + ':week:' + target.week.weekNumber,
      to: user.email,
      email: askEmail,
    });
    if (askResult.sent) await markScheduleDaysAsked(user.id, target.week.weekNumber);
  }

  const template = target.type === 'resume' ? 'resume' : 'nudge';
  const dedupeKey =
    target.type === 'resume'
      ? date + ':session:' + target.session?.id
      : date + ':week' + target.week.weekNumber + ':day' + target.day.dayNumber;

  // A nudge is a repeat once the same week/day target has already gone out on an
  // earlier date — the coach photo turns from a gentle OK to a more insistent Mad.
  let isRepeat = false;
  if (template === 'nudge') {
    const priorSends = await query(
      "SELECT id FROM email_sends WHERE user_id = ? AND template = 'nudge' AND dedupe_key LIKE ? LIMIT 1",
      [user.id, '%:week' + target.week.weekNumber + ':day' + target.day.dayNumber]
    );
    isRepeat = priorSends.rows.length > 0;
  }

  await loadCoachCatalogFromDb();
  const email = buildNudgeEmail({
    name: user.name,
    mode: target.type,
    weekNumber: target.week.weekNumber,
    dayName: target.day.name,
    focus: target.day.focus,
    estimate: formatEstimateMinutes(estimateWorkoutSeconds(target.day)),
    href: whoUrl(),
    isRepeat,
  });

  return claimAndSend({
    userId: user.id,
    athleteName: user.name,
    template,
    dedupeKey,
    to: user.email,
    email,
  });
}

export async function sendDailyNudges() {
  const users = await query(
    `SELECT u.id, u.name, u.email, u.schedule_days_per_week, u.schedule_days_asked_week, u.created_at FROM users u
     WHERE u.email IS NOT NULL AND u.pin_hash IS NOT NULL AND ${SQL_NOT_BLOCKED_USER}`
  );
  const roster = users.rows as {
    id: number;
    name: string;
    email: string | null;
    schedule_days_per_week?: number | null;
    schedule_days_asked_week?: number | null;
    created_at?: string | Date | null;
  }[];
  const ids = roster.map((user) => Number(user.id));
  const [sessionsByUser, floors] = await Promise.all([loadSessionsByUser(ids), mainResumeFloors(ids)]);
  // Sends stay one at a time (SMTP); only the reads are batched.
  const results = [];
  for (const user of roster) {
    results.push({
      userId: user.id,
      name: user.name,
      ...(await sendNudgesForUser(user, {
        sessions: sessionsByUser.get(Number(user.id)) ?? [],
        resumeFloor: floors.get(Number(user.id)) ?? 1,
      })),
    });
  }
  return results;
}
