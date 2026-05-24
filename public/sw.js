// QMS Enterprise 4.0 - Service Worker
const CACHE_NAME = 'qms-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

const isLocalDev =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '::1';

const deleteQmsCaches = () =>
  caches.keys().then((keys) =>
    Promise.all(keys.filter((key) => key.startsWith('qms-')).map((key) => caches.delete(key))),
  );

if (isLocalDev) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      deleteQmsCaches()
        .then(() => self.clients.claim())
        .then(() => self.registration.unregister()),
    );
  });

  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
  });
} else {
  self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const isApiRequest = url.pathname.includes('/api/');
    const isNavigation = event.request.mode === 'navigate';
    const isBuildAsset = url.pathname.includes('/assets/');

    if (isApiRequest || isNavigation || isBuildAsset) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'opaque') return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match(event.request)),
      );
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }),
      ),
    );
  });
}
