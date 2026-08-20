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

async function householdRecipients() {
  const result = await query(
    `SELECT name, email FROM users
     WHERE email IS NOT NULL AND email != ''
     ORDER BY id ASC`
  );
  const rows = (result.rows as { name: string; email: string | null }[]).filter(
    (row) => row.email
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
    const email = buildReleaseEmail({
      name: user.name,
      ...CURRENT_RELEASE,
    });
    const id = await sendEmail({
      to: user.email as string,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: email.from,
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
