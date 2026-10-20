const CACHE = 'glitch-hop-shell-v5';
const ASSETS = [
  './', './index.html', './manifest.json', './src/style.css',
  './src/ads.js', './src/audio.js', './src/achievements.js', './src/logic.js', './src/save.js',
  './src/levels.js', './src/levels2.js', './src/levels3.js',
  './src/levels4.js', './src/levels5.js', './src/levels6.js',
  './src/levels7.js', './src/levels8.js', './src/levels9.js',
  './src/levels10.js', './src/levels11.js', './src/levels12.js',
  './src/art.js', './src/main.js', './assets/icon.svg', './assets/icon-192.png',
  './assets/icon-512.png', './assets/icon-1024.png', './assets/splash.png', './privacy.html',
  './assets/tile-stone.png', './assets/tile-crumble.png', './assets/tile-phase-a.png', './assets/tile-phase-b.png', './assets/tile-belt-right.png', './assets/tile-ice.png', './assets/wind-up.png', './assets/wind-down.png', './assets/spike.png', './assets/spring.png', './assets/coin.png', './assets/checkpoint.png', './assets/portal.png', './assets/saw.png', './assets/player-idle-1.png', './assets/player-idle-2.png', './assets/player-run-1.png', './assets/player-run-2.png', './assets/player-run-3.png', './assets/player-run-4.png', './assets/player-jump.png', './assets/player-fall.png', './assets/player-wall.png', './assets/player-death-1.png', './assets/player-death-2.png', './assets/player-death-3.png', './assets/bg-far.png', './assets/bg-mid.png', './assets/btn-left.png', './assets/btn-right.png', './assets/btn-jump.png', './assets/ui-star.png', './assets/ui-star-empty.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
