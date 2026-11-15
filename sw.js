const VERSION = "noctis-v3";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/app.css",
  "./js/app.js", "./js/util.js", "./js/data.js", "./js/store.js", "./js/icons.js", "./js/ui.js",
  "./js/security.js", "./js/detector.js", "./js/convert.js", "./js/finance.js", "./js/backup.js",
  "./js/screens/namaz.js", "./js/screens/gym.js", "./js/screens/finance.js", "./js/screens/settings.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png", "./icons/favicon.png",
];

self.addEventListener("install", (e) => {
  // Ek file missing ho to poora install fail na ho (addAll sab ya kuch nahi karta)
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then((res) => {
        res.forEach((r, i) => { if (r.status === "rejected") console.warn("SW: cache nahi hui:", SHELL[i]); });
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== "noctis-fonts").map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: cache after first online visit so Urdu/Arabic fonts work offline
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open("noctis-fonts").then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((r) => {
          if (r.status === 200 || r.type === "opaque") c.put(req, r.clone()).catch(() => {});
          return r;
        }).catch(() => hit || Response.error());
        return hit || net;
      })
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // App shell: cache first, refresh in background
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((r) => {
        // clone foran (synchronously) karna zaroori hai, warna "body already used" error aata hai
        if (r.status === 200) {
          const copy = r.clone();
          e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}));
        }
        return r;
      }).catch(() => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()));
      return hit || net;
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) if ("focus" in c) return c.focus();
      return self.clients.openWindow("./");
    })
  );
});
