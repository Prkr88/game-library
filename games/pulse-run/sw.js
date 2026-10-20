const CACHE = 'pulse-run-shell-v6';
const ASSETS = [
 './',
 './index.html',
 './manifest.json', './icons/icon-192.png', './icons/favicon-32.png',
 './src/style.css',
 './src/logic.js',
 './src/feedback.js',
 './src/main.js',
 './assets/gen/bg-district-1.png', './assets/gen/bg-district-2.png', './assets/gen/bg-district-3.png', './assets/gen/bg-district-4.png', './assets/gen/bg-district-5.png', './assets/gen/bg-district-6.png',
 './assets/gen/ground-tile.png', './assets/gen/runner-run-1.png', './assets/gen/runner-jump.png', './assets/gen/runner-fall.png', './assets/gen/runner-slide.png', './assets/gen/barrier-low.png', './assets/gen/barrier-high.png', './assets/gen/gap-edge.png', './assets/gen/pulse-core.png', './assets/bg-mid-buildings.png', './assets/btn-jump.png', './assets/btn-slide.png', './assets/fx-burst.png'
];

self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
 if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
 event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
  const copy = response.clone();
  caches.open(CACHE).then(cache => cache.put(event.request, copy));
  return response;
 }).catch(() => caches.match('./index.html'))));
});
