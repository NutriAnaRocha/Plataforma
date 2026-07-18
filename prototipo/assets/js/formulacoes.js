/* ============================================================
   BANCO DE FORMULAÇÕES — fitoterapia, suplementação, magistral, orto.
   Mesmo modelo das outras telas da IC: lê ic_formulacoes_minhas
   (base + minhas), editar uma base duplica antes (copy-on-write).

   As fórmulas (jsonb) são editadas num formato amigável:
     # Título da formulação
     - Ativo | dose | observação
     Posologia: ...
     Duração: ...
     Via: oral
   ============================================================ */
(function () {
  "use strict";

  var db = null;
  var todos = [];
  var catAtiva = "todos";
  var termo = "";
  var selecionado = null;

  var CAT_LABEL = { fitoterapia: "Fitoterapia", suplementacao: "Suplementação", magistral: "Magistral", ortomolecular: "Ortomolecular" };
  var CAT_ICO = { fitoterapia: "🌿", suplementacao: "💊", magistral: "⚗️", ortomolecular: "🧬" };

  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---- formulas <-> texto amigável ----
  function formulasToTexto(formulas) {
    return (formulas || []).map(function (f) {
      var linhas = ["# " + (f.titulo || "")];
      (f.componentes || []).forEach(function (c) {
        linhas.push("- " + [c.ativo, c.dose, c.obs].filter(Boolean).join(" | "));
      });
      if (f.posologia) linhas.push("Posologia: " + f.posologia);
      if (f.duracao) linhas.push("Duração: " + f.duracao);
      if (f.via) linhas.push("Via: " + f.via);
      return linhas.join("\n");
    }).join("\n\n").trim();
  }
  function textoToFormulas(texto) {
    var formulas = [], atual = null;
    function garante() { if (!atual) { atual = { titulo: "", componentes: [] }; formulas.push(atual); } }
    (texto || "").split(/\r?\n/).forEach(function (linha) {
      var l = linha.trim();
      if (!l) return;
      if (l.indexOf("# ") === 0) { atual = { titulo: l.slice(2).trim(), componentes: [] }; formulas.push(atual); return; }
      var mPos = l.match(/^posologia:\s*(.*)$/i);
      var mDur = l.match(/^dura[cç][aã]o:\s*(.*)$/i);
      var mVia = l.match(/^via:\s*(.*)$/i);
      if (mPos) { garante(); atual.posologia = mPos[1].trim(); return; }
      if (mDur) { garante(); atual.duracao = mDur[1].trim(); return; }
      if (mVia) { garante(); atual.via = mVia[1].trim(); return; }
      // componente
      garante();
      var p = l.replace(/^[-•*]\s*/, "").split("|").map(function (x) { return x.trim(); });
      atual.componentes.push({ ativo: p[0] || "", dose: p[1] || "", obs: p[2] || "" });
    });
    return formulas;
  }

  async function carregar() {
    db = await window.NutriDBReady;
    var r = await db.from("ic_formulacoes_minhas").select("*").order("categoria").order("nome");
    if (r.error) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">⚠️</span>' +
        '<div class="bc-vazio__t">Não consegui carregar as formulações</div>' +
        '<div class="bc-vazio__d">' + esc(r.error.message) + "</div></div>";
      return;
    }
    todos = r.data || [];
    renderCats();
    render();

    var slug = new URLSearchParams(location.search).get("formulacao");
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
        o.nome, o.indicacao, o.eixo, o.grupo,
        (o.sinonimos || []).join(" "),
        (o.formulas || []).map(function (f) {
          return (f.titulo || "") + " " + (f.componentes || []).map(function (c) { return c.ativo; }).join(" ");
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
    Object.keys(CAT_LABEL).forEach(function (g) {
      if (!mapa[g]) return;
      html += '<button class="bc-chip' + (catAtiva === g ? " is-active" : "") +
        '" data-g="' + esc(g) + '" type="button">' + esc(CAT_LABEL[g]) +
        '<span class="bc-chip__n">' + mapa[g] + "</span></button>";
    });
    $("#bc-grupos").innerHTML = html;
  }

  function render() {
    var lista = filtrados();
    $("#bc-count").textContent =
      lista.length + (lista.length === 1 ? " formulação" : " formulações") +
      (catAtiva !== "todos" ? " · " + (CAT_LABEL[catAtiva] || catAtiva) : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou crie uma nova formulação.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (o) {
      return '<button class="bc-item' + (selecionado === o.id ? " is-active" : "") +
        '" data-id="' + o.id + '" type="button">' +
        '<div class="bc-item__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? '<span class="bc-selo">minha</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + esc(CAT_LABEL[o.categoria] || o.categoria) + "</span>" +
          '<span>' + (o.formulas || []).length + (o.formulas && o.formulas.length === 1 ? " fórmula" : " fórmulas") + "</span>" +
        "</div></button>";
    }).join("");
  }

  function detalhe(o) {
    var formulas = (o.formulas || []).map(function (f) {
      var comp = (f.componentes || []).map(function (c) {
        return '<div class="fm-comp"><span class="fm-comp__a">' + esc(c.ativo) + "</span>" +
          (c.dose ? '<span class="fm-comp__d">' + esc(c.dose) + "</span>" : "") +
          (c.obs ? '<span class="fm-comp__o">' + esc(c.obs) + "</span>" : "") + "</div>";
      }).join("");
      var rodape = [];
      if (f.posologia) rodape.push("<b>Posologia:</b> " + esc(f.posologia));
      if (f.duracao) rodape.push("<b>Duração:</b> " + esc(f.duracao));
      if (f.via) rodape.push("<b>Via:</b> " + esc(f.via));
      return '<div class="fm-formula">' +
        (f.titulo ? '<div class="fm-formula__t">' + esc(f.titulo) + "</div>" : "") +
        '<div class="fm-comps">' + comp + "</div>" +
        (rodape.length ? '<div class="fm-formula__pos">' + rodape.join(" · ") + "</div>" : "") +
        "</div>";
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
          (o.eixo ? " · " + esc(o.eixo) : "") + "</div>" +
      "</div>" +
      '<div class="bc-d__acoes">' +
        '<button class="btn btn--ghost" id="fm-copiar" type="button">📋 Copiar</button>' +
        '<button class="btn btn--ghost" id="bc-editar" type="button">✏️ Editar</button>' +
      "</div></div>" +

      (o.indicacao ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🎯</span> Indicação</div><p>' +
        esc(o.indicacao) + "</p></div>" : "") +

      (formulas ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🧪</span> Formulações</div>' + formulas + "</div>" : "") +

      (o.observacoes ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📌</span> Observações</div><p>' +
        esc(o.observacoes) + "</p></div>" : "") +

      (o.interacoes ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">⚠️</span> Interações e cautelas</div><p>' +
        esc(o.interacoes) + "</p></div>" : "") +

      (o.quando_encaminhar ? '<div class="bc-sec bc-encaminhar"><div class="bc-sec__t"><span class="ico">🚩</span> Quando encaminhar</div><p>' +
        esc(o.quando_encaminhar) + "</p></div>" : "") +

      (o.atencao ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">❗</span> Atenção</div><p>' +
        esc(o.atencao) + "</p></div>" : "") +

      (refs ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📚</span> Referências</div>' +
        '<ul class="bc-refsci">' + refs + "</ul></div>" : "") +

      (o.notas_pessoais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📝</span> Minhas notas</div><p>' +
        esc(o.notas_pessoais) + "</p></div>" : "") +

      '<div class="bc-rodape">Faixas de apoio à decisão. A prescrição é individualizada e dentro do escopo do CFN.</div>';
  }

  function textoFormulacao(o) {
    var l = [o.nome.toUpperCase()];
    if (o.indicacao) l.push("Indicação: " + o.indicacao);
    (o.formulas || []).forEach(function (f) {
      l.push("");
      if (f.titulo) l.push(f.titulo);
      (f.componentes || []).forEach(function (c) {
        l.push("• " + [c.ativo, c.dose, c.obs].filter(Boolean).join(" — "));
      });
      if (f.posologia) l.push("Posologia: " + f.posologia);
      if (f.duracao) l.push("Duração: " + f.duracao);
      if (f.via) l.push("Via: " + f.via);
    });
    if (o.interacoes) { l.push(""); l.push("Cautelas: " + o.interacoes); }
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
    var selCat = o.editavel
      ? '<div class="bc-sec"><div class="bc-sec__t">Categoria</div><select name="categoria">' +
          Object.keys(CAT_LABEL).map(function (k) {
            return '<option value="' + k + '"' + (o.categoria === k ? " selected" : "") + ">" + esc(CAT_LABEL[k]) + "</option>";
          }).join("") + "</select></div>"
      : "";
    var campoNome = o.editavel
      ? '<div class="bc-sec"><div class="bc-sec__t">Título</div><input class="or-input" name="nome" value="' + esc(o.nome) + '" /></div>'
      : "";

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(o.nome) + "</div>" +
        '<div class="bc-d__sub">Editando</div></div></div>' +
      (o.editavel
        ? '<div class="bc-aviso">Esta já é a sua versão. As alterações valem só para você.</div>'
        : '<div class="bc-aviso">Esta é uma formulação da base, com referência. Ao salvar, eu crio <b>uma cópia sua</b> e a base fica intacta.</div>') +
      '<form class="bc-edit" id="bc-form">' +
        campoNome +
        selCat +
        campo("Indicação", "indicacao", o.indicacao, 2) +
        campo("Formulações", "formulas", formulasToTexto(o.formulas), 12,
          "“# Título” abre uma fórmula; “- Ativo | dose | obs” para cada componente; Posologia:/Duração:/Via: nas linhas próprias.") +
        campo("Observações", "observacoes", o.observacoes, 2) +
        campo("Interações e cautelas", "interacoes", o.interacoes, 3) +
        campo("Quando encaminhar", "quando_encaminhar", o.quando_encaminhar, 2) +
        campo("Atenção", "atencao", o.atencao, 2) +
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
      indicacao: (fd.get("indicacao") || "").trim() || null,
      formulas: textoToFormulas(fd.get("formulas") || ""),
      observacoes: (fd.get("observacoes") || "").trim() || null,
      interacoes: (fd.get("interacoes") || "").trim() || null,
      quando_encaminhar: (fd.get("quando_encaminhar") || "").trim() || null,
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
      var dup = await db.rpc("ic_formulacao_duplicar", { p_id: o.id });
      if (dup.error) {
        alert("Não consegui duplicar para edição: " + dup.error.message);
        botao.disabled = false; botao.textContent = "Salvar";
        return;
      }
      alvoId = dup.data;
    }

    var up = await db.from("ic_formulacoes").update(patch).eq("id", alvoId);
    if (up.error) {
      alert("Não consegui salvar: " + up.error.message);
      botao.disabled = false; botao.textContent = "Salvar";
      return;
    }
    await carregar();
    abrirDetalhe(alvoId);
  }

  async function novaFormulacao() {
    db = await window.NutriDBReady;
    var sess = await db.auth.getUser();
    var uid = sess && sess.data && sess.data.user && sess.data.user.id;
    if (!uid) { alert("Faça login para criar formulações."); return; }
    var ins = await db.from("ic_formulacoes").insert({
      nutricionista_id: uid,
      nome: "Nova formulação",
      slug: "minha-" + Date.now(),
      categoria: "suplementacao",
      indicacao: "",
      formulas: [{ titulo: "", componentes: [] }]
    }).select("id").single();
    if (ins.error) { alert("Não consegui criar: " + ins.error.message); return; }
    await carregar();
    abrirDetalhe(ins.data.id);
    $("#bc-detail").innerHTML = formEdicao(todos.find(function (x) { return x.id === ins.data.id; }));
  }

  async function copiar(o) {
    try {
      await navigator.clipboard.writeText(textoFormulacao(o));
      var b = $("#fm-copiar");
      if (b) { var t0 = b.textContent; b.textContent = "✓ Copiada"; setTimeout(function () { b.textContent = t0; }, 1500); }
    } catch (e) { alert("Não consegui copiar automaticamente."); }
  }

  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".bc-chip");
    if (chip) { catAtiva = chip.dataset.g; renderCats(); render(); return; }

    if (ev.target.closest("#fm-nova")) { novaFormulacao(); return; }

    var item = ev.target.closest(".bc-item");
    if (item) { abrirDetalhe(item.dataset.id); return; }

    if (ev.target.closest("#fm-copiar")) {
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
      '<div class="bc-vazio"><span class="bc-vazio__ico">⚗️</span>' +
      '<div class="bc-vazio__t">Escolha uma formulação</div>' +
      '<div class="bc-vazio__d">Fitoterapia, suplementação e magistral — cada uma com suas fórmulas ' +
      "separadas, faixas de dose, interações, referência e limite de escopo. Edite ou crie a sua.</div></div>";
    carregar();
  });
})();
