/**
 * Send Master Workit release orders to every household user with an email.
 *
 *   npx tsx --env-file=.env.local scripts/send-release-email.ts
 *
 * `/document` must run this after rewriting lib/emails/currentRelease.ts.
 */
import { query } from '../lib/db';
import { isEmailEnabled, sendEmail } from '../lib/mailClient';
import { CURRENT_RELEASE } from '../lib/emails/currentRelease';
import { buildReleaseEmail } from '../lib/emails/templates';
import { SQL_EXCLUDE_TEST_USER } from '../lib/householdUsers';
import { firstName } from '../lib/profile';
import { normalizeCoachTone } from '../lib/coachTone';

async function householdRecipients() {
  const onlyWorked = CURRENT_RELEASE.onlyAthletesWithWorkouts;
  const activeDays = Math.max(0, Math.trunc(Number(CURRENT_RELEASE.activeInDays || 0)));
  const recent =
    onlyWorked && activeDays > 0
      ? ` AND COALESCE(ws.completed_at, ws.started_at, ws.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${activeDays} DAY)`
      : '';
  const result = await query(
    onlyWorked
      ? `SELECT DISTINCT u.id, u.name, u.email, u.coach_tone
         FROM users u
         INNER JOIN workout_sessions ws ON ws.user_id = u.id AND ws.is_completed = 1${recent}
         WHERE u.email IS NOT NULL AND u.email != ''
           AND ${SQL_EXCLUDE_TEST_USER}
         ORDER BY u.id ASC`
      : `SELECT id, name, email, coach_tone FROM users
         WHERE email IS NOT NULL AND email != ''
         ORDER BY id ASC`
  );
  const only = (CURRENT_RELEASE.onlyAthletes || []).map((name) =>
    name.trim().toLowerCase()
  );
  const rows = (result.rows as { id: number; name: string; email: string | null; coach_tone?: string | null }[]).filter(
    (row) => {
      if (!row.email) return false;
      if (only.length === 0) return true;
      const full = String(row.name || '').trim().toLowerCase();
      const first = firstName(row.name).toLowerCase();
      return only.includes(full) || only.includes(first);
    }
  );
  const seen = new Set<string>();
  return rows.filter((row) => {
    const email = String(row.email).toLowerCase();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

async function main() {
  if (!isEmailEnabled()) {
    console.error('[send-release-email] EMAIL_ENABLED is off');
    process.exitCode = 1;
    return;
  }

  const recipients = await householdRecipients();
  if (recipients.length === 0) {
    console.error('[send-release-email] no users with email');
    process.exitCode = 1;
    return;
  }

  let sent = 0;
  for (const user of recipients) {
    const tone = normalizeCoachTone(user.coach_tone);
    const email = buildReleaseEmail({
      name: user.name,
      ...CURRENT_RELEASE,
      tone,
      signer: tone === 'master' ? CURRENT_RELEASE.signer : undefined,
    });
    const id = await sendEmail({
      to: user.email as string,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: email.from,
      archive: {
        userId: user.id,
        athleteName: user.name,
        template: 'release',
      },
    });
    if (!id) {
      console.error('[send-release-email] failed for', user.email);
      process.exitCode = 1;
      continue;
    }
    sent += 1;
    console.log('[send-release-email] sent', id, 'to', user.email);
  }

  console.log('[send-release-email] done', sent + '/' + recipients.length);
  if (sent === 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[send-release-email] failed:', err);
  process.exitCode = 1;
});
