/* ============================================================
   BIBLIOTECA DE RECEITAS — fit e práticas, para anexar ao plano.
   Mesmo modelo das outras telas da IC: lê ic_receitas_minhas
   (base + minhas), editar uma base duplica antes (copy-on-write),
   e a Ana cria as suas do zero.

   Listas (ingredientes / modo de preparo) são editadas em texto:
   uma linha por item.
   ============================================================ */
(function () {
  "use strict";

  var db = null;
  var todos = [];
  var catAtiva = "todos";
  var termo = "";
  var selecionado = null;

  var CAT_LABEL = { "cafe-lanche": "Café & lanches", "refeicao": "Refeições", "doce": "Doces fit", "bebida": "Bebidas" };
  var CAT_ICO = { "cafe-lanche": "🥪", "refeicao": "🍲", "doce": "🍫", "bebida": "🥤" };

  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function arrToTexto(a) { return (a || []).join("\n"); }
  function textoToArr(t) {
    return (t || "").split(/\r?\n/).map(function (l) {
      return l.trim().replace(/^[-•*\d.)\s]+/, "").trim();
    }).filter(Boolean);
  }

  async function carregar() {
    db = await window.NutriDBReady;
    var r = await db.from("ic_receitas_minhas").select("*").order("categoria").order("nome");
    if (r.error) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">⚠️</span>' +
        '<div class="bc-vazio__t">Não consegui carregar as receitas</div>' +
        '<div class="bc-vazio__d">' + esc(r.error.message) + "</div></div>";
      return;
    }
    todos = r.data || [];
    renderCats();
    render();

    var slug = new URLSearchParams(location.search).get("receita");
    if (slug) {
      var alvo = todos.find(function (o) { return o.slug === slug; });
      if (alvo) abrirDetalhe(alvo.id);
    }
  }

  function filtrados() {
    var t = termo.trim().toLowerCase();
    return todos.filter(function (o) {
      if (catAtiva !== "todos" && o.categoria !== catAtiva) return false;
      if (!t) return true;
      var alvo = [
        o.nome, o.resumo, o.dica,
        (o.tags || []).join(" "),
        (o.sinonimos || []).join(" "),
        (o.ingredientes || []).join(" ")
      ].join(" ").toLowerCase();
      return alvo.indexOf(t) !== -1;
    });
  }

  function renderCats() {
    var mapa = {};
    todos.forEach(function (o) { mapa[o.categoria] = (mapa[o.categoria] || 0) + 1; });
    var html = '<button class="bc-chip' + (catAtiva === "todos" ? " is-active" : "") +
      '" data-g="todos" type="button">Todas<span class="bc-chip__n">' + todos.length + "</span></button>";
    Object.keys(CAT_LABEL).forEach(function (g) {
      if (!mapa[g]) return;
      html += '<button class="bc-chip' + (catAtiva === g ? " is-active" : "") +
        '" data-g="' + esc(g) + '" type="button">' + esc(CAT_LABEL[g]) +
        '<span class="bc-chip__n">' + mapa[g] + "</span></button>";
    });
    $("#bc-grupos").innerHTML = html;
  }

  function metaLinha(o) {
    var p = [];
    if (o.tempo_min) p.push("⏱ " + o.tempo_min + " min");
    if (o.porcoes) p.push("🍽 " + esc(o.porcoes));
    if (o.kcal_porcao) p.push("🔥 " + o.kcal_porcao + " kcal");
    return p.join(" · ");
  }

  function render() {
    var lista = filtrados();
    $("#bc-count").textContent =
      lista.length + (lista.length === 1 ? " receita" : " receitas") +
      (catAtiva !== "todos" ? " · " + (CAT_LABEL[catAtiva] || catAtiva) : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou crie uma nova receita.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (o) {
      return '<button class="bc-item' + (selecionado === o.id ? " is-active" : "") +
        '" data-id="' + o.id + '" type="button">' +
        '<div class="bc-item__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? '<span class="bc-selo">minha</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + (o.tempo_min ? o.tempo_min + " min" : esc(CAT_LABEL[o.categoria] || "")) + "</span>" +
          (o.kcal_porcao ? "<span>" + o.kcal_porcao + " kcal</span>" : "") +
        "</div></button>";
    }).join("");
  }

  function detalhe(o) {
    var tags = (o.tags || []).map(function (t) { return '<span class="rc-tag">' + esc(t) + "</span>"; }).join("");
    var ingr = (o.ingredientes || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    var passos = (o.modo_preparo || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? ' <span class="bc-selo">minha</span>' : "") + "</div>" +
        '<div class="bc-d__sub">' + esc(CAT_LABEL[o.categoria] || o.categoria) +
          (metaLinha(o) ? " · " + metaLinha(o) : "") + "</div>" +
      "</div>" +
      '<div class="bc-d__acoes">' +
        '<button class="btn btn--ghost" id="rc-copiar" type="button">📋 Copiar receita</button>' +
        '<button class="btn btn--ghost" id="bc-editar" type="button">✏️ Editar</button>' +
      "</div></div>" +

      (o.resumo ? '<div class="bc-sec"><p class="or-resumo">' + esc(o.resumo) + "</p></div>" : "") +
      (tags ? '<div class="bc-sec rc-tags">' + tags + "</div>" : "") +

      (ingr ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🧺</span> Ingredientes</div>' +
        '<ul class="rc-ingr">' + ingr + "</ul></div>" : "") +

      (passos ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">👩‍🍳</span> Modo de preparo</div>' +
        '<ol class="rc-passos">' + passos + "</ol></div>" : "") +

      (o.dica ? '<div class="bc-sec or-dica"><div class="bc-sec__t"><span class="ico">💡</span> Dica</div><p>' +
        esc(o.dica) + "</p></div>" : "") +

      (o.atencao ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">⚠️</span> Observação</div><p>' +
        esc(o.atencao) + "</p></div>" : "") +

      (o.notas_pessoais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📝</span> Minhas notas</div><p>' +
        esc(o.notas_pessoais) + "</p></div>" : "") +

      '<div class="bc-rodape">Receita de apoio. Ajuste porções e ingredientes ao paciente.</div>';
  }

  function textoReceita(o) {
    var l = [o.nome.toUpperCase()];
    if (o.resumo) l.push(o.resumo);
    if (metaLinha(o)) l.push(metaLinha(o).replace(/[⏱🍽🔥]/g, "").replace(/\s+·\s+/g, " · ").trim());
    l.push("");
    l.push("Ingredientes:");
    (o.ingredientes || []).forEach(function (i) { l.push("• " + i); });
    l.push("");
    l.push("Modo de preparo:");
    (o.modo_preparo || []).forEach(function (p, idx) { l.push((idx + 1) + ". " + p); });
    if (o.dica) { l.push(""); l.push("Dica: " + o.dica); }
    return l.join("\n");
  }

  function abrirDetalhe(id) {
    selecionado = id;
    var o = todos.find(function (x) { return x.id === id; });
    if (!o) return;
    var el = $("#bc-detail");
    el.innerHTML = detalhe(o);
    el.classList.add("is-open");
    $(".bc-grid").classList.add("has-selection");
    el.scrollTop = 0;
    render();
  }

  function formEdicao(o) {
    var campo = function (label, name, valor, linhas, hint) {
      return '<div class="bc-sec"><div class="bc-sec__t">' + esc(label) +
        (hint ? ' <span class="or-hint">' + esc(hint) + "</span>" : "") + "</div>" +
        '<textarea name="' + name + '" rows="' + (linhas || 3) + '">' + esc(valor || "") + "</textarea></div>";
    };
    var inputMini = function (label, name, valor) {
      return '<div class="rc-mini"><label>' + esc(label) + '</label>' +
        '<input class="or-input" name="' + name + '" value="' + esc(valor == null ? "" : valor) + '" /></div>';
    };
    var selCat = '<div class="bc-sec"><div class="bc-sec__t">Categoria</div><select name="categoria">' +
      Object.keys(CAT_LABEL).map(function (k) {
        return '<option value="' + k + '"' + (o.categoria === k ? " selected" : "") + ">" + esc(CAT_LABEL[k]) + "</option>";
      }).join("") + "</select></div>";
    var campoNome = o.editavel
      ? '<div class="bc-sec"><div class="bc-sec__t">Nome</div><input class="or-input" name="nome" value="' + esc(o.nome) + '" /></div>'
      : "";

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(o.nome) + "</div>" +
        '<div class="bc-d__sub">Editando</div></div></div>' +
      (o.editavel
        ? '<div class="bc-aviso">Esta já é a sua versão. As alterações valem só para você.</div>'
        : '<div class="bc-aviso">Esta é uma receita da base. Ao salvar, eu crio <b>uma cópia sua</b> e a base fica intacta.</div>') +
      '<form class="bc-edit" id="bc-form">' +
        campoNome +
        (o.editavel ? selCat : "") +
        campo("Resumo (1 linha)", "resumo", o.resumo, 2) +
        '<div class="rc-minis">' +
          inputMini("Porções", "porcoes", o.porcoes) +
          inputMini("Tempo (min)", "tempo_min", o.tempo_min) +
          inputMini("Kcal/porção", "kcal_porcao", o.kcal_porcao) +
        "</div>" +
        campo("Tags", "tags", (o.tags || []).join(", "), 1, "separadas por vírgula") +
        campo("Ingredientes", "ingredientes", arrToTexto(o.ingredientes), 8, "um por linha") +
        campo("Modo de preparo", "modo_preparo", arrToTexto(o.modo_preparo), 8, "um passo por linha") +
        campo("Dica", "dica", o.dica, 2) +
        campo("Observação (alérgeno etc.)", "atencao", o.atencao, 2) +
        campo("Minhas notas", "notas_pessoais", o.notas_pessoais, 2) +
        '<div class="bc-d__acoes">' +
          '<button class="btn btn--primary" type="submit">Salvar</button>' +
          '<button class="btn btn--ghost" type="button" id="bc-cancelar">Cancelar</button>' +
        "</div></form>";
  }

  function intOuNull(v) { v = parseInt(v, 10); return isNaN(v) ? null : v; }

  async function salvar(ev) {
    ev.preventDefault();
    var o = todos.find(function (x) { return x.id === selecionado; });
    if (!o) return;

    var fd = new FormData(ev.target);
    var patch = {
      resumo: (fd.get("resumo") || "").trim() || null,
      porcoes: (fd.get("porcoes") || "").trim() || null,
      tempo_min: intOuNull(fd.get("tempo_min")),
      kcal_porcao: intOuNull(fd.get("kcal_porcao")),
      tags: (fd.get("tags") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      ingredientes: textoToArr(fd.get("ingredientes")),
      modo_preparo: textoToArr(fd.get("modo_preparo")),
      dica: (fd.get("dica") || "").trim() || null,
      atencao: (fd.get("atencao") || "").trim() || null,
      notas_pessoais: (fd.get("notas_pessoais") || "").trim() || null
    };
    if (o.editavel) {
      if (fd.get("nome")) patch.nome = fd.get("nome").trim();
      if (fd.get("categoria")) patch.categoria = fd.get("categoria");
    }

    var botao = ev.target.querySelector('[type="submit"]');
    botao.disabled = true; botao.textContent = "Salvando…";

    var alvoId = o.id;
    if (!o.editavel) {
      var dup = await db.rpc("ic_receita_duplicar", { p_id: o.id });
      if (dup.error) {
        alert("Não consegui duplicar para edição: " + dup.error.message);
        botao.disabled = false; botao.textContent = "Salvar";
        return;
      }
      alvoId = dup.data;
    }

    var up = await db.from("ic_receitas").update(patch).eq("id", alvoId);
    if (up.error) {
      alert("Não consegui salvar: " + up.error.message);
      botao.disabled = false; botao.textContent = "Salvar";
      return;
    }
    await carregar();
    abrirDetalhe(alvoId);
  }

  async function novaReceita() {
    db = await window.NutriDBReady;
    var sess = await db.auth.getUser();
    var uid = sess && sess.data && sess.data.user && sess.data.user.id;
    if (!uid) { alert("Faça login para criar receitas."); return; }
    var ins = await db.from("ic_receitas").insert({
      nutricionista_id: uid,
      nome: "Nova receita",
      slug: "minha-" + Date.now(),
      categoria: "refeicao",
      resumo: "",
      ingredientes: [],
      modo_preparo: []
    }).select("id").single();
    if (ins.error) { alert("Não consegui criar: " + ins.error.message); return; }
    await carregar();
    abrirDetalhe(ins.data.id);
    $("#bc-detail").innerHTML = formEdicao(todos.find(function (x) { return x.id === ins.data.id; }));
  }

  async function copiar(o) {
    try {
      await navigator.clipboard.writeText(textoReceita(o));
      var b = $("#rc-copiar");
      if (b) { var t0 = b.textContent; b.textContent = "✓ Copiada"; setTimeout(function () { b.textContent = t0; }, 1500); }
    } catch (e) { alert("Não consegui copiar automaticamente."); }
  }

  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".bc-chip");
    if (chip) { catAtiva = chip.dataset.g; renderCats(); render(); return; }

    if (ev.target.closest("#rc-nova")) { novaReceita(); return; }

    var item = ev.target.closest(".bc-item");
    if (item) { abrirDetalhe(item.dataset.id); return; }

    if (ev.target.closest("#rc-copiar")) {
      var oc = todos.find(function (x) { return x.id === selecionado; });
      if (oc) copiar(oc);
      return;
    }
    if (ev.target.closest("#bc-editar")) {
      var o = todos.find(function (x) { return x.id === selecionado; });
      if (o) $("#bc-detail").innerHTML = formEdicao(o);
      return;
    }
    if (ev.target.closest("#bc-cancelar")) { abrirDetalhe(selecionado); return; }
    if (ev.target.closest("#bc-voltar")) {
      selecionado = null;
      $("#bc-detail").classList.remove("is-open");
      $(".bc-grid").classList.remove("has-selection");
      render();
      return;
    }
  });

  document.addEventListener("submit", function (ev) {
    if (ev.target.id === "bc-form") salvar(ev);
  });

  var t;
  document.addEventListener("input", function (ev) {
    if (ev.target.id !== "bc-busca") return;
    clearTimeout(t);
    t = setTimeout(function () { termo = ev.target.value; render(); }, 180);
  });

  document.addEventListener("DOMContentLoaded", function () {
    $("#bc-detail").innerHTML =
      '<div class="bc-vazio"><span class="bc-vazio__ico">🍳</span>' +
      '<div class="bc-vazio__t">Escolha uma receita</div>' +
      '<div class="bc-vazio__d">Receitas fit e práticas para anexar ao plano ou sugerir ao paciente. ' +
      "Edite qualquer uma ou crie a sua no botão “Nova receita”.</div></div>";
    carregar();
  });
})();
