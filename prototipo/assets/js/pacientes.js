/* ============================================================
   PACIENTES (Tela 3) — lista/busca/filtros + perfil com abas.
   Depende de pacientes-data.js (window.PAC_DATA).
   ============================================================ */
(function () {
  "use strict";

  var P = { pacientes: [], filtros: (window.PAC_DATA && window.PAC_DATA.filtros) || ["Todos", "Ativos", "Atenção", "Inativos"] };
  var statusMap = { ativo: "Ativo", atencao: "Atenção", inativo: "Inativo" };

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  var state = { filtro: "Todos", busca: "", tab: "resumo", current: null, load: "loading" };

  document.addEventListener("DOMContentLoaded", function () {
    renderFilters();
    renderList();
    initSearch();
    initMobileNav();
    initCrud();
    loadPatients();
  });

  /* ---------- Carga do banco (Supabase) ---------- */
  function loadPatients() {
    if (!window.NutriPacientes) { state.load = "error"; renderList(); return; }
    state.load = "loading"; renderList();
    window.NutriPacientes.list().then(function (rows) {
      P.pacientes = rows;
      state.load = "ready";
      renderFilters(); renderList();
    }).catch(function () {
      state.load = "error";
      renderList();
    });
  }

  /* ---------- Filtros (status) ---------- */
  function matchFiltro(p) {
    if (state.filtro === "Todos") return true;
    return statusMap[p.status] === state.filtro || (state.filtro === "Ativos" && p.status === "ativo")
      || (state.filtro === "Atenção" && p.status === "atencao")
      || (state.filtro === "Inativos" && p.status === "inativo");
  }
  function countFor(f) {
    if (f === "Todos") return P.pacientes.length;
    var key = f === "Ativos" ? "ativo" : f === "Atenção" ? "atencao" : f === "Inativos" ? "inativo" : null;
    return P.pacientes.filter(function (p) { return p.status === key; }).length;
  }

  function renderFilters() {
    var wrap = el("filters");
    if (!wrap) return;
    wrap.innerHTML = P.filtros.map(function (f) {
      return '<button class="chip" type="button" data-f="' + esc(f) + '" aria-pressed="' + (f === state.filtro) + '">' +
        esc(f) + ' <span class="count">' + countFor(f) + '</span></button>';
    }).join("");
    wrap.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        state.filtro = c.getAttribute("data-f");
        renderFilters(); renderList();
      });
    });
  }

  /* ---------- Lista ---------- */
  function visiblePatients() {
    var q = state.busca.trim().toLowerCase();
    return P.pacientes.filter(matchFiltro).filter(function (p) {
      return !q || p.nome.toLowerCase().indexOf(q) > -1 || (p.objetivo || "").toLowerCase().indexOf(q) > -1;
    });
  }

  function renderList() {
    var wrap = el("plist2");
    if (!wrap) return;
    var rows = visiblePatients();
    var tot = el("pac-total");
    if (tot) tot.textContent = rows.length + " de " + P.pacientes.length + " paciente" + (P.pacientes.length === 1 ? "" : "s");
    if (state.load === "loading") {
      wrap.innerHTML = '<div class="empty-state">Carregando pacientes…</div>';
      return;
    }
    if (state.load === "error") {
      wrap.innerHTML = '<div class="empty-state">Não foi possível carregar os pacientes. Verifique a conexão e ' +
        '<button class="link-btn" id="retry-load" type="button">tente de novo</button>.</div>';
      var rb = el("retry-load"); if (rb) rb.addEventListener("click", loadPatients);
      return;
    }
    if (!rows.length) {
      if (!P.pacientes.length) {
        wrap.innerHTML = '<div class="empty-state">Você ainda não tem pacientes.' +
          '<div class="empty-state__actions">' +
          '<button class="btn btn--primary" id="empty-novo" type="button">+ Cadastrar o primeiro</button>' +
          '<button class="btn btn--outline" id="empty-seed" type="button">Carregar exemplos</button>' +
          '</div></div>';
        var en = el("empty-novo"); if (en) en.addEventListener("click", function () { openForm(null); });
        var es = el("empty-seed"); if (es) es.addEventListener("click", seedExamples);
      } else {
        wrap.innerHTML = '<div class="empty-state">Nenhum paciente encontrado para este filtro/busca.</div>';
      }
      return;
    }
    wrap.innerHTML = rows.map(function (p) {
      var low = p.adesao < 50 ? " is-low" : "";
      return '' +
        '<div class="prow2" data-id="' + p.id + '" role="button" tabindex="0">' +
          '<div class="pcell-who">' +
            '<span class="avatar avatar--sm avatar--rosa">' + esc(p.ini) + '</span>' +
            '<div><div class="pcell-nome">' + esc(p.nome) + '</div>' +
            '<div class="pcell-meta">' + p.idade + ' anos · ' + (p.sexo === "F" ? "Feminino" : "Masculino") + '</div></div>' +
          '</div>' +
          '<div class="pcell-obj">' + esc(p.objetivo) + '</div>' +
          '<div class="pcell-status"><span class="pill pill-' + p.status + '">' + statusMap[p.status] + '</span></div>' +
          '<div class="pcell-adesao"><div class="bar"><div class="bar__fill' + low + '" style="width:' + p.adesao + '%"></div></div>' +
            '<span class="val">' + p.adesao + '%</span></div>' +
          '<div class="pcell-go">›</div>' +
        '</div>';
    }).join("");
    wrap.querySelectorAll(".prow2").forEach(function (r) {
      var open = function () { openProfile(r.getAttribute("data-id")); };
      r.addEventListener("click", open);
      r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  function initSearch() {
    var inp = el("search-pac");
    if (!inp) return;
    inp.addEventListener("input", function () { state.busca = inp.value; renderList(); });
  }

  /* ---------- Perfil ---------- */
  function openProfile(id) {
    var p = P.pacientes.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    state.current = p; state.tab = "resumo";
    renderProfile(p);
    document.getElementById("app").classList.add("is-profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeProfile() {
    document.getElementById("app").classList.remove("is-profile");
  }

  function renderProfile(p) {
    var wrap = el("profile");
    var metaMeta = (p.meta != null ? "Meta " + p.meta + " kg" : "Sem meta de peso");
    var hint = p.adesao >= 70 ? '<span class="delta delta--up">Boa adesão</span>'
             : p.adesao >= 50 ? '<span class="delta delta--neutro">Adesão média</span>'
             : '<span class="delta delta--down">Adesão baixa</span>';
    var deltaPeso = (p.pesoAtual - p.pesoInicial);
    var deltaTxt = (deltaPeso <= 0 ? "▼ " : "▲ ") + Math.abs(deltaPeso).toFixed(1) + " kg";
    var deltaCls = deltaPeso <= 0 ? "delta--up" : "delta--neutro";

    wrap.innerHTML = '' +
      '<button class="back-link" id="back-list">‹ Voltar para a lista</button>' +

      '<div class="card" style="padding:var(--sp-5)">' +
        '<div class="phead">' +
          '<span class="phead__avatar">' + esc(p.ini) + '</span>' +
          '<div class="phead__id">' +
            '<h1 class="phead__name">' + esc(p.nome) + ' <span class="pill pill-' + p.status + '">' + statusMap[p.status] + '</span></h1>' +
            '<p class="phead__meta">' + p.idade + ' anos · ' + (p.sexo === "F" ? "Feminino" : "Masculino") +
              ' · ' + esc(p.objetivo) + ' · ' + esc(p.contato.cidade) + '</p>' +
            '<div class="phead__tags">' + (p.tags || []).map(function (t) { return '<span class="mini-tag">' + esc(t) + '</span>'; }).join("") + '</div>' +
          '</div>' +
          '<div class="phead__actions">' +
            '<button class="btn btn--ghost" id="pac-edit" type="button">✏ Editar</button>' +
            '<button class="btn btn--ghost btn--danger" id="pac-del" type="button">🗑 Excluir</button>' +
            '<a class="btn btn--primary" href="prontuario.html">📋 Abrir prontuário</a>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pstats">' +
        pstat("Peso atual", p.pesoAtual + '<small> kg</small>', '<span class="delta ' + deltaCls + '">' + deltaTxt + '</span>') +
        pstat("IMC", p.imc + '', '<span class="pstat__hint" style="color:var(--texto-sutil)">' + imcClasse(p.imc) + '</span>') +
        pstat("Meta", (p.meta != null ? p.meta + '<small> kg</small>' : '—'), '<span class="pstat__hint" style="color:var(--texto-sutil)">' + esc(metaMeta) + '</span>') +
        pstat("Adesão", p.adesao + '<small>%</small>', hint) +
      '</div>' +

      '<div class="card" style="padding:0">' +
        '<div class="tabs" id="tabs" style="padding:0 var(--sp-4)">' +
          tabBtn("resumo", "Resumo") + tabBtn("evolucao", "Evolução") + tabBtn("consultas", "Consultas") +
          tabBtn("prescricoes", "Prescrições") + tabBtn("exames", "Exames") +
        '</div>' +
        '<div style="padding:var(--sp-5)">' +
          pane("resumo", paneResumo(p)) +
          pane("evolucao", paneEvolucao(p)) +
          pane("consultas", paneConsultas(p)) +
          pane("prescricoes", paneLista(p.prescricoes, "🥗", "Nenhuma prescrição registrada.")) +
          pane("exames", paneLista(p.exames, "🧪", "Nenhum exame registrado.")) +
        '</div>' +
      '</div>';

    el("back-list").addEventListener("click", closeProfile);
    el("pac-edit").addEventListener("click", function () { openForm(p); });
    el("pac-del").addEventListener("click", function () { confirmDelete(p); });
    wrap.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-t")); });
    });
    drawWeightChart(p);
  }

  function pstat(lbl, val, hint) {
    return '<div class="pstat"><div class="pstat__lbl">' + lbl + '</div><div class="pstat__val">' + val + '</div><div class="pstat__hint">' + hint + '</div></div>';
  }
  function tabBtn(id, label) { return '<button class="tab' + (id === "resumo" ? " is-active" : "") + '" data-t="' + id + '">' + label + '</button>'; }
  function pane(id, html) { return '<div class="tabpane' + (id === "resumo" ? " is-active" : "") + '" data-pane="' + id + '">' + html + '</div>'; }

  function switchTab(id) {
    state.tab = id;
    var wrap = el("profile");
    wrap.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-t") === id); });
    wrap.querySelectorAll(".tabpane").forEach(function (pn) { pn.classList.toggle("is-active", pn.getAttribute("data-pane") === id); });
    if (id === "evolucao") drawWeightChart(state.current);
  }

  /* ---------- Conteúdo das abas ---------- */
  function paneResumo(p) {
    return '<div class="pgrid">' +
      '<div>' +
        block("Anamnese", p.anamnese) +
        block("Restrições & alergias", p.restricoes) +
        block("Observações clínicas", p.observacoes) +
      '</div>' +
      '<div>' +
        '<div class="info-block"><p class="info-block__label">Contato</p>' +
          '<p class="info-block__text">📞 ' + esc(p.contato.tel) + '<br>✉ ' + esc(p.contato.email) + '<br>📍 ' + esc(p.contato.cidade) + '</p></div>' +
        '<div class="info-block"><p class="info-block__label">Agenda</p>' +
          '<p class="info-block__text">Última consulta: <strong>' + esc(p.ultConsulta) + '</strong><br>Próxima: <strong>' + esc(p.proxConsulta) + '</strong></p></div>' +
        '<div class="info-block"><p class="info-block__label">Antropometria</p>' +
          '<p class="info-block__text">Altura: ' + p.altura.toFixed(2) + ' m<br>Peso inicial: ' + p.pesoInicial + ' kg → atual: <strong>' + p.pesoAtual + ' kg</strong></p></div>' +
      '</div>' +
    '</div>';
  }
  function block(label, text) { return '<div class="info-block"><p class="info-block__label">' + label + '</p><p class="info-block__text">' + esc(text) + '</p></div>'; }

  function paneEvolucao(p) {
    return '<div class="pgrid">' +
      '<div><div class="chart" id="weight-chart"></div></div>' +
      '<div>' +
        '<div class="info-block"><p class="info-block__label">Resumo da evolução</p>' +
        '<p class="info-block__text">Variação total: <strong>' + (p.pesoAtual - p.pesoInicial).toFixed(1) + ' kg</strong><br>' +
        'Peso atual: <strong>' + p.pesoAtual + ' kg</strong>' + (p.meta != null ? ' · Meta: ' + p.meta + ' kg' : '') + '<br>' +
        'IMC atual: <strong>' + p.imc + '</strong> (' + imcClasse(p.imc) + ')</p></div>' +
      '</div>' +
    '</div>';
  }

  function paneConsultas(p) {
    if (!p.consultas || !p.consultas.length) return '<div class="empty-state">Sem consultas registradas.</div>';
    return '<div class="timeline">' + p.consultas.map(function (c) {
      return '<div class="tl-item"><div class="tl-date">' + esc(c.data) + '</div>' +
        '<div class="tl-tipo">' + esc(c.tipo) + '</div><p class="tl-nota">' + esc(c.nota) + '</p></div>';
    }).join("") + '</div>';
  }

  function paneLista(items, ico, vazio) {
    if (!items || !items.length) return '<div class="empty-state">' + vazio + '</div>';
    return '<div class="ilist">' + items.map(function (it) {
      return '<div class="iitem"><span class="iitem__ico">' + ico + '</span>' +
        '<div class="iitem__info"><div class="iitem__title">' + esc(it.titulo) + '</div>' +
        '<div class="iitem__date">' + esc(it.data) + '</div></div>' +
        '<span class="istatus is-' + esc(it.status) + '">' + esc(it.status) + '</span></div>';
    }).join("") + '</div>';
  }

  /* ---------- Gráfico de peso (SVG, mesma técnica do dashboard) ---------- */
  function drawWeightChart(p) {
    var host = el("weight-chart");
    if (!host || !p) return;
    var pts = p.evolucao.peso, labels = p.evolucao.labels;
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
      '<span class="card__sub">peso · ' + esc(labels[0]) + '–' + esc(labels[labels.length - 1]) + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução de peso">' +
      '<defs><linearGradient id="gradWine2" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#7B284C" stop-opacity="0.20"/><stop offset="100%" stop-color="#7B284C" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="chart__area" style="fill:url(#gradWine2)" d="' + area + '"></path>' +
      '<path class="chart__line" d="' + line + '"></path>' + dots + lbls + '</svg>';
  }

  function imcClasse(imc) {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Eutrófico";
    if (imc < 30) return "Sobrepeso";
    return "Obesidade";
  }

  /* ---------- Navegação mobile (reaproveita do dashboard) ---------- */
  function initMobileNav() {
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  /* ============================================================
     CRUD — cadastro/edição/exclusão de pacientes (Supabase).
     ============================================================ */
  function initCrud() {
    var novo = el("btn-novo-pac");
    if (novo) novo.addEventListener("click", function () { openForm(null); });
  }

  function seedExamples() {
    if (!window.NutriPacientes) return;
    var btn = el("empty-seed");
    if (btn) { btn.disabled = true; btn.textContent = "Carregando…"; }
    window.NutriPacientes.seedExamples().then(function () {
      loadPatients();
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = "Carregar exemplos"; }
      alert("Não foi possível carregar os exemplos. Tente novamente.");
    });
  }

  function confirmDelete(p) {
    if (!window.confirm('Excluir o paciente "' + p.nome + '"? Esta ação não pode ser desfeita.')) return;
    window.NutriPacientes.remove(p.id).then(function () {
      closeProfile();
      loadPatients();
    }).catch(function () { alert("Não foi possível excluir. Tente novamente."); });
  }

  /* ---------- Modal de formulário ---------- */
  var formOverlay = null;

  function field(label, name, val, opts) {
    opts = opts || {};
    var v = esc(val == null ? "" : val);
    var input;
    if (opts.type === "textarea") {
      input = '<textarea name="' + name + '" rows="' + (opts.rows || 2) + '">' + v + '</textarea>';
    } else if (opts.type === "select") {
      input = '<select name="' + name + '">' + opts.options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(val) === String(o.v) ? " selected" : "") + '>' + esc(o.l) + '</option>';
      }).join("") + '</select>';
    } else {
      input = '<input type="' + (opts.type || "text") + '" name="' + name + '" value="' + v + '"' +
        (opts.type === "number" ? ' step="' + (opts.step || "any") + '"' : "") +
        (opts.required ? " required" : "") + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") + ' />';
    }
    return '<label class="pf-field' + (opts.wide ? " pf-field--wide" : "") + '"><span>' + esc(label) + '</span>' + input + '</label>';
  }

  function openForm(p) {
    var edit = !!p;
    p = p || {};
    var c = p.contato || {};
    if (formOverlay) formOverlay.remove();

    formOverlay = document.createElement("div");
    formOverlay.className = "pf-overlay";
    formOverlay.innerHTML =
      '<div class="pf-modal" role="dialog" aria-modal="true" aria-label="' + (edit ? "Editar paciente" : "Novo paciente") + '">' +
        '<div class="pf-modal__head"><h3>' + (edit ? "Editar paciente" : "Novo paciente") + '</h3>' +
          '<button class="pf-close" type="button" aria-label="Fechar">✕</button></div>' +
        '<form class="pf-form" id="pf-form">' +
          '<p class="pf-msg" hidden></p>' +
          '<div class="pf-grid">' +
            field("Nome completo", "nome", p.nome, { required: true, wide: true }) +
            field("Idade", "idade", p.idade, { type: "number", step: "1" }) +
            field("Sexo", "sexo", p.sexo || "F", { type: "select", options: [{ v: "F", l: "Feminino" }, { v: "M", l: "Masculino" }] }) +
            field("Objetivo", "objetivo", p.objetivo, { wide: true }) +
            field("Status", "status", p.status || "ativo", { type: "select", options: [{ v: "ativo", l: "Ativo" }, { v: "atencao", l: "Atenção" }, { v: "inativo", l: "Inativo" }] }) +
            field("Adesão (%)", "adesao", p.adesao, { type: "number", step: "1" }) +
            field("Peso inicial (kg)", "pesoInicial", p.pesoInicial, { type: "number" }) +
            field("Peso atual (kg)", "pesoAtual", p.pesoAtual, { type: "number" }) +
            field("Meta (kg)", "meta", p.meta, { type: "number" }) +
            field("Altura (m)", "altura", p.altura, { type: "number", placeholder: "1.68" }) +
            field("Telefone", "tel", c.tel, {}) +
            field("E-mail", "email", c.email, { type: "email" }) +
            field("Cidade", "cidade", c.cidade, { wide: true }) +
            field("Tags (separadas por vírgula)", "tags", (p.tags || []).join(", "), { wide: true }) +
            field("Anamnese", "anamnese", p.anamnese, { type: "textarea", rows: 3, wide: true }) +
            field("Restrições & alergias", "restricoes", p.restricoes, { type: "textarea", rows: 2, wide: true }) +
            field("Observações clínicas", "observacoes", p.observacoes, { type: "textarea", rows: 2, wide: true }) +
          '</div>' +
          '<div class="pf-actions">' +
            '<button class="btn btn--ghost" type="button" id="pf-cancel">Cancelar</button>' +
            '<button class="btn btn--primary" type="submit" id="pf-save">' + (edit ? "Salvar alterações" : "Cadastrar paciente") + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(formOverlay);
    requestAnimationFrame(function () { formOverlay.classList.add("is-open"); });

    var closeIt = function () { if (formOverlay) { formOverlay.remove(); formOverlay = null; } };
    formOverlay.querySelector(".pf-close").addEventListener("click", closeIt);
    formOverlay.querySelector("#pf-cancel").addEventListener("click", closeIt);
    formOverlay.addEventListener("click", function (e) { if (e.target === formOverlay) closeIt(); });
    formOverlay.querySelector("[name=nome]").focus();

    formOverlay.querySelector("#pf-form").addEventListener("submit", function (e) {
      e.preventDefault();
      saveForm(e.target, edit ? p : null, closeIt);
    });
  }

  function saveForm(form, existing, closeIt) {
    var f = new FormData(form);
    var g = function (k) { var v = f.get(k); return v == null ? "" : String(v).trim(); };
    var msg = form.querySelector(".pf-msg");
    var save = form.querySelector("#pf-save");

    var nome = g("nome");
    if (!nome) { msg.textContent = "Informe o nome do paciente."; msg.hidden = false; return; }

    var payload = {
      nome: nome, idade: g("idade"), sexo: g("sexo"), objetivo: g("objetivo"),
      status: g("status"), adesao: g("adesao"),
      pesoInicial: g("pesoInicial"), pesoAtual: g("pesoAtual"), meta: g("meta"), altura: g("altura"),
      contato: { tel: g("tel"), email: g("email"), cidade: g("cidade") },
      tags: g("tags").split(",").map(function (t) { return t.trim(); }).filter(Boolean),
      anamnese: g("anamnese"), restricoes: g("restricoes"), observacoes: g("observacoes")
    };
    // Preserva as estruturas ricas ao editar (não são editáveis por este form).
    if (existing) {
      payload.evolucao = existing.evolucao;
      payload.consultas = existing.consultas;
      payload.prescricoes = existing.prescricoes;
      payload.exames = existing.exames;
      payload.ultConsulta = existing.ultConsulta;
      payload.proxConsulta = existing.proxConsulta;
    }

    save.disabled = true; save.textContent = "Salvando…"; msg.hidden = true;
    var op = existing ? window.NutriPacientes.update(existing.id, payload)
                      : window.NutriPacientes.create(payload);
    op.then(function (saved) {
      closeIt();
      state.load = "ready";
      return window.NutriPacientes.list().then(function (rows) {
        P.pacientes = rows;
        renderFilters(); renderList();
        if (existing) { var fresh = rows.filter(function (x) { return x.id === saved.id; })[0]; if (fresh) openProfile(fresh.id); }
      });
    }).catch(function () {
      save.disabled = false; save.textContent = existing ? "Salvar alterações" : "Cadastrar paciente";
      msg.textContent = "Não foi possível salvar. Verifique a conexão e tente novamente."; msg.hidden = false;
    });
  }
})();
