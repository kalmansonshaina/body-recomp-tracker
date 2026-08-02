/* Body Recomp Tracker — runtime-caching service worker.
   Caches the app shell + Next.js assets as they're used, so once the app has
   been opened online it also works offline. Path-agnostic (works under any
   base path, e.g. GitHub Pages project subpath). */
const CACHE = 'brt-next-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match(req, { ignoreSearch: true })))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok && (res.type === 'basic' || res.type === 'default')) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
      return res;
    }).catch(() => cached))
  );
});
