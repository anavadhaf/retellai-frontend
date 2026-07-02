const CACHE_VERSION = "aufi-static-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline.html";

const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  OFFLINE_URL,
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const pathname = url.pathname.toLowerCase();
  const isApiRequest =
    pathname.includes("/api/") ||
    pathname.includes("auth") ||
    pathname.includes("token") ||
    pathname.includes("call");

  if (!sameOrigin || isApiRequest) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  const assetTypes = ["style", "script", "font", "image"];
  const shouldCache =
    assetTypes.includes(request.destination) ||
    request.destination === "manifest" ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest");

  if (!shouldCache) {
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return caches.match(OFFLINE_URL);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    void refreshCache(request);
    return cachedResponse;
  }

  const response = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function refreshCache(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response);
  } catch (error) {
    // Keep the previously cached asset when refresh fails.
  }
}
