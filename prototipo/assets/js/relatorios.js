/* ============================================================
   RELATÓRIOS — indicadores DERIVADOS do banco real (window.NutriPacientes
   + window.NutriConsultas). Enquanto o banco carrega mostra a casca; sem
   banco (file://) cai no mock REL_DATA. Nada de números fabricados: uma
   nutri sem pacientes vê zeros honestos.
   ============================================================ */
(function () {
  "use strict";
  var M = window.REL_DATA || {};   // modelo atual (mock até o real chegar)
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  var CORES = ["#840B55", "#A23A66", "#C65C86", "#E39CB6", "#F0C9D8"];

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var r = M.resumo || {}, box = el("rel-kpis");
    if (!box) return;
    var kpis = [
      { rot: "Pacientes ativos", val: r.ativos != null ? r.ativos : "—", sub: r.ativosSub || "", tipo: "up", ico: "👥" },
      { rot: "Novos no mês", val: r.novos != null ? r.novos : "—", sub: r.novosSub || "captação do mês", tipo: "neutro", ico: "✨" },
      { rot: "Adesão média", val: (r.adesao != null ? r.adesao : 0) + "%", sub: r.adesaoSub || "ao plano alimentar", tipo: "up", ico: "🎯" },
      { rot: "Retenção", val: (r.retencao != null ? r.retencao : 0) + "%", sub: r.retencaoSub || "pacientes mantidos", tipo: "ok", ico: "💚" }
    ];
    box.innerHTML = kpis.map(function (k) {
      return '<div class="kpi kpi--' + k.tipo + '">' +
        '<div class="kpi__ico">' + k.ico + '</div>' +
        '<div class="kpi__rot">' + esc(k.rot) + '</div>' +
        '<div class="kpi__val">' + esc(k.val) + '</div>' +
        '<div class="kpi__sub">' + esc(k.sub) + '</div></div>';
    }).join("");
  }

  function emptyBox(id, texto) {
    var b = el(id); if (b) b.innerHTML = '<div class="dash-empty" style="min-height:120px"><p class="dash-empty__txt">' + esc(texto) + '</p></div>';
  }

  /* ---------- Gráfico de linha ---------- */
  function renderLine() {
    var wrap = el("rel-line"); if (!wrap) return;
    var S = M.evolucao || { labels: [], valores: [] };
    if (!S.valores || S.valores.length < 2 || Math.max.apply(null, S.valores) === 0) { emptyBox("rel-line", "Ainda sem histórico suficiente para o gráfico."); return; }
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

  /* ---------- Barras — consultas por mês ---------- */
  function renderBars() {
    var box = el("rel-bars"); if (!box) return;
    var S = M.consultas || { labels: [], valores: [] };
    var max = Math.max.apply(null, S.valores.length ? S.valores : [0]) || 1;
    if (!S.valores.length || max === 0) { box.innerHTML = '<div class="dash-empty" style="min-height:120px"><p class="dash-empty__txt">Nenhuma consulta registrada no período.</p></div>'; return; }
    box.innerHTML = S.valores.map(function (v, i) {
      var h = Math.round((v / max) * 100);
      return '<div class="bar-col"><span class="bar-col__v">' + v + '</span>' +
        '<div class="bar-col__bar" style="height:' + h + '%"></div>' +
        '<span class="bar-col__l">' + esc(S.labels[i]) + '</span></div>';
    }).join("");
  }

  /* ---------- Donut — objetivos ---------- */
  function renderDonut() {
    var box = el("rel-donut"); if (!box) return;
    var itens = M.objetivos || [];
    if (!itens.length) { emptyBox("rel-donut", "Cadastre pacientes para ver a distribuição por objetivo."); return; }
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

  /* ---------- Barras horizontais ---------- */
  function renderHBars(id, itens, vazio) {
    var box = el(id); if (!box) return;
    if (!itens || !itens.length) { emptyBox(id, vazio || "Sem dados ainda."); return; }
    box.innerHTML = itens.map(function (x) {
      return '<div class="hbar"><div class="hbar__top"><span>' + esc(x.nome) + '</span><strong>' + x.pct + '%</strong></div>' +
        '<div class="hbar__track"><span style="width:' + x.pct + '%"></span></div></div>';
    }).join("");
  }

  function renderAll() {
    renderKpis(); renderLine(); renderBars(); renderDonut();
    renderHBars("rel-adesao", M.adesao, "Sem dados de adesão ainda.");
    renderHBars("rel-origem", M.origem, "A origem dos pacientes ainda não é registrada.");
  }

  /* ---------- Modelo real a partir do banco ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ultimosMeses(n) {
    var arr = [], d = new Date(); d.setDate(1);
    for (var i = n - 1; i >= 0; i--) {
      var m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push({ y: m.getFullYear(), m: m.getMonth(), label: m.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") });
    }
    return arr;
  }
  function mesDe(iso) { var m = /^(\d{4})-(\d{2})/.exec(String(iso || "")); return m ? { y: +m[1], m: +m[2] - 1 } : null; }

  function construirModelo(pacientes, consultas) {
    var meses = ultimosMeses(6);
    var total = pacientes.length;
    var ativos = pacientes.filter(function (p) { return p.status === "ativo"; }).length;
    var inativos = pacientes.filter(function (p) { return p.status === "inativo"; }).length;
    var agora = new Date(), mesAtual = agora.getMonth(), anoAtual = agora.getFullYear();
    var novos = pacientes.filter(function (p) { var mm = mesDe(p.criadoEm); return mm && mm.y === anoAtual && mm.m === mesAtual; }).length;
    var comAdesao = pacientes.filter(function (p) { return typeof p.adesao === "number"; });
    var adesao = comAdesao.length ? Math.round(comAdesao.reduce(function (a, p) { return a + p.adesao; }, 0) / comAdesao.length) : 0;
    var retencao = total ? Math.round((total - inativos) / total * 100) : 0;

    // Evolução: total de pacientes cadastrados até o fim de cada mês (base acumulada).
    var evoLabels = [], evoVals = [];
    meses.forEach(function (mb) {
      var fimMes = new Date(mb.y, mb.m + 1, 1).getTime();
      var count = pacientes.filter(function (p) { var t = Date.parse(p.criadoEm || ""); return !isNaN(t) && t < fimMes; }).length;
      evoLabels.push(mb.label); evoVals.push(count);
    });

    // Consultas por mês (concluídas).
    var consLabels = meses.map(function (mb) { return mb.label; });
    var consVals = meses.map(function (mb) {
      return consultas.filter(function (c) { var mm = mesDe(c.data); return mm && mm.y === mb.y && mm.m === mb.m && c.status !== "cancelada"; }).length;
    });

    // Objetivos (distribuição).
    var objMap = {};
    pacientes.forEach(function (p) { var o = (p.objetivo || "Sem objetivo").trim() || "Sem objetivo"; objMap[o] = (objMap[o] || 0) + 1; });
    var objetivos = Object.keys(objMap).map(function (k) { return { nome: k, n: objMap[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 5)
      .map(function (o) { return { nome: o.nome, pct: Math.round(o.n / (total || 1) * 100) }; });

    // Adesão em faixas.
    var boa = pacientes.filter(function (p) { return (p.adesao || 0) >= 70; }).length;
    var med = pacientes.filter(function (p) { return (p.adesao || 0) >= 50 && (p.adesao || 0) < 70; }).length;
    var baixa = pacientes.filter(function (p) { return (p.adesao || 0) < 50; }).length;
    var adesaoFaixas = total ? [
      { nome: "Boa (≥70%)", pct: Math.round(boa / total * 100) },
      { nome: "Média (50–69%)", pct: Math.round(med / total * 100) },
      { nome: "Baixa (<50%)", pct: Math.round(baixa / total * 100) }
    ] : [];

    return {
      periodoLabel: "Últimos 6 meses",
      resumo: {
        ativos: ativos, ativosSub: "de " + total + " no total",
        novos: novos, novosSub: "cadastrados este mês",
        adesao: adesao, adesaoSub: "ao plano alimentar",
        retencao: retencao, retencaoSub: "pacientes não inativos"
      },
      evolucao: { labels: evoLabels, valores: evoVals },
      consultas: { labels: consLabels, valores: consVals },
      objetivos: objetivos,
      adesao: adesaoFaixas,
      origem: []   // origem ainda não é registrada — empty-state honesto
    };
  }

  function loadReal() {
    if (!window.NutriPacientes || !window.NutriConsultas) return; // file:// → mantém mock
    var hoje = new Date();
    var ini = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
    var fromISO = ini.getFullYear() + "-" + pad(ini.getMonth() + 1) + "-01";
    var toISO = hoje.getFullYear() + "-" + pad(hoje.getMonth() + 1) + "-" + pad(hoje.getDate());
    Promise.all([
      window.NutriPacientes.list(),
      window.NutriConsultas.listRange(fromISO, toISO).catch(function () { return []; })
    ]).then(function (r) {
      M = construirModelo(r[0] || [], r[1] || []);
      var per = el("rel-periodo"); if (per) per.textContent = M.periodoLabel;
      renderAll();
    }).catch(function () { /* mantém o mock já renderizado */ });
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (el("rel-periodo") && M.periodoLabel) el("rel-periodo").textContent = M.periodoLabel;
    renderAll();       // casca (mock em file://; será substituída pelo real)
    initMobileNav();
    loadReal();
  });
})();
