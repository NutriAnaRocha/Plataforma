/* ============================================================
   RECEITAS DO PACIENTE — a nutri liga/desliga receita a receita o que
   aparece no portal daquela paciente. Guardado em paciente_receitas
   (migração 0058); a RLS deixa o paciente ler só as liberadas para ele.

   Os ingredientes das receitas liberadas entram na lista de compras do
   plano (ver lista-compras.js).

   window.ReceitasPaciente = { render, wire }   → ficha da nutri
   window.ReceitasView     = { carregar, portalHTML, wire }  → portal
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var CAT_LABEL = { "cafe-lanche": "Café & lanches", "refeicao": "Refeições", "doce": "Doces fit", "bebida": "Bebidas" };
  var CAT_ICO = { "cafe-lanche": "🥪", "refeicao": "🍲", "doce": "🍫", "bebida": "🥤" };
  var CAT_ORDEM = ["refeicao", "cafe-lanche", "doce", "bebida"];

  function metaLinha(o) {
    var p = [];
    if (o.tempo_min) p.push("⏱ " + o.tempo_min + " min");
    if (o.porcoes) p.push("🍽 " + o.porcoes);
    if (o.kcal_porcao) p.push("🔥 " + o.kcal_porcao + " kcal");
    if (o.proteina_g > 0) p.push("💪 " + o.proteina_g + " g proteína");
    return p.join(" · ");
  }

  /* ---------- Dados ---------- */
  function db() { return window.NutriDBReady; }

  function listarReceitas() {
    return db().then(function (c) {
      return c.from("ic_receitas_minhas").select("*").order("categoria").order("nome");
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return r.data || [];
    });
  }

  function listarLiberadas(pacienteId) {
    return db().then(function (c) {
      return c.from("paciente_receitas").select("receita_id").eq("paciente_id", pacienteId);
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return (r.data || []).map(function (x) { return x.receita_id; });
    });
  }

  function liberar(pacienteId, receitaId) {
    return db().then(function (c) {
      return c.from("paciente_receitas").insert({ paciente_id: pacienteId, receita_id: receitaId });
    }).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }

  /* Liberar de uma vez o que está na tela. Liberar receita a receita é o
     certo quando são poucas; com o catálogo inteiro filtrado por categoria
     vira trabalho manual repetido — e foi por isso que o portal da paciente
     ficou sem receita nenhuma. upsert com ignoreDuplicates: reclicar não
     estoura por chave duplicada. */
  function liberarVarias(pacienteId, ids) {
    if (!ids.length) return Promise.resolve();
    return db().then(function (c) {
      return c.from("paciente_receitas").upsert(
        ids.map(function (id) { return { paciente_id: pacienteId, receita_id: id }; }),
        { onConflict: "paciente_id,receita_id", ignoreDuplicates: true }
      );
    }).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }

  function ocultarVarias(pacienteId, ids) {
    if (!ids.length) return Promise.resolve();
    return db().then(function (c) {
      return c.from("paciente_receitas").delete()
        .eq("paciente_id", pacienteId).in("receita_id", ids);
    }).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }

  function ocultar(pacienteId, receitaId) {
    return db().then(function (c) {
      return c.from("paciente_receitas").delete()
        .eq("paciente_id", pacienteId).eq("receita_id", receitaId);
    }).then(function (r) { if (r.error) throw new Error(r.error.message); });
  }

  // Receitas liberadas COM o conteúdo — usada pelo portal e pela lista de compras.
  function carregar(pacienteId) {
    return db().then(function (c) {
      return c.from("paciente_receitas")
        .select("receita_id, ic_receitas(*)")
        .eq("paciente_id", pacienteId);
    }).then(function (r) {
      if (r.error) return [];
      return (r.data || []).map(function (x) { return x.ic_receitas; }).filter(Boolean)
        .sort(function (a, b) {
          var ca = CAT_ORDEM.indexOf(a.categoria), cb = CAT_ORDEM.indexOf(b.categoria);
          if (ca !== cb) return ca - cb;
          return (a.nome || "").localeCompare(b.nome || "");
        });
    }).catch(function () { return []; });
  }

  /* ============================================================
     LADO DA NUTRI — seção "Receitas" na ficha do paciente
     ============================================================ */
  var _p = null, _ctx = null, _todas = [], _lib = {}, _termo = "", _cat = "todas";

  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function root() { return document.getElementById("rcp-root"); }

  function render(p) {
    return '<section class="fsec"><div class="fsec__head">' +
      '<h2 class="fsec__title">🍳 Receitas do paciente</h2></div>' +
      '<p class="pl-hint">Ligue as receitas que esta paciente deve ver no portal. ' +
      'Os ingredientes das receitas liberadas entram na lista de compras dela.</p>' +
      '<div id="rcp-root"><div class="empty-state">Carregando receitas…</div></div></section>';
  }

  function barraHTML() {
    var n = Object.keys(_lib).length;
    var chips = ['<button class="rcp-chip' + (_cat === "todas" ? " is-active" : "") + '" data-rcp-cat="todas" type="button">Todas</button>'];
    CAT_ORDEM.forEach(function (k) {
      chips.push('<button class="rcp-chip' + (_cat === k ? " is-active" : "") + '" data-rcp-cat="' + k + '" type="button">' +
        CAT_ICO[k] + " " + esc(CAT_LABEL[k]) + "</button>");
    });
    chips.push('<button class="rcp-chip' + (_cat === "liberadas" ? " is-active" : "") + '" data-rcp-cat="liberadas" type="button">✓ Liberadas' +
      (n ? ' <span class="rcp-chip__n">' + n + "</span>" : "") + "</button>");
    return '<div class="rcp-bar">' +
      '<div class="rcp-search">🔍<input type="search" data-rcp-busca placeholder="Buscar receita ou ingrediente…" ' +
        'value="' + esc(_termo) + '" aria-label="Buscar receita" /></div>' +
      '<div class="rcp-chips">' + chips.join("") + "</div></div>";
  }

  function filtradas() {
    var t = _termo.trim().toLowerCase();
    return _todas.filter(function (o) {
      if (_cat === "liberadas") { if (!_lib[o.id]) return false; }
      else if (_cat !== "todas" && o.categoria !== _cat) return false;
      if (!t) return true;
      return [o.nome, o.resumo, (o.tags || []).join(" "), (o.ingredientes || []).join(" ")]
        .join(" ").toLowerCase().indexOf(t) !== -1;
    });
  }

  function itemHTML(o) {
    var on = !!_lib[o.id];
    return '<li class="rcp-item' + (on ? " is-on" : "") + '" data-rcp-id="' + esc(o.id) + '">' +
      '<div class="rcp-item__info">' +
        '<div class="rcp-item__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? ' <span class="rcp-selo">minha</span>' : "") + "</div>" +
        (metaLinha(o) ? '<div class="rcp-item__meta">' + esc(metaLinha(o)) + "</div>" : "") +
      "</div>" +
      '<button class="pl-switch' + (on ? " pl-switch--on" : "") + '" type="button" role="switch" ' +
        'aria-checked="' + on + '" data-rcp-toggle="' + esc(o.id) + '" ' +
        'title="' + (on ? "Liberada — clique para ocultar" : "Oculta — clique para liberar") + '">' +
        '<span class="pl-switch__knob"></span><span class="pl-switch__lbl">' + (on ? "Liberada" : "Oculta") + "</span></button>" +
      "</li>";
  }

  function listaHTML() {
    var lista = filtradas();
    if (!lista.length) return '<div class="empty-state">Nenhuma receita encontrada.</div>';
    var n = Object.keys(_lib).length;
    var faltam = lista.filter(function (o) { return !_lib[o.id]; }).length;
    var acao = faltam
      ? '<button class="rcp-lote" type="button" data-rcp-lote="liberar">Liberar as ' + faltam + ' desta lista</button>'
      : '<button class="rcp-lote rcp-lote--off" type="button" data-rcp-lote="ocultar">Ocultar as ' + lista.length + ' desta lista</button>';
    return '<div class="rcp-count-linha">' +
      '<p class="rcp-count">' + lista.length + (lista.length === 1 ? " receita" : " receitas") +
      " · " + n + " liberada" + (n === 1 ? "" : "s") + " para " + esc((_p.nome || "").split(/\s+/)[0]) + "</p>" +
      acao + '</div>' +
      '<ul class="rcp-list">' + lista.map(itemHTML).join("") + "</ul>";
  }

  function pintar() {
    var r = root(); if (!r) return;
    r.innerHTML = barraHTML() + listaHTML();
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    _termo = ""; _cat = "todas";
    if (!root()) return;
    Promise.all([listarReceitas(), listarLiberadas(p.id)]).then(function (res) {
      _todas = res[0];
      _lib = {};
      res[1].forEach(function (id) { _lib[id] = true; });
      pintar();
    }).catch(function (e) {
      var r = root();
      if (r) r.innerHTML = '<div class="empty-state">Não consegui carregar as receitas. ' + esc(e.message || "") + "</div>";
    });

    var host = root();
    host.addEventListener("click", function (ev) {
      var tg = ev.target.closest("[data-rcp-toggle]");
      if (tg) { alternar(tg.getAttribute("data-rcp-toggle"), tg); return; }
      var ch = ev.target.closest("[data-rcp-cat]");
      if (ch) { _cat = ch.getAttribute("data-rcp-cat"); pintar(); return; }
      var lote = ev.target.closest("[data-rcp-lote]");
      if (lote) { emLote(lote.getAttribute("data-rcp-lote") === "liberar", lote); return; }
    });
    var t;
    host.addEventListener("input", function (ev) {
      if (!ev.target.matches("[data-rcp-busca]")) return;
      var v = ev.target.value;
      clearTimeout(t);
      t = setTimeout(function () {
        _termo = v;
        var r = root(); if (!r) return;
        // Só a lista é repintada: repintar a barra roubaria o foco do campo.
        var lista = r.querySelector(".rcp-list") || r.querySelector(".empty-state");
        var tmp = document.createElement("div");
        tmp.innerHTML = listaHTML();
        var count = r.querySelector(".rcp-count");
        if (count) count.remove();
        if (lista) lista.replaceWith.apply(lista, Array.prototype.slice.call(tmp.childNodes));
      }, 200);
    });
  }

  function alternar(id, btn) {
    var on = !!_lib[id];
    btn.disabled = true;
    var acao = on ? ocultar(_p.id, id) : liberar(_p.id, id);
    acao.then(function () {
      if (on) delete _lib[id]; else _lib[id] = true;
      pintar();
      toast(on ? "Receita ocultada do portal" : "Receita liberada para o paciente");
    }).catch(function (e) {
      btn.disabled = false;
      toast("Não consegui salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  // Age só sobre o que está filtrado na tela — o que a nutri está vendo é
  // exatamente o que muda.
  function emLote(liberando, btn) {
    var alvo = filtradas().filter(function (o) { return liberando ? !_lib[o.id] : !!_lib[o.id]; })
                          .map(function (o) { return o.id; });
    if (!alvo.length) return;
    if (!liberando && !window.confirm("Ocultar " + alvo.length + " receitas do portal do paciente?")) return;
    btn.disabled = true;
    btn.textContent = liberando ? "Liberando…" : "Ocultando…";
    (liberando ? liberarVarias(_p.id, alvo) : ocultarVarias(_p.id, alvo)).then(function () {
      alvo.forEach(function (id) { if (liberando) _lib[id] = true; else delete _lib[id]; });
      pintar();
      toast(alvo.length + (liberando ? " receitas liberadas para o paciente" : " receitas ocultadas"));
    }).catch(function (e) {
      btn.disabled = false;
      toast("Não consegui salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  /* ============================================================
     LADO DO PACIENTE — aba "Receitas" no portal
     ============================================================ */
  function cardHTML(o, idx) {
    var ingr = (o.ingredientes || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    var passos = (o.modo_preparo || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    return '<article class="rcv-card" data-rcv-card="' + idx + '">' +
      '<button class="rcv-card__head" type="button" data-rcv-abrir="' + idx + '" aria-expanded="false">' +
        '<span class="rcv-card__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) + "</span>" +
        (metaLinha(o) ? '<span class="rcv-card__meta">' + esc(metaLinha(o)) + "</span>" : "") +
        '<span class="rcv-card__seta" aria-hidden="true">▾</span>' +
      "</button>" +
      '<div class="rcv-card__corpo" hidden>' +
        (o.resumo ? '<p class="rcv-resumo">' + esc(o.resumo) + "</p>" : "") +
        (ingr ? '<h4 class="rcv-sec">🧺 Ingredientes</h4><ul class="rcv-ingr">' + ingr + "</ul>" : "") +
        (passos ? '<h4 class="rcv-sec">👩‍🍳 Modo de preparo</h4><ol class="rcv-passos">' + passos + "</ol>" : "") +
        (o.dica ? '<p class="rcv-dica">💡 ' + esc(o.dica) + "</p>" : "") +
        (o.atencao ? '<p class="rcv-atencao">⚠️ ' + esc(o.atencao) + "</p>" : "") +
      "</div></article>";
  }

  function portalHTML(receitas) {
    receitas = receitas || [];
    if (!receitas.length) {
      return '<div class="pcard"><div class="empty-state">Sua nutricionista ainda não liberou receitas para você. 🍳</div></div>';
    }
    var porCat = {};
    receitas.forEach(function (o) { (porCat[o.categoria] = porCat[o.categoria] || []).push(o); });
    var i = 0;
    var blocos = CAT_ORDEM.filter(function (k) { return porCat[k]; }).map(function (k) {
      var cards = porCat[k].map(function (o) { return cardHTML(o, i++); }).join("");
      return '<div class="pcard"><h3 class="rcv-grupo">' + CAT_ICO[k] + " " + esc(CAT_LABEL[k]) + "</h3>" + cards + "</div>";
    }).join("");
    return '<div class="pcard pcard--head"><h2>🍳 Minhas receitas</h2>' +
      '<p class="pcard__hint">' + receitas.length + (receitas.length === 1 ? " receita escolhida" : " receitas escolhidas") +
      ' para você. Os ingredientes já entram na sua lista de compras. 💜</p></div>' + blocos;
  }

  function wirePortal(paneId) {
    var pane = document.getElementById(paneId || "pane-receitas");
    if (!pane) return;
    pane.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-rcv-abrir]");
      if (!b) return;
      var card = b.closest(".rcv-card");
      var corpo = card.querySelector(".rcv-card__corpo");
      var abrir = corpo.hidden;
      corpo.hidden = !abrir;
      card.classList.toggle("is-open", abrir);
      b.setAttribute("aria-expanded", abrir ? "true" : "false");
    });
  }

  window.ReceitasPaciente = { render: render, wire: wire };
  window.ReceitasView = { carregar: carregar, portalHTML: portalHTML, wire: wirePortal };
})();
