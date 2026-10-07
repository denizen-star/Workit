// Browser side of workout reminder pushes (docs/plans/PLAN_PUSH_REMINDERS.md).
// The service worker (public/sw.js) is registered only from the Allow tap, never on load,
// so athletes who never opt in never get a worker.

export type PushSupport = 'ready' | 'needs-home-screen' | 'unsupported';

function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone only does web push for the app opened from the Home Screen (iOS 16.4+). */
export function pushSupport(): PushSupport {
  if (isIos() && !isStandalone()) return 'needs-home-screen';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return 'ready';
}

export function notificationsDenied(): boolean {
  return 'Notification' in window && Notification.permission === 'denied';
}

/** This device's live push subscription, if it has one. */
export async function deviceSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ready') return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return (await registration?.pushManager.getSubscription()) ?? null;
}

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

/**
 * Call straight from a tap: asks permission (iOS refuses outside a user gesture), registers
 * the worker, subscribes, and saves this device on the server.
 */
export async function enablePush(publicKey: string): Promise<'ok' | 'denied' | 'error'> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription: subscription.toJSON() }),
    });
    return res.ok ? 'ok' : 'error';
  } catch (error) {
    console.error('[push] enable failed', error);
    return 'error';
  }
}
