/* ============================================================
   EXAMES (consolidado) — agrega os exames REAIS de todos os pacientes
   (window.NutriPacientes → p.exames). Usa o catálogo window.Exames.MARC
   para rótulo/unidade/referência dos marcadores. Sem banco (file://) ou
   sem exames, mostra estado-vazio honesto (nada de dados fabricados).
   ============================================================ */
(function () {
  "use strict";
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  var MARC_BY_KEY = {};
  (function () {
    var marc = (window.Exames && window.Exames.MARC) || [];
    marc.forEach(function (m) { MARC_BY_KEY[m.key] = m; });
  })();

  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    return (((p[0] || "")[0] || "") + (p.length > 1 ? (p[p.length - 1][0] || "") : "")).toUpperCase() || "?";
  }
  function fmtData(d) {
    if (!d) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d));
    if (m) return m[3] + "/" + m[2] + "/" + m[1];
    return String(d);
  }
  function tsData(d) { var t = Date.parse(String(d || "")); return isNaN(t) ? 0 : t; }
  function refPara(m, sexo) {
    var r = m.ref || {}; if (r.min != null || r.max != null) return r;
    var s = (sexo === "M") ? "M" : "F"; return r[s] || r.F || r.M || {};
  }
  function refTexto(m, sexo) {
    var r = refPara(m, sexo);
    if (r.min != null && r.max != null && r.max < 900) return r.min + "–" + r.max;
    if (r.max != null && r.max < 900) return "≤ " + r.max;
    if (r.min != null) return "≥ " + r.min;
    return "—";
  }

  var registros = [];   // [{id, paciente, iniciais, sexo, tipo, titulo, data, ts, status, alterados, avaliacoes, texto, itens}]

  /* ---------- Achata os exames de todos os pacientes ---------- */
  function achatar(pacientes) {
    var out = [];
    (pacientes || []).forEach(function (p) {
      (p.exames || []).forEach(function (e) {
        if (!e || typeof e !== "object") return;
        var av = Array.isArray(e.avaliacoes) ? e.avaliacoes : [];
        var alterados = av.filter(function (a) { return a.stat === "alto" || a.stat === "baixo"; }).length;
        out.push({
          id: (p.id + ":" + (e.id || Math.random())),
          paciente: p.nome, iniciais: p.ini || iniciais(p.nome), sexo: e.sexo || p.sexo,
          tipo: e.tipo || "registrado", titulo: e.titulo || "Exame",
          data: e.data, ts: tsData(e.data),
          status: e.status || "registrado",
          alterados: alterados, avaliacoes: av, texto: e.texto || "", itens: e.itens || []
        });
      });
    });
    return out.sort(function (a, b) { return b.ts - a.ts; });
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var box = el("ex-kpis"); if (!box) return;
    var aguardando = registros.filter(function (r) { return r.tipo === "registrado"; }).length;
    var alterados = registros.reduce(function (a, r) { return a + r.alterados; }, 0);
    var pacientes = {}; registros.forEach(function (r) { pacientes[r.paciente] = 1; });
    var coletas = registros.filter(function (r) { return r.tipo === "solicitacao"; }).length;
    var k = [
      [aguardando, "Resultados registrados"],
      [alterados, "Marcadores alterados"],
      [Object.keys(pacientes).length, "Pacientes com exames"],
      [coletas, "Solicitações emitidas"]
    ];
    box.innerHTML = k.map(function (x) {
      return '<div class="ex-kpi"><div class="ex-kpi__n">' + x[0] + '</div><div class="ex-kpi__l">' + x[1] + '</div></div>';
    }).join("");
  }

  /* ---------- Lista ---------- */
  var TIPO_LABEL = { registrado: "Resultados laboratoriais", ia: "Interpretação por IA", solicitacao: "Solicitação de exames" };
  var TIPO_PILL = { registrado: "novo", ia: "analisado", solicitacao: "analisado" };
  var TIPO_PILL_TXT = { registrado: "Resultados", ia: "Analisado", solicitacao: "Solicitado" };

  function cardHTML(e) {
    var okCls = e.alterados ? "" : "ok";
    var altTxt = e.tipo === "registrado"
      ? (e.alterados ? 'Alterados <b>' + e.alterados + '</b>' : '<b>Normais</b>')
      : (e.tipo === "ia" ? "IA" : "Pendente");
    return '<div class="ex-card" data-id="' + esc(e.id) + '">' +
      '<span class="ex-card__av vinho">' + esc(e.iniciais) + '</span>' +
      '<div><div class="ex-card__nome">' + esc(e.paciente) + '</div>' +
      '<div class="ex-card__tipo">' + esc(TIPO_LABEL[e.tipo] || e.titulo) + '</div>' +
      '<div class="ex-card__meta"><span class="ex-data">' + esc(fmtData(e.data)) + '</span></div></div>' +
      '<div class="ex-right"><span class="ex-pill ' + (TIPO_PILL[e.tipo] || "novo") + '">' + (TIPO_PILL_TXT[e.tipo] || "") + '</span>' +
      '<span class="ex-alt ' + okCls + '">' + altTxt + '</span></div>' +
      '</div>';
  }

  function renderList(filtro) {
    var box = el("ex-list"); if (!box) return;
    var itens = registros;
    if (filtro) {
      var f = filtro.toLowerCase();
      itens = itens.filter(function (e) {
        return (e.paciente || "").toLowerCase().indexOf(f) > -1 || (TIPO_LABEL[e.tipo] || "").toLowerCase().indexOf(f) > -1;
      });
    }
    box.innerHTML = itens.length ? itens.map(cardHTML).join("") :
      '<div class="ex-empty">' + (registros.length ? "Nenhum exame encontrado." : "Você ainda não registrou exames. Eles aparecem aqui ao serem lançados no prontuário de um paciente.") + '</div>';
    box.querySelectorAll(".ex-card").forEach(function (c) {
      c.addEventListener("click", function () { select(c.getAttribute("data-id")); });
    });
  }

  /* ---------- Detalhe ---------- */
  function avRow(a, sexo) {
    var m = MARC_BY_KEY[a.key] || { lbl: a.key, un: "" };
    var flag = a.stat === "normal" ? "" : "flag-" + (a.stat || "");
    var lbl = a.stat === "normal" ? "Normal" : (a.stat === "alto" ? "Alto" : (a.stat === "baixo" ? "Baixo" : "—"));
    return '<div class="mk-row">' +
      '<span class="mk-name">' + esc(m.lbl) + '</span>' +
      '<span class="mk-val ' + flag + '">' + esc(a.valor) + ' <small>' + esc(m.un || "") + '</small></span>' +
      '<span class="mk-ref">' + esc(refTexto(m, sexo)) + '</span>' +
      '<span class="st-dot ' + (a.stat || "") + '">' + lbl + '</span>' +
      '</div>';
  }

  function renderDetail(e) {
    var box = el("ex-detail"); if (!box) return;
    if (!e) { box.innerHTML = '<div class="ex-empty">Selecione um exame à esquerda para visualizar.</div>'; return; }
    var head =
      '<div class="ex-dhead">' +
        '<span class="ex-card__av vinho" style="width:48px;height:48px">' + esc(e.iniciais) + '</span>' +
        '<div class="ex-dhead__id"><div class="ex-dhead__tit">' + esc(e.paciente) + '</div>' +
        '<div class="ex-dhead__sub">' + esc(TIPO_LABEL[e.tipo] || e.titulo) + ' · ' + esc(fmtData(e.data)) + '</div></div>' +
      '</div>';

    var body = "";
    if (e.tipo === "registrado" && e.avaliacoes.length) {
      var headRow = '<div class="mk-row is-head"><span>Marcador</span><span>Resultado</span><span>Referência</span><span>Status</span></div>';
      body = '<div class="ex-group"><div class="mk-table">' + headRow +
        e.avaliacoes.map(function (a) { return avRow(a, e.sexo); }).join("") + '</div></div>';
    } else if (e.tipo === "ia" && e.texto) {
      body = '<div class="ex-ia"><span class="ex-ia__ico">🤖</span><div><div class="ex-ia__t">Leitura da IA</div>' +
        '<div class="ex-ia__txt">' + esc(e.texto) + '</div></div></div>';
    } else if (e.tipo === "solicitacao" && e.itens.length) {
      body = '<div class="ex-group"><div class="ex-group__h">Exames solicitados</div><ul style="margin:0;padding-left:20px">' +
        e.itens.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join("") + '</ul></div>';
    } else {
      body = '<div class="ex-empty">Sem detalhes registrados neste item.</div>';
    }
    box.innerHTML = head + body;
  }

  function select(id) {
    var e = registros.filter(function (x) { return x.id === id; })[0];
    document.querySelectorAll(".ex-card").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-id") === id);
    });
    renderDetail(e);
  }

  function renderAll() {
    renderKpis();
    renderList(el("ex-search-input") ? el("ex-search-input").value : "");
    if (registros.length) select(registros[0].id); else renderDetail(null);
  }

  function loadReal() {
    if (!window.NutriPacientes) { renderKpis(); renderDetail(null); return; }
    window.NutriPacientes.list().then(function (pacientes) {
      registros = achatar(pacientes || []);
      renderAll();
    }).catch(function () { registros = []; renderAll(); });
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Casca inicial honesta enquanto o banco carrega.
    renderKpis(); renderDetail(null);
    var search = el("ex-search-input");
    if (search) search.addEventListener("input", function () { renderList(search.value); });
    initMobileNav();
    loadReal();
  });
})();
