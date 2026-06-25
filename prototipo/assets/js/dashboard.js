/* ============================================================
   DASHBOARD (Tela 2) — render dos dados mock, gráfico SVG de
   evolução, assistente Nútri AI e navegação mobile.
   Depende de dashboard-data.js (window.DASH_DATA).
   ============================================================ */
(function () {
  "use strict";

  var D = window.DASH_DATA || {};

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  document.addEventListener("DOMContentLoaded", function () {
    renderTopbar();
    renderStats();
    renderAgenda();
    renderChart();
    renderPacientes();
    renderAniversariantes();
    renderPendencias();
    initAI();
    initMobileNav();
  });

  /* ---------- Topbar ---------- */
  function renderTopbar() {
    var u = D.user || {};
    var hello = el("hello");
    if (hello) hello.textContent = "Olá, " + (u.saudacao || "nutricionista") + " 👋";
    var data = el("hoje");
    if (data) {
      var hoje = new Date();
      var fmt = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      data.textContent = fmt.charAt(0).toUpperCase() + fmt.slice(1);
    }
    var av = el("user-avatar");
    if (av && u.nome) av.textContent = iniciais(u.nome);
    var sName = el("side-user-name");
    var sCrn = el("side-user-crn");
    if (sName) sName.textContent = u.nome || "Nutricionista";
    if (sCrn) sCrn.textContent = u.crn || "";
  }

  function iniciais(nome) {
    var p = String(nome).trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
  }

  /* ---------- Stat cards ---------- */
  function renderStats() {
    var wrap = el("stats");
    if (!wrap) return;
    wrap.innerHTML = (D.stats || []).map(function (s) {
      return '' +
        '<div class="stat">' +
          '<div class="stat__ico stat__ico--' + s.cor + '">' + s.ico + '</div>' +
          '<div>' +
            '<div class="stat__valor">' + esc(s.valor) + '</div>' +
            '<div class="stat__label">' + esc(s.label) + '</div>' +
          '</div>' +
          '<div class="stat__foot">' +
            '<span class="delta delta--' + s.deltaTipo + '">' + esc(s.delta) + '</span>' +
            '<span class="stat__sub">' + esc(s.sub) + '</span>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  /* ---------- Agenda inteligente ---------- */
  function renderAgenda() {
    var wrap = el("agenda");
    if (!wrap) return;
    var stLabel = { concluida: "Concluída", emandamento: "Em andamento", proxima: "Agendada" };
    wrap.innerHTML = (D.agenda || []).map(function (a) {
      var h = a.hora.split(":");
      var modoIco = a.modo === "Online" ? "💻" : "🏥";
      return '' +
        '<div class="appt">' +
          '<div class="appt__hora">' + h[0] + 'h<span>' + h[1] + '</span></div>' +
          '<div class="appt__who">' +
            '<span class="avatar avatar--sm avatar--rosa">' + esc(a.ini) + '</span>' +
            '<div>' +
              '<div class="appt__nome">' + esc(a.paciente) + '</div>' +
              '<div class="appt__meta">' + esc(a.tipo) +
                '<span class="dot-sep"></span>' +
                '<span class="modo">' + modoIco + ' ' + esc(a.modo) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<span class="appt__status st-' + a.status + '">' + stLabel[a.status] + '</span>' +
        '</div>';
    }).join("");
  }

  /* ---------- Gráfico de evolução (SVG line + area) ---------- */
  function renderChart() {
    var wrap = el("chart");
    if (!wrap || !D.evolucao) return;
    var ev = D.evolucao;
    var pts = ev.pontos, labels = ev.labels;
    var W = 560, H = 200, padX = 16, padY = 24;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
    var span = (max - min) || 1;
    var stepX = (W - padX * 2) / (pts.length - 1);

    function x(i) { return padX + i * stepX; }
    function y(v) { return padY + (H - padY * 2) * (1 - (v - min) / span); }

    var line = pts.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var area = "M" + x(0).toFixed(1) + " " + (H - padY).toFixed(1) + " " +
               pts.map(function (v, i) { return "L" + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ") +
               " L" + x(pts.length - 1).toFixed(1) + " " + (H - padY).toFixed(1) + " Z";

    var dots = pts.map(function (v, i) {
      return '<circle class="chart__pt" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.2) + '"></circle>';
    }).join("");
    var lbls = labels.map(function (l, i) {
      return '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(l) + '</text>';
    }).join("");

    wrap.innerHTML = '' +
      '<div class="chart__head">' +
        '<span class="chart__big">' + esc(pts[pts.length - 1]) + ev.unidade + '</span>' +
        '<span class="delta delta--up">▲ ' + esc(ev.resumo) + '</span>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ev.sub) + '">' +
        '<defs><linearGradient id="gradWine" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#7B284C" stop-opacity="0.22"/>' +
          '<stop offset="100%" stop-color="#7B284C" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path class="chart__area" d="' + area + '"></path>' +
        '<path class="chart__line" d="' + line + '"></path>' +
        dots + lbls +
      '</svg>';
  }

  /* ---------- Lista de pacientes (progresso) ---------- */
  function renderPacientes() {
    var wrap = el("pacientes");
    if (!wrap) return;
    wrap.innerHTML = (D.pacientes || []).map(function (p) {
      return '' +
        '<div class="prow">' +
          '<span class="avatar avatar--sm avatar--rosa">' + esc(p.ini) + '</span>' +
          '<div class="prow__info">' +
            '<div class="prow__nome">' + esc(p.nome) + '</div>' +
            '<div class="prow__obj">' + esc(p.obj) + ' · atualizado ' + esc(p.ult) + '</div>' +
          '</div>' +
          '<div class="prow__prog">' +
            '<span class="prow__pct">' + p.progresso + '%</span>' +
            '<div class="bar"><div class="bar__fill" style="width:' + p.progresso + '%"></div></div>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  /* ---------- Aniversariantes ---------- */
  function renderAniversariantes() {
    var wrap = el("aniversariantes");
    if (!wrap) return;
    wrap.innerHTML = (D.aniversariantes || []).map(function (a) {
      return '' +
        '<div class="simple__row">' +
          '<span class="avatar avatar--sm avatar--rosa">' + esc(a.ini) + '</span>' +
          '<div class="simple__info">' +
            '<div class="simple__nome">' + esc(a.nome) + '</div>' +
            '<div class="simple__sub">Completa ' + a.idade + ' anos hoje 🎉</div>' +
          '</div>' +
          '<button class="btn btn--outline" style="padding:7px 13px;font-size:.78rem">Parabenizar</button>' +
        '</div>';
    }).join("");
  }

  /* ---------- Pendências ---------- */
  function renderPendencias() {
    var wrap = el("pendencias");
    if (!wrap) return;
    wrap.innerHTML = (D.pendencias || []).map(function (t) {
      return '' +
        '<div class="todo__item">' +
          '<span class="todo__check"></span>' +
          '<div>' +
            '<div class="todo__txt">' + esc(t.texto) + '</div>' +
            '<div class="todo__prazo' + (t.urgente ? " is-urgente" : "") + '">' +
              (t.urgente ? "⚠ " : "") + 'Prazo: ' + esc(t.prazo) + '</div>' +
          '</div>' +
        '</div>';
    }).join("");
    // marcar como concluída ao clicar
    wrap.querySelectorAll(".todo__item").forEach(function (item) {
      item.addEventListener("click", function () {
        item.style.opacity = item.style.opacity === "0.45" ? "" : "0.45";
        item.style.textDecoration = item.style.textDecoration ? "" : "line-through";
        var chk = item.querySelector(".todo__check");
        chk.style.background = chk.style.background ? "" : "var(--vinho)";
        chk.style.borderColor = "var(--vinho)";
      });
    });
  }

  /* ---------- Nútri AI ---------- */
  function initAI() {
    var fab = el("ai-fab");
    var panel = el("ai-panel");
    var close = el("ai-close");
    var thread = el("ai-thread");
    var input = el("ai-text");
    var send = el("ai-send");
    var suggest = el("ai-suggest");
    if (!fab || !panel) return;

    function open() { panel.classList.add("is-open"); fab.classList.add("is-hidden"); setTimeout(function () { input && input.focus(); }, 200); }
    function hide() { panel.classList.remove("is-open"); fab.classList.remove("is-hidden"); }
    fab.addEventListener("click", open);
    close.addEventListener("click", hide);

    // chips de sugestão
    if (suggest) {
      suggest.innerHTML = (D.aiSugestoes || []).map(function (s) {
        return '<button class="ai-suggest__chip" type="button">' + esc(s) + '</button>';
      }).join("");
      suggest.querySelectorAll(".ai-suggest__chip").forEach(function (c) {
        c.addEventListener("click", function () { sendMsg(c.textContent); });
      });
    }

    function addMsg(html, who) {
      var m = document.createElement("div");
      m.className = "msg msg--" + who;
      m.innerHTML = html;
      thread.appendChild(m);
      thread.scrollTop = thread.scrollHeight;
      return m;
    }

    function sendMsg(text) {
      text = (text || "").trim();
      if (!text) return;
      addMsg(esc(text), "me");
      if (input) input.value = "";
      if (suggest) suggest.style.display = "none";
      var typing = addMsg('<span class="msg--typing"><span></span><span></span><span></span></span>', "ai");
      setTimeout(function () {
        typing.innerHTML = D.aiRespostaDemo || "Posso ajudar com isso! (resposta de demonstração)";
        thread.scrollTop = thread.scrollHeight;
      }, 1100);
    }

    send.addEventListener("click", function () { sendMsg(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") sendMsg(input.value); });
  }

  /* ---------- Navegação mobile (sidebar gaveta) ---------- */
  function initMobileNav() {
    var app = el("app");
    var toggle = el("menu-toggle");
    var scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }
})();
