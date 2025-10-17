// service-worker.js (en raíz del proyecto)
const CACHE_NAME = 'taskflow-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/Task.tsx'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cacheando recursos...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve el cache o hace fetch
        return response || fetch(event.request);
      })
  );
});