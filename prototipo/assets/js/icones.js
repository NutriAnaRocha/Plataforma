/* =========================================================================
   icones.js — troca os emojis da casca (menu, topbar, cards, botões) por
   ícones de traço desenhados (estilo Lucide, licença ISC).
   Funciona em todas as telas sem mexer no HTML de cada uma: varre só os
   contêineres de ícone conhecidos e observa o que for renderizado depois.
   ========================================================================= */
(function () {
  "use strict";

  var P = {
    grid: '<rect width="7" height="9" x="3" y="3" rx="1.5"/><rect width="7" height="5" x="14" y="3" rx="1.5"/><rect width="7" height="9" x="14" y="12" rx="1.5"/><rect width="7" height="5" x="3" y="16" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    salad: '<path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/>',
    tube: '<path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/>',
    star: '<path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.49l-5.87 3.09 1.12-6.54L2.5 9.41l6.56-.95z"/>',
    microscope: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
    chef: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.46.32-.84.73-1.04a4 4 0 0 0-2.14-7.59 5 5 0 0 0-9.18 0 4 4 0 0 0-2.14 7.59c.41.2.73.58.73 1.04V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
    flask: '<path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.12a2 2 0 0 1-.21-.9V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4M22 5h-4"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3M12 8v3M17 8v3"/><path d="M7 4h.01M12 4h.01M17 4h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'
  };

  // emoji (sem o seletor de variação FE0F) → ícone
  var MAPA = {
    "📊": "grid", "👥": "users", "📅": "calendar", "🗓": "calendar",
    "📋": "clipboard", "🥗": "salad", "🧪": "tube", "⭐": "star",
    "🔬": "microscope", "📑": "book", "📄": "file", "🍳": "chef",
    "⚗": "flask", "💬": "chat", "💰": "wallet", "📈": "trend",
    "🎨": "palette", "📱": "phone", "📲": "download", "🤖": "sparkles",
    "⚙": "gear", "🔔": "bell", "☰": "menu", "↩": "logout", "🔍": "search",
    "⚠": "alert", "🎂": "cake", "➤": "send", "👋": ""
  };

  // Só estes lugares — nunca o conteúdo clínico nem o texto do paciente.
  var ALVOS = [
    ".menu .ico", ".stat__ico", ".icon-btn", ".ai-fab__ico", ".ai-panel__avatar",
    ".ai-input__send", ".topbar__search", ".card__title", ".notif__ico",
    ".dash-empty__ico", ".pwa-install", ".modrail__item .ico", "#hello"
  ].join(",");

  var RE = new RegExp("(" + Object.keys(MAPA).map(function (k) {
    return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|") + ")\\uFE0F?\\s?", "g");

  function svg(nome) {
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[nome] + "</svg>";
  }

  function trocarTexto(no) {
    var t = no.nodeValue;
    if (!no.parentNode || !t) return;
    RE.lastIndex = 0;
    if (!RE.test(t)) return;
    RE.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var ultimo = 0, m;
    while ((m = RE.exec(t))) {
      if (m.index > ultimo) frag.appendChild(document.createTextNode(t.slice(ultimo, m.index)));
      var nome = MAPA[m[1]];
      if (nome) {
        var tmp = document.createElement("span");
        tmp.innerHTML = svg(nome);
        frag.appendChild(tmp.firstChild);
        if (/\s$/.test(m[0])) frag.appendChild(document.createTextNode(" "));
      }
      ultimo = m.index + m[0].length;
    }
    if (ultimo < t.length) frag.appendChild(document.createTextNode(t.slice(ultimo)));
    no.parentNode.replaceChild(frag, no);
  }

  function varrer(raiz) {
    var alvos = [];
    if (raiz.matches && raiz.matches(ALVOS)) alvos.push(raiz);
    if (raiz.querySelectorAll) alvos.push.apply(alvos, raiz.querySelectorAll(ALVOS));
    alvos.forEach(function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nos = [], n;
      while ((n = w.nextNode())) nos.push(n);
      nos.forEach(trocarTexto);
    });
  }

  function estilos() {
    if (document.getElementById("icones-css")) return;
    var s = document.createElement("style");
    s.id = "icones-css";
    s.textContent =
      ".ic{width:1.15em;height:1.15em;display:inline-block;vertical-align:-.2em;flex:none}" +
      ".menu a .ico{display:grid;place-items:center}.menu a .ico .ic{width:19px;height:19px}" +
      ".icon-btn .ic{width:20px;height:20px;color:var(--cinza-escuro,#1f2a2a)}" +
      ".stat__ico .ic{width:22px;height:22px}" +
      ".stat__ico--vinho{color:#fff}.stat__ico--rosa{color:var(--vinho)}.stat__ico--alerta{color:#B4640F}" +
      ".topbar__search .ic{width:17px;height:17px;opacity:.6}" +
      ".card__title .ic{margin-right:.15em;color:var(--vinho)}" +
      ".pwa-install .ic,.ai-fab__ico .ic{width:18px;height:18px}" +
      ".ai-panel__avatar{display:grid;place-items:center}";
    document.head.appendChild(s);
  }

  function iniciar() {
    estilos();
    varrer(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === "characterData") {
          var p = m.target.parentElement;
          if (p && p.closest(ALVOS)) trocarTexto(m.target);
          return;
        }
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) varrer(n);
          else if (n.nodeType === 3 && n.parentElement && n.parentElement.closest(ALVOS)) trocarTexto(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
