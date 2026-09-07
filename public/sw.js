/* SPWMS offline service worker: app shell + vendor assets cached for full offline use. */
const CACHE = "spwms-v1";
const PRECACHE = [
  "/",
  "/welcome",
  "/app",
  "/legacy.html",
  "/vendor/html5-qrcode.min.js",
  "/vendor/xlsx.bundle.js",
  "/vendor/jspdf.umd.min.js",
  "/vendor/html2canvas.min.js",
  "/vendor/supabase.min.js",
  "/vendor/fonts.css",
  "/vendor/fontawesome.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !isSameOrigin(req.url)) return;

  const url = new URL(req.url);
  // Never cache API / server-function traffic.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return;

  const isDocument = req.mode === "navigate" || req.destination === "document";

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      if (isDocument) {
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (
            (await cache.match(req)) ||
            (await cache.match("/legacy.html")) ||
            (await cache.match("/")) ||
            new Response("Offline", { status: 503 })
          );
        }
      }

      const cached = await cache.match(req);
      if (cached) {
        // Refresh in background when possible.
        event.waitUntil(
          fetch(req)
            .then((res) => (res.ok ? cache.put(req, res.clone()) : null))
            .catch(() => {}),
        );
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return new Response("", { status: 504 });
      }
    })(),
  );
});
