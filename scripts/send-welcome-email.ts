/**
 * Resend welcome mail to every household user with an email.
 *
 *   npx tsx --env-file=.env.local scripts/send-welcome-email.ts
 */
import { isEmailEnabled } from '../lib/mailClient';
import { resendWelcomeEmails } from '../lib/emails/lifecycle';

async function main() {
  if (!isEmailEnabled()) {
    console.error('[send-welcome-email] EMAIL_ENABLED is off');
    process.exitCode = 1;
    return;
  }

  const results = await resendWelcomeEmails();
  if (results.length === 0) {
    console.error('[send-welcome-email] no users with email');
    process.exitCode = 1;
    return;
  }

  let sent = 0;
  for (const row of results) {
    if (row.sent) {
      sent += 1;
      console.log('[send-welcome-email] sent', row.id, 'to', row.to);
    } else {
      console.error('[send-welcome-email] failed for', row.to, row.skipped || 'unknown');
      process.exitCode = 1;
    }
  }

  console.log('[send-welcome-email] done', sent + '/' + results.length);
}

main().catch((err) => {
  console.error('[send-welcome-email] failed:', err);
  process.exitCode = 1;
});
