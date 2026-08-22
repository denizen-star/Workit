// Kill-switch. The old cache-first worker stored "/" and then "/" became a
// redirect, so Chrome served a dead document (ERR_FAILED) and never reached
// the network. Clear every cache, drop this worker, and let the next load
// go to Netlify.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        windows.map((client) => {
          const url = client.url || '/who';
          return client.navigate(url);
        })
      );
    })()
  );
});
