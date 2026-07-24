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

  var ctx = { mode: "real", paciente: null, user: null, marcas: {} };

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
    return window.NutriPacientes.getAdesao(paciente.id)
      .then(function (marcas) { ctx.marcas = marcas || {}; })
      .catch(function () { ctx.marcas = {}; })
      .then(function () { boot(); });
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
    el("pane-treino").innerHTML = window.TreinoView ? window.TreinoView.portalHTML(p, ctx.marcas, ctx.mode === "preview") : "";
    el("pane-metas").innerHTML = window.MetasView ? window.MetasView.portalHTML(p, ctx.marcas, ctx.mode === "preview") : "";
    el("pane-evolucao").innerHTML = renderEvolucao(p);
    hidratarFotosPortal(p);
    el("pane-consultas").innerHTML = renderConsultas(p);

    // Abas
    el("portal-tabs").querySelectorAll(".ptab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-t")); });
    });

    applyFeatureGate(p);
    drawWeightChart(p);
    initChat();
    wireLogout();
  }

  // Mostra só as seções liberadas para este paciente (pacientes.portal_features).
  // O chat tem gate real de RLS; as demais são apenas ocultadas aqui.
  function applyFeatureGate(p) {
    var feats = Array.isArray(p.portalFeatures) ? p.portalFeatures : ["plano", "evolucao", "consultas", "chat"];
    // Treino e Metas não são features pagas: aparecem quando há conteúdo liberado.
    var temTreino = !!(p.treino && p.treino.publicado && (p.treino.blocos || []).length);
    var temMetas = !!(p.metas && p.metas.publicado && (p.metas.itens || []).some(function (i) { return (i.texto || "").trim(); }));
    var tabsWrap = el("portal-tabs");
    var visiveis = [];
    tabsWrap.querySelectorAll(".ptab").forEach(function (t) {
      var id = t.getAttribute("data-t");
      var on;
      if (id === "treino") on = temTreino;
      else if (id === "metas") on = temMetas;
      else on = feats.indexOf(id) >= 0;
      t.hidden = !on;
      if (on) visiveis.push(id);
    });
    tabsWrap.hidden = visiveis.length <= 1; // 0 ou 1 seção: nem mostra a barra de abas
    if (!visiveis.length) {
      el("portal").querySelectorAll(".portal-pane").forEach(function (pn) { pn.classList.remove("is-active"); });
      var pp = el("pane-plano");
      pp.classList.add("is-active");
      pp.innerHTML = '<div class="pcard"><div class="empty-state">Seu acesso ainda não tem seções liberadas. Fale com sua nutricionista.</div></div>';
      return;
    }
    // Se a aba ativa foi ocultada, ativa a primeira liberada.
    var ativo = tabsWrap.querySelector(".ptab.is-active");
    if (!ativo || ativo.hidden) switchTab(visiveis[0]);
  }

  function switchTab(id) {
    var root = el("portal");
    root.querySelectorAll(".ptab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-t") === id); });
    root.querySelectorAll(".portal-pane").forEach(function (pn) { pn.classList.toggle("is-active", pn.getAttribute("data-pane") === id); });
    if (id === "evolucao") drawWeightChart(ctx.paciente);
    if (id === "chat") { var box = el("chat-scroll"); if (box) box.scrollTop = box.scrollHeight; }
  }

  /* ---------- Meu plano ---------- */
  // Planos liberados pela nutri (flag publicado). Cai no formato antigo de plano único.
  function planosLiberados(p) {
    var pl = p.plano || {};
    if (Array.isArray(pl.planos)) return pl.planos.filter(function (x) { return x && x.publicado; });
    if ((pl.refeicoes || []).length) return [pl];
    return [];
  }
  function horaRefeicao(r) { return r.hora || r.horario || ""; }
  // Item pode ser string (formato antigo) ou objeto do construtor {alimento, medida, qtd, gramas}.
  function itemTexto(it) {
    if (it == null) return "";
    if (typeof it === "string") return it;
    var nome = it.alimento || it.nome || "";
    var q;
    if (it.medida && it.medida !== "grama") q = (it.qtd != null ? it.qtd + " " : "") + it.medida;
    else if (it.gramas != null) q = it.gramas + " g";
    else if (it.qtd != null) q = it.qtd + "";
    return nome + (q ? " — " + q : "");
  }

  function renderPlano(p) {
    var planos = planosLiberados(p);
    if (!planos.length) {
      return '<div class="pcard"><div class="empty-state">Seu plano alimentar ainda não foi publicado. ' +
        'Assim que sua nutricionista liberar, ele aparece aqui.</div></div>';
    }
    var readonly = ctx.mode === "preview";
    var multi = planos.length > 1;
    var corpo = planos.map(function (plano, pi) {
      var refs = plano.refeicoes || [];
      // Só o 1º plano liberado é "interativo" (checkboxes + adesão), casando com a
      // adesão que a nutri acompanha (chaves ri:ii sobre o plano espelhado no topo).
      var interativo = pi === 0;
      var head;
      if (interativo) {
        var pct = adesaoPct(p);
        head = '<div class="pcard pcard--head"><h2>' + esc(plano.titulo || "Plano alimentar") + '</h2>' +
          (plano.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(plano.atualizadoEm) + '</span>' : '') +
          '<div class="plano-adesao"><div class="plano-adesao__bar"><span id="adesao-fill" style="width:' + pct + '%"></span></div>' +
            '<span class="plano-adesao__pct" id="adesao-pct">' + pct + '% seguido</span></div>' +
          '<p class="pcard__hint">Marque o que você seguiu — sua nutricionista acompanha sua adesão por aqui.</p></div>';
      } else {
        head = '<div class="pcard pcard--head"><h2>' + esc(plano.titulo || "Plano alimentar") + '</h2>' +
          (plano.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(plano.atualizadoEm) + '</span>' : '') +
          '<p class="pcard__hint">Plano adicional liberado pela sua nutricionista.</p></div>';
      }
      var body = refs.map(function (r, ri) {
        var itens = (r.itens || []).map(function (it, ii) {
          var texto = itemTexto(it);
          if (!interativo) return '<li class="meal-item"><span>' + esc(texto) + '</span></li>';
          var key = ri + ":" + ii;
          var done = checkGet(key);
          return '<li class="meal-item"><label><input type="checkbox" data-check="' + esc(key) + '"' +
            (done ? " checked" : "") + (readonly ? " disabled" : "") + '> ' +
            '<span>' + esc(texto) + '</span></label></li>';
        }).join("");
        var hora = horaRefeicao(r);
        return '<div class="pcard meal"><div class="meal__head"><span class="meal__nome">' + esc(r.nome) + '</span>' +
          (hora ? '<span class="meal__hora">' + esc(hora) + '</span>' : '') + '</div>' +
          '<ul class="meal__list">' + itens + '</ul></div>';
      }).join("");
      return (multi ? '<div class="plano-sep">' + esc(plano.titulo || "Plano alimentar") + '</div>' : '') + head + body;
    }).join("");
    // Lista de compras (uma só, do 1º plano liberado) + dicas de marmita.
    var compras = window.ListaCompras ? window.ListaCompras.htmlPortal(planos[0], ctx.marcas, readonly) : "";
    return corpo + compras;
  }

  // Marcação do plano sincronizada no banco (tabela plano_adesao, gravada pelo
  // próprio paciente via RLS). A nutri só lê. Salvamento é debounced.
  function checkGet(key) { return ctx.marcas[key] === true; }
  var saveTimer = null;
  function checkSet(key, val) {
    if (val) ctx.marcas[key] = true; else delete ctx.marcas[key];
    if (ctx.mode === "preview") return; // nutri em preview não grava (e RLS bloquearia)
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      window.NutriPacientes.setAdesao(ctx.paciente.id, ctx.marcas).catch(function () {});
    }, 500);
  }

  // % de itens do plano marcados como seguidos (só conta itens que ainda existem).
  function adesaoPct(p) {
    var refs = (p.plano && p.plano.refeicoes) || [];
    var total = 0, feitos = 0;
    refs.forEach(function (r, ri) {
      (r.itens || []).forEach(function (_it, ii) { total++; if (ctx.marcas[ri + ":" + ii] === true) feitos++; });
    });
    return total ? Math.round(feitos * 100 / total) : 0;
  }
  function refreshAdesaoUI() {
    var pct = adesaoPct(ctx.paciente);
    var fill = el("adesao-fill"), lbl = el("adesao-pct");
    if (fill) fill.style.width = pct + "%";
    if (lbl) lbl.textContent = pct + "% seguido";
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
      '</div>' +
      renderFotosEvolucao(p);
  }
  function stat(l, v) { return '<div class="pstat"><div class="pstat__lbl">' + esc(l) + '</div><div class="pstat__val">' + esc(v) + '</div></div>'; }

  /* Fotos de evolução que a nutri enviou (só leitura no portal).
     Os arquivos ficam num bucket privado; aqui resolvemos URLs assinadas
     (o RLS libera porque o paciente é dono da ficha). Fotos antigas em
     base64 (f.data) continuam funcionando. */
  var FOTO_LBL = { frente: "Frente", lado: "Lado", costas: "Costas" };
  var portalSigned = {}; // path -> signedUrl
  function fmtDataFoto(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  function fotoUrlPortal(f) { return (f.path && portalSigned[f.path]) || f.data || ""; }
  function renderFotosEvolucao(p) {
    var fotos = ((p.antropometria || {}).fotos || []).slice()
      .sort(function (a, b) { return String(b.dataISO || "").localeCompare(String(a.dataISO || "")); });
    if (!fotos.length) return "";
    var cards = fotos.map(function (f) {
      var tipo = FOTO_LBL[f.tipo] || "Foto";
      var meta = [tipo];
      if (f.peso != null && f.peso !== "") meta.push(String(f.peso).replace(".", ",") + " kg");
      var src = fotoUrlPortal(f);
      return '<figure class="evo-card' + (src ? '' : ' is-loading') + '">' +
        '<button type="button" class="evo-card__img" data-pfoto="' + esc(f.id) + '" aria-label="Ampliar foto">' +
          '<img data-foto-img="' + esc(f.id) + '" ' + (src ? 'src="' + esc(src) + '"' : '') + ' alt="Foto de evolução — ' + esc(tipo) + '" loading="lazy" /></button>' +
        '<figcaption class="evo-card__cap">' +
          '<span class="evo-card__date">' + esc(fmtDataFoto(f.dataISO)) + '</span>' +
          '<span class="evo-card__meta">' + esc(meta.join(" · ")) + '</span>' +
          (f.obs ? '<span class="evo-card__obs">' + esc(f.obs) + '</span>' : '') +
        '</figcaption></figure>';
    }).join("");
    return '<div class="pcard"><h2 class="pcard__title">Sua evolução em fotos</h2>' +
      '<p class="card__sub" style="margin:-4px 0 12px">Registros que sua nutricionista adicionou. Toque para ampliar.</p>' +
      '<div class="evo-grid">' + cards + '</div></div>';
  }
  // Busca as URLs assinadas e preenche as imagens do painel de evolução.
  function hidratarFotosPortal(p) {
    if (!window.NutriPacientes || !window.NutriPacientes.assinarFotosEvolucao) return;
    var fotos = (p.antropometria || {}).fotos || [];
    var pend = fotos.filter(function (f) { return f.path && !portalSigned[f.path]; });
    if (!pend.length) return;
    window.NutriPacientes.assinarFotosEvolucao(pend.map(function (f) { return f.path; })).then(function (mapa) {
      Object.keys(mapa).forEach(function (k) { portalSigned[k] = mapa[k]; });
      pend.forEach(function (f) {
        var u = fotoUrlPortal(f); if (!u) return;
        var img = document.querySelector('[data-foto-img="' + f.id + '"]');
        if (img) { img.src = u; var card = img.closest(".evo-card"); if (card) card.classList.remove("is-loading"); }
      });
    }).catch(function () {});
  }
  // Lightbox das fotos no portal (delegação global).
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-pfoto]");
    if (!btn || !ctx.paciente) return;
    var id = btn.getAttribute("data-pfoto");
    var f = (((ctx.paciente.antropometria || {}).fotos) || []).filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    var tipo = FOTO_LBL[f.tipo] || "Foto";
    var cap = [fmtDataFoto(f.dataISO), tipo];
    if (f.peso != null && f.peso !== "") cap.push(String(f.peso).replace(".", ",") + " kg");
    var ov = document.createElement("div");
    ov.className = "evo-lb";
    ov.innerHTML = '<button class="evo-lb__close" aria-label="Fechar">✕</button>' +
      '<figure class="evo-lb__fig"><img src="' + esc(fotoUrlPortal(f)) + '" alt="Foto de evolução ampliada" />' +
      '<figcaption>' + esc(cap.join(" · ")) + (f.obs ? " — " + esc(f.obs) : "") + '</figcaption></figure>';
    function fechar() { ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(ev) { if (ev.key === "Escape") fechar(); }
    ov.addEventListener("click", function (ev) { if (ev.target === ov || ev.target.closest(".evo-lb__close")) fechar(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
  });

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
      '<stop offset="0%" stop-color="#840B55" stop-opacity="0.20"/><stop offset="100%" stop-color="#840B55" stop-opacity="0"/></linearGradient></defs>' +
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
    refreshAdesaoUI();
  });
})();
