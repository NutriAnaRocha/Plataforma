/* ============================================================
   ORIENTAÇÕES DO PACIENTE — seção do prontuário.
   Anexa orientações (da Biblioteca de Orientações ou escritas do zero)
   ao paciente, gera PDF com a marca da nutri e guarda o histórico.

   Guardadas em pacientes.orientacoes (jsonb array) via NutriPacientes.
   A biblioteca vem de ic_orientacoes_minhas (base + as da nutri).
   ============================================================ */
(function () {
  "use strict";

  var _p = null, _ctx = null, _lib = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function hojeISO() { return new Date().toISOString().slice(0, 10); }
  function fmtData(iso) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || ""); }
  function uid() { return "o" + Date.now() + Math.floor(Math.random() * 1000); }
  function secWrap(t, inner) { return '<section class="fsec"><h2 class="fsec__title">' + esc(t) + "</h2>" + inner + "</section>"; }

  var CAT_LABEL = { condicao: "Condição", tecnica: "Técnica", geral: "Geral", custom: "Minha" };

  // "# Título" abre bloco; demais linhas viram itens.
  function textoToBlocos(texto) {
    var blocos = [], atual = null;
    (texto || "").split(/\r?\n/).forEach(function (l) {
      l = l.trim(); if (!l) return;
      if (l.indexOf("# ") === 0) { atual = { titulo: l.slice(2).trim(), itens: [] }; blocos.push(atual); }
      else { if (!atual) { atual = { titulo: "", itens: [] }; blocos.push(atual); } atual.itens.push(l.replace(/^[-•*]\s*/, "")); }
    });
    return blocos;
  }

  function blocosHTML(o) {
    return (o.blocos || []).map(function (b) {
      var itens = (b.itens || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
      return '<div class="op-bloco">' + (b.titulo ? '<div class="op-bloco__t">' + esc(b.titulo) + "</div>" : "") +
        "<ul>" + itens + "</ul></div>";
    }).join("");
  }

  function cardHTML(o) {
    return '<div class="op-card" data-id="' + esc(o.id) + '">' +
      '<div class="op-card__head"><div>' +
        '<div class="op-card__t">' + esc(o.titulo) + "</div>" +
        '<div class="op-card__meta">' + esc(CAT_LABEL[o.categoria] || "") +
          (o.categoria ? " · " : "") + "anexada em " + fmtData(o.data) + "</div>" +
      "</div><div class=\"op-card__acts\">" +
        '<button class="btn btn--ghost" data-op-pdf="' + esc(o.id) + '" type="button">📄 PDF</button>' +
        '<button class="btn btn--ghost" data-op-rm="' + esc(o.id) + '" type="button">Remover</button>' +
      "</div></div>" +
      (o.resumo ? '<p class="op-card__resumo">' + esc(o.resumo) + "</p>" : "") +
      blocosHTML(o) +
      (o.dica ? '<div class="op-dica">💡 ' + esc(o.dica) + "</div>" : "") +
    "</div>";
  }

  function render(p) {
    _p = p;
    var lista = (p.orientacoes || []).slice().sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); });
    var toolbar = '<div class="op-bar">' +
      '<button class="btn btn--primary" id="op-add" type="button">＋ Da biblioteca</button>' +
      '<button class="btn btn--ghost" id="op-custom" type="button">✍️ Escrever do zero</button>' +
    "</div>";
    var atuais = lista.length ? lista.map(cardHTML).join("")
      : '<div class="empty-state">Nenhuma orientação anexada. Puxe da sua biblioteca ou escreva do zero — o PDF sai com a sua marca.</div>';
    var hist = lista.length
      ? '<div class="ilist">' + lista.map(function (o) {
          return '<div class="iitem"><span class="iitem__ico">📄</span>' +
            '<div class="iitem__info"><div class="iitem__title">' + esc(o.titulo) + "</div>" +
            '<div class="iitem__date">' + fmtData(o.data) + "</div></div>" +
            '<button class="btn btn--ghost" data-op-pdf="' + esc(o.id) + '" type="button">PDF</button></div>';
        }).join("") + "</div>"
      : '<div class="empty-state">Ainda não há histórico.</div>';
    return secWrap("Orientações atuais", toolbar + '<div class="op-list">' + atuais + "</div>") +
           secWrap("Histórico de orientações", hist);
  }

  /* ---------- Persistência ---------- */
  function salvar(lista) {
    return window.NutriPacientes.saveOrientacoes(_p.id, lista);
  }
  function attach(item) {
    var lista = (_p.orientacoes || []).concat([item]);
    if (_ctx.toast) _ctx.toast("Anexando…");
    salvar(lista).then(function (saved) {
      if (_ctx.onSaved) _ctx.onSaved(saved);
      if (_ctx.toast) _ctx.toast("Orientação anexada");
    }).catch(function (e) { if (_ctx.toast) _ctx.toast("Não consegui anexar. " + (e && e.message || ""), true); });
  }
  function remover(id) {
    if (!confirm("Remover esta orientação do paciente?")) return;
    var lista = (_p.orientacoes || []).filter(function (o) { return o.id !== id; });
    salvar(lista).then(function (saved) {
      if (_ctx.onSaved) _ctx.onSaved(saved);
      if (_ctx.toast) _ctx.toast("Removida");
    }).catch(function (e) { if (_ctx.toast) _ctx.toast("Não consegui remover. " + (e && e.message || ""), true); });
  }

  /* ---------- PDF com a marca ---------- */
  function gerarPDF(o) {
    if (!window.NutriDoc) { if (_ctx.toast) _ctx.toast("Motor de documento indisponível.", true); return; }
    var body = (o.resumo ? "<p>" + esc(o.resumo) + "</p>" : "") +
      (o.blocos || []).map(function (b) {
        return (b.titulo ? "<h2>" + esc(b.titulo) + "</h2>" : "") +
          "<ul>" + (b.itens || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
      }).join("") +
      (o.dica ? '<div class="doc-note">💡 ' + esc(o.dica) + "</div>" : "");
    window.NutriDoc.imprimir(_ctx.perfil || {}, {
      tipo: "Orientação Nutricional", paciente: _p.nome, data: fmtData(o.data) || fmtData(hojeISO()), bodyHTML: body
    });
  }

  /* ---------- Picker da biblioteca ---------- */
  function abrirPicker() {
    var host = document.getElementById("ficha-main");
    if (!host) return;
    var ov = document.createElement("div");
    ov.className = "op-modal"; ov.id = "op-modal";
    ov.innerHTML =
      '<div class="op-modal__box"><div class="op-modal__head"><b>Anexar da biblioteca</b>' +
      '<button class="op-modal__x" id="op-modal-x" type="button" aria-label="Fechar">✕</button></div>' +
      '<input class="op-modal__busca" id="op-modal-busca" type="search" placeholder="Buscar orientação…" autocomplete="off" />' +
      '<div class="op-modal__list" id="op-modal-list"><div class="empty-state">Carregando…</div></div></div>';
    host.appendChild(ov);
    document.getElementById("op-modal-busca").focus();

    function pintar() {
      var t = (document.getElementById("op-modal-busca").value || "").toLowerCase();
      var arr = (_lib || []).filter(function (o) {
        if (!t) return true;
        return (o.nome + " " + (o.resumo || "") + " " + (o.sinonimos || []).join(" ")).toLowerCase().indexOf(t) !== -1;
      });
      document.getElementById("op-modal-list").innerHTML = arr.length ? arr.map(function (o) {
        return '<button class="op-pick" data-op-pick="' + esc(o.slug) + '" type="button">' +
          '<span class="op-pick__t">' + esc(o.nome) + (o.editavel ? ' <span class="bc-selo">minha</span>' : "") + "</span>" +
          '<span class="op-pick__d">' + esc(o.resumo || "") + "</span></button>";
      }).join("") : '<div class="empty-state">Nada encontrado.</div>';
    }

    function carregarLib() {
      if (_lib) { pintar(); return; }
      window.NutriDBReady.then(function (db) {
        return db.from("ic_orientacoes_minhas").select("*").order("categoria").order("nome");
      }).then(function (r) {
        _lib = (r && r.data) || [];
        pintar();
      }).catch(function () {
        document.getElementById("op-modal-list").innerHTML = '<div class="empty-state">Não consegui carregar a biblioteca.</div>';
      });
    }
    carregarLib();

    ov.addEventListener("input", function (e) { if (e.target.id === "op-modal-busca") pintar(); });
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("#op-modal-x")) { ov.remove(); return; }
      var pick = e.target.closest("[data-op-pick]");
      if (pick) {
        var slug = pick.getAttribute("data-op-pick");
        var o = (_lib || []).find(function (x) { return x.slug === slug; });
        if (o) {
          attach({
            id: uid(), titulo: o.nome, origem_slug: o.slug, categoria: o.categoria,
            resumo: o.resumo || "", blocos: o.blocos || [], dica: o.dica_pratica || null, data: hojeISO()
          });
        }
        ov.remove();
      }
    });
  }

  /* ---------- Escrever do zero ---------- */
  function abrirCustom() {
    var host = document.getElementById("ficha-main");
    if (!host) return;
    var ov = document.createElement("div");
    ov.className = "op-modal"; ov.id = "op-modal";
    ov.innerHTML =
      '<div class="op-modal__box"><div class="op-modal__head"><b>Escrever orientação</b>' +
      '<button class="op-modal__x" id="op-modal-x" type="button" aria-label="Fechar">✕</button></div>' +
      '<form id="op-form" class="op-form">' +
        '<label>Título<input name="titulo" required placeholder="Ex.: Orientações para o refluxo" /></label>' +
        '<label>Resumo (opcional)<input name="resumo" placeholder="Uma linha" /></label>' +
        '<label>Conteúdo <span class="op-hint">“# Título” abre um bloco; cada linha vira um item.</span>' +
          '<textarea name="conteudo" rows="9" placeholder="# Rotina&#10;Coma devagar&#10;Evite deitar após comer"></textarea></label>' +
        '<label>Dica (opcional)<input name="dica" placeholder="Um destaque prático" /></label>' +
        '<div class="op-form__acts"><button class="btn btn--primary" type="submit">Anexar</button>' +
          '<button class="btn btn--ghost" type="button" id="op-modal-x2">Cancelar</button></div>' +
      "</form></div>";
    host.appendChild(ov);
    var nome = ov.querySelector('[name="titulo"]'); if (nome) nome.focus();

    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("#op-modal-x") || e.target.closest("#op-modal-x2")) ov.remove();
    });
    ov.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var titulo = (fd.get("titulo") || "").trim();
      if (!titulo) return;
      attach({
        id: uid(), titulo: titulo, origem_slug: null, categoria: "custom",
        resumo: (fd.get("resumo") || "").trim(), blocos: textoToBlocos(fd.get("conteudo") || ""),
        dica: (fd.get("dica") || "").trim() || null, data: hojeISO()
      });
      ov.remove();
    });
  }

  /* ---------- Fiação ---------- */
  function onClick(ev) {
    if (ev.target.closest("#op-add")) { abrirPicker(); return; }
    if (ev.target.closest("#op-custom")) { abrirCustom(); return; }
    var pdf = ev.target.closest("[data-op-pdf]");
    if (pdf) { var o = (_p.orientacoes || []).find(function (x) { return x.id === pdf.getAttribute("data-op-pdf"); }); if (o) gerarPDF(o); return; }
    var rm = ev.target.closest("[data-op-rm]");
    if (rm) { remover(rm.getAttribute("data-op-rm")); return; }
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    var main = document.getElementById("ficha-main");
    if (main && !main._opWired) { main.addEventListener("click", onClick); main._opWired = true; }
  }

  window.OrientacoesPaciente = { render: render, wire: wire };
})();
