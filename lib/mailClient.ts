import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';

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
};

export const OPS_BCC = 'info@kervinapps.com';

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

export function defaultFrom(displayName = 'Master Tom Iron') {
  const user = senderUser();
  return user ? `${displayName} <${user}>` : displayName;
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

  const info = await transporter.sendMail({
    from: payload.from || defaultFrom(),
    to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    bcc: withOpsBcc(payload.to, payload.bcc),
    cc: Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc,
    attachments: payload.attachments,
  });

  return info.messageId || null;
}
