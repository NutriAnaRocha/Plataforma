/* ============================================================
   MEUS FAVORITOS — a estrela da nutri (migração 0060).

   Cinco tipos, uma tabela: receita, orientacao, formulacao, protocolo
   (linhas do banco, ref = uuid) e anamnese/plano (modelos que vivem no
   código, ref = id textual).

   Nas quatro telas da Inteligência Clínica a estrela é INJETADA: todas
   renderizam o mesmo `.bc-d__acoes` no detalhe e marcam o item aberto
   com `.bc-item.is-active[data-id]`. Um observer no #bc-detail dispensa
   editar os quatro arquivos — e a próxima tela que seguir o padrão
   ganha a estrela de graça.

   window.Favoritos = { pronto, tem, alternar, listar, botaoHTML, wire }
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var TIPOS = {
    receita:    { ico: "🍳", label: "Receitas",    tabela: "ic_receitas_minhas",    pagina: "receitas.html",    param: "receita" },
    orientacao: { ico: "📄", label: "Orientações", tabela: "ic_orientacoes_minhas", pagina: "orientacoes.html", param: "orientacao" },
    formulacao: { ico: "⚗️", label: "Formulações", tabela: "ic_formulacoes_minhas", pagina: "formulacoes.html", param: "formulacao" },
    protocolo:  { ico: "📑", label: "Protocolos",  tabela: "ic_protocolos_meus",    pagina: "protocolos.html",  param: "protocolo" },
    anamnese:   { ico: "📝", label: "Modelos de anamnese", tabela: null, pagina: "pacientes.html", param: null },
    plano:      { ico: "🥗", label: "Modelos de plano",    tabela: null, pagina: "pacientes.html", param: null }
  };
  var ORDEM = ["anamnese", "plano", "receita", "orientacao", "formulacao", "protocolo"];

  var cache = null;              // { "tipo|ref": rotulo }
  var carregando = null;

  function chave(tipo, ref) { return tipo + "|" + ref; }

  function carregar() {
    if (cache) return Promise.resolve(cache);
    if (carregando) return carregando;
    carregando = window.NutriDBReady.then(function (c) {
      return c.from("nutri_favoritos").select("tipo,ref,rotulo,created_at").order("created_at");
    }).then(function (r) {
      cache = {};
      if (!r.error) (r.data || []).forEach(function (f) { cache[chave(f.tipo, f.ref)] = f.rotulo || ""; });
      return cache;
    }).catch(function () { cache = {}; return cache; });
    return carregando;
  }

  function tem(tipo, ref) { return !!(cache && Object.prototype.hasOwnProperty.call(cache, chave(tipo, ref))); }

  function alternar(tipo, ref, rotulo) {
    var on = tem(tipo, ref);
    return window.NutriDBReady.then(function (c) {
      if (on) {
        return c.from("nutri_favoritos").delete().eq("tipo", tipo).eq("ref", String(ref));
      }
      return c.from("nutri_favoritos").insert({ tipo: tipo, ref: String(ref), rotulo: rotulo || null });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      if (on) delete cache[chave(tipo, ref)]; else cache[chave(tipo, ref)] = rotulo || "";
      return !on;
    });
  }

  // Favoritos de um tipo, na ordem em que foram marcados.
  function listar(tipo) {
    if (!cache) return [];
    return Object.keys(cache)
      .filter(function (k) { return k.indexOf(tipo + "|") === 0; })
      .map(function (k) { return { ref: k.slice(tipo.length + 1), rotulo: cache[k] }; });
  }

  function botaoHTML(tipo, ref, rotulo) {
    var on = tem(tipo, ref);
    return '<button class="fav-btn' + (on ? " is-on" : "") + '" type="button" ' +
      'data-fav-tipo="' + esc(tipo) + '" data-fav-ref="' + esc(ref) + '" ' +
      'data-fav-rotulo="' + esc(rotulo || "") + '" ' +
      'aria-pressed="' + on + '" title="' + (on ? "Nos meus favoritos — clique para tirar" : "Marcar como favorito") + '">' +
      '<span class="fav-btn__ico" aria-hidden="true">' + (on ? "★" : "☆") + "</span>" +
      '<span class="fav-btn__lbl">' + (on ? "Favorita" : "Favoritar") + "</span></button>";
  }

  /* ---------- Clique na estrela (funciona em qualquer tela) ---------- */
  function wire() {
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-fav-tipo]");
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      var tipo = b.getAttribute("data-fav-tipo");
      var ref = b.getAttribute("data-fav-ref");
      var rotulo = b.getAttribute("data-fav-rotulo");
      b.disabled = true;
      alternar(tipo, ref, rotulo).then(function (ligado) {
        b.disabled = false;
        b.classList.toggle("is-on", ligado);
        b.setAttribute("aria-pressed", ligado ? "true" : "false");
        b.title = ligado ? "Nos meus favoritos — clique para tirar" : "Marcar como favorito";
        var ico = b.querySelector(".fav-btn__ico"), lbl = b.querySelector(".fav-btn__lbl");
        if (ico) ico.textContent = ligado ? "★" : "☆";
        if (lbl) lbl.textContent = ligado ? "Favorita" : "Favoritar";
        document.dispatchEvent(new CustomEvent("favorito:mudou", { detail: { tipo: tipo, ref: ref, ligado: ligado } }));
      }).catch(function () {
        b.disabled = false;
        alert("Não consegui salvar o favorito. Verifique a conexão.");
      });
    }, true);
  }

  /* ---------- Injeção nas telas da Inteligência Clínica ---------- */
  function tipoDaPagina() {
    var arq = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    var achado = null;
    Object.keys(TIPOS).forEach(function (t) {
      if (TIPOS[t].pagina === arq + ".html" && TIPOS[t].tabela) achado = t;
    });
    return achado;
  }

  function injetar(tipo) {
    var det = document.getElementById("bc-detail");
    if (!det) return;
    var acoes = det.querySelector(".bc-d__acoes");
    if (!acoes || acoes.querySelector("[data-fav-tipo]")) return;
    if (det.querySelector("#bc-form")) return;           // está editando: sem estrela
    var ativo = document.querySelector(".bc-item.is-active");
    if (!ativo) return;
    var ref = ativo.getAttribute("data-id");
    if (!ref) return;
    var nomeEl = det.querySelector(".bc-d__nome");
    var rotulo = nomeEl ? nomeEl.textContent.replace(/\s+/g, " ").trim() : "";
    acoes.insertAdjacentHTML("afterbegin", botaoHTML(tipo, ref, rotulo));
  }

  document.addEventListener("DOMContentLoaded", function () {
    wire();
    // O cache é carregado em toda tela: a ficha do paciente (modelos de
    // anamnese e de plano) desenha a estrela sem esperar consulta nenhuma.
    var pronto = carregar();
    var tipo = tipoDaPagina();
    var det = document.getElementById("bc-detail");
    if (!tipo || !det) return;
    pronto.then(function () {
      injetar(tipo);
      new MutationObserver(function () { injetar(tipo); }).observe(det, { childList: true, subtree: true });
    });
  });

  window.Favoritos = {
    TIPOS: TIPOS, ORDEM: ORDEM,
    carregar: carregar, tem: tem, alternar: alternar, listar: listar,
    botaoHTML: botaoHTML, wire: wire
  };
})();
