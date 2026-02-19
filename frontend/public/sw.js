/**
 * BizBranches PWA Service Worker
 * - Cache-first: static assets (JS, CSS, images, fonts)
 * - Network-first: API and document, fallback to cache or offline page
 * - Only handles http(s) requests; ignores chrome-extension:// etc. to avoid Cache errors
 */
const CACHE_NAME = "bizbranches-v3";
const OFFLINE_URL = "/offline.html";

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(js|css|woff2?|png|jpg|jpeg|webp|svg|ico)(\?.*)?$/i,
];

function isStaticAsset(url) {
  const path = new URL(url).pathname;
  return STATIC_PATTERNS.some((re) => re.test(path));
}

function isApiRequest(url) {
  return new URL(url).pathname.startsWith("/api/");
}

/** Only cache http/https requests; Cache API does not support chrome-extension: etc. */
function isCacheableRequest(request) {
  try {
    const u = request.url;
    return u.startsWith("http:") || u.startsWith("https:");
  } catch (_) {
    return false;
  }
}

/** Safely cache response only when allowed (same-origin or CORS, non-opaque, ok). */
function safeCachePut(cache, request, response) {
  if (!isCacheableRequest(request)) return Promise.resolve();
  if (!response || !response.ok || response.status !== 200) return Promise.resolve();
  if (response.type === "opaque") return Promise.resolve();
  return cache.put(request, response.clone()).catch(function () {});
}

function getOfflinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline – BizBranches</title><style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center;padding:1.5rem;}h1{font-size:1.5rem;margin-bottom:0.5rem;}p{color:#94a3b8;margin-bottom:1.5rem;}a{color:#34d399;text-decoration:none;}a:hover{text-decoration:underline;}button{background:#059669;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-size:1rem;cursor:pointer;}</style></head><body><h1>You're offline</h1><p>Check your connection and try again.</p><button onclick="window.location.reload()">Retry</button></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/", "/manifest.json", "/bizbranches.pk.png"]).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;
  if (request.method !== "GET") return;
  if (!isCacheableRequest(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => safeCachePut(cache, request, res));
          return res;
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || getOfflinePage();
          });
        })
    );
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((cache) => safeCachePut(cache, request, res));
          return res;
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        caches.open(CACHE_NAME).then((cache) => safeCachePut(cache, request, res));
        return res;
      })
      .catch(function () {
        return caches.match(request) || Promise.resolve(undefined);
      })
  );
});
