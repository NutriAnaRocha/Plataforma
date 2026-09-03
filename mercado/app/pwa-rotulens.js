/* ============================================================
   RotuLens — "Instalar app"

   Mesma ideia do botão que já existe na plataforma
   (Plataforma/prototipo/assets/js/pwa.js): injeta o manifest e as
   metas de instalação, registra o service worker e mostra um botão
   PRÓPRIO de instalar. Basta incluir este arquivo na página.

   Por que um botão nosso, se o navegador "já" instala PWA:
   - iPhone/Safari NUNCA dispara o balão automático. Só dá para
     instalar por Compartilhar -> "Adicionar à Tela de Início", e
     sem instrução ninguém descobre.
   - Android/Chrome dispara `beforeinstallprompt`, mas se a gente
     não capturar o evento e oferecer um botão, ele quase nunca
     aparece.
   - Firefox e Samsung Internet não disparam nada: para eles o
     botão abre o passo a passo do menu do navegador.

   O QUE MUDA EM RELAÇÃO AO BOTÃO DA PLATAFORMA

   Na plataforma quem abre a página é paciente da Ana: já sabe o que
   é aquilo e instalar de cara faz sentido. No RotuLens quem chega
   veio de um anúncio e ainda não viu o app fazer nada — pedir
   instalação antes de entregar valor é o pedido na hora errada, e
   quem recusa fica 7 dias sem ver o convite de novo (regra abaixo).
   Então aqui o botão espera:

     RotuLensInstalar.oferecer()   <- chame DEPOIS da primeira leitura

   Se a página nunca chamar, o botão aparece sozinho depois de
   ESPERA_MAXIMA_MS, para o convite não deixar de existir por causa
   de uma chamada esquecida.

   Personalização, se precisar:
     <script src="pwa-rotulens.js"
             data-manifest="manifest.webmanifest"
             data-cor="#0E4C5C"></script>
   ============================================================ */
(function () {
  "use strict";

  var script = document.currentScript;
  function opcao(nome, padrao) {
    var v = script && script.getAttribute("data-" + nome);
    return v || padrao;
  }

  var MANIFEST = opcao("manifest", "manifest.webmanifest");
  var COR = opcao("cor", "#0E4C5C");
  var TITULO = opcao("titulo", "RotuLens");
  var ESPERA_MAXIMA_MS = 45000;
  var DISMISS_KEY = "rotulens_instalar_dispensado";
  var DIAS_SILENCIO = 7;

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
  addLink("manifest", MANIFEST);
  addMeta("theme-color", COR);

  // iOS / Safari — vira app em tela cheia com ícone próprio
  addMeta("apple-mobile-web-app-capable", "yes");
  addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  addMeta("apple-mobile-web-app-title", TITULO);
  addLink("apple-touch-icon", "assets/img/apple-touch-icon.png");

  // Service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* silencioso */ });
    });
  }

  /* ---------------- estado ---------------- */

  function jaInstalado() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  function ehIOS() {
    var ua = window.navigator.userAgent || "";
    // iPhone/iPod/iPad clássicos + iPad no iPadOS 13+, que se disfarça de Mac.
    return /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }

  function dispensadoRecentemente() {
    try {
      var t = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
      return t && (Date.now() - t) < DIAS_SILENCIO * 24 * 60 * 60 * 1000;
    } catch (e) { return false; }
  }
  function marcarDispensado() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  var promptGuardado = null;   // evento do Chrome/Edge
  var jaApareceu = false;
  var relogio = null;

  /* ---------------- estilos ---------------- */

  function injetarEstilos() {
    if (document.getElementById("rl-instalar-style")) return;
    var css =
      '.rl-instalar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);' +
      'z-index:2147483000;display:flex;align-items:center;gap:.5rem;' +
      'padding:.7rem 1rem .7rem 1.1rem;border:0;border-radius:999px;cursor:pointer;' +
      'background:' + COR + ';color:#fff;font-family:inherit;' +
      'font-size:.95rem;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.28);' +
      'max-width:calc(100vw - 24px);' +
      'padding-bottom:calc(.7rem + env(safe-area-inset-bottom));' +
      'animation:rlSobe .28s ease both}' +
      '@keyframes rlSobe{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '.rl-instalar__x{margin-left:.35rem;width:1.4rem;height:1.4rem;border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.22);' +
      'font-size:1rem;line-height:1;flex:0 0 auto}' +
      '.rl-instalar__x:hover{background:rgba(255,255,255,.35)}' +
      '.rl-instalar:focus-visible,.rl-folha__ok:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
      /* folha de instruções */
      '.rl-folha{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:flex-end;' +
      'justify-content:center;background:rgba(10,20,24,.55);animation:rlFade .2s ease both}' +
      '@keyframes rlFade{from{opacity:0}to{opacity:1}}' +
      '.rl-folha__card{background:#fff;color:#1d2b30;width:100%;max-width:440px;' +
      'border-radius:20px 20px 0 0;padding:1.4rem 1.3rem calc(1.6rem + env(safe-area-inset-bottom));' +
      'font-family:inherit;box-shadow:0 -12px 40px rgba(0,0,0,.3);animation:rlSobe2 .3s ease both}' +
      '@keyframes rlSobe2{from{transform:translateY(30px)}to{transform:translateY(0)}}' +
      '.rl-folha__titulo{margin:0 0 .2rem;font-size:1.15rem;font-weight:800;color:' + COR + '}' +
      '.rl-folha__sub{margin:0 0 1rem;font-size:.9rem;color:#5c6b70;line-height:1.45}' +
      '.rl-passo{display:flex;align-items:flex-start;gap:.7rem;padding:.55rem 0;font-size:.95rem;font-weight:600}' +
      '.rl-passo__n{flex:0 0 auto;width:1.7rem;height:1.7rem;border-radius:50%;background:#e4eef0;' +
      'color:' + COR + ';font-weight:800;display:flex;align-items:center;justify-content:center;font-size:.9rem}' +
      '.rl-passo__t{flex:1;line-height:1.55}' +
      '.rl-passo svg{color:' + COR + ';vertical-align:-4px}' +
      '.rl-folha__ok{margin-top:1rem;width:100%;padding:.85rem;border:0;border-radius:12px;' +
      'background:' + COR + ';color:#fff;font-weight:700;font-size:1rem;cursor:pointer;font-family:inherit}' +
      '@media (prefers-reduced-motion:reduce){.rl-instalar,.rl-folha,.rl-folha__card{animation:none}}';
    var s = document.createElement("style");
    s.id = "rl-instalar-style";
    s.textContent = css;
    head().appendChild(s);
  }

  function removerBotao() {
    var b = document.getElementById("rl-instalar-btn");
    if (b) b.remove();
  }

  /* ---------------- botão ---------------- */

  // modo: "prompt" (Chrome guardou o evento) | "ios" | "manual"
  function mostrarBotao(modo) {
    if (jaInstalado() || dispensadoRecentemente()) return;
    if (document.getElementById("rl-instalar-btn")) return;
    injetarEstilos();
    jaApareceu = true;

    var btn = document.createElement("button");
    btn.id = "rl-instalar-btn";
    btn.className = "rl-instalar";
    btn.type = "button";
    btn.innerHTML = '<span>📲 Instalar app</span>' +
      '<span class="rl-instalar__x" role="button" aria-label="Agora não">✕</span>';

    btn.addEventListener("click", function (ev) {
      // Clicou no ✕ -> só fecha e silencia por uns dias.
      if (ev.target.closest(".rl-instalar__x")) {
        ev.stopPropagation();
        marcarDispensado();
        removerBotao();
        return;
      }
      if (modo === "prompt" && promptGuardado) {
        promptGuardado.prompt();
        promptGuardado.userChoice.then(function () {
          promptGuardado = null;
          removerBotao();
        });
      } else {
        abrirFolha(modo === "ios" ? "ios" : "manual");
      }
    });

    document.body.appendChild(btn);
  }

  /* ---------------- folha de instruções ---------------- */

  function abrirFolha(qual) {
    injetarEstilos();

    var compartilharSvg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 3v13"/><path d="M8 7l4-4 4 4"/>' +
      '<path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';
    var maisSvg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="3" width="18" height="18" rx="4"/>' +
      '<path d="M12 8v8"/><path d="M8 12h8"/></svg>';
    var menuSvg =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/>' +
      '<circle cx="12" cy="19" r="1.7"/></svg>';

    // O texto de cada passo vai dentro de UM span: .rl-passo e um flex,
    // e sem isso cada <strong> viraria um item solto, quebrando a frase
    // em colunas.
    function passo(n, html) {
      return '<div class="rl-passo"><span class="rl-passo__n">' + n + '</span>' +
             '<span class="rl-passo__t">' + html + '</span></div>';
    }

    var passos = qual === "ios"
      ? passo(1, 'Toque em ' + compartilharSvg + ' <strong>Compartilhar</strong>, na barra do Safari') +
        passo(2, 'Escolha ' + maisSvg + ' <strong>Adicionar à Tela de Início</strong>') +
        passo(3, 'Toque em <strong>Adicionar</strong>, no canto de cima')
      : passo(1, 'Abra o menu ' + menuSvg + ' do navegador') +
        passo(2, 'Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>') +
        passo(3, 'Confirme em <strong>Instalar</strong>');

    var ov = document.createElement("div");
    ov.className = "rl-folha";
    ov.innerHTML =
      '<div class="rl-folha__card" role="dialog" aria-modal="true" aria-label="Instalar na tela inicial">' +
      '<h3 class="rl-folha__titulo">Instalar na tela inicial</h3>' +
      '<p class="rl-folha__sub">Assim o RotuLens fica igual a um aplicativo, aberto por um ícone — ' +
      'sem precisar achar o link de novo na próxima compra.</p>' +
      passos +
      '<button class="rl-folha__ok" type="button">Entendi</button>' +
      '</div>';

    function fechar() {
      ov.remove();
      document.removeEventListener("keydown", noEsc);
    }
    function noEsc(e) { if (e.key === "Escape") fechar(); }

    ov.addEventListener("click", function (ev) {
      if (ev.target === ov || ev.target.closest(".rl-folha__ok")) fechar();
    });
    document.addEventListener("keydown", noEsc);
    document.body.appendChild(ov);
    var ok = ov.querySelector(".rl-folha__ok");
    if (ok) ok.focus();
  }

  /* ---------------- ligação ---------------- */

  // Chamado pela página depois da primeira leitura de rótulo: é o
  // momento em que a pessoa acabou de ver o app fazer o que promete.
  function oferecer() {
    if (jaInstalado() || dispensadoRecentemente() || jaApareceu) return;
    if (promptGuardado) return mostrarBotao("prompt");
    if (ehIOS()) return mostrarBotao("ios");
    mostrarBotao("manual");
  }

  function iniciar() {
    if (jaInstalado()) return;

    // Android/Chrome/Edge: guarda o evento. Não mostra o botão ainda —
    // quem decide a hora é oferecer(), ou o relógio abaixo.
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      promptGuardado = e;
    });

    window.addEventListener("appinstalled", function () {
      promptGuardado = null;
      removerBotao();
      marcarDispensado();
    });

    // Rede de segurança: se a página nunca chamar oferecer(), o convite
    // ainda aparece — depois de tempo suficiente para a pessoa ter lido
    // pelo menos um rótulo.
    relogio = setTimeout(oferecer, ESPERA_MAXIMA_MS);
  }

  window.RotuLensInstalar = {
    oferecer: function () {
      if (relogio) { clearTimeout(relogio); relogio = null; }
      oferecer();
    },
    // Para gravar vídeo ou testar: mostra o botão na hora, ignorando
    // o silêncio de quem já dispensou.
    forcar: function () {
      try { localStorage.removeItem(DISMISS_KEY); } catch (e) {}
      jaApareceu = false;
      removerBotao();
      oferecer();
    },
    instruções: abrirFolha
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
