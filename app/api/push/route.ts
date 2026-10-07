import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireCurrentUser } from '@/lib/auth';
import { vapidPublicKey } from '@/lib/push';
import {
  deleteSubscription,
  loadReminderSettings,
  saveReminderSettings,
  saveSubscription,
  sendTestReminder,
  setRemindersFolded,
} from '@/lib/pushReminders';
import { isValidReminderDays, isValidReminderTime, isValidTimeZone } from '@/lib/reminderPrefs';
import { trackServerEvent } from '@/lib/trackServerEvent';

// Workout reminder pushes (docs/plans/PLAN_PUSH_REMINDERS.md). Session-gated by middleware.

function authError(error: unknown, fallback: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

/** GET — the public key devices subscribe with, plus this athlete's reminder settings. */
export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ publicKey: vapidPublicKey(), settings: await loadReminderSettings(user.id) });
  } catch (error) {
    return authError(error, 'Failed to load reminders');
  }
}

type PushBody = {
  action?: string;
  subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  endpoint?: unknown;
  on?: unknown;
  time?: unknown;
  timeZone?: unknown;
  days?: unknown;
  folded?: unknown;
};

/**
 * POST { action } —
 * `subscribe` { subscription } (this device, upsert by endpoint) ·
 * `unsubscribe` { endpoint } ·
 * `settings` { on, time, timeZone, days } (account-wide) ·
 * `fold` { folded } (the ✕ on the menu's Reminders section) ·
 * `test` (send the reminder to this athlete's devices now).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = ((await request.json().catch(() => ({}))) ?? {}) as PushBody;

    switch (body.action) {
      case 'subscribe': {
        const sub = body.subscription;
        if (
          typeof sub?.endpoint !== 'string' ||
          !sub.endpoint.startsWith('https://') ||
          sub.endpoint.length > 512 ||
          typeof sub.keys?.p256dh !== 'string' ||
          typeof sub.keys?.auth !== 'string'
        ) {
          return NextResponse.json({ error: 'Bad subscription' }, { status: 400 });
        }
        await saveSubscription(user.id, sub as { endpoint: string });
        void trackServerEvent({ eventType: 'push_enabled', pageCategory: 'push', ctaType: 'subscribe' });
        return NextResponse.json({ ok: true });
      }
      case 'unsubscribe': {
        if (typeof body.endpoint !== 'string') {
          return NextResponse.json({ error: 'Bad endpoint' }, { status: 400 });
        }
        await deleteSubscription(user.id, body.endpoint);
        return NextResponse.json({ ok: true });
      }
      case 'settings': {
        if (
          typeof body.on !== 'boolean' ||
          !isValidReminderTime(body.time) ||
          !isValidTimeZone(body.timeZone) ||
          !isValidReminderDays(body.days)
        ) {
          return NextResponse.json({ error: 'Bad reminder settings' }, { status: 400 });
        }
        const before = await loadReminderSettings(user.id);
        await saveReminderSettings(user.id, { on: body.on, time: body.time, timeZone: body.timeZone, days: body.days });
        if (before.on !== body.on) {
          void trackServerEvent({
            eventType: body.on ? 'push_enabled' : 'push_disabled',
            pageCategory: 'push',
            ctaType: 'switch',
          });
        }
        return NextResponse.json({ settings: await loadReminderSettings(user.id) });
      }
      case 'fold': {
        await setRemindersFolded(user.id, body.folded === true);
        return NextResponse.json({ ok: true });
      }
      case 'test': {
        if (!vapidPublicKey()) {
          return NextResponse.json({ error: 'Reminders are not set up on this server yet.' }, { status: 503 });
        }
        const outcome = await sendTestReminder(user.id);
        void trackServerEvent({ eventType: 'push_test', pageCategory: 'push', ctaType: String(outcome.sent) });
        return NextResponse.json(outcome);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return authError(error, 'Failed to save reminders');
  }
}
