/* ============================================================
   FINANCEIRO — ledger REAL (window.NutriFinanceiro → tabela lancamentos).
   KPIs do mês, faturamento dos últimos 8 meses, métodos, últimos
   lançamentos e "Novo lançamento" (modal). Sem banco (file://) mostra a
   casca vazia — nada de números fabricados.
   ============================================================ */
(function () {
  "use strict";
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function brl(n) { return "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function mesDe(iso) { var m = /^(\d{4})-(\d{2})/.exec(String(iso || "")); return m ? { y: +m[1], m: +m[2] - 1 } : null; }
  function fmtDataBR(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] : esc(iso); }

  var lancamentos = [];

  function ultimosMeses(n) {
    var arr = [], d = new Date(); d.setDate(1);
    for (var i = n - 1; i >= 0; i--) {
      var m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push({ y: m.getFullYear(), m: m.getMonth(), label: m.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") });
    }
    return arr;
  }

  /* ---------- KPIs (mês atual) ---------- */
  function renderKpis() {
    var box = el("fin-kpis"); if (!box) return;
    var agora = new Date(), y = agora.getFullYear(), mo = agora.getMonth();
    var doMes = lancamentos.filter(function (l) { var mm = mesDe(l.data); return mm && mm.y === y && mm.m === mo; });
    var soma = function (arr) { return arr.reduce(function (a, l) { return a + (l.valor || 0); }, 0); };
    var receita = soma(doMes);
    var recebido = soma(doMes.filter(function (l) { return l.status === "pago"; }));
    var aReceber = soma(doMes.filter(function (l) { return l.status === "pendente"; }));
    var atrasado = soma(doMes.filter(function (l) { return l.status === "atrasado"; }));
    var mesLabel = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    var fm = el("fin-mes"); if (fm) fm.textContent = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

    var kpis = [
      { rotulo: "Faturamento do mês", valor: brl(receita), sub: doMes.length + " lançamento" + (doMes.length === 1 ? "" : "s"), tipo: "up", ico: "💰" },
      { rotulo: "Recebido", valor: brl(recebido), sub: receita ? Math.round(recebido / receita * 100) + "% do faturado" : "—", tipo: "ok", ico: "✅" },
      { rotulo: "A receber", valor: brl(aReceber), sub: "pendente", tipo: "neutro", ico: "⏳" },
      { rotulo: "Em atraso", valor: brl(atrasado), sub: atrasado ? "cobrar" : "nada em atraso", tipo: "down", ico: "⚠️" }
    ];
    box.innerHTML = kpis.map(function (k) {
      return '<div class="kpi kpi--' + k.tipo + '">' +
        '<div class="kpi__ico">' + k.ico + '</div>' +
        '<div class="kpi__rot">' + esc(k.rotulo) + '</div>' +
        '<div class="kpi__val">' + esc(k.valor) + '</div>' +
        '<div class="kpi__sub">' + esc(k.sub) + '</div>' +
      '</div>';
    }).join("");
  }

  /* ---------- Gráfico de faturamento (8 meses) ---------- */
  function renderChart() {
    var wrap = el("fin-chart"); if (!wrap) return;
    var meses = ultimosMeses(8);
    var pts = meses.map(function (mb) {
      return lancamentos.filter(function (l) { var mm = mesDe(l.data); return mm && mm.y === mb.y && mm.m === mb.m; })
        .reduce(function (a, l) { return a + (l.valor || 0); }, 0);
    });
    var labels = meses.map(function (mb) { return mb.label; });
    if (Math.max.apply(null, pts) === 0) {
      wrap.innerHTML = '<div class="dash-empty" style="min-height:160px"><p class="dash-empty__txt">Sem faturamento registrado ainda.<br>Use “+ Novo lançamento” para começar.</p></div>';
      return;
    }
    var W = 640, H = 240, padX = 34, padY = 26;
    var max = Math.max.apply(null, pts), min = 0;
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

  /* ---------- Métodos de pagamento (mês) ---------- */
  function renderMetodos() {
    var box = el("fin-metodos"); if (!box) return;
    var agora = new Date(), y = agora.getFullYear(), mo = agora.getMonth();
    var pagos = lancamentos.filter(function (l) { var mm = mesDe(l.data); return l.status === "pago" && mm && mm.y === y && mm.m === mo; });
    var total = pagos.reduce(function (a, l) { return a + l.valor; }, 0);
    if (!total) { box.innerHTML = '<div class="dash-empty" style="min-height:80px"><p class="dash-empty__txt">Nenhum recebimento neste mês.</p></div>'; return; }
    var ICO = { Pix: "⚡", "Dinheiro": "💵", "Cartão": "💳", "Transferência": "🏦", Boleto: "🧾", Outro: "•" };
    var map = {}; pagos.forEach(function (l) { var k = l.metodo || "Outro"; map[k] = (map[k] || 0) + l.valor; });
    box.innerHTML = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).map(function (nome) {
      var pct = Math.round(map[nome] / total * 100);
      return '<div class="mtd">' +
        '<div class="mtd__top"><span>' + (ICO[nome] || "•") + ' ' + esc(nome) + '</span><strong>' + brl(map[nome]) + '</strong></div>' +
        '<div class="mtd__bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="mtd__pct">' + pct + '%</div>' +
      '</div>';
    }).join("");
  }

  /* ---------- Resumo por status (mês) ---------- */
  function renderResumo() {
    var box = el("fin-planos"); if (!box) return;
    var agora = new Date(), y = agora.getFullYear(), mo = agora.getMonth();
    var doMes = lancamentos.filter(function (l) { var mm = mesDe(l.data); return mm && mm.y === y && mm.m === mo; });
    var g = { pago: { n: 0, v: 0 }, pendente: { n: 0, v: 0 }, atrasado: { n: 0, v: 0 } };
    doMes.forEach(function (l) { var s = g[l.status] || g.pago; s.n++; s.v += l.valor; });
    var lbl = { pago: "Recebido", pendente: "A receber", atrasado: "Em atraso" };
    box.innerHTML = ["pago", "pendente", "atrasado"].map(function (k) {
      return '<div class="plano">' +
        '<div><div class="plano__nome">' + lbl[k] + '</div><div class="plano__sub">' + g[k].n + ' lançamento' + (g[k].n === 1 ? "" : "s") + '</div></div>' +
        '<div class="plano__val">' + brl(g[k].v) + '</div>' +
      '</div>';
    }).join("");
  }

  /* ---------- Últimos lançamentos ---------- */
  function renderLanc() {
    var box = el("fin-lanc"); if (!box) return;
    if (!lancamentos.length) {
      box.innerHTML = '<tr><td colspan="5"><div class="dash-empty" style="min-height:90px"><p class="dash-empty__txt">Nenhum lançamento ainda.</p></div></td></tr>';
      return;
    }
    var stLabel = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" };
    box.innerHTML = lancamentos.slice(0, 12).map(function (l) {
      return '<tr>' +
        '<td class="lc-data">' + fmtDataBR(l.data) + '</td>' +
        '<td><div class="lc-pac">' + esc(l.paciente || "—") + '</div>' + (l.descricao ? '<div class="lc-desc">' + esc(l.descricao) + '</div>' : '') + '</td>' +
        '<td class="lc-met">' + esc(l.metodo || "—") + '</td>' +
        '<td class="lc-val">' + brl(l.valor) + '</td>' +
        '<td><span class="st st--' + l.status + '">' + (stLabel[l.status] || l.status) + '</span></td>' +
      '</tr>';
    }).join("");
  }

  /* ---------- Formas de pagamento (honesto) ---------- */
  function renderIntegracoes() {
    var box = el("fin-integ"); if (!box) return;
    box.innerHTML = '<p class="dash-empty__txt" style="text-align:left;margin:0 0 8px">' +
      'Registre os recebimentos manualmente por Pix, dinheiro, cartão ou transferência.</p>' +
      '<div class="integ is-on"><span class="integ__nome">Registro manual</span><span class="integ__st">● ativo</span></div>' +
      '<div class="integ"><span class="integ__nome">Cobrança online automática</span><span class="integ__st">em breve</span></div>';
  }

  function renderAll() {
    renderKpis(); renderChart(); renderMetodos(); renderResumo(); renderLanc(); renderIntegracoes();
  }

  /* ---------- Modal · Novo lançamento ---------- */
  function initModal() {
    var overlay = el("fin-modal"), form = el("fin-form"), btnNovo = el("fin-novo");
    var cancel = el("fl-cancel"), msg = el("fl-msg"), save = el("fl-save");
    if (!overlay || !form || !btnNovo) return;

    function open() {
      form.reset();
      var d = el("fl-data"); if (d) { var t = new Date(); d.value = t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate()); }
      if (msg) msg.hidden = true;
      overlay.classList.add("is-open");
      setTimeout(function () { var p = el("fl-paciente"); if (p) p.focus(); }, 150);
    }
    function close() { overlay.classList.remove("is-open"); }
    btnNovo.addEventListener("click", open);
    if (cancel) cancel.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!window.NutriFinanceiro) { if (msg) { msg.textContent = "Sem conexão com o servidor."; msg.hidden = false; } return; }
      var valor = parseFloat(el("fl-valor").value);
      if (!valor || valor <= 0) { if (msg) { msg.textContent = "Informe um valor válido."; msg.hidden = false; } return; }
      var novo = {
        paciente: el("fl-paciente").value,
        descricao: el("fl-desc").value,
        valor: valor,
        metodo: el("fl-metodo").value,
        status: el("fl-status").value,
        data: el("fl-data").value || null
      };
      if (save) { save.disabled = true; save.textContent = "Salvando…"; }
      window.NutriFinanceiro.create(novo).then(function (l) {
        lancamentos.unshift(l);
        lancamentos.sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
        renderAll(); close();
      }).catch(function (err) {
        if (msg) { msg.textContent = "Não foi possível salvar. " + (err && err.message ? err.message : ""); msg.hidden = false; }
      }).then(function () { if (save) { save.disabled = false; save.textContent = "Salvar lançamento"; } });
    });
  }

  function preencherPacientes() {
    if (!window.NutriPacientes) return;
    window.NutriPacientes.list().then(function (list) {
      var dl = el("fl-pac-list"); if (!dl) return;
      dl.innerHTML = (list || []).map(function (p) { return '<option value="' + esc(p.nome) + '"></option>'; }).join("");
    }).catch(function () {});
  }

  function loadReal() {
    if (!window.NutriFinanceiro) return; // file:// → casca vazia
    var d = new Date(); var ini = new Date(d.getFullYear(), d.getMonth() - 7, 1);
    var fromISO = ini.getFullYear() + "-" + pad(ini.getMonth() + 1) + "-01";
    window.NutriFinanceiro.listDesde(fromISO).then(function (list) {
      lancamentos = list || [];
      renderAll();
    }).catch(function () { renderAll(); });
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderAll();          // casca honesta (vazia) enquanto carrega
    initModal();
    initMobileNav();
    loadReal();
    preencherPacientes();
  });
})();
