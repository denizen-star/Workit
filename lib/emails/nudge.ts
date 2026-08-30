import { getUserTone } from '@/lib/auth';
import { loadCoachCatalogFromDb } from '@/lib/coachCatalogDb';
import { query } from '@/lib/db';
import { whoUrl } from '@/lib/emailLayout';
import { formatEstimateMinutes, estimateWorkoutSeconds } from '@/lib/estimateDuration';
import { getTodayTarget, type WorkoutSessionRow } from '@/lib/nextWorkout';
import { claimAndSend } from '@/lib/emails/send';
import { buildNudgeEmail } from '@/lib/emails/templates';

const TRAINING_DAYS = new Set(['Monday', 'Tuesday', 'Thursday', 'Friday']);

export function todayInNewYork() {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'America/New_York',
  }).format(new Date());
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return { weekday, date };
}

function trainedToday(sessions: WorkoutSessionRow[], date: string) {
  return sessions.some((session) => {
    if (!Number(session.is_completed)) return false;
    const stamp = session.started_at || session.created_at;
    if (!stamp) return false;
    const local = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(stamp));
    return local === date;
  });
}

export async function sendNudgesForUser(user: { id: number; name: string; email: string | null }) {
  if (!user.email) return { sent: false, skipped: 'no-address' };

  const result = await query(
    'SELECT id, week_number, day_number, workout_type, is_completed, started_at, created_at FROM workout_sessions WHERE user_id = ? ORDER BY week_number, day_number',
    [user.id]
  );
  const sessions = result.rows as WorkoutSessionRow[];
  const { weekday, date } = todayInNewYork();
  const target = getTodayTarget(sessions);

  if (target.type === 'done') {
    return { sent: false, skipped: 'program-complete' };
  }

  if (target.type === 'hold') {
    return { sent: false, skipped: 'week-holds-until-monday' };
  }

  if (trainedToday(sessions, date) && target.type !== 'resume') {
    return { sent: false, skipped: 'already-trained' };
  }

  if (target.type === 'start' && !TRAINING_DAYS.has(weekday)) {
    return { sent: false, skipped: 'rest-day' };
  }

  if (!target.week || !target.day) {
    return { sent: false, skipped: 'no-target' };
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
    tone: await getUserTone(user.id),
  });

  const template = target.type === 'resume' ? 'resume' : 'nudge';
  const dedupeKey =
    target.type === 'resume'
      ? date + ':session:' + target.session?.id
      : date + ':week' + target.week.weekNumber + ':day' + target.day.dayNumber;

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
    'SELECT id, name, email FROM users WHERE email IS NOT NULL AND pin_hash IS NOT NULL'
  );
  const results = [];
  for (const user of users.rows as { id: number; name: string; email: string | null }[]) {
    results.push({
      userId: user.id,
      name: user.name,
      ...(await sendNudgesForUser(user)),
    });
  }
  return results;
}
