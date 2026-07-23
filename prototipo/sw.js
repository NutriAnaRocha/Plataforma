/* ============================================================
   Service Worker — Portal do paciente (PWA)
   Estratégia:
     • Navegações (HTML): network-first → cai no cache se offline.
     • Estáticos (css/js/img) do MESMO domínio: stale-while-revalidate.
     • Qualquer coisa de outro domínio (Supabase, fontes Google) e
       tudo que não for GET: passa direto, o SW NÃO intercepta.
   Assim login/dados nunca são servidos de cache velho.
   Suba o CACHE quando publicar mudanças para forçar atualização.
   ============================================================ */
"use strict";

var CACHE = "nutri-portal-v1";

// App shell mínimo do paciente (best-effort: um 404 não quebra o install).
var SHELL = [
  "./",
  "./index.html",
  "./portal-paciente.html",
  "./manifest.webmanifest",
  "assets/css/tokens.css",
  "assets/css/style.css",
  "assets/css/portal.css",
  "assets/css/lista-compras.css",
  "assets/css/treino.css",
  "assets/css/metas.css",
  "assets/js/supabase-client.js",
  "assets/js/pacientes-db.js",
  "assets/js/alimentos-data.js",
  "assets/js/lista-compras.js",
  "assets/js/portal.js",
  "assets/js/app.js",
  "assets/js/pwa.js",
  "assets/img/logo-mark.png",
  "assets/img/icon-192.png",
  "assets/img/icon-512.png",
  "assets/img/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.allSettled(SHELL.map(function (u) { return cache.add(u); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                      // não mexe em POST/PUT (auth, saves)
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Supabase, fontes: passa direto

  // Navegações (abrir uma página): tenta rede, cai no cache offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // Estáticos: responde do cache já e atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
