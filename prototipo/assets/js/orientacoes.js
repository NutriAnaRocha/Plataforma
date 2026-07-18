/* ============================================================
   BIBLIOTECA DE ORIENTAÇÕES — textos prontos para o paciente.
   Mesmo modelo da Biblioteca de Exames/Protocolos: lê
   ic_orientacoes_minhas (base + minhas), e editar uma base duplica
   antes (copy-on-write). A Ana também cria as suas do zero.

   Blocos são editados num formato amigável (sem JSON):
     linha "# Título"  abre um bloco
     demais linhas      viram itens (bullets) do bloco atual
   ============================================================ */
(function () {
  "use strict";

  var db = null;
  var todos = [];
  var catAtiva = "todos";
  var termo = "";
  var selecionado = null;

  var CAT_LABEL = { condicao: "Condições", tecnica: "Técnicas", geral: "Gerais" };
  var CAT_ICO = { condicao: "🩺", tecnica: "🍳", geral: "📄" };

  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---- blocos <-> texto amigável ----
  function blocosToTexto(blocos) {
    return (blocos || []).map(function (b) {
      return "# " + (b.titulo || "") + "\n" + (b.itens || []).join("\n");
    }).join("\n\n").trim();
  }
  function textoToBlocos(texto) {
    var blocos = [], atual = null;
    (texto || "").split(/\r?\n/).forEach(function (linha) {
      var l = linha.trim();
      if (!l) return;
      if (l.indexOf("# ") === 0) {
        atual = { titulo: l.slice(2).trim(), itens: [] };
        blocos.push(atual);
      } else {
        if (!atual) { atual = { titulo: "", itens: [] }; blocos.push(atual); }
        atual.itens.push(l.replace(/^[-•*]\s*/, ""));
      }
    });
    return blocos;
  }

  async function carregar() {
    db = await window.NutriDBReady;
    var r = await db.from("ic_orientacoes_minhas").select("*").order("categoria").order("nome");
    if (r.error) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">⚠️</span>' +
        '<div class="bc-vazio__t">Não consegui carregar as orientações</div>' +
        '<div class="bc-vazio__d">' + esc(r.error.message) + "</div></div>";
      return;
    }
    todos = r.data || [];
    renderCats();
    render();

    var slug = new URLSearchParams(location.search).get("orientacao");
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
        o.nome, o.resumo, o.grupo, o.eixo, o.dica_pratica,
        (o.sinonimos || []).join(" "),
        (o.blocos || []).map(function (b) {
          return (b.titulo || "") + " " + (b.itens || []).join(" ");
        }).join(" ")
      ].join(" ").toLowerCase();
      return alvo.indexOf(t) !== -1;
    });
  }

  function renderCats() {
    var mapa = {};
    todos.forEach(function (o) { mapa[o.categoria] = (mapa[o.categoria] || 0) + 1; });
    var html = '<button class="bc-chip' + (catAtiva === "todos" ? " is-active" : "") +
      '" data-g="todos" type="button">Todas<span class="bc-chip__n">' + todos.length + "</span></button>";
    Object.keys(mapa).sort().forEach(function (g) {
      html += '<button class="bc-chip' + (catAtiva === g ? " is-active" : "") +
        '" data-g="' + esc(g) + '" type="button">' + esc(CAT_LABEL[g] || g) +
        '<span class="bc-chip__n">' + mapa[g] + "</span></button>";
    });
    $("#bc-grupos").innerHTML = html;
  }

  function render() {
    var lista = filtrados();
    $("#bc-count").textContent =
      lista.length + (lista.length === 1 ? " orientação" : " orientações") +
      (catAtiva !== "todos" ? " · " + (CAT_LABEL[catAtiva] || catAtiva) : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou crie uma nova orientação.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (o) {
      return '<button class="bc-item' + (selecionado === o.id ? " is-active" : "") +
        '" data-id="' + o.id + '" type="button">' +
        '<div class="bc-item__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? '<span class="bc-selo">minha</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + esc(CAT_LABEL[o.categoria] || o.categoria) + "</span>" +
          '<span>' + (o.blocos || []).length + " blocos</span>" +
        "</div></button>";
    }).join("");
  }

  function detalhe(o) {
    var blocos = (o.blocos || []).map(function (b) {
      var itens = (b.itens || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
      return '<div class="or-bloco"><div class="or-bloco__t">' + esc(b.titulo || "") + "</div>" +
        "<ul>" + itens + "</ul></div>";
    }).join("");

    var refs = (o.referencias || []).map(function (r) {
      return "<li><b>" + esc(r.fonte) + (r.ano ? " (" + esc(r.ano) + ")" : "") + "</b>" +
        (r.detalhe ? " — " + esc(r.detalhe) : "") + "</li>";
    }).join("");

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? ' <span class="bc-selo">minha</span>' : "") + "</div>" +
        '<div class="bc-d__sub">' + esc(CAT_LABEL[o.categoria] || o.categoria) +
          (o.grupo ? " · " + esc(o.grupo) : "") +
          ((o.sinonimos || []).length ? " · " + esc(o.sinonimos.join(", ")) : "") + "</div>" +
      "</div>" +
      '<div class="bc-d__acoes">' +
        '<button class="btn btn--ghost" id="or-copiar" type="button">📋 Copiar texto</button>' +
        '<button class="btn btn--ghost" id="bc-editar" type="button">✏️ Editar</button>' +
      "</div></div>" +

      (o.resumo ? '<div class="bc-sec"><p class="or-resumo">' + esc(o.resumo) + "</p></div>" : "") +

      (blocos ? '<div class="bc-sec">' + blocos + "</div>" : "") +

      (o.dica_pratica ? '<div class="bc-sec or-dica"><div class="bc-sec__t"><span class="ico">💡</span> Dica prática</div><p>' +
        esc(o.dica_pratica) + "</p></div>" : "") +

      (o.atencao ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">⚠️</span> Atenção</div><p>' +
        esc(o.atencao) + "</p></div>" : "") +

      (refs ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📚</span> Referências</div>' +
        '<ul class="bc-refsci">' + refs + "</ul></div>" : "") +

      (o.notas_pessoais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📝</span> Minhas notas</div><p>' +
        esc(o.notas_pessoais) + "</p></div>" : "") +

      '<div class="bc-rodape">Orientação de apoio ao paciente. Ajuste ao caso antes de anexar ao plano.</div>';
  }

  // Texto puro para o botão "Copiar" (vai para o plano/WhatsApp).
  function textoPlano(o) {
    var linhas = [o.nome.toUpperCase()];
    if (o.resumo) linhas.push(o.resumo);
    (o.blocos || []).forEach(function (b) {
      linhas.push("");
      if (b.titulo) linhas.push(b.titulo);
      (b.itens || []).forEach(function (i) { linhas.push("• " + i); });
    });
    if (o.dica_pratica) { linhas.push(""); linhas.push("Dica: " + o.dica_pratica); }
    return linhas.join("\n");
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
    var selCat = o.editavel
      ? '<div class="bc-sec"><div class="bc-sec__t">Categoria</div><select name="categoria">' +
          Object.keys(CAT_LABEL).map(function (k) {
            return '<option value="' + k + '"' + (o.categoria === k ? " selected" : "") + ">" +
              esc(CAT_LABEL[k]) + "</option>";
          }).join("") + "</select></div>"
      : "";
    var campoNome = o.editavel
      ? '<div class="bc-sec"><div class="bc-sec__t">Título</div>' +
        '<input class="or-input" name="nome" value="' + esc(o.nome) + '" /></div>'
      : "";

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(o.nome) + "</div>" +
        '<div class="bc-d__sub">Editando</div></div></div>' +
      (o.editavel
        ? '<div class="bc-aviso">Esta já é a sua versão. As alterações valem só para você.</div>'
        : '<div class="bc-aviso">Esta é uma orientação da base, com referência. Ao salvar, eu crio <b>uma cópia sua</b> e a base fica intacta.</div>') +
      '<form class="bc-edit" id="bc-form">' +
        campoNome +
        selCat +
        campo("Resumo (1 linha)", "resumo", o.resumo, 2) +
        campo("Conteúdo", "conteudo", blocosToTexto(o.blocos), 12,
          "Use “# Título” para começar um bloco; cada linha abaixo vira um item.") +
        campo("Dica prática", "dica_pratica", o.dica_pratica, 2) +
        campo("Atenção", "atencao", o.atencao, 3) +
        campo("Minhas notas", "notas_pessoais", o.notas_pessoais, 2) +
        '<div class="bc-d__acoes">' +
          '<button class="btn btn--primary" type="submit">Salvar</button>' +
          '<button class="btn btn--ghost" type="button" id="bc-cancelar">Cancelar</button>' +
        "</div></form>";
  }

  async function salvar(ev) {
    ev.preventDefault();
    var o = todos.find(function (x) { return x.id === selecionado; });
    if (!o) return;

    var fd = new FormData(ev.target);
    var patch = {
      resumo: (fd.get("resumo") || "").trim() || null,
      blocos: textoToBlocos(fd.get("conteudo") || ""),
      dica_pratica: (fd.get("dica_pratica") || "").trim() || null,
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
      var dup = await db.rpc("ic_orientacao_duplicar", { p_id: o.id });
      if (dup.error) {
        alert("Não consegui duplicar para edição: " + dup.error.message);
        botao.disabled = false; botao.textContent = "Salvar";
        return;
      }
      alvoId = dup.data;
    }

    var up = await db.from("ic_orientacoes").update(patch).eq("id", alvoId);
    if (up.error) {
      alert("Não consegui salvar: " + up.error.message);
      botao.disabled = false; botao.textContent = "Salvar";
      return;
    }
    await carregar();
    abrirDetalhe(alvoId);
  }

  async function novaOrientacao() {
    db = await window.NutriDBReady;
    var sess = await db.auth.getUser();
    var uid = sess && sess.data && sess.data.user && sess.data.user.id;
    if (!uid) { alert("Faça login para criar orientações."); return; }
    var ins = await db.from("ic_orientacoes").insert({
      nutricionista_id: uid,
      nome: "Nova orientação",
      slug: "minha-" + Date.now(),
      categoria: "condicao",
      resumo: "",
      blocos: [{ titulo: "", itens: [] }]
    }).select("id").single();
    if (ins.error) { alert("Não consegui criar: " + ins.error.message); return; }
    await carregar();
    abrirDetalhe(ins.data.id);
    $("#bc-detail").innerHTML = formEdicao(todos.find(function (x) { return x.id === ins.data.id; }));
  }

  async function copiar(o) {
    try {
      await navigator.clipboard.writeText(textoPlano(o));
      var b = $("#or-copiar");
      if (b) { var t0 = b.textContent; b.textContent = "✓ Copiado"; setTimeout(function () { b.textContent = t0; }, 1500); }
    } catch (e) { alert("Não consegui copiar automaticamente."); }
  }

  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".bc-chip");
    if (chip) { catAtiva = chip.dataset.g; renderCats(); render(); return; }

    if (ev.target.closest("#or-nova")) { novaOrientacao(); return; }

    var item = ev.target.closest(".bc-item");
    if (item) { abrirDetalhe(item.dataset.id); return; }

    if (ev.target.closest("#or-copiar")) {
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
      '<div class="bc-vazio"><span class="bc-vazio__ico">📄</span>' +
      '<div class="bc-vazio__t">Escolha uma orientação</div>' +
      '<div class="bc-vazio__d">Textos prontos para anexar ao plano do paciente — ' +
      "por condição (ansiedade, TPM, gastrite…) e técnicas do dia a dia (branqueamento, remolho…). " +
      "Edite qualquer uma ou crie a sua.</div></div>";
    carregar();
  });
})();
