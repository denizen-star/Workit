// Web push sender (docs/plans/PLAN_PUSH_REMINDERS.md). Server only.
// Keys: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT (see .env.example).
import webpush, { type PushSubscription } from 'web-push';
import { query } from '@/lib/db';

export type PushPayload = { title: string; body: string; url: string };

let configured = false;

/** The public key browsers subscribe with, or null when push isn't set up on this deploy. */
export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function configure(): boolean {
  if (configured) return true;
  const publicKey = vapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || 'https://workitapp.fit', publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Sends to every device this athlete subscribed. A device the push service says is gone
 * (404/410: app deleted, phone reset, subscription rotated) is deleted. `sent` = devices
 * reached; `failed` = other errors, kept so a later run can try again.
 */
export async function sendToUser(userId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!configure()) return { sent: 0, failed: 0 };
  const rows = (await query('SELECT id, subscription FROM push_subscriptions WHERE user_id = ?', [userId])).rows as {
    id: number;
    subscription: PushSubscription | string;
  }[];

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const subscription =
      typeof row.subscription === 'string' ? (JSON.parse(row.subscription) as PushSubscription) : row.subscription;
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await query('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
      } else {
        failed += 1;
        console.error('[push] send failed', userId, status, error);
      }
    }
  }
  return { sent, failed };
}
