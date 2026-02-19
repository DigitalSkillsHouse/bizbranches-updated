/**
 * BizBranches PWA Service Worker
 * Caching disabled so testing always gets fresh responses (no stale cache).
 * All requests: network-only; offline fallback only for navigate.
 */
const CACHE_NAME = "bizbranches-v4-no-cache";

function isCacheableRequest(request) {
  try {
    const u = request.url;
    return u.startsWith("http:") || u.startsWith("https:");
  } catch (_) {
    return false;
  }
}

function getOfflinePage() {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline – BizBranches</title><style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f172a;color:#e2e8f0;text-align:center;padding:1.5rem;}h1{font-size:1.5rem;margin-bottom:0.5rem;}p{color:#94a3b8;margin-bottom:1.5rem;}a{color:#34d399;text-decoration:none;}a:hover{text-decoration:underline;}button{background:#059669;color:#fff;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-size:1rem;cursor:pointer;}</style></head><body><h1>You're offline</h1><p>Check your connection and try again.</p><button onclick="window.location.reload()">Retry</button></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.resolve().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!isCacheableRequest(request)) return;

  event.respondWith(
    fetch(request).catch(function () {
      if (request.mode === "navigate") return getOfflinePage();
      return undefined;
    })
  );
});
