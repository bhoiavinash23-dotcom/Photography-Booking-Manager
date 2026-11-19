const CACHE_NAME = "photography-booking-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(APP_FILES.map(async file => {
      try {
        await cache.add(file);
      } catch (e) {}
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("photography-booking-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;

      } catch (error) {
        return (
          await caches.match(request) ||
          await caches.match("./index.html") ||
          new Response("Offline page unavailable.", {
            status: 503
          })
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  })());
});
