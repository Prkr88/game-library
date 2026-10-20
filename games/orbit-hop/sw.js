const CACHE = 'orbit-hop-shell-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './assets/gen/planet-1.png',
  './assets/gen/planet-2.png',
  './assets/gen/planet-3.png',
  './assets/gen/planet-4.png',
  './assets/gen/planet-5.png',
  './assets/gen/planet-6.png',
  './assets/gen/planet-7.png',
  './assets/gen/planet-8.png',
  './assets/gen/planet-shrink.png',
  './assets/gen/asteroid-1.png',
  './assets/gen/asteroid-2.png',
  './assets/gen/asteroid-3.png',
  './assets/gen/blackhole.png',
  './assets/gen/star-pickup.png',
  './assets/gen/comet.png',
  './assets/gen/comet-skin-1.png',
  './assets/gen/comet-skin-2.png',
  './assets/gen/comet-skin-3.png',
  './assets/gen/comet-skin-4.png',
  './assets/gen/bg-stars.png',
  './assets/gen/orbit-ring.png',
  './assets/gen/bg-nebula-1.png',
  './assets/gen/bg-nebula-2.png',
  './assets/gen/bg-nebula-3.png',
  './assets/gen/fx-explosion-1.png',
  './assets/gen/fx-explosion-2.png',
  './assets/gen/fx-explosion-3.png',
  './assets/gen/fx-explosion-4.png',
  './src/style.css',
  './src/ads.js',
'./src/logic.js',
  './src/missions.js',
  './src/daily.js',
  './src/achievements.js',
  './src/haptics.js',
  './src/audio.js',
  './src/save.js',
  './src/main.js'
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
