(function () {
  "use strict";
  var D = window.RX_DATA || {};
  var perfil = null;   // identidade da nutri (para os PDFs) — carregada no init
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function hoje() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(); }

  /* KPIs */
  function renderKpis() {
    var r = D.resumo || {};
    var box = el("rx-kpis");
    if (!box) return;
    var k = [
      [r.ativos, "Planos ativos"],
      [r.modelos, "Modelos salvos"],
      [r.revisar, "Para revisar"],
      [(r.aderencia || 0) + "%", "Adesão média"]
    ];
    box.innerHTML = k.map(function (x) {
      return '<div class="rx-kpi"><div class="rx-kpi__n">' + x[0] + '</div><div class="rx-kpi__l">' + x[1] + '</div></div>';
    }).join("");
  }

  /* Lista de planos */
  function cardHTML(p) {
    var st = p.status === "ativo" ? "ativo" : "revisar";
    var lbl = p.status === "ativo" ? "Ativo" : "Revisar";
    return '<div class="rx-card" data-id="' + p.id + '">' +
      '<span class="rx-card__av ' + (p.cor === "vinho" ? "vinho" : "") + '">' + esc(p.iniciais) + '</span>' +
      '<div><div class="rx-card__nome">' + esc(p.paciente) + '</div>' +
      '<div class="rx-card__obj">' + esc(p.objetivo) + '</div>' +
      '<div class="rx-card__meta"><span class="rx-kcal">' + p.kcal + ' kcal</span><span class="rx-up">· ' + esc(p.atualizado) + '</span></div></div>' +
      '<div class="rx-right"><span class="st-pill ' + st + '">' + lbl + '</span>' +
      '<span class="rx-ades">Adesão <b>' + p.adesao + '%</b></span></div>' +
      '</div>';
  }

  function renderList(filtro) {
    var box = el("rx-list");
    if (!box) return;
    var planos = D.planos || [];
    if (filtro) {
      var f = filtro.toLowerCase();
      planos = planos.filter(function (p) {
        return p.paciente.toLowerCase().indexOf(f) > -1 || p.objetivo.toLowerCase().indexOf(f) > -1;
      });
    }
    box.innerHTML = planos.length ? planos.map(cardHTML).join("") :
      '<div class="rx-empty">Nenhum plano encontrado.</div>';
    box.querySelectorAll(".rx-card").forEach(function (c) {
      c.addEventListener("click", function () { select(c.getAttribute("data-id")); });
    });
  }

  /* Detalhe */
  function mealHTML(m) {
    var tot = (m.itens || []).reduce(function (a, i) { return a + (i.kcal || 0); }, 0);
    var itens = (m.itens || []).map(function (i) {
      return '<div class="meal__item"><span class="meal__nm">' + esc(i.alimento) + '</span>' +
        '<span class="meal__qt">' + esc(i.qtd) + '</span>' +
        '<span class="meal__kc">' + i.kcal + ' kcal</span></div>';
    }).join("");
    return '<div class="meal"><div class="meal__head">' +
      '<span class="meal__hora">' + esc(m.hora) + '</span>' +
      '<span class="meal__nome">' + esc(m.nome) + '</span>' +
      '<span class="meal__kcal">' + tot + ' kcal</span></div>' + itens + '</div>';
  }

  function renderDetail(p) {
    var box = el("rx-detail");
    if (!box) return;
    if (!p) { box.innerHTML = '<div class="rx-empty">Selecione um plano à esquerda para visualizar.</div>'; return; }
    var mc = p.macros || {};
    var refs = p.refeicoes && p.refeicoes.length
      ? p.refeicoes.map(mealHTML).join("")
      : '<div class="rx-empty">Refeições deste plano não detalhadas nesta demonstração.</div>';
    box.innerHTML =
      '<div class="rx-dhead">' +
        '<span class="rx-card__av ' + (p.cor === "vinho" ? "vinho" : "") + '" style="width:48px;height:48px">' + esc(p.iniciais) + '</span>' +
        '<div><div class="rx-dhead__tit">' + esc(p.paciente) + '</div>' +
        '<div class="rx-dhead__sub">' + esc(p.objetivo) + ' · ' + p.kcal + ' kcal/dia</div></div>' +
        '<div class="rx-dhead__actions"><button class="btn btn--ghost">Duplicar</button>' +
          '<button class="btn btn--outline" type="button" data-pdf="' + esc(p.id) + '">🖨️ Gerar PDF</button>' +
          '<button class="btn btn--primary">Editar plano</button></div>' +
      '</div>' +
      '<div class="rx-macros">' +
        '<div class="macro"><div class="macro__v">' + mc.cho + '%</div><div class="macro__l">Carboidrato</div></div>' +
        '<div class="macro"><div class="macro__v">' + mc.ptn + '%</div><div class="macro__l">Proteína</div></div>' +
        '<div class="macro"><div class="macro__v">' + mc.lip + '%</div><div class="macro__l">Gordura</div></div>' +
        '<div class="macro"><div class="macro__v">' + p.adesao + '%</div><div class="macro__l">Adesão</div></div>' +
      '</div>' +
      '<div class="rx-bar"><i class="cho" style="width:' + mc.cho + '%"></i><i class="ptn" style="width:' + mc.ptn + '%"></i><i class="lip" style="width:' + mc.lip + '%"></i></div>' +
      refs;
  }

  function select(id) {
    var p = (D.planos || []).filter(function (x) { return x.id === id; })[0];
    document.querySelectorAll(".rx-card").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-id") === id);
    });
    renderDetail(p);
  }

  /* ---------- Gerar PDF da prescrição (usa a identidade da nutri) ---------- */
  // Monta o corpo do documento no formato do motor NutriDoc (classes doc-*).
  function corpoPrescricao(p) {
    var mc = p.macros || {};
    var macros =
      '<div class="doc-macros">' +
        '<div class="doc-macro"><div class="doc-macro__v">' + (mc.cho || 0) + '%</div><div class="doc-macro__l">Carboidrato</div></div>' +
        '<div class="doc-macro"><div class="doc-macro__v">' + (mc.ptn || 0) + '%</div><div class="doc-macro__l">Proteína</div></div>' +
        '<div class="doc-macro"><div class="doc-macro__v">' + (mc.lip || 0) + '%</div><div class="doc-macro__l">Gordura</div></div>' +
        '<div class="doc-macro"><div class="doc-macro__v">' + (p.kcal || 0) + '</div><div class="doc-macro__l">kcal/dia</div></div>' +
      '</div>';

    var refs = (p.refeicoes || []).map(function (m) {
      var tot = (m.itens || []).reduce(function (a, i) { return a + (i.kcal || 0); }, 0);
      var itens = (m.itens || []).map(function (i) {
        return '<div class="doc-meal__item"><span>' + esc(i.alimento) + '</span>' +
          '<span class="doc-meal__qt">' + esc(i.qtd) + '</span></div>';
      }).join("");
      return '<div class="doc-meal"><div class="doc-meal__head">' +
        '<span class="doc-meal__nome">' + esc(m.nome) + '</span>' +
        '<span class="doc-meal__hora">' + esc(m.hora) + '</span>' +
        '<span class="doc-meal__kcal">' + tot + ' kcal</span></div>' + itens + '</div>';
    }).join("");

    if (!refs) refs = '<div class="doc-note">Refeições detalhadas serão adicionadas ao editar o plano.</div>';

    return '<h2>Objetivo: ' + esc(p.objetivo || "—") + '</h2>' + macros + refs +
      '<div class="doc-note">💡 Beba água ao longo do dia e respeite os horários das refeições. ' +
      'Em caso de dúvidas, entre em contato pelo canal informado no cabeçalho.</div>';
  }

  function gerarPDF(id) {
    if (!window.NutriDoc) { alert("Motor de documento indisponível."); return; }
    var p = (D.planos || []).filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    window.NutriDoc.imprimir(perfil, {
      tipo: "Prescrição Nutricional",
      paciente: p.paciente,
      data: hoje(),
      bodyHTML: corpoPrescricao(p)
    });
  }

  /* Modelos */
  function renderModelos() {
    var box = el("rx-modelos-grid");
    if (!box) return;
    box.innerHTML = (D.modelos || []).map(function (m) {
      return '<div class="mod"><span class="mod__tag">' + esc(m.tag) + '</span>' +
        '<div class="mod__nome">' + esc(m.nome) + '</div>' +
        '<div class="mod__desc">' + esc(m.desc) + '</div>' +
        '<div class="mod__usos">Usado em ' + m.usos + ' planos</div></div>';
    }).join("");
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
    renderModelos();
    var first = (D.planos || [])[0];
    if (first) select(first.id);
    var search = el("rx-search-input");
    if (search) search.addEventListener("input", function () { renderList(search.value); });
    initMobileNav();

    // Botão "Gerar PDF" no detalhe (delegação — o detalhe é repintado).
    var detail = el("rx-detail");
    if (detail) detail.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pdf]");
      if (b) gerarPDF(b.getAttribute("data-pdf"));
    });

    // Carrega a identidade da nutri para aplicar nos PDFs (offline → usa padrão).
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) { perfil = p; }).catch(function () {});
    }
  });
})();
