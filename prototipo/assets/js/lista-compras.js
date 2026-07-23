/* ============================================================
   LISTA DE COMPRAS — gerada automaticamente a partir de um plano
   alimentar. Soma os alimentos de todas as refeições, agrupa por
   seção de mercado (grupo TACO → corredor) e mostra a quantidade
   consolidada. Usada em 3 lugares:
     • painel da nutri (abaixo do plano)   → ListaCompras.htmlNutri(plano)
     • PDF do plano (via NutriDoc)          → ListaCompras.pdfHTML(plano)
     • portal do paciente (com check)       → ListaCompras.htmlPortal(plano, marcas, readonly)
   Também expõe as dicas de congelamento/porcionamento de marmita.
   window.ListaCompras.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function r0(n) { return Math.round(n); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  var AL = window.ALIMENTOS || [];
  var AL_BY_ID = {}, AL_BY_NOME = {};
  AL.forEach(function (a) { AL_BY_ID[a.id] = a; AL_BY_NOME[a.nome.toLowerCase()] = a; });

  /* grupo TACO → corredor de mercado (ordem = ordem de exibição) */
  var CORREDORES = [
    { key: "hortifruti", ico: "🥬", label: "Hortifrúti", grupos: ["Verduras, hortaliças e derivados", "Frutas e derivados"] },
    { key: "carnes", ico: "🥩", label: "Açougue & peixaria", grupos: ["Carnes e derivados", "Pescados e frutos do mar"] },
    { key: "ovos", ico: "🥚", label: "Ovos", grupos: ["Ovos e derivados"] },
    { key: "laticinios", ico: "🧀", label: "Laticínios & frios", grupos: ["Leite e derivados"] },
    { key: "mercearia", ico: "🌾", label: "Mercearia (grãos, cereais)", grupos: ["Cereais e derivados", "Leguminosas e derivados"] },
    { key: "oleos", ico: "🫒", label: "Óleos, azeites & temperos", grupos: ["Óleos e gorduras", "Miscelâneas", "Alimentos preparados"] },
    { key: "nozes", ico: "🥜", label: "Castanhas & sementes", grupos: ["Nozes e sementes"] },
    { key: "acucar", ico: "🍯", label: "Açúcares & doces", grupos: ["Açúcares e produtos de confeitaria", "Bebidas (alcoólicas e não alcoólicas)"] }
  ];
  var GRUPO2CORR = {};
  CORREDORES.forEach(function (c) { c.grupos.forEach(function (g) { GRUPO2CORR[g] = c.key; }); });
  var OUTROS = { key: "outros", ico: "🛒", label: "Outros" };

  function alimentoDe(it) {
    if (it.alimentoId != null && AL_BY_ID[it.alimentoId]) return AL_BY_ID[it.alimentoId];
    if (it.alimento && AL_BY_NOME[it.alimento.toLowerCase()]) return AL_BY_NOME[it.alimento.toLowerCase()];
    return null;
  }

  // Soma os itens do plano por alimento; devolve corredores ordenados com itens.
  function gerar(plano) {
    var mapa = {}; // chave -> { nome, grupo, gramas, medidas:{medida:qtd} }
    (plano && plano.refeicoes || []).forEach(function (rf) {
      (rf.itens || []).forEach(function (it) {
        var nome = it.alimento || (it.nome) || "";
        if (!nome.trim()) return;
        var al = alimentoDe(it);
        var chave = al ? ("id" + al.id) : ("n" + nome.toLowerCase());
        if (!mapa[chave]) mapa[chave] = { nome: al ? al.nome : nome, grupo: al ? al.grupo : null, gramas: 0, medidas: {} };
        var reg = mapa[chave];
        reg.gramas += (+it.gramas || 0);
        var med = it.medida || "grama", qtd = +it.qtd || 0;
        if (med !== "grama" && qtd) reg.medidas[med] = (reg.medidas[med] || 0) + qtd;
      });
    });

    var buckets = {};
    Object.keys(mapa).forEach(function (k) {
      var reg = mapa[k];
      var corr = (reg.grupo && GRUPO2CORR[reg.grupo]) || OUTROS.key;
      (buckets[corr] = buckets[corr] || []).push(reg);
    });

    var out = [];
    CORREDORES.concat([OUTROS]).forEach(function (c) {
      var itens = buckets[c.key];
      if (!itens || !itens.length) return;
      itens.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
      out.push({ key: c.key, ico: c.ico, label: c.label, itens: itens.map(finalizaItem) });
    });
    return { corredores: out, totalItens: Object.keys(mapa).length };
  }

  // Texto amigável de quantidade: "3 unidades · 150 g" ou "≈ 320 g".
  function qtdTexto(reg) {
    var partes = [];
    Object.keys(reg.medidas).forEach(function (m) {
      var q = reg.medidas[m];
      partes.push(r1(q) + " " + m + (q > 1 && !/s$|colher|fatia|pires|concha/.test(m) ? "s" : ""));
    });
    var g = r0(reg.gramas);
    if (partes.length) return partes.join(" · ") + (g ? " · " + g + " g" : "");
    return "≈ " + g + " g";
  }
  function finalizaItem(reg) {
    return { nome: reg.nome, qtd: qtdTexto(reg), slug: slug(reg.nome), gramas: r0(reg.gramas) };
  }

  /* ---------- Dicas de congelamento & porcionamento de marmita ---------- */
  var DICAS = [
    { ico: "❄️", t: "Congele em porções individuais", d: "Divida em potes do tamanho de uma refeição antes de congelar. Assim você descongela só o que vai comer e evita recongelar." },
    { ico: "🍚", t: "Resfrie antes de fechar", d: "Deixe a comida esfriar até a temperatura ambiente (máx. 1–2 h fora) antes de tampar e levar ao freezer. Fechar quente cria gelo e umidade." },
    { ico: "🏷️", t: "Etiquete com data", d: "Escreva o nome e a data no pote. Congelados caseiros duram bem por até 3 meses; arroz e feijão, até 3 meses; carnes cozidas, 2–3 meses." },
    { ico: "🥦", t: "Legumes: branqueie", d: "Ferva os legumes por 2–3 min e mergulhe em água gelada antes de congelar. Conserva cor, textura e nutrientes." },
    { ico: "🍗", t: "Separe proteína e carboidrato", d: "Congele arroz, feijão e a proteína em potes separados. Na hora, você monta a marmita do jeito que quiser." },
    { ico: "🔥", t: "Descongele na geladeira", d: "Passe do freezer para a geladeira na véspera. Requentar bem (fervura/vapor no micro-ondas com tampa) garante segurança." },
    { ico: "🥣", t: "Potes certos", d: "Use potes de vidro ou plástico livre de BPA, próprios para freezer e micro-ondas. Deixe 1–2 cm de folga: a comida expande ao congelar." },
    { ico: "🚫", t: "O que NÃO congela bem", d: "Folhas cruas (alface), batata cozida inteira, ovo cozido e preparações com muita maionese perdem textura. Prefira consumir frescos." }
  ];
  function dicasHTML(compact) {
    var cards = DICAS.map(function (d) {
      return '<div class="lc-dica"><span class="lc-dica__ico">' + d.ico + '</span>' +
        '<div><strong>' + esc(d.t) + '</strong><p>' + esc(d.d) + '</p></div></div>';
    }).join("");
    return '<div class="lc-dicas' + (compact ? " lc-dicas--compact" : "") + '">' +
      '<h3 class="lc-dicas__tit">🍱 Marmita sem erro — congelamento & porcionamento</h3>' +
      '<div class="lc-dicas__grid">' + cards + '</div></div>';
  }

  /* ---------- Render: painel da nutri ---------- */
  function corredoresHTML(lista, opts) {
    opts = opts || {};
    if (!lista.totalItens) return '<div class="empty-state">Adicione alimentos ao plano para gerar a lista de compras.</div>';
    return lista.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        if (opts.check) {
          var key = "compra:" + it.slug;
          var done = opts.marcas && opts.marcas[key] === true;
          return '<li class="lc-item lc-item--check"><label><input type="checkbox" data-check="' + esc(key) + '"' +
            (done ? " checked" : "") + (opts.readonly ? " disabled" : "") + '>' +
            '<span class="lc-item__nome">' + esc(it.nome) + '</span>' +
            '<span class="lc-item__qt">' + esc(it.qtd) + '</span></label></li>';
        }
        return '<li class="lc-item"><span class="lc-item__nome">' + esc(it.nome) + '</span>' +
          '<span class="lc-item__qt">' + esc(it.qtd) + '</span></li>';
      }).join("");
      return '<div class="lc-corr"><div class="lc-corr__head"><span class="lc-corr__ico">' + c.ico + '</span>' +
        '<span class="lc-corr__label">' + esc(c.label) + '</span>' +
        '<span class="lc-corr__n">' + c.itens.length + '</span></div>' +
        '<ul class="lc-list">' + itens + '</ul></div>';
    }).join("");
  }

  function htmlNutri(plano) {
    var lista = gerar(plano);
    return '<section class="fsec lc-sec">' +
      '<div class="fsec__head"><h2 class="fsec__title">🛒 Lista de compras</h2>' +
        '<span class="lc-badge">' + lista.totalItens + ' itens · gerada do plano</span></div>' +
      '<p class="pl-hint">Consolidada automaticamente a partir das refeições. Vai junto quando você libera o plano para o paciente.</p>' +
      '<div class="lc-cols">' + corredoresHTML(lista) + '</div>' +
      dicasHTML(true) +
      '</section>';
  }

  /* ---------- Render: portal do paciente (com check) ---------- */
  function htmlPortal(plano, marcas, readonly) {
    var lista = gerar(plano);
    if (!lista.totalItens) return "";
    return '<div class="pcard lc-portal">' +
      '<div class="lc-portal__head"><h3>🛒 Sua lista de compras</h3>' +
        '<span class="pcard__meta">' + lista.totalItens + ' itens</span></div>' +
      '<p class="pcard__hint">Marque o que já tem em casa. A lista sai do seu plano alimentar.</p>' +
      '<div class="lc-cols">' + corredoresHTML(lista, { check: true, marcas: marcas, readonly: readonly }) + '</div>' +
      dicasHTML(false) +
      '</div>';
  }

  /* ---------- Render: PDF (classes doc-*) ---------- */
  function pdfHTML(plano) {
    var lista = gerar(plano);
    if (!lista.totalItens) return "";
    var corr = lista.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        return '<div class="doc-lc__item"><span>' + esc(it.nome) + '</span><span class="doc-lc__qt">' + esc(it.qtd) + '</span></div>';
      }).join("");
      return '<div class="doc-lc__corr"><div class="doc-lc__corrhead">' + c.ico + ' ' + esc(c.label) + '</div>' + itens + '</div>';
    }).join("");
    var dicas = DICAS.slice(0, 6).map(function (d) {
      return '<div class="doc-lc__dica"><strong>' + d.ico + ' ' + esc(d.t) + '</strong> ' + esc(d.d) + '</div>';
    }).join("");
    return '<div class="doc-pagebreak"></div>' +
      '<h2>🛒 Lista de compras</h2>' +
      '<div class="doc-lc">' + corr + '</div>' +
      '<h2 style="margin-top:14px">🍱 Marmita sem erro — congelamento & porcionamento</h2>' +
      '<div class="doc-lc__dicas">' + dicas + '</div>';
  }

  window.ListaCompras = {
    gerar: gerar, htmlNutri: htmlNutri, htmlPortal: htmlPortal, pdfHTML: pdfHTML, dicasHTML: dicasHTML
  };
})();
