import { query } from '@/lib/db';
import { sendEmail, isEmailEnabled } from '@/lib/mailClient';
import type { BuiltEmail } from '@/lib/emails/templates';

export type SendResult = {
  sent: boolean;
  skipped?: string;
  id?: string | null;
};

function isDuplicateKeyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate/i.test(message);
}

export async function claimAndSend(opts: {
  userId?: number | null;
  template: string;
  dedupeKey: string;
  to: string;
  email: BuiltEmail;
}): Promise<SendResult> {
  if (!opts.to) return { sent: false, skipped: 'no-address' };
  if (!isEmailEnabled()) return { sent: false, skipped: 'disabled' };

  let claimed = false;
  try {
    await query(
      `INSERT INTO email_sends (user_id, template, dedupe_key, to_email, subject)
       VALUES (?, ?, ?, ?, ?)`,
      [opts.userId ?? null, opts.template, opts.dedupeKey, opts.to, opts.email.subject]
    );
    claimed = true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { sent: false, skipped: 'already-sent' };
    }
    console.warn('[mail] email_sends insert failed; sending without claim', error);
  }

  try {
    const id = await sendEmail({
      to: opts.to,
      from: opts.email.from,
      subject: opts.email.subject,
      html: opts.email.html,
      text: opts.email.text,
    });
    if (!id) {
      if (claimed) {
        await query('DELETE FROM email_sends WHERE template = ? AND dedupe_key = ?', [
          opts.template,
          opts.dedupeKey,
        ]).catch(() => null);
      }
      return { sent: false, skipped: 'smtp' };
    }
    if (claimed) {
      await query(
        'UPDATE email_sends SET message_id = ? WHERE template = ? AND dedupe_key = ?',
        [id, opts.template, opts.dedupeKey]
      ).catch(() => null);
    }
    return { sent: true, id };
  } catch (error) {
    if (claimed) {
      await query('DELETE FROM email_sends WHERE template = ? AND dedupe_key = ?', [
        opts.template,
        opts.dedupeKey,
      ]).catch(() => null);
    }
    console.error('[mail] send failed', error);
    return { sent: false, skipped: 'error' };
  }
}

export async function sendNow(to: string, email: BuiltEmail): Promise<string | null> {
  return sendEmail({
    to,
    from: email.from,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}
