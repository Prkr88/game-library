var CACHE = 'stack-rush-v4';
var ASSETS = [
  './', './index.html', './manifest.json', './src/style.css', './src/logic.js', './src/audio.js', './src/ads.js', './privacy.html', './src/main.js',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/icon-1024.png', './assets/splash.png',
  './assets/base.png', './assets/block-1.png', './assets/block-2.png', './assets/block-3.png', './assets/block-4.png', './assets/block-5.png', './assets/block-6.png', './assets/block-7.png', './assets/block-8.png',
  './assets/block-perfect.png', './assets/block-shard.png', './assets/fx-perfect.png', './assets/ui-button.png', './assets/ui-coin.png', './assets/ui-crown.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(function (cached) {
    return cached || fetch(event.request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      return response;
    });
  }));
});
