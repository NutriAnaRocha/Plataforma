/* Este service worker existe para se destruir. A plataforma mudou para
   nutriplat.com.br; sem isto, quem instalou o app no endereço antigo
   ficaria preso na versão em cache. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: "window" }); })
      .then(function (cs) { cs.forEach(function (c) { c.navigate(c.url); }); })
  );
});
