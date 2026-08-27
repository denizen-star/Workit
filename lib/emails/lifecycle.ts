import { after } from 'next/server';
import { query } from '@/lib/db';
import { checkAndAwardBadges, type AwardedBadge } from '@/lib/badges';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { sqlSessionOptionalVolume } from '@/lib/optionals';
import { getUserTone } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { pickCompleteLine } from '@/lib/coachLines';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import {
  buildBadgeEmail,
  buildInviteEmail,
  buildInviteNotifyEmail,
  buildWelcomeEmail,
  buildWorkoutCompleteEmail,
} from '@/lib/emails/templates';
import { findNextProgramDay, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { claimUrl } from '@/lib/emailLayout';
import { feedbackMailTo } from '@/lib/emails/feedback';

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
  rawToken: string;
  dedupe: boolean;
}) {
  const email = buildInviteEmail({
    name: opts.name,
    inviterName: opts.inviterName,
    inviterEmail: opts.inviterEmail,
    claimUrl: claimUrl(opts.rawToken),
  });
  if (!opts.dedupe) {
    const id = await sendNow(opts.email, email);
    return { sent: Boolean(id), skipped: id ? undefined : ('smtp' as const) };
  }
  return claimAndSend({
    userId: opts.id,
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
  await sendNow(to, email);
}

export function queueInviteEmail(opts: {
  id: number;
  name: string;
  email: string;
  inviterName: string;
  inviterEmail: string | null;
  rawToken: string;
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

export async function resendInviteEmail(opts: {
  id: number;
  name: string;
  email: string;
  inviterName: string;
  inviterEmail: string | null;
  rawToken: string;
}) {
  return sendInviteEmail({ ...opts, dedupe: false });
}

export function queueWelcomeEmail(user: { id: number; name: string; email: string | null }) {
  if (!user.email) return;
  after(async () => {
    await sendWelcomeEmail(user);
  });
}

export async function sendWelcomeEmail(user: { id: number; name: string; email: string | null }) {
  if (!user.email) return { sent: false, skipped: 'no-address' as const };
  const email = buildWelcomeEmail({ name: user.name });
  return claimAndSend({
    userId: user.id,
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
    const email = buildWelcomeEmail({ name: user.name });
    const id = await sendNow(user.email, email);
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
       COALESCE(SUM(${sqlSetVolume()}), 0)
         + (SELECT ${sqlSessionOptionalVolume('ws')} FROM workout_sessions ws WHERE ws.id = ?) as volume,
       COUNT(*) as set_count,
       COUNT(DISTINCT exercise_name) as exercise_count
     FROM exercise_sets
     WHERE workout_session_id = ?`,
    [opts.sessionId, opts.sessionId]
  );
  const timing = await query(
    `SELECT TIMESTAMPDIFF(SECOND, started_at, ended_at) as duration_seconds
     FROM workout_sessions WHERE id = ? AND user_id = ?`,
    [opts.sessionId, opts.userId]
  );
  const weekDays = await query(
    `SELECT COUNT(*) as completed_days
     FROM workout_sessions
     WHERE user_id = ? AND week_number = ? AND is_completed = 1`,
    [opts.userId, opts.weekNumber]
  );
  const weeks = await query(
    `SELECT week_number
     FROM workout_sessions
     WHERE user_id = ? AND is_completed = 1
     GROUP BY week_number
     HAVING COUNT(*) >= 4`,
    [opts.userId]
  );
  const sessions = await query(
    'SELECT id, week_number, day_number, workout_type, is_completed, started_at, created_at FROM workout_sessions WHERE user_id = ?',
    [opts.userId]
  );

  const totalRow = totals.rows[0] as {
    volume: number;
    set_count: number;
    exercise_count: number;
  };
  const duration = (timing.rows[0] as { duration_seconds: number | null } | undefined)
    ?.duration_seconds;
  const weekComplete = Number((weekDays.rows[0] as { completed_days: number })?.completed_days || 0) >= 4;
  const programComplete = weeks.rows.length >= 6;
  const next = findNextProgramDay(sessions.rows as WorkoutSessionRow[]);
  const nextLabel = next ? 'Week ' + next.week.weekNumber + ' · ' + next.day.name : null;

  await loadCoachCatalogFromDb();
  const tone = await getUserTone(opts.userId);
  const recap = buildWorkoutCompleteEmail({
    name: opts.name,
    weekNumber: opts.weekNumber,
    dayName: opts.dayName,
    durationSeconds: duration,
    volumeLbs: Number(totalRow.volume || 0),
    setCount: Number(totalRow.set_count || 0),
    exerciseCount: Number(totalRow.exercise_count || 0),
    completeLine: pickCompleteLine(tone),
    weekComplete,
    programComplete,
    nextLabel,
    tone,
  });

  await claimAndSend({
    userId: opts.userId,
    template: programComplete ? 'program' : weekComplete ? 'week' : 'complete',
    dedupeKey: 'session:' + opts.sessionId,
    to: opts.email,
    email: recap,
  });

  const awarded = opts.awarded ?? await checkAndAwardBadges(opts.userId);
  for (const badge of awarded) {
    if (!BADGE_EMAIL_TYPES.has(badge.requirement_type)) continue;
    const email = buildBadgeEmail({
      name: opts.name,
      badgeName: badge.name,
      badgeDescription: badge.description,
      tone,
    });
    await claimAndSend({
      userId: opts.userId,
      template: 'badge',
      dedupeKey: 'user:' + opts.userId + ':badge:' + badge.id,
      to: opts.email,
      email,
    });
  }
}
