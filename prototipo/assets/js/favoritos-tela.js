/* ============================================================
   TELA "MEUS FAVORITOS" — reúne o que a nutri estrelou nos módulos.
   Os favoritos que apontam para o banco (receita/orientação/formulação/
   protocolo) são resolvidos em uma consulta por tipo; os modelos de
   anamnese e de plano vivem no código, então usam o rótulo gravado na
   hora de favoritar.
   Depende de favoritos.js.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function $(s) { return document.querySelector(s); }

  var F = window.Favoritos;

  // Resolve os refs de um tipo em { id: {nome, slug} }.
  function resolver(tipo, refs) {
    var cfg = F.TIPOS[tipo];
    if (!cfg.tabela || !refs.length) return Promise.resolve({});
    return window.NutriDBReady.then(function (c) {
      return c.from(cfg.tabela).select("id,nome,slug").in("id", refs);
    }).then(function (r) {
      var mapa = {};
      if (!r.error) (r.data || []).forEach(function (o) { mapa[o.id] = o; });
      return mapa;
    }).catch(function () { return {}; });
  }

  function itemHTML(tipo, ref, nome, href) {
    var cfg = F.TIPOS[tipo];
    return '<li class="fav-item">' +
      (href
        ? '<a class="fav-item__link" href="' + esc(href) + '">' + cfg.ico + " " + esc(nome) + "</a>"
        : '<span class="fav-item__link fav-item__link--off">' + cfg.ico + " " + esc(nome) + "</span>") +
      '<button class="fav-tirar" type="button" data-fav-tipo="' + esc(tipo) + '" data-fav-ref="' + esc(ref) + '" ' +
        'title="Tirar dos favoritos" aria-label="Tirar dos favoritos">★</button></li>';
  }

  function blocoHTML(tipo, itens) {
    var cfg = F.TIPOS[tipo];
    return '<section class="fav-bloco">' +
      '<h2 class="fav-bloco__t">' + cfg.ico + " " + esc(cfg.label) +
        '<span class="fav-bloco__n">' + itens.length + "</span></h2>" +
      '<ul class="fav-lista">' + itens.join("") + "</ul></section>";
  }

  function vazioHTML() {
    return '<div class="fav-vazio">' +
      '<span class="fav-vazio__ico">⭐</span>' +
      '<h2 class="fav-vazio__t">Você ainda não favoritou nada</h2>' +
      '<p class="fav-vazio__d">Abra uma receita, orientação, formulação ou protocolo e clique em ' +
      '<b>☆ Favoritar</b>. O que você marcar aparece aqui, para achar sem procurar.</p>' +
      '<div class="fav-vazio__acoes">' +
        '<a class="btn btn--primary" href="receitas.html">🍳 Receitas</a>' +
        '<a class="btn btn--outline" href="orientacoes.html">📄 Orientações</a>' +
        '<a class="btn btn--outline" href="formulacoes.html">⚗️ Formulações</a>' +
        '<a class="btn btn--outline" href="protocolos.html">📑 Protocolos</a>' +
      "</div></div>";
  }

  function pintar(resolvidos) {
    var blocos = [];
    F.ORDEM.forEach(function (tipo) {
      var favs = F.listar(tipo);
      if (!favs.length) return;
      var cfg = F.TIPOS[tipo];
      var mapa = resolvidos[tipo] || {};
      var itens = favs.map(function (f) {
        var o = mapa[f.ref];
        // Sem tabela (modelo do código) ou item apagado: vale o rótulo gravado.
        var nome = (o && o.nome) || f.rotulo || "(item removido)";
        var href = null;
        if (o && cfg.param && o.slug) href = cfg.pagina + "?" + cfg.param + "=" + encodeURIComponent(o.slug);
        else if (!cfg.tabela) href = cfg.pagina;
        return itemHTML(tipo, f.ref, nome, href);
      });
      blocos.push(blocoHTML(tipo, itens));
    });
    $("#fav-tela").innerHTML = blocos.length ? '<div class="fav-grid">' + blocos.join("") + "</div>" : vazioHTML();
  }

  function carregarTudo() {
    return F.carregar().then(function () {
      var tipos = F.ORDEM.filter(function (t) { return F.listar(t).length && F.TIPOS[t].tabela; });
      return Promise.all(tipos.map(function (t) {
        return resolver(t, F.listar(t).map(function (f) { return f.ref; }))
          .then(function (m) { return { tipo: t, mapa: m }; });
      })).then(function (res) {
        var out = {};
        res.forEach(function (r) { out[r.tipo] = r.mapa; });
        return out;
      });
    }).then(pintar);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.Favoritos) return;
    carregarTudo().catch(function () {
      $("#fav-tela").innerHTML = '<div class="empty-state">Não consegui carregar seus favoritos. Recarregue a página.</div>';
    });
  });

  // Tirou a estrela aqui dentro: some da lista na hora.
  document.addEventListener("favorito:mudou", function () { carregarTudo(); });
})();
