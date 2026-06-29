/* ============================================================
   FINANCEIRO (consolidado) — render do mock
   ============================================================ */
(function () {
  "use strict";

  var D = window.FIN_DATA || {};
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function brl(n) { return "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0 }); }

  document.addEventListener("DOMContentLoaded", function () {
    var R = D.resumo || {};
    if (el("fin-mes") && D.mesLabel) el("fin-mes").textContent = D.mesLabel;

    /* ---------- KPIs ---------- */
    var kpis = [
      { rotulo: "Faturamento do mês", valor: brl(R.receita), sub: "▲ " + R.variacao + "% vs. maio", tipo: "up", ico: "💰" },
      { rotulo: "Recebido", valor: brl(R.recebido), sub: Math.round((R.recebido / R.receita) * 100) + "% do faturado", tipo: "ok", ico: "✅" },
      { rotulo: "A receber", valor: brl(R.aReceber), sub: "dentro do prazo", tipo: "neutro", ico: "⏳" },
      { rotulo: "Inadimplência", valor: brl(R.atrasado), sub: "2 lançamentos atrasados", tipo: "down", ico: "⚠️" }
    ];
    el("fin-kpis").innerHTML = kpis.map(function (k) {
      return '<div class="kpi kpi--' + k.tipo + '">' +
        '<div class="kpi__ico">' + k.ico + '</div>' +
        '<div class="kpi__rot">' + esc(k.rotulo) + '</div>' +
        '<div class="kpi__val">' + esc(k.valor) + '</div>' +
        '<div class="kpi__sub">' + esc(k.sub) + '</div>' +
      '</div>';
    }).join("");

    /* ---------- Gráfico de faturamento (SVG) ---------- */
    renderChart();
    function renderChart() {
      var wrap = el("fin-chart"); if (!wrap) return;
      var S = D.serie || { labels: [], valores: [] };
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
      wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="fin-svg">' +
        '<defs><linearGradient id="gfin" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="var(--vinho)" stop-opacity="0.18"/>' +
        '<stop offset="1" stop-color="var(--vinho)" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + area + '" fill="url(#gfin)"/>' +
        '<path d="' + line + '" fill="none" stroke="var(--vinho)" stroke-width="2.5" stroke-linejoin="round"/>' +
        dots + lbls + '</svg>';
    }

    /* ---------- Métodos de pagamento (barras) ---------- */
    el("fin-metodos").innerHTML = (D.metodos || []).map(function (m) {
      return '<div class="mtd">' +
        '<div class="mtd__top"><span>' + m.ico + ' ' + esc(m.nome) + '</span><strong>' + brl(m.valor) + '</strong></div>' +
        '<div class="mtd__bar"><span style="width:' + m.pct + '%"></span></div>' +
        '<div class="mtd__pct">' + m.pct + '%</div>' +
      '</div>';
    }).join("");

    /* ---------- Planos ativos ---------- */
    el("fin-planos").innerHTML = (D.planos || []).map(function (p) {
      return '<div class="plano">' +
        '<div><div class="plano__nome">' + esc(p.nome) + '</div><div class="plano__sub">' + p.ativos + ' pacientes ativos</div></div>' +
        '<div class="plano__val">' + brl(p.valor) + '<span>/mês</span></div>' +
      '</div>';
    }).join("");

    /* ---------- Lançamentos ---------- */
    var stLabel = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" };
    el("fin-lanc").innerHTML = (D.lancamentos || []).map(function (l) {
      return '<tr>' +
        '<td class="lc-data">' + esc(l.data) + '</td>' +
        '<td><div class="lc-pac">' + esc(l.paciente) + '</div><div class="lc-desc">' + esc(l.desc) + '</div></td>' +
        '<td class="lc-met">' + esc(l.metodo) + '</td>' +
        '<td class="lc-val">' + brl(l.valor) + '</td>' +
        '<td><span class="st st--' + l.status + '">' + (stLabel[l.status] || l.status) + '</span></td>' +
      '</tr>';
    }).join("");

    /* ---------- Integrações ---------- */
    el("fin-integ").innerHTML = (D.integracoes || []).map(function (i) {
      return '<div class="integ' + (i.ok ? " is-on" : "") + '">' +
        '<span class="integ__nome">' + esc(i.nome) + '</span>' +
        '<span class="integ__st">' + (i.ok ? "● " : "") + esc(i.status) + '</span>' +
      '</div>';
    }).join("");

    /* ---------- Navegação mobile ---------- */
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (app && toggle) {
      toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
      if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
    }
  });
})();
