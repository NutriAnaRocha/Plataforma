/* ============================================================
   PWA loader — injeta o manifest + metas de instalação (iOS/Android),
   registra o service worker E mostra um botão "Instalar app" próprio.
   Basta incluir este arquivo em qualquer página para ela virar
   instalável ("Adicionar à tela inicial").
   Precisa de: manifest.webmanifest, sw.js e os ícones em assets/img.

   Por que um botão nosso, se o navegador "já" instala PWA?
   - iPhone/Safari NUNCA dispara o balão automático: só dá pra instalar
     por Compartilhar → "Adicionar à Tela de Início". Sem instrução, o
     paciente não descobre. Aqui mostramos um passo a passo.
   - Android/Chrome dispara `beforeinstallprompt`, mas se a gente não
     capturar o evento e oferecer um botão, ele quase nunca aparece.
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
  addMeta("theme-color", "#0E4C5C");

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

  /* ==========================================================
     Botão "Instalar app"
     ========================================================== */

  // Já está instalado / rodando como app? Não mostra nada.
  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  function isIOS() {
    var ua = window.navigator.userAgent || "";
    // iPhone/iPod/iPad clássicos + iPad no iPadOS 13+ (que se disfarça de Mac).
    return /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }

  var DISMISS_KEY = "pwa_install_dismiss";
  function dismissedRecently() {
    try {
      var t = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
      // Silencia por 7 dias depois de fechar.
      return t && (Date.now() - t) < 7 * 24 * 60 * 60 * 1000;
    } catch (e) { return false; }
  }
  function markDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("pwa-install-style")) return;
    var css =
      '.pwa-install{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);' +
      'z-index:2147483000;display:flex;align-items:center;gap:.5rem;' +
      'padding:.7rem 1rem .7rem 1.1rem;border:0;border-radius:999px;cursor:pointer;' +
      'background:#0E4C5C;color:#fff;font-family:Montserrat,system-ui,sans-serif;' +
      'font-size:.95rem;font-weight:700;box-shadow:0 8px 24px rgba(14, 76, 92,.35);' +
      'max-width:calc(100vw - 24px);' +
      'padding-bottom:calc(.7rem + env(safe-area-inset-bottom));' +
      'animation:pwaUp .28s ease both}' +
      '@keyframes pwaUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '.pwa-install__x{margin-left:.35rem;width:1.4rem;height:1.4rem;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.22);' +
      'font-size:1rem;line-height:1;flex:0 0 auto}' +
      '.pwa-install__x:hover{background:rgba(255,255,255,.35)}' +
      /* Folha de instruções (iOS) */
      '.pwa-sheet{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-end;' +
      'justify-content:center;background:rgba(20,4,14,.55);animation:pwaFade .2s ease both}' +
      '@keyframes pwaFade{from{opacity:0}to{opacity:1}}' +
      '.pwa-sheet__card{background:#fff;color:#2a1420;width:100%;max-width:440px;' +
      'border-radius:20px 20px 0 0;padding:1.4rem 1.3rem calc(1.6rem + env(safe-area-inset-bottom));' +
      'font-family:Montserrat,system-ui,sans-serif;box-shadow:0 -12px 40px rgba(0,0,0,.3);' +
      'animation:pwaUp2 .3s ease both}' +
      '@keyframes pwaUp2{from{transform:translateY(30px)}to{transform:translateY(0)}}' +
      '.pwa-sheet__title{margin:0 0 .2rem;font-size:1.15rem;font-weight:800;color:#0E4C5C}' +
      '.pwa-sheet__sub{margin:0 0 1rem;font-size:.9rem;color:#6b5560;line-height:1.4}' +
      '.pwa-step{display:flex;align-items:center;gap:.7rem;padding:.55rem 0;font-size:.95rem;font-weight:600}' +
      '.pwa-step__n{flex:0 0 auto;width:1.7rem;height:1.7rem;border-radius:50%;background:#f3e3ec;' +
      'color:#0E4C5C;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:.9rem}' +
      '.pwa-step svg{flex:0 0 auto;color:#0E4C5C}' +
      '.pwa-sheet__done{margin-top:1rem;width:100%;padding:.85rem;border:0;border-radius:12px;' +
      'background:#0E4C5C;color:#fff;font-weight:700;font-size:1rem;cursor:pointer;font-family:inherit}';
    var s = document.createElement("style");
    s.id = "pwa-install-style";
    s.textContent = css;
    head().appendChild(s);
  }

  function removeButton() {
    var b = document.getElementById("pwa-install-btn");
    if (b) b.remove();
  }

  // O evento que o Chrome/Edge guardam para instalar sem sair da página.
  var deferredPrompt = null;

  function showButton(mode) {
    if (isStandalone() || dismissedRecently()) return;
    if (document.getElementById("pwa-install-btn")) return;
    injectStyles();

    var btn = document.createElement("button");
    btn.id = "pwa-install-btn";
    btn.className = "pwa-install";
    btn.type = "button";
    btn.innerHTML = '<span>📲 Instalar app</span>' +
      '<span class="pwa-install__x" role="button" aria-label="Agora não">✕</span>';

    btn.addEventListener("click", function (ev) {
      // Clicou no ✕ → só fecha e silencia por uns dias.
      if (ev.target.closest(".pwa-install__x")) {
        ev.stopPropagation();
        markDismissed();
        removeButton();
        return;
      }
      if (mode === "ios") {
        openIOSSheet();
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          removeButton();
        });
      }
    });

    document.body.appendChild(btn);
  }

  function openIOSSheet() {
    injectStyles();
    var shareSvg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3v13"/><path d="M8 7l4-4 4 4"/>' +
      '<path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';
    var plusSvg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="18" height="18" rx="4"/>' +
      '<path d="M12 8v8"/><path d="M8 12h8"/></svg>';

    var ov = document.createElement("div");
    ov.className = "pwa-sheet";
    ov.innerHTML =
      '<div class="pwa-sheet__card" role="dialog" aria-modal="true">' +
      '<h3 class="pwa-sheet__title">Instalar na tela inicial</h3>' +
      '<p class="pwa-sheet__sub">Assim você abre seu acompanhamento como um app, direto do ícone — sem digitar link.</p>' +
      '<div class="pwa-step"><span class="pwa-step__n">1</span>' +
      'Toque em ' + shareSvg + ' <strong>Compartilhar</strong> na barra do Safari</div>' +
      '<div class="pwa-step"><span class="pwa-step__n">2</span>' +
      'Escolha ' + plusSvg + ' <strong>Adicionar à Tela de Início</strong></div>' +
      '<div class="pwa-step"><span class="pwa-step__n">3</span>' +
      'Toque em <strong>Adicionar</strong> no canto superior</div>' +
      '<button class="pwa-sheet__done" type="button">Entendi</button>' +
      '</div>';

    function close() { ov.remove(); }
    ov.addEventListener("click", function (ev) {
      if (ev.target === ov || ev.target.closest(".pwa-sheet__done")) close();
    });
    document.body.appendChild(ov);
  }

  function initInstallUI() {
    if (isStandalone()) return;

    // Android / Chrome / Edge: captura o evento e mostra nosso botão.
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showButton("prompt");
    });

    // Instalou → some com o botão.
    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      removeButton();
      markDismissed();
    });

    // iOS não dispara beforeinstallprompt: mostramos o botão de instruções.
    // Pequeno atraso para não competir com o carregamento da página.
    if (isIOS()) {
      setTimeout(function () { showButton("ios"); }, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInstallUI);
  } else {
    initInstallUI();
  }
})();
