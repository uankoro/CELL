/* CELL service worker — works offline and starts instantly.
   Bump VERSION on every release: the new worker precaches the new files and deletes the old caches on activate. */
const VERSION = 'v2.0.0';
const SHELL = `cell-shell-${VERSION}`;
const RUNTIME = `cell-runtime-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cell-') && k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* serve from cache right away, refresh the cache in the background (next launch gets the update) */
function staleWhileRevalidate(e, cacheName, key) {
  const net = fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(cacheName).then(c => c.put(key || e.request, copy));
    }
    return res;
  }).catch(() => null);
  e.waitUntil(net);
  return caches.match(key || e.request).then(hit => hit || net).then(res => res || caches.match('./index.html'));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // the app itself (any navigation inside the scope) -> the cached app shell
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(staleWhileRevalidate(e, SHELL, './index.html'));
    return;
  }
  // same-origin files (icons, manifest) -> cache first
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // web fonts used by the casual clock -> keep a copy so the look survives offline
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(staleWhileRevalidate(e, RUNTIME));
  }
});
