import { after } from 'next/server';
import { query } from '@/lib/db';
import { checkAndAwardBadges, type AwardedBadge } from '@/lib/badges';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume } from '@/lib/optionals';
import { getUserTone } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { pickCompleteLine, pickReplenishLine } from '@/lib/coachLines';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import {
  buildInviteEmail,
  buildInviteNotifyEmail,
  buildPinResetEmail,
  buildVerifyEmail,
  buildWelcomeEmail,
  buildWorkoutCompleteEmail,
} from '@/lib/emails/templates';
import { createEmailVerifyToken } from '@/lib/emailVerify';
import { BELTS, getBelts } from '@/lib/belts';
import { findNextProgramDay, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { claimUrl, resetUrl } from '@/lib/emailLayout';
import { feedbackMailTo } from '@/lib/emails/feedback';
import { clampScheduleDays, daysForWeekFn } from '@/lib/scheduleDays';
import { lockedWeekCountFromTable } from '@/lib/lockedWeeks';

const BADGE_EMAIL_TYPES = new Set([
  'streak',
  'weight_milestone',
  'perfect_week',
  'total_workouts',
]);

export async function sendInviteEmail(opts: {
  id: number;
  name: string;
  email: string;
  inviterName: string;
  inviterEmail: string | null;
  inviterId?: number | null;
  rawToken: string;
  houseSlug?: string;
  dedupe: boolean;
}) {
  const tone = opts.inviterId ? await getUserTone(opts.inviterId) : undefined;
  const email = buildInviteEmail({
    name: opts.name,
    inviterName: opts.inviterName,
    inviterEmail: opts.inviterEmail,
    claimUrl: claimUrl(opts.rawToken, opts.houseSlug || 'og'),
    tone,
  });
  if (!opts.dedupe) {
    const id = await sendNow(opts.email, email, {
      userId: opts.id,
      athleteName: opts.name,
      template: 'invite',
    });
    return { sent: Boolean(id), skipped: id ? undefined : ('smtp' as const) };
  }
  return claimAndSend({
    userId: opts.id,
    athleteName: opts.name,
    template: 'invite',
    dedupeKey: 'user:' + opts.id + ':invite',
    to: opts.email,
    email,
  });
}

async function sendInviteNotifyEmail(opts: {
  inviterName: string;
  inviterEmail: string | null;
  inviteeName: string;
  inviteeEmail: string;
}) {
  const to = feedbackMailTo();
  if (!to) return;
  const email = buildInviteNotifyEmail(opts);
  await sendNow(to, email, {
    athleteName: opts.inviteeName,
    template: 'invite_notify',
  });
}

export function queueInviteEmail(opts: {
  id: number;
  name: string;
  email: string;
  inviterName: string;
  inviterEmail: string | null;
  inviterId?: number | null;
  rawToken: string;
  houseSlug?: string;
}) {
  after(async () => {
    await sendInviteEmail({ ...opts, dedupe: true });
    await sendInviteNotifyEmail({
      inviterName: opts.inviterName,
      inviterEmail: opts.inviterEmail,
      inviteeName: opts.name,
      inviteeEmail: opts.email,
    });
  });
}

export function queuePinResetEmail(opts: {
  id: number;
  name: string;
  email: string;
  rawToken: string;
}) {
  after(async () => {
    const email = buildPinResetEmail({
      name: opts.name,
      resetUrl: resetUrl(opts.rawToken),
    });
    await sendNow(opts.email, email, {
      userId: opts.id,
      athleteName: opts.name,
      template: 'pin_reset',
    });
  });
}

export async function resendInviteEmail(opts: {
  id: number;
  name: string;
  email: string;
  inviterName: string;
  inviterEmail: string | null;
  inviterId?: number | null;
  rawToken: string;
  houseSlug?: string;
}) {
  return sendInviteEmail({ ...opts, dedupe: false });
}

export function queueJoinWelcome(opts: {
  id: number;
  name: string;
  email: string;
  verify: boolean;
  callName: string;
}) {
  after(async () => {
    if (opts.verify) {
      const token = await createEmailVerifyToken(opts.id);
      const email = buildVerifyEmail({ name: opts.callName || opts.name, token, tone: 'luna' });
      await sendNow(opts.email, email, {
        userId: opts.id,
        athleteName: opts.name,
        template: 'verify',
      });
    } else {
      await sendWelcomeEmail({ id: opts.id, name: opts.callName || opts.name, email: opts.email });
    }
    await sendInviteNotifyEmail({
      inviterName: 'Work-It',
      inviterEmail: null,
      inviteeName: opts.name,
      inviteeEmail: opts.email,
    });
  });
}

export function queueWelcomeEmail(user: { id: number; name: string; email: string | null }) {
  if (!user.email) return;
  after(async () => {
    await sendWelcomeEmail(user);
  });
}

export async function sendWelcomeEmail(user: { id: number; name: string; email: string | null }) {
  if (!user.email) return { sent: false, skipped: 'no-address' as const };
  const email = buildWelcomeEmail({ name: user.name, tone: await getUserTone(user.id) });
  return claimAndSend({
    userId: user.id,
    athleteName: user.name,
    template: 'welcome',
    dedupeKey: 'user:' + user.id,
    to: user.email,
    email,
  });
}

export async function resendWelcomeEmails() {
  const result = await query(
    `SELECT id, name, email FROM users
     WHERE email IS NOT NULL AND email != ''
     ORDER BY id ASC`
  );
  const results = [];
  for (const user of result.rows as { id: number; name: string; email: string }[]) {
    const email = buildWelcomeEmail({ name: user.name, tone: await getUserTone(user.id) });
    const id = await sendNow(user.email, email, {
      userId: user.id,
      athleteName: user.name,
      template: 'welcome',
    });
    results.push({
      userId: user.id,
      to: user.email,
      sent: Boolean(id),
      id,
      skipped: id ? undefined : 'smtp',
    });
  }
  return results;
}

export function queueWorkoutCompleteEmails(opts: {
  userId: number;
  name: string;
  email: string | null;
  sessionId: number;
  weekNumber: number;
  dayName: string;
  awarded?: AwardedBadge[];
}) {
  if (!opts.email) return;
  after(async () => {
    await sendWorkoutCompleteBundle(opts);
  });
}

export async function sendWorkoutCompleteBundle(opts: {
  userId: number;
  name: string;
  email: string | null;
  sessionId: number;
  weekNumber: number;
  dayName: string;
  awarded?: AwardedBadge[];
}) {
  if (!opts.email) return;

  const totals = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN is_completed = 1 THEN ${sqlSetVolume()} ELSE 0 END), 0)
         + (SELECT ${sqlSessionOptionalVolume('ws')} FROM workout_sessions ws WHERE ws.id = ?) as volume,
       COUNT(CASE WHEN is_completed = 1 THEN id END) as set_count,
       COUNT(DISTINCT CASE WHEN is_completed = 1 THEN exercise_name END) as exercise_count
     FROM exercise_sets
     WHERE workout_session_id = ? AND is_completed = 1`,
    [opts.sessionId, opts.sessionId]
  );
  const timing = await query(
    `SELECT TIMESTAMPDIFF(SECOND, started_at, ended_at) as duration_seconds
     FROM workout_sessions WHERE id = ? AND user_id = ?`,
    [opts.sessionId, opts.userId]
  );
  const sessions = await query(
    'SELECT id, week_number, day_number, workout_type, is_completed, started_at, created_at, pick_type, swap_for_day FROM workout_sessions WHERE user_id = ?',
    [opts.userId]
  );
  const userRow = await query('SELECT schedule_days_per_week, gender FROM users WHERE id = ?', [opts.userId]);

  const totalRow = totals.rows[0] as {
    volume: number;
    set_count: number;
    exercise_count: number;
  };
  const duration = (timing.rows[0] as { duration_seconds: number | null } | undefined)
    ?.duration_seconds;

  const scheduleDays = clampScheduleDays(
    (userRow.rows[0] as { schedule_days_per_week?: number | null } | undefined)?.schedule_days_per_week
  );
  const userGender = (userRow.rows[0] as { gender?: string | null } | undefined)?.gender;
  // Persisted count from `locked_weeks` — by the time this async email builder
  // runs, app/api/sessions/route.ts has already recorded this completion's lock
  // (if it crossed the bar), so this reflects the true, permanent state rather
  // than a live recompute against the athlete's current setting.
  const lockedWeeks = await lockedWeekCountFromTable(opts.userId);
  const weekLockedRow = await query(
    'SELECT 1 FROM locked_weeks WHERE user_id = ? AND week_number = ? LIMIT 1',
    [opts.userId, opts.weekNumber]
  );
  const weekComplete = weekLockedRow.rows.length > 0;
  const programComplete = lockedWeeks >= 6;
  const next = findNextProgramDay(sessions.rows as WorkoutSessionRow[], undefined, 1, daysForWeekFn(scheduleDays));
  const nextLabel = next ? 'Week ' + next.week.weekNumber + ' · ' + next.day.name : null;

  await loadCoachCatalogFromDb();
  const tone = await getUserTone(opts.userId);

  // Belt and badge, if either was earned by this same session, roll into the one
  // recap email below instead of firing their own separate sends.
  const earnedBelt = weekComplete ? getBelts(userGender).find((belt) => belt.weeks === lockedWeeks) : undefined;
  const awarded = opts.awarded ?? (await checkAndAwardBadges(opts.userId));
  const emailBadges = awarded
    .filter((badge) => BADGE_EMAIL_TYPES.has(badge.requirement_type))
    .map((badge) => ({ name: badge.name, description: badge.description }));

  const recap = buildWorkoutCompleteEmail({
    name: opts.name,
    weekNumber: opts.weekNumber,
    dayName: opts.dayName,
    durationSeconds: duration,
    volumeLbs: Number(totalRow.volume || 0),
    setCount: Number(totalRow.set_count || 0),
    exerciseCount: Number(totalRow.exercise_count || 0),
    completeLine: pickCompleteLine(tone, opts.name),
    replenishLine: pickReplenishLine(),
    weekComplete,
    programComplete,
    nextLabel,
    lockedWeeks,
    tone,
    badges: emailBadges,
    belt: earnedBelt ?? null,
  });

  await claimAndSend({
    userId: opts.userId,
    athleteName: opts.name,
    template: programComplete ? 'program' : weekComplete ? 'week' : 'complete',
    dedupeKey: 'session:' + opts.sessionId,
    to: opts.email,
    email: recap,
  });
}
