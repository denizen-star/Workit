// Push-only service worker for workout reminders (docs/plans/PLAN_PUSH_REMINDERS.md).
//
// NEVER add a `fetch` handler or any caching here. The 2026-08 homepage outage (2d04be4)
// came from a worker that cached "/" and kept serving it after "/" became a redirect.
// With no fetch handler the browser skips this worker for every page and API request,
// so it can't break loading. app/layout.tsx spares this file when it unregisters workers.
//
// Registered only from the menu's "Allow notifications" tap (lib/pushClient.ts).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear anything an older caching worker left behind, then take over open tabs.
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

// Payload from lib/push.ts: { title, body, url }.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Work-It', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/home' },
    })
  );
});

// Tap: bring an open Work-It window forward on the reminder's page, else open one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/home', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if ('navigate' in client) await client.navigate(url).catch(() => {});
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
