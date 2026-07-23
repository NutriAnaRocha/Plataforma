/* ============================================================
   PWA loader — injeta o manifest + metas de instalação (iOS/Android)
   e registra o service worker. Basta incluir este arquivo em
   qualquer página para ela virar instalável ("Adicionar à tela inicial").
   Precisa de: manifest.webmanifest, sw.js e os ícones em assets/img.
   ============================================================ */
(function () {
  "use strict";

  function head() { return document.head || document.getElementsByTagName("head")[0]; }

  function addLink(rel, href, extra) {
    if (document.querySelector('link[rel="' + rel + '"]')) return;
    var l = document.createElement("link");
    l.rel = rel; l.href = href;
    if (extra) Object.keys(extra).forEach(function (k) { l.setAttribute(k, extra[k]); });
    head().appendChild(l);
  }

  function addMeta(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var m = document.createElement("meta");
    m.name = name; m.content = content;
    head().appendChild(m);
  }

  // Manifest + tema (Android/Chrome)
  addLink("manifest", "manifest.webmanifest");
  addMeta("theme-color", "#840B55");

  // iOS / Safari — vira app em tela cheia com ícone próprio
  addMeta("apple-mobile-web-app-capable", "yes");
  addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  addMeta("apple-mobile-web-app-title", "Meu Nutri");
  addLink("apple-touch-icon", "assets/img/apple-touch-icon.png");

  // Service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* silencioso */ });
    });
  }
})();
