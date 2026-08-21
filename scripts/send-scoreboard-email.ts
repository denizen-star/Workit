/**
 * Live household scoreboard.
 *
 *   npx tsx --env-file=.env.local scripts/send-scoreboard-email.ts
 */
import { isEmailEnabled } from '../lib/mailClient';
import { sendScoreboardEmail } from '../lib/emails/scoreboard';

async function main() {
  if (!isEmailEnabled()) {
    console.error('[send-scoreboard-email] EMAIL_ENABLED is off');
    process.exitCode = 1;
    return;
  }

  const result = await sendScoreboardEmail();
  if (!result.sent) {
    console.error('[send-scoreboard-email] skipped:', result.skipped || 'unknown');
    process.exitCode = 1;
    return;
  }
  console.log('[send-scoreboard-email] sent', JSON.stringify(result.results || result));
}

main().catch((err) => {
  console.error('[send-scoreboard-email] failed:', err);
  process.exitCode = 1;
});
