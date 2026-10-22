const CACHE_NAME = 'sudoproyectivo-1.1.5';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './projective.css',
  './projective-v08.css',
  './pwa.css',
  './profile.css',
  './manifest.webmanifest',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './js/app.js',
  './js/puzzles.js',
  './js/campaign-migration.js',
  './js/brand.js',
  './js/pwa.js',
  './js/profile.js',
  './js/perfect-solution.js',
  './js/geometry.js',
  './js/ultra.js',
  './js/projective.js',
  './js/projective/storage.js',
  './js/projective/ui.js',
  './js/projective/ultra-game.js',
  './js/projective/visuals.js',
  './js/data/route1.js',
  './js/data/route2.js',
  './js/data/route3.js',
  './js/data/route4.js',
  './js/data/route5.js',
  './js/data/route6.js',
  './js/data/nonlinear/route1.js',
  './js/data/nonlinear/route2.js',
  './js/data/nonlinear/route3.js',
  './js/data/nonlinear/route4.js',
  './js/data/nonlinear/route5.js',
  './js/data/nonlinear/route6.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const oldCaches = keys.filter((key) => key !== CACHE_NAME && key.startsWith('sudoproyectivo-'));
    const upgradingExistingInstall = oldCaches.length > 0;

    await Promise.all(oldCaches.map((key) => caches.delete(key)));
    await self.clients.claim();

    if (upgradingExistingInstall) {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => null)));
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return Response.error();
    }
  })());
});
