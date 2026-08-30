import { query } from '../db';

export type MailArchiveMeta = {
  userId?: number | null;
  athleteName?: string | null;
  template?: string | null;
};

function splitFrom(from?: string | null): { display: string | null; email: string | null } {
  if (!from) return { display: null, email: null };
  const match = from.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    const display = match[1].trim().replace(/^["']|["']$/g, '');
    return { display: display || null, email: match[2].trim() };
  }
  if (from.includes('@')) return { display: null, email: from.trim() };
  return { display: from.trim(), email: null };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function bodyText(html: string, text?: string): string {
  if (text && text.trim()) return text.trim();
  return stripHtml(html);
}

function toAddress(to: string | string[]): string {
  return (Array.isArray(to) ? to.join(', ') : to).trim();
}

export async function archiveSentEmail(opts: {
  to: string | string[];
  from?: string | null;
  subject: string;
  html: string;
  text?: string;
  messageId?: string | null;
  archive?: MailArchiveMeta | null;
}): Promise<void> {
  const from = splitFrom(opts.from);
  try {
    await query(
      `INSERT INTO email_archive
         (user_id, athlete_name, to_email, from_display, from_email, template, subject, body_text, message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        opts.archive?.userId ?? null,
        opts.archive?.athleteName?.trim() || null,
        toAddress(opts.to),
        from.display,
        from.email,
        opts.archive?.template || null,
        opts.subject,
        bodyText(opts.html, opts.text),
        opts.messageId || null,
      ]
    );
  } catch (error) {
    console.warn('[mail] email_archive insert failed', error);
  }
}
