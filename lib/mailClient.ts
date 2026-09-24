import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { archiveSentEmail, type MailArchiveMeta } from './emails/archive';
import { MAIL_FROM } from './mailFrom';

export function isEmailEnabled() {
  const v = process.env.EMAIL_ENABLED;
  if (v === undefined || v === null || v === '') return true;
  return /^(1|true|yes|on)$/i.test(String(v).trim());
}

function smtpHost() {
  return process.env.SMTP_SERVER || process.env.SMTP_HOST || 'smtp.zoho.com';
}

function senderUser() {
  return process.env.SENDER_EMAIL || process.env.SMTP_USER;
}

function senderPass() {
  return process.env.SENDER_PASSWORD || process.env.SMTP_PASS;
}

export function getTransporter(): Transporter | null {
  const user = senderUser();
  const pass = senderPass();
  const host = smtpHost();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  bcc?: string | string[];
  cc?: string | string[];
  attachments?: SendMailOptions['attachments'];
  archive?: MailArchiveMeta;
};

export type { MailArchiveMeta };

export const OPS_BCC = MAIL_FROM.info;

function normalizeAddressList(value?: string | string[]): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(',') : value;
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function emailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function withOpsBcc(to: string | string[], bcc?: string | string[]) {
  const toAddrs = normalizeAddressList(to).map(emailAddress);
  const bccList = normalizeAddressList(bcc);
  const alreadyBcc = bccList.some((entry) => emailAddress(entry) === OPS_BCC);
  const alreadyTo = toAddrs.includes(OPS_BCC);
  if (!alreadyBcc && !alreadyTo) {
    bccList.push(OPS_BCC);
  }
  return bccList.length ? bccList.join(', ') : undefined;
}

/** More than one person on To/Cc → nobody sees anybody else's address: every
 * recipient moves to Bcc and the mail is addressed to the sender itself. A single
 * recipient is sent as-is. Ops Bcc is added either way. */
function visibleRecipients(from: string, payload: MailPayload) {
  const to = normalizeAddressList(payload.to);
  const cc = normalizeAddressList(payload.cc);
  if (to.length + cc.length <= 1) {
    return {
      to: to.join(', '),
      cc: cc.length ? cc.join(', ') : undefined,
      bcc: withOpsBcc(payload.to, payload.bcc),
    };
  }
  const seen = new Set<string>();
  const everyone = [...to, ...cc, ...normalizeAddressList(payload.bcc)].filter((entry) => {
    const key = emailAddress(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { to: from, cc: undefined, bcc: withOpsBcc(from, everyone) };
}

export function defaultFrom(displayName = 'Workit - Coach Tom', address: string = MAIL_FROM.tom) {
  return `${displayName} <${address}>`;
}

export async function sendEmail(payload: MailPayload): Promise<string | null> {
  if (!isEmailEnabled()) {
    console.warn('[mailClient] Email disabled (EMAIL_ENABLED)');
    return null;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailClient] SMTP not configured');
    return null;
  }

  const from = payload.from || defaultFrom();
  const info = await transporter.sendMail({
    from,
    ...visibleRecipients(from, payload),
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    attachments: payload.attachments,
  });

  const messageId = info.messageId || null;
  await archiveSentEmail({
    to: payload.to,
    from,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    messageId,
    archive: payload.archive,
  });
  return messageId;
}
