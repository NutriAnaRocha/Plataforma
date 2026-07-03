(function () {
  "use strict";
  var D = window.EX_DATA || {};
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  /* KPIs */
  function renderKpis() {
    var r = D.resumo || {}, box = el("ex-kpis");
    if (!box) return;
    var k = [
      [r.aguardando, "Aguardando análise"],
      [r.alterados, "Marcadores alterados"],
      [r.pacientes, "Pacientes com exames"],
      [r.coletas, "Coletas agendadas"]
    ];
    box.innerHTML = k.map(function (x) {
      return '<div class="ex-kpi"><div class="ex-kpi__n">' + x[0] + '</div><div class="ex-kpi__l">' + x[1] + '</div></div>';
    }).join("");
  }

  /* Sparkline (reaproveita padrão do prontuário) */
  function sparkline(pts) {
    var W = 90, H = 26, p = 3;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), span = (max - min) || 1;
    var step = (W - p * 2) / (pts.length - 1);
    var d = pts.map(function (v, i) { return (i ? "L" : "M") + (p + i * step).toFixed(1) + " " + (p + (H - p * 2) * (1 - (v - min) / span)).toFixed(1); }).join(" ");
    return '<div class="mk-spark"><svg viewBox="0 0 ' + W + " " + H + '"><path d="' + d + '"></path></svg></div>';
  }

  /* Lista */
  function cardHTML(e) {
    var okCls = e.alterados ? "" : "ok";
    var altTxt = e.alterados
      ? 'Alterados <b>' + e.alterados + '</b>'
      : '<b>Normais</b>';
    return '<div class="ex-card" data-id="' + e.id + '">' +
      '<span class="ex-card__av ' + (e.cor === "vinho" ? "vinho" : "") + '">' + esc(e.iniciais) + '</span>' +
      '<div><div class="ex-card__nome">' + esc(e.paciente) + '</div>' +
      '<div class="ex-card__tipo">' + esc(e.tipo) + '</div>' +
      '<div class="ex-card__meta"><span class="ex-data">' + esc(e.data) + '</span></div></div>' +
      '<div class="ex-right"><span class="ex-pill ' + e.status + '">' + (e.status === "novo" ? "Novo" : "Analisado") + '</span>' +
      '<span class="ex-alt ' + okCls + '">' + altTxt + '</span></div>' +
      '</div>';
  }

  function renderList(filtro) {
    var box = el("ex-list");
    if (!box) return;
    var itens = D.exames || [];
    if (filtro) {
      var f = filtro.toLowerCase();
      itens = itens.filter(function (e) {
        return e.paciente.toLowerCase().indexOf(f) > -1 || e.tipo.toLowerCase().indexOf(f) > -1;
      });
    }
    box.innerHTML = itens.length ? itens.map(cardHTML).join("") :
      '<div class="ex-empty">Nenhum exame encontrado.</div>';
    box.querySelectorAll(".ex-card").forEach(function (c) {
      c.addEventListener("click", function () { select(c.getAttribute("data-id")); });
    });
  }

  /* Detalhe */
  function markerRow(m) {
    var flag = m.status === "normal" ? "" : "flag-" + m.status;
    var lbl = m.status === "normal" ? "Normal" : (m.status === "alto" ? "Alto" : "Baixo");
    return '<div class="mk-row">' +
      '<span class="mk-name">' + esc(m.nome) + '</span>' +
      '<span class="mk-val ' + flag + '">' + esc(m.valor) + ' <small>' + esc(m.un) + '</small></span>' +
      '<span class="mk-ref">' + esc(m.ref) + '</span>' +
      '<span class="st-dot ' + m.status + '">' + lbl + '</span>' +
      sparkline(m.hist) + '</div>';
  }

  function groupHTML(g) {
    var head = '<div class="mk-row is-head"><span>Marcador</span><span>Resultado</span><span>Referência</span><span>Status</span><span>Tendência</span></div>';
    return '<div class="ex-group"><div class="ex-group__h">' + esc(g.grupo) + '</div>' +
      '<div class="mk-table">' + head + (g.marcadores || []).map(markerRow).join("") + '</div></div>';
  }

  function renderDetail(e) {
    var box = el("ex-detail");
    if (!box) return;
    if (!e) { box.innerHTML = '<div class="ex-empty">Selecione um exame à esquerda para visualizar.</div>'; return; }
    box.innerHTML =
      '<div class="ex-dhead">' +
        '<span class="ex-card__av ' + (e.cor === "vinho" ? "vinho" : "") + '" style="width:48px;height:48px">' + esc(e.iniciais) + '</span>' +
        '<div class="ex-dhead__id"><div class="ex-dhead__tit">' + esc(e.paciente) + '</div>' +
        '<div class="ex-dhead__sub">' + esc(e.tipo) + ' · ' + esc(e.data) + '</div></div>' +
        '<div class="ex-dhead__actions"><button class="btn btn--outline">Baixar PDF</button><button class="btn btn--primary">Comentar no prontuário</button></div>' +
      '</div>' +
      (e.ia ? '<div class="ex-ia"><span class="ex-ia__ico">🤖</span><div><div class="ex-ia__t">Leitura da IA</div><div class="ex-ia__txt">' + esc(e.ia) + '</div></div></div>' : '') +
      (e.grupos || []).map(groupHTML).join("");
  }

  function select(id) {
    var e = (D.exames || []).filter(function (x) { return x.id === id; })[0];
    document.querySelectorAll(".ex-card").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-id") === id);
    });
    renderDetail(e);
  }

  /* Menu mobile */
  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderKpis();
    renderList("");
    var first = (D.exames || [])[0];
    if (first) select(first.id);
    var search = el("ex-search-input");
    if (search) search.addEventListener("input", function () { renderList(search.value); });
    initMobileNav();
  });
})();
