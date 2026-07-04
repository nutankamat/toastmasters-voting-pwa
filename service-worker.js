/* Club Vote service worker — offline app shell.
   Bump CACHE when you change any cached file so devices pick up the update. */
   const CACHE = "clubvote-v3";
   const ASSETS = [
     "./",
     "./index.html",
     "./manifest.json",
     "./icon-192.png",
     "./icon-512.png",
     "./icon-maskable-512.png",
     "./apple-touch-icon.png",
     "./favicon-32.png"
   ];
   
   // Precache everything on install
   self.addEventListener("install", (e) => {
     e.waitUntil(
       caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
     );
   });
   
   // Clean up old caches on activate
   self.addEventListener("activate", (e) => {
     e.waitUntil(
       caches.keys().then((keys) =>
         Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
       ).then(() => self.clients.claim())
     );
   });
   
   // Cache-first: serve from cache, fall back to network, then to cached index for navigations
   self.addEventListener("fetch", (e) => {
     const req = e.request;
     if (req.method !== "GET") return;
     e.respondWith(
       caches.match(req).then((hit) => {
         if (hit) return hit;
         return fetch(req)
           .then((res) => {
             const copy = res.clone();
             caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
             return res;
           })
           .catch(() => {
             if (req.mode === "navigate") return caches.match("./index.html");
             return new Response("", { status: 504, statusText: "offline" });
           });
       })
     );
   });
   