/* PetsDB service worker: network-first with offline fallback to cache.
   Bump VERSION when you deploy changes so old caches are cleaned up. */
const VERSION = 'petsdb-v1.0.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/styles.css',
  './js/i18n.js', './js/content.js', './js/charts.js', './js/app.js',
  './icons/apple-touch-icon.png', './icons/favicon-64.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './assets/logo-full.png', './assets/logo-full-dark.png', './assets/logo-mark.png', './assets/logo-mark-dark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then((hit) => hit || new Response('', { status: 504, statusText: 'Offline' })))
  );
});
