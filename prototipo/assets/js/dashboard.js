/* ============================================================
   DASHBOARD (Tela 2) — KPIs e listas DERIVADOS do banco real
   (window.NutriPacientes + window.NutriPerfil). Enquanto o banco
   carrega, mostra a casca; sem banco (file://) cai no mock DASH_DATA.
   Agenda "de hoje" e aniversariantes dependem de dados que ainda não
   existem (tabela consultas / data de nascimento) → empty-state honesto.
   ============================================================ */
(function () {
  "use strict";

  var D = window.DASH_DATA || {};
  var pacientes = null;   // array real (preenchido no load)
  var perfil = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  document.addEventListener("DOMContentLoaded", function () {
    renderTopbar(D.user || {});
    renderStatsMock();      // casca inicial (mock) até o banco responder
    renderAgenda();
    renderChartMock();
    renderPacientesMock();
    renderAniversariantes();
    renderPendenciasMock();
    initAI();
    initMobileNav();
    loadReal();
  });

  /* ---------- Carga real ---------- */
  function loadReal() {
    if (!window.NutriPacientes) return; // file:// / offline → fica no mock
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) {
        perfil = p;
        renderTopbar({ nome: p.nome, saudacao: (p.nome || "").split(/\s+/)[0], crn: p.crn });
      }).catch(function () {});
    }
    window.NutriPacientes.list().then(function (list) {
      pacientes = list || [];
      renderStatsReal();
      renderChartReal();
      renderPacientesReal();
      renderPendenciasReal();
      renderAgenda();          // repinta empty-state real
      renderAniversariantes();
    }).catch(function () { /* mantém mock */ });
  }

  /* ---------- Topbar ---------- */
  function renderTopbar(u) {
    u = u || {};
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
    if (sName && u.nome) sName.textContent = u.nome;
    if (sCrn) sCrn.textContent = u.crn || "";
  }

  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/);
    return (((p[0] || "")[0] || "") + ((p[1] || "")[0] || "")).toUpperCase();
  }

  function setCardSub(bodyId, texto) {
    var body = el(bodyId);
    if (!body) return;
    var card = body.closest(".card");
    var sub = card && card.querySelector(".card__sub");
    if (sub) sub.textContent = texto;
  }

  /* ---------- Stat cards ---------- */
  function statCard(s) {
    return '' +
      '<div class="stat">' +
        '<div class="stat__ico stat__ico--' + s.cor + '">' + s.ico + '</div>' +
        '<div>' +
          '<div class="stat__valor">' + esc(s.valor) + '</div>' +
          '<div class="stat__label">' + esc(s.label) + '</div>' +
        '</div>' +
        '<div class="stat__foot">' +
          (s.delta ? '<span class="delta delta--' + s.deltaTipo + '">' + esc(s.delta) + '</span>' : '') +
          '<span class="stat__sub">' + esc(s.sub) + '</span>' +
        '</div>' +
      '</div>';
  }
  function renderStatsMock() {
    var wrap = el("stats"); if (!wrap) return;
    wrap.innerHTML = (D.stats || []).map(statCard).join("");
  }
  function renderStatsReal() {
    var wrap = el("stats"); if (!wrap) return;
    var total = pacientes.length;
    var ativos = pacientes.filter(function (p) { return p.status === "ativo"; }).length;
    var atencao = pacientes.filter(function (p) { return p.status === "atencao"; }).length;
    var inativos = pacientes.filter(function (p) { return p.status === "inativo"; }).length;
    var comAdesao = pacientes.filter(function (p) { return typeof p.adesao === "number"; });
    var adesaoMedia = comAdesao.length
      ? Math.round(comAdesao.reduce(function (a, p) { return a + p.adesao; }, 0) / comAdesao.length) : 0;
    wrap.innerHTML = [
      { label: "Pacientes ativos", valor: ativos, sub: "de " + total + " no total", ico: "👥", cor: "vinho" },
      { label: "Precisam de atenção", valor: atencao, sub: atencao ? "revisar plano" : "tudo em dia", ico: "⚠️", cor: "alerta" },
      { label: "Adesão média", valor: adesaoMedia + "%", sub: "ao plano alimentar", ico: "📈", cor: "rosa" },
      { label: "Inativos", valor: inativos, sub: inativos ? "reativar contato" : "nenhum", ico: "💤", cor: "rosa" }
    ].map(function (s) { s.delta = ""; s.deltaTipo = "neutro"; return statCard(s); }).join("");
  }

  /* ---------- Agenda inteligente (honesto até tabela consultas existir) ---------- */
  function renderAgenda() {
    var wrap = el("agenda");
    if (!wrap) return;
    // Sem tabela de consultas com data real, não há como listar "hoje".
    setCardSub("agenda", "Agenda em tempo real chega com o módulo de consultas");
    wrap.innerHTML =
      '<div class="dash-empty">' +
        '<span class="dash-empty__ico">🗓️</span>' +
        '<p class="dash-empty__txt">As consultas do dia aparecem aqui assim que o módulo de agenda estiver ativo.</p>' +
        '<a class="btn btn--outline" href="agenda.html">Abrir agenda</a>' +
      '</div>';
  }

  /* ---------- Distribuição de adesão (real) ---------- */
  function renderChartMock() {
    var wrap = el("chart"); if (!wrap || !D.evolucao) return;
    // mantém o gráfico mock só na casca inicial (substituído por dados reais no load)
    wrap.innerHTML = '<div class="dash-empty" style="min-height:120px"><p class="dash-empty__txt">Carregando…</p></div>';
  }
  function renderChartReal() {
    var wrap = el("chart"); if (!wrap) return;
    setCardSub("chart", "Distribuição de adesão dos seus pacientes");
    var boa = pacientes.filter(function (p) { return p.adesao >= 70; }).length;
    var media = pacientes.filter(function (p) { return p.adesao >= 50 && p.adesao < 70; }).length;
    var baixa = pacientes.filter(function (p) { return p.adesao < 50; }).length;
    var total = pacientes.length || 1;
    function row(label, n, cls) {
      var pct = Math.round(n / total * 100);
      return '<div class="dash-bar">' +
        '<div class="dash-bar__top"><span>' + label + '</span><span>' + n + ' · ' + pct + '%</span></div>' +
        '<div class="bar"><div class="bar__fill ' + cls + '" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }
    wrap.innerHTML =
      '<div class="dash-dist">' +
        row("Boa adesão (≥70%)", boa, "is-good") +
        row("Adesão média (50–69%)", media, "") +
        row("Baixa adesão (<50%)", baixa, "is-low") +
      '</div>';
  }

  /* ---------- Pacientes em foco ---------- */
  function prowMock(p) {
    return '<div class="prow">' +
      '<span class="avatar avatar--sm avatar--rosa">' + esc(p.ini) + '</span>' +
      '<div class="prow__info"><div class="prow__nome">' + esc(p.nome) + '</div>' +
        '<div class="prow__obj">' + esc(p.obj) + ' · atualizado ' + esc(p.ult) + '</div></div>' +
      '<div class="prow__prog"><span class="prow__pct">' + p.progresso + '%</span>' +
        '<div class="bar"><div class="bar__fill" style="width:' + p.progresso + '%"></div></div></div>' +
    '</div>';
  }
  function renderPacientesMock() {
    var wrap = el("pacientes"); if (!wrap) return;
    wrap.innerHTML = (D.pacientes || []).map(prowMock).join("");
  }
  function renderPacientesReal() {
    var wrap = el("pacientes"); if (!wrap) return;
    if (!pacientes.length) {
      wrap.innerHTML = '<div class="dash-empty"><p class="dash-empty__txt">Você ainda não tem pacientes cadastrados.</p>' +
        '<a class="btn btn--primary" href="pacientes.html">Adicionar paciente</a></div>';
      return;
    }
    // Prioriza quem precisa de atenção, depois menor adesão.
    var ord = pacientes.slice().sort(function (a, b) {
      var wa = a.status === "atencao" ? 0 : 1, wb = b.status === "atencao" ? 0 : 1;
      if (wa !== wb) return wa - wb;
      return (a.adesao || 0) - (b.adesao || 0);
    }).slice(0, 5);
    wrap.innerHTML = ord.map(function (p) {
      var low = p.adesao < 50 ? " is-low" : "";
      return '<a class="prow" href="prontuario.html?id=' + encodeURIComponent(p.id) + '" style="text-decoration:none;color:inherit">' +
        '<span class="avatar avatar--sm avatar--rosa">' + esc(p.ini) + '</span>' +
        '<div class="prow__info"><div class="prow__nome">' + esc(p.nome) + '</div>' +
          '<div class="prow__obj">' + esc(p.objetivo || "Sem objetivo definido") + '</div></div>' +
        '<div class="prow__prog"><span class="prow__pct">' + (p.adesao || 0) + '%</span>' +
          '<div class="bar"><div class="bar__fill' + low + '" style="width:' + (p.adesao || 0) + '%"></div></div></div>' +
      '</a>';
    }).join("");
  }

  /* ---------- Aniversariantes (sem data de nascimento na lista → honesto) ---------- */
  function renderAniversariantes() {
    var wrap = el("aniversariantes"); if (!wrap) return;
    wrap.innerHTML = '<div class="dash-empty" style="min-height:90px"><p class="dash-empty__txt">Sem aniversariantes hoje.</p></div>';
  }

  /* ---------- Pendências (derivadas do estado real) ---------- */
  function renderPendenciasMock() {
    var wrap = el("pendencias"); if (!wrap) return;
    wrap.innerHTML = (D.pendencias || []).map(function (t) {
      return '<div class="todo__item"><span class="todo__check"></span><div>' +
        '<div class="todo__txt">' + esc(t.texto) + '</div>' +
        '<div class="todo__prazo' + (t.urgente ? " is-urgente" : "") + '">' + (t.urgente ? "⚠ " : "") + 'Prazo: ' + esc(t.prazo) + '</div>' +
      '</div></div>';
    }).join("");
    bindTodos(wrap);
  }
  function renderPendenciasReal() {
    var wrap = el("pendencias"); if (!wrap) return;
    var itens = [];
    pacientes.filter(function (p) { return p.status === "atencao"; }).slice(0, 4).forEach(function (p) {
      itens.push({ texto: "Revisar plano de " + p.nome, urgente: (p.adesao || 0) < 40, id: p.id });
    });
    pacientes.filter(function (p) { return p.status === "inativo"; }).slice(0, 2).forEach(function (p) {
      itens.push({ texto: "Reativar contato com " + p.nome, urgente: false, id: p.id });
    });
    if (!itens.length) {
      wrap.innerHTML = '<div class="dash-empty" style="min-height:90px"><p class="dash-empty__txt">Nenhuma pendência. 🎉</p></div>';
      return;
    }
    wrap.innerHTML = itens.map(function (t) {
      return '<a class="todo__item" href="prontuario.html?id=' + encodeURIComponent(t.id) + '" style="text-decoration:none;color:inherit">' +
        '<span class="todo__check"></span><div>' +
        '<div class="todo__txt">' + esc(t.texto) + '</div>' +
        '<div class="todo__prazo' + (t.urgente ? " is-urgente" : "") + '">' + (t.urgente ? "⚠ prioridade" : "quando puder") + '</div>' +
      '</div></a>';
    }).join("");
  }
  function bindTodos(wrap) {
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

  /* ---------- Nútri AI (demo) ---------- */
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

  /* ---------- Navegação mobile ---------- */
  function initMobileNav() {
    var app = el("app");
    var toggle = el("menu-toggle");
    var scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }
})();
