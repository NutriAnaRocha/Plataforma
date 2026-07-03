(function () {
  "use strict";
  var D = window.REL_DATA || {};
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  // Paleta para segmentos (donut/legendas)
  var CORES = ["#7B284C", "#A23A66", "#C65C86", "#E39CB6", "#F0C9D8"];

  /* KPIs */
  function renderKpis() {
    var r = D.resumo || {}, box = el("rel-kpis");
    if (!box) return;
    var kpis = [
      { rot: "Pacientes ativos", val: r.ativos, sub: "▲ " + r.ativosVar + "% no semestre", tipo: "up", ico: "👥" },
      { rot: "Novos no mês", val: r.novos, sub: "captação de junho", tipo: "neutro", ico: "✨" },
      { rot: "Adesão média", val: r.adesao + "%", sub: "▲ " + r.adesaoVar + "% vs. início", tipo: "up", ico: "🎯" },
      { rot: "Retenção", val: r.retencao + "%", sub: "pacientes mantidos", tipo: "ok", ico: "💚" }
    ];
    box.innerHTML = kpis.map(function (k) {
      return '<div class="kpi kpi--' + k.tipo + '">' +
        '<div class="kpi__ico">' + k.ico + '</div>' +
        '<div class="kpi__rot">' + esc(k.rot) + '</div>' +
        '<div class="kpi__val">' + esc(k.val) + '</div>' +
        '<div class="kpi__sub">' + esc(k.sub) + '</div></div>';
    }).join("");
  }

  /* Gráfico de linha — evolução de pacientes */
  function renderLine() {
    var wrap = el("rel-line"); if (!wrap) return;
    var S = D.evolucao || { labels: [], valores: [] };
    var pts = S.valores, labels = S.labels;
    var W = 640, H = 240, padX = 34, padY = 26;
    var max = Math.max.apply(null, pts), min = Math.min.apply(null, pts) * 0.9;
    var span = (max - min) || 1, stepX = (W - padX * 2) / (pts.length - 1);
    function x(i) { return padX + i * stepX; }
    function y(v) { return padY + (H - padY * 2) * (1 - (v - min) / span); }
    var line = pts.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var area = "M" + x(0).toFixed(1) + " " + (H - padY) + " " +
      pts.map(function (v, i) { return "L" + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ") +
      " L" + x(pts.length - 1).toFixed(1) + " " + (H - padY) + " Z";
    var dots = pts.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3.5" fill="var(--vinho)"/>'; }).join("");
    var lbls = labels.map(function (l, i) { return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="cx-lbl">' + esc(l) + '</text>'; }).join("");
    wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="rel-svg">' +
      '<defs><linearGradient id="grel" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="var(--vinho)" stop-opacity="0.18"/>' +
      '<stop offset="1" stop-color="var(--vinho)" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#grel)"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--vinho)" stroke-width="2.5" stroke-linejoin="round"/>' +
      dots + lbls + '</svg>';
  }

  /* Gráfico de barras — consultas por mês */
  function renderBars() {
    var box = el("rel-bars"); if (!box) return;
    var S = D.consultas || { labels: [], valores: [] };
    var max = Math.max.apply(null, S.valores) || 1;
    box.innerHTML = S.valores.map(function (v, i) {
      var h = Math.round((v / max) * 100);
      return '<div class="bar-col"><span class="bar-col__v">' + v + '</span>' +
        '<div class="bar-col__bar" style="height:' + h + '%"></div>' +
        '<span class="bar-col__l">' + esc(S.labels[i]) + '</span></div>';
    }).join("");
  }

  /* Donut — objetivos */
  function renderDonut() {
    var box = el("rel-donut"); if (!box) return;
    var itens = D.objetivos || [];
    var R = 60, C = 2 * Math.PI * R, off = 0;
    var segs = itens.map(function (o, i) {
      var len = (o.pct / 100) * C;
      var s = '<circle cx="75" cy="75" r="' + R + '" fill="none" stroke="' + CORES[i % CORES.length] +
        '" stroke-width="26" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) +
        '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += len;
      return s;
    }).join("");
    var legenda = itens.map(function (o, i) {
      return '<div class="leg"><span class="leg__dot" style="background:' + CORES[i % CORES.length] + '"></span>' +
        '<span class="leg__nome">' + esc(o.nome) + '</span><span class="leg__pct">' + o.pct + '%</span></div>';
    }).join("");
    box.innerHTML = '<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 150 150">' + segs + '</svg></div>' +
      '<div class="donut-legend">' + legenda + '</div></div>';
  }

  /* Barras horizontais genéricas */
  function renderHBars(id, itens) {
    var box = el(id); if (!box) return;
    box.innerHTML = (itens || []).map(function (x) {
      return '<div class="hbar"><div class="hbar__top"><span>' + esc(x.nome) + '</span><strong>' + x.pct + '%</strong></div>' +
        '<div class="hbar__track"><span style="width:' + x.pct + '%"></span></div></div>';
    }).join("");
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (el("rel-periodo") && D.periodoLabel) el("rel-periodo").textContent = D.periodoLabel;
    renderKpis();
    renderLine();
    renderBars();
    renderDonut();
    renderHBars("rel-adesao", D.adesao);
    renderHBars("rel-origem", D.origem);
    initMobileNav();
  });
})();
