/* ============================================================
   PRESCRIÇÕES (consolidado) — agrega os planos alimentares REAIS de
   todos os pacientes (window.NutriPacientes → p.plano.planos[], a
   biblioteca gravada pelo módulo Planejamento Alimentar do prontuário).
   Sem banco (file://) ou sem planos, mostra estado-vazio honesto —
   nada de pacientes ou planos fabricados.
   ============================================================ */
(function () {
  "use strict";
  var perfil = null;   // identidade da nutri (para os PDFs) — carregada no init
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function hoje() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function r0(n) { return Math.round(n || 0); }

  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    return (((p[0] || "")[0] || "") + (p.length > 1 ? (p[p.length - 1][0] || "") : "")).toUpperCase() || "?";
  }

  /* ---------- totais/macros a partir dos itens gravados ---------- */
  function totaisDe(pl) {
    var t = { kcal: 0, cho: 0, ptn: 0, lip: 0 };
    (pl.refeicoes || []).forEach(function (r) {
      (r.itens || []).forEach(function (i) {
        t.kcal += (+i.kcal || 0); t.cho += (+i.cho || 0);
        t.ptn += (+i.ptn || 0); t.lip += (+i.lip || 0);
      });
    });
    return t;
  }
  function pctMacros(t) {
    var k = t.cho * 4 + t.ptn * 4 + t.lip * 9;
    if (k <= 0) return { cho: 0, ptn: 0, lip: 0 };
    return { cho: r0(t.cho * 4 / k * 100), ptn: r0(t.ptn * 4 / k * 100), lip: r0(t.lip * 9 / k * 100) };
  }
  function kcalRefeicao(m) {
    return r0((m.itens || []).reduce(function (a, i) { return a + (+i.kcal || 0); }, 0));
  }

  var registros = [];   // planos achatados de todos os pacientes

  /* ---------- Achata os planos de todos os pacientes ----------
     Aceita os dois formatos gravados pelo prontuário: a biblioteca nova
     (plano.planos[]) e o plano único antigo (plano.refeicoes no topo). */
  function planosDoPaciente(p) {
    var pl = p && p.plano;
    if (!pl) return [];
    if (Array.isArray(pl.planos) && pl.planos.length) return pl.planos;
    if ((pl.refeicoes && pl.refeicoes.length) || pl.titulo) return [pl];
    return [];
  }

  function achatar(pacientes) {
    var out = [];
    (pacientes || []).forEach(function (p) {
      planosDoPaciente(p).forEach(function (pl, i) {
        if (!pl || typeof pl !== "object") return;
        var t = totaisDe(pl);
        out.push({
          id: p.id + ":" + (pl.id || ("i" + i)),
          pid: p.id,
          paciente: p.nome || "Paciente",
          iniciais: p.ini || iniciais(p.nome),
          titulo: pl.titulo || "Plano alimentar",
          objetivo: pl.objetivo || p.objetivo || "—",
          publicado: pl.publicado !== false,
          kcal: r0(t.kcal),
          metaKcal: pl.metaKcal || "",
          macros: pctMacros(t),
          adesao: (p.adesao == null ? null : p.adesao),
          atualizado: pl.atualizadoEm || "",
          refeicoes: pl.refeicoes || []
        });
      });
    });
    return out;
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var box = el("rx-kpis"); if (!box) return;
    var liberados = registros.filter(function (r) { return r.publicado; }).length;
    var pacientes = {}; registros.forEach(function (r) { pacientes[r.pid] = 1; });
    var modelos = ((window.PlanoAlimentar && window.PlanoAlimentar.MODELOS) || []).length;
    var k = [
      [registros.length, "Planos criados"],
      [liberados, "Liberados no portal"],
      [Object.keys(pacientes).length, "Pacientes com plano"],
      [modelos, "Modelos disponíveis"]
    ];
    box.innerHTML = k.map(function (x) {
      return '<div class="rx-kpi"><div class="rx-kpi__n">' + x[0] + '</div><div class="rx-kpi__l">' + x[1] + '</div></div>';
    }).join("");
  }

  /* ---------- Lista de planos ---------- */
  function cardHTML(p) {
    var st = p.publicado ? "ativo" : "revisar";
    var lbl = p.publicado ? "Liberado" : "Oculto";
    var meta = p.kcal + " kcal" + (p.atualizado ? '<span class="rx-up">· ' + esc(p.atualizado) + "</span>" : "");
    return '<div class="rx-card" data-id="' + esc(p.id) + '">' +
      '<span class="rx-card__av vinho">' + esc(p.iniciais) + '</span>' +
      '<div><div class="rx-card__nome">' + esc(p.paciente) + '</div>' +
      '<div class="rx-card__obj">' + esc(p.titulo) + '</div>' +
      '<div class="rx-card__meta"><span class="rx-kcal">' + meta + '</span></div></div>' +
      '<div class="rx-right"><span class="st-pill ' + st + '">' + lbl + '</span>' +
      (p.adesao == null ? "" : '<span class="rx-ades">Adesão <b>' + p.adesao + '%</b></span>') +
      '</div>' +
      '</div>';
  }

  function renderList(filtro) {
    var box = el("rx-list"); if (!box) return;
    var planos = registros;
    if (filtro) {
      var f = filtro.toLowerCase();
      planos = planos.filter(function (p) {
        return (p.paciente || "").toLowerCase().indexOf(f) > -1 ||
          (p.objetivo || "").toLowerCase().indexOf(f) > -1 ||
          (p.titulo || "").toLowerCase().indexOf(f) > -1;
      });
    }
    box.innerHTML = planos.length ? planos.map(cardHTML).join("") :
      '<div class="rx-empty">' + (registros.length ? "Nenhum plano encontrado."
        : "Você ainda não montou planos alimentares. Eles aparecem aqui ao serem criados na ficha do paciente, em <strong>Planejamento Alimentar</strong>.") + '</div>';
    box.querySelectorAll(".rx-card").forEach(function (c) {
      c.addEventListener("click", function () { select(c.getAttribute("data-id")); });
    });
  }

  /* ---------- Detalhe ---------- */
  function mealHTML(m) {
    var itens = (m.itens || []).map(function (i) {
      var qt = (i.qtd != null ? i.qtd : "") + " " + (i.medida || "");
      if (i.gramas) qt += " (" + r0(i.gramas) + " g)";
      return '<div class="meal__item"><span class="meal__nm">' + esc(window.NomeAlimento ? window.NomeAlimento.doItem(i) : i.alimento) + '</span>' +
        '<span class="meal__qt">' + esc(qt.trim()) + '</span>' +
        '<span class="meal__kc">' + r0(i.kcal) + ' kcal</span></div>';
    }).join("");
    return '<div class="meal"><div class="meal__head">' +
      '<span class="meal__hora">' + esc(m.hora || "") + '</span>' +
      '<span class="meal__nome">' + esc(m.nome || "Refeição") + '</span>' +
      '<span class="meal__kcal">' + kcalRefeicao(m) + ' kcal</span></div>' + itens + '</div>';
  }

  function renderDetail(p) {
    var box = el("rx-detail"); if (!box) return;
    if (!p) {
      box.innerHTML = '<div class="rx-empty">' + (registros.length
        ? "Selecione um plano à esquerda para visualizar."
        : "Nenhum plano para exibir ainda.") + "</div>";
      return;
    }
    var mc = p.macros || {};
    var refs = p.refeicoes && p.refeicoes.length
      ? p.refeicoes.map(mealHTML).join("")
      : '<div class="rx-empty">Este plano ainda não tem refeições montadas.</div>';
    box.innerHTML =
      '<div class="rx-dhead">' +
        '<span class="rx-card__av vinho" style="width:48px;height:48px">' + esc(p.iniciais) + '</span>' +
        '<div><div class="rx-dhead__tit">' + esc(p.paciente) + '</div>' +
        '<div class="rx-dhead__sub">' + esc(p.titulo) + ' · ' + p.kcal + ' kcal/dia' +
          (p.publicado ? "" : " · oculto para o paciente") + '</div></div>' +
        '<div class="rx-dhead__actions">' +
          '<button class="btn btn--outline" type="button" data-view="' + esc(p.id) + '">👁️ Visualizar</button>' +
          '<a class="btn btn--outline" href="pacientes.html?id=' + encodeURIComponent(p.pid) + '&sec=plano">✏️ Editar</a>' +
          '<button class="btn btn--primary" type="button" data-pdf="' + esc(p.id) + '">🖨️ Gerar PDF</button>' +
        '</div>' +
      '</div>' +
      '<div class="rx-macros">' +
        '<div class="macro"><div class="macro__v">' + mc.cho + '%</div><div class="macro__l">Carboidrato</div></div>' +
        '<div class="macro"><div class="macro__v">' + mc.ptn + '%</div><div class="macro__l">Proteína</div></div>' +
        '<div class="macro"><div class="macro__v">' + mc.lip + '%</div><div class="macro__l">Gordura</div></div>' +
        '<div class="macro"><div class="macro__v">' + (p.metaKcal ? esc(p.metaKcal) : p.kcal) + '</div><div class="macro__l">' + (p.metaKcal ? "Meta kcal" : "kcal/dia") + '</div></div>' +
      '</div>' +
      '<div class="rx-bar"><i class="cho" style="width:' + mc.cho + '%"></i><i class="ptn" style="width:' + mc.ptn + '%"></i><i class="lip" style="width:' + mc.lip + '%"></i></div>' +
      refs;
  }

  function select(id) {
    var p = registros.filter(function (x) { return x.id === id; })[0];
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
      var itens = (m.itens || []).map(function (i) {
        var qt = (i.qtd != null ? i.qtd : "") + " " + (i.medida || "");
        if (i.gramas) qt += " (" + r0(i.gramas) + " g)";
        return '<div class="doc-meal__item"><span>' + esc(window.NomeAlimento ? window.NomeAlimento.doItem(i) : i.alimento) + '</span>' +
          '<span class="doc-meal__qt">' + esc(qt.trim()) + '</span></div>';
      }).join("");
      return '<div class="doc-meal"><div class="doc-meal__head">' +
        '<span class="doc-meal__nome">' + esc(m.nome || "Refeição") + '</span>' +
        '<span class="doc-meal__hora">' + esc(m.hora || "") + '</span>' +
        '<span class="doc-meal__kcal">' + kcalRefeicao(m) + ' kcal</span></div>' + itens + '</div>';
    }).join("");

    if (!refs) refs = '<div class="doc-note">Este plano ainda não tem refeições montadas.</div>';

    return '<h2>' + esc(p.titulo || "Plano alimentar") + '</h2>' +
      (p.objetivo && p.objetivo !== "—" ? '<p class="doc-note">Objetivo: ' + esc(p.objetivo) + "</p>" : "") +
      macros + refs +
      '<div class="doc-note">💡 Beba água ao longo do dia e respeite os horários das refeições. ' +
      'Em caso de dúvidas, entre em contato pelo canal informado no cabeçalho.</div>';
  }

  function docSpec(p) {
    return {
      tipo: "Prescrição Nutricional",
      paciente: p.paciente,
      data: hoje(),
      bodyHTML: corpoPrescricao(p)
    };
  }
  function acaoDoc(id, modo) {
    if (!window.NutriDoc) { alert("Motor de documento indisponível."); return; }
    var p = registros.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (modo === "view") window.NutriDoc.visualizar(perfil, docSpec(p));
    else window.NutriDoc.imprimir(perfil, docSpec(p));
  }

  /* ---------- Modelos (catálogo real do montador de planos) ---------- */
  function renderModelos() {
    var box = el("rx-modelos-grid"); if (!box) return;
    var modelos = (window.PlanoAlimentar && window.PlanoAlimentar.MODELOS) || [];
    if (!modelos.length) { box.innerHTML = '<div class="rx-empty">Catálogo de modelos indisponível.</div>'; return; }
    box.innerHTML = modelos.map(function (m) {
      // Uso real: planos já criados a partir deste modelo (mesmo objetivo).
      var usos = registros.filter(function (r) { return r.objetivo === m.objetivo; }).length;
      var kcals = Object.keys(m.variacoes || {});
      return '<div class="mod"><span class="mod__tag">' + esc(m.ico || "🥗") + " " +
        (kcals.length ? esc(kcals.join(" · ")) + " kcal" : "modelo") + '</span>' +
        '<div class="mod__nome">' + esc(m.nome) + '</div>' +
        '<div class="mod__desc">' + esc(m.desc || m.objetivo || "") + '</div>' +
        '<div class="mod__usos">' + (usos ? "Usado em " + usos + (usos > 1 ? " planos" : " plano") : "Ainda não usado") + '</div></div>';
    }).join("");
  }

  /* ---------- Carga ---------- */
  function renderAll() {
    renderKpis();
    renderList(el("rx-search-input") ? el("rx-search-input").value : "");
    renderModelos();
    if (registros.length) select(registros[0].id); else renderDetail(null);
  }

  function loadReal() {
    if (!window.NutriPacientes) { renderAll(); return; }
    window.NutriPacientes.list().then(function (pacientes) {
      registros = achatar(pacientes || []);
      renderAll();
    }).catch(function () { registros = []; renderAll(); });
  }

  /* Menu mobile */
  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Casca inicial honesta enquanto o banco carrega.
    renderKpis(); renderDetail(null); renderModelos();
    var search = el("rx-search-input");
    if (search) search.addEventListener("input", function () { renderList(search.value); });
    initMobileNav();

    // Ações do detalhe (delegação — o detalhe é repintado): Visualizar / Gerar PDF.
    var detail = el("rx-detail");
    if (detail) detail.addEventListener("click", function (e) {
      var view = e.target.closest("[data-view]");
      if (view) { acaoDoc(view.getAttribute("data-view"), "view"); return; }
      var pdf = e.target.closest("[data-pdf]");
      if (pdf) { acaoDoc(pdf.getAttribute("data-pdf"), "pdf"); return; }
    });

    // Carrega a identidade da nutri para aplicar nos PDFs (offline → usa padrão).
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) { perfil = p; }).catch(function () {});
    }
    loadReal();
  });
})();
