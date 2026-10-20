// Network-first with runtime cache: online play stays fresh, offline play works after one visit.
const CACHE = 'merge-drop-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
