/**
 * Lovevery Fans Service Worker
 *
 * Strategy:
 * - Cache-first for static assets (JS, CSS, images, fonts)
 * - Network-first for HTML pages (ensures fresh content)
 * - Stale-while-revalidate for API/data requests
 *
 * This enables the app to work offline for previously visited pages.
 */

const CACHE_NAME = "loveveryfans-v1";
const STATIC_CACHE = "loveveryfans-static-v1";
const DATA_CACHE = "loveveryfans-data-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name !== CACHE_NAME &&
                name !== STATIC_CACHE &&
                name !== DATA_CACHE
            )
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests (except CDN assets)
  if (request.method !== "GET") return;
  if (url.origin !== location.origin && !url.hostname.includes("amazon.com")) return;

  // HTML navigation: Network-first, fallback to cache
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): Cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|webp|ico|gif)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
          }
          return response;
        });
      })
    );
    return;
  }

  // JSON data files: Stale-while-revalidate
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
