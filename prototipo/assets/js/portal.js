/* ============================================================
   PORTAL DO PACIENTE — visão do próprio acompanhamento.
   Dois modos:
     • real     — um paciente logado (profiles.tipo = 'paciente'),
                  vê e edita a própria conversa. RLS filtra tudo.
     • preview  — a nutri logada abre ?preview=<paciente_id> para
                  ver "como o paciente veria" (somente leitura no chat).
   Requer supabase-client.js + pacientes-db.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  var ctx = { mode: "real", paciente: null, user: null };

  window.NutriDBReady.then(function (c) {
    return c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return null; }
      ctx.user = r.data.session.user;
      var previewId = new URLSearchParams(window.location.search).get("preview");

      return c.from("profiles").select("tipo,nome").maybeSingle().then(function (pr) {
        var tipo = (pr.data && pr.data.tipo) || "nutri";
        if (tipo === "nutri") {
          if (!previewId) { window.location.replace("dashboard.html"); return null; }
          ctx.mode = "preview";
          return window.NutriPacientes.get(previewId);
        }
        // paciente real: a própria ficha (RLS devolve só ela)
        ctx.mode = "real";
        return window.NutriPacientes.list().then(function (rows) { return rows[0] || null; });
      });
    });
  }).then(function (paciente) {
    if (paciente === undefined) return;
    if (!paciente) { showNoData(); return; }
    ctx.paciente = paciente;
    boot();
  }).catch(function () {
    el("portal-loading").textContent = "Não foi possível carregar. Verifique a conexão e recarregue.";
  });

  function showNoData() {
    el("portal-loading").innerHTML = "Ainda não há um acompanhamento vinculado a esta conta. " +
      "Fale com sua nutricionista. <br><br><button class='btn btn--outline' data-logout type='button'>Sair</button>";
    wireLogout();
  }

  function boot() {
    var p = ctx.paciente;
    el("portal-loading").hidden = true;
    el("portal").hidden = false;
    if (ctx.mode === "preview") el("preview-bar").hidden = false;

    var primeiro = (p.nome || "").split(/\s+/)[0] || "";
    el("portal-hi").textContent = "Olá, " + primeiro;
    el("portal-avatar").textContent = p.ini || "?";
    el("portal-name").textContent = p.nome || "—";
    el("portal-sub").textContent = (p.objetivo ? "Objetivo: " + p.objetivo + " · " : "") +
      "Próxima consulta: " + (p.proxConsulta || "a agendar");

    el("pane-plano").innerHTML = renderPlano(p);
    el("pane-evolucao").innerHTML = renderEvolucao(p);
    el("pane-consultas").innerHTML = renderConsultas(p);

    // Abas
    el("portal-tabs").querySelectorAll(".ptab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-t")); });
    });

    drawWeightChart(p);
    initChat();
    wireLogout();
  }

  function switchTab(id) {
    var root = el("portal");
    root.querySelectorAll(".ptab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-t") === id); });
    root.querySelectorAll(".portal-pane").forEach(function (pn) { pn.classList.toggle("is-active", pn.getAttribute("data-pane") === id); });
    if (id === "evolucao") drawWeightChart(ctx.paciente);
    if (id === "chat") { var box = el("chat-scroll"); if (box) box.scrollTop = box.scrollHeight; }
  }

  /* ---------- Meu plano ---------- */
  function renderPlano(p) {
    var plano = p.plano || {};
    var refs = plano.refeicoes || [];
    if (!refs.length) {
      return '<div class="pcard"><div class="empty-state">Seu plano alimentar ainda não foi publicado. ' +
        'Assim que sua nutricionista liberar, ele aparece aqui.</div></div>';
    }
    var pid = p.id;
    var head = '<div class="pcard pcard--head"><h2>' + esc(plano.titulo || "Plano alimentar") + '</h2>' +
      (plano.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(plano.atualizadoEm) + '</span>' : '') +
      '<p class="pcard__hint">Marque o que você seguiu — é só pra seu acompanhamento pessoal.</p></div>';
    var body = refs.map(function (r, ri) {
      var itens = (r.itens || []).map(function (it, ii) {
        var key = pid + ":" + ri + ":" + ii;
        var done = checkGet(key);
        return '<li class="meal-item"><label><input type="checkbox" data-check="' + esc(key) + '"' + (done ? " checked" : "") + '> ' +
          '<span>' + esc(it) + '</span></label></li>';
      }).join("");
      return '<div class="pcard meal"><div class="meal__head"><span class="meal__nome">' + esc(r.nome) + '</span>' +
        (r.horario ? '<span class="meal__hora">' + esc(r.horario) + '</span>' : '') + '</div>' +
        '<ul class="meal__list">' + itens + '</ul></div>';
    }).join("");
    return head + body;
  }

  // Marcação do plano: persistência local por paciente (v1). Sincronizar a adesão
  // com a nutri é passo futuro (evita o paciente escrever em campos clínicos).
  function checkKey() { return "nutriplat.plano." + (ctx.paciente ? ctx.paciente.id : "x"); }
  function checkGet(key) {
    try { return (JSON.parse(localStorage.getItem(checkKey()) || "{}"))[key] === true; } catch (e) { return false; }
  }
  function checkSet(key, val) {
    try {
      var o = JSON.parse(localStorage.getItem(checkKey()) || "{}");
      o[key] = val; localStorage.setItem(checkKey(), JSON.stringify(o));
    } catch (e) {}
  }

  /* ---------- Evolução ---------- */
  function renderEvolucao(p) {
    var dif = (p.pesoAtual != null && p.pesoInicial != null) ? (p.pesoAtual - p.pesoInicial) : null;
    var difTxt = dif == null ? "—" : (dif <= 0 ? "▼ " : "▲ ") + Math.abs(dif).toFixed(1) + " kg";
    return '<div class="pcard"><div class="chart" id="weight-chart"></div></div>' +
      '<div class="portal-stats">' +
        stat("Peso atual", (p.pesoAtual != null ? p.pesoAtual + " kg" : "—")) +
        stat("Variação total", difTxt) +
        stat("Meta", (p.meta != null ? p.meta + " kg" : "Sem meta")) +
        stat("IMC", (p.imc != null ? String(p.imc) : "—")) +
      '</div>';
  }
  function stat(l, v) { return '<div class="pstat"><div class="pstat__lbl">' + esc(l) + '</div><div class="pstat__val">' + esc(v) + '</div></div>'; }

  function drawWeightChart(p) {
    var host = el("weight-chart");
    if (!host || !p || !p.evolucao) return;
    var pts = p.evolucao.peso || [], labels = p.evolucao.labels || [];
    if (pts.length < 2) { host.innerHTML = '<div class="empty-state">Ainda não há histórico de peso suficiente para o gráfico.</div>'; return; }
    var W = 520, H = 210, padX = 18, padY = 26;
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
      return '<g><circle class="chart__pt" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.2) + '"></circle>' +
        '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (y(v) - 10).toFixed(1) + '" text-anchor="middle">' + v + '</text></g>';
    }).join("");
    var lbls = labels.map(function (l, i) {
      return '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + esc(l) + '</text>';
    }).join("");
    host.innerHTML = '<div class="chart__head"><span class="chart__big">' + pts[pts.length - 1] + ' kg</span>' +
      '<span class="card__sub">peso · ' + esc(labels[0] || "") + '–' + esc(labels[labels.length - 1] || "") + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução de peso">' +
      '<defs><linearGradient id="gradWineP" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#7B284C" stop-opacity="0.20"/><stop offset="100%" stop-color="#7B284C" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="chart__area" style="fill:url(#gradWineP)" d="' + area + '"></path>' +
      '<path class="chart__line" d="' + line + '"></path>' + dots + lbls + '</svg>';
  }

  /* ---------- Consultas ---------- */
  function renderConsultas(p) {
    var prox = '<div class="pcard pcard--next"><span class="pcard__meta">Próxima consulta</span>' +
      '<div class="next-big">' + esc(p.proxConsulta || "a agendar") + '</div></div>';
    var hist = (p.consultas || []);
    if (!hist.length) return prox + '<div class="pcard"><div class="empty-state">Sem consultas registradas ainda.</div></div>';
    var tl = '<div class="pcard"><h2 class="pcard__title">Histórico</h2><div class="timeline">' + hist.map(function (c) {
      return '<div class="tl-item"><div class="tl-date">' + esc(c.data) + '</div>' +
        '<div class="tl-tipo">' + esc(c.tipo) + '</div>' + (c.nota ? '<p class="tl-nota">' + esc(c.nota) + '</p>' : '') + '</div>';
    }).join("") + '</div></div>';
    return prox + tl;
  }

  /* ---------- Chat ---------- */
  function initChat() {
    var readonly = ctx.mode === "preview";
    el("pane-chat").innerHTML =
      '<div class="pcard chat">' +
        '<div class="chat__scroll" id="chat-scroll"><div class="empty-state">Carregando mensagens…</div></div>' +
        (readonly
          ? '<div class="chat__note">Pré-visualização: no acesso real, o paciente escreve aqui.</div>'
          : '<form class="chat__form" id="chat-form">' +
              '<input type="text" id="chat-input" placeholder="Escreva uma mensagem para sua nutricionista…" autocomplete="off" />' +
              '<button class="btn btn--primary" type="submit">Enviar</button></form>') +
      '</div>';
    loadChat();
    if (!readonly) {
      el("chat-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = el("chat-input");
        var txt = inp.value.trim();
        if (!txt) return;
        inp.value = ""; inp.disabled = true;
        window.NutriPacientes.sendMensagem(ctx.paciente.id, "paciente", txt).then(function () {
          inp.disabled = false; inp.focus(); loadChat();
        }).catch(function () {
          inp.disabled = false; inp.value = txt;
          alert("Não foi possível enviar. Tente novamente.");
        });
      });
    }
  }

  function loadChat() {
    window.NutriPacientes.listMensagens(ctx.paciente.id).then(function (msgs) {
      var box = el("chat-scroll");
      if (!box) return;
      if (!msgs.length) { box.innerHTML = '<div class="empty-state">Nenhuma mensagem ainda. Diga um oi 👋</div>'; return; }
      box.innerHTML = msgs.map(function (m) {
        var mine = m.autor === "paciente";
        return '<div class="msg ' + (mine ? "msg--me" : "msg--nutri") + '">' +
          '<div class="msg__bubble">' + esc(m.corpo) + '</div>' +
          '<div class="msg__time">' + fmtTime(m.created_at) + (mine ? "" : " · nutri") + '</div></div>';
      }).join("");
      box.scrollTop = box.scrollHeight;
    }).catch(function () {
      var box = el("chat-scroll"); if (box) box.innerHTML = '<div class="empty-state">Não foi possível carregar as mensagens.</div>';
    });
  }

  function fmtTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  /* ---------- Logout ---------- */
  function wireLogout() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-logout]");
      if (!t) return;
      e.preventDefault();
      window.NutriDBReady.then(function (c) {
        return c.auth.signOut();
      }).then(function () { window.location.replace("index.html"); });
    });
  }

  /* Marcação do plano (delegação) */
  document.addEventListener("change", function (e) {
    var cb = e.target.closest && e.target.closest("[data-check]");
    if (!cb) return;
    checkSet(cb.getAttribute("data-check"), cb.checked);
  });
})();
