/* ============================================================
   BIBLIOTECA CLÍNICA — Exames laboratoriais.
   Lê a view ic_exames_meus (conteúdo base + o da nutri, menos o que
   ela ocultou). Editar um item base duplica antes (ic_exame_duplicar),
   de modo que a base nunca é alterada e a nutri fica com a versão dela.
   ============================================================ */
(function () {
  "use strict";

  var db = null;
  var todos = [];
  var grupoAtivo = "todos";
  var termo = "";
  var selecionado = null;
  var editando = false;

  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Carga ---------- */
  async function carregar() {
    db = await window.NutriDBReady;
    var r = await db.from("ic_exames_meus").select("*").order("grupo").order("nome");
    if (r.error) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">⚠️</span>' +
        '<div class="bc-vazio__t">Não consegui carregar a biblioteca</div>' +
        '<div class="bc-vazio__d">' + esc(r.error.message) + "</div></div>";
      return;
    }
    todos = r.data || [];
    renderGrupos();
    render();

    // Deep-link: ?exame=<slug> abre o item direto (usado pela tela de Exames,
    // que liga cada marcador do paciente à sua entrada aqui).
    var slug = new URLSearchParams(location.search).get("exame");
    if (slug) {
      var alvo = todos.find(function (e) { return e.slug === slug; });
      if (alvo) abrirDetalhe(alvo.id);
    }
  }

  /* ---------- Filtro ---------- */
  function filtrados() {
    var t = termo.trim().toLowerCase();
    return todos.filter(function (e) {
      if (grupoAtivo !== "todos" && e.grupo !== grupoAtivo) return false;
      if (!t) return true;
      // busca em nome, sinônimos, grupo, nutrientes e sinais
      var alvo = [
        e.nome, e.grupo, e.eixo,
        (e.sinonimos || []).join(" "),
        (e.nutrientes || []).map(function (n) { return n.nutriente + " " + n.relacao; }).join(" "),
        (e.sinais_alto || []).join(" "),
        (e.sinais_baixo || []).join(" ")
      ].join(" ").toLowerCase();
      return alvo.indexOf(t) !== -1;
    });
  }

  /* ---------- Chips de grupo ---------- */
  function renderGrupos() {
    var mapa = {};
    todos.forEach(function (e) { mapa[e.grupo] = (mapa[e.grupo] || 0) + 1; });
    var nomes = Object.keys(mapa).sort();

    var html = '<button class="bc-chip' + (grupoAtivo === "todos" ? " is-active" : "") +
      '" data-g="todos" type="button">Todos<span class="bc-chip__n">' + todos.length + "</span></button>";
    nomes.forEach(function (g) {
      html += '<button class="bc-chip' + (grupoAtivo === g ? " is-active" : "") +
        '" data-g="' + esc(g) + '" type="button">' + esc(g) +
        '<span class="bc-chip__n">' + mapa[g] + "</span></button>";
    });
    $("#bc-grupos").innerHTML = html;
  }

  /* ---------- Lista ---------- */
  function render() {
    var lista = filtrados();
    $("#bc-count").textContent =
      lista.length + (lista.length === 1 ? " exame" : " exames") +
      (grupoAtivo !== "todos" ? " em " + grupoAtivo : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou limpe o filtro de grupo.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (e) {
      return '<button class="bc-item' + (selecionado === e.id ? " is-active" : "") +
        '" data-id="' + e.id + '" type="button">' +
        '<div class="bc-item__nome">' + esc(e.nome) +
          (e.editavel ? '<span class="bc-selo">meu</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + esc(e.grupo) + "</span>" +
          (e.unidade ? '<span class="bc-item__un">' + esc(e.unidade) + "</span>" : "") +
        "</div></button>";
    }).join("");
  }

  /* ---------- Detalhe ---------- */
  function detalhe(e) {
    var nutri = (e.nutrientes || []).map(function (n) {
      return '<div class="bc-nutri__i"><div class="bc-nutri__n">' + esc(n.nutriente) +
        '</div><div class="bc-nutri__r">' + esc(n.relacao) + "</div></div>";
    }).join("");

    var refs = (e.referencias || []).map(function (r) {
      return "<li><b>" + esc(r.fonte) + (r.ano ? " (" + esc(r.ano) + ")" : "") + "</b>" +
        (r.detalhe ? " — " + esc(r.detalhe) : "") + "</li>";
    }).join("");

    var sinaisAlto = (e.sinais_alto || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var sinaisBaixo = (e.sinais_baixo || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head">' +
        "<div>" +
          '<div class="bc-d__nome">' + esc(e.nome) +
            (e.editavel ? ' <span class="bc-selo">meu</span>' : "") +
          "</div>" +
          '<div class="bc-d__sub">' + esc(e.grupo) +
            (e.unidade ? " · " + esc(e.unidade) : "") +
            ((e.sinonimos || []).length ? " · " + esc(e.sinonimos.join(", ")) : "") +
          "</div>" +
        "</div>" +
        '<div class="bc-d__acoes">' +
          '<button class="btn btn--ghost" id="bc-editar" type="button">✏️ Editar</button>' +
        "</div>" +
      "</div>" +

      '<div class="bc-refs">' +
        '<div class="bc-ref bc-ref--conv"><div class="bc-ref__l">Referência convencional</div>' +
          '<div class="bc-ref__v">' + esc(e.ref_convencional || "—") + "</div></div>" +
        '<div class="bc-ref bc-ref--func"><div class="bc-ref__l">Referência funcional</div>' +
          '<div class="bc-ref__v">' + esc(e.ref_funcional || "Não se aplica") + "</div></div>" +
      "</div>" +

      (e.interpretacao_clinica ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🩺</span> Interpretação clínica</div><p>' +
        esc(e.interpretacao_clinica) + "</p></div>" : "") +

      (e.interpretacao_funcional ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🌿</span> Interpretação funcional</div><p>' +
        esc(e.interpretacao_funcional) + "</p></div>" : "") +

      (e.atencao ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">⚠️</span> Atenção na interpretação</div><p>' +
        esc(e.atencao) + "</p></div>" : "") +

      (nutri ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🧬</span> Relação com nutrientes</div>' +
        '<div class="bc-nutri">' + nutri + "</div></div>" : "") +

      ((sinaisAlto || sinaisBaixo) ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📋</span> Sinais e sintomas</div>' +
        '<div class="bc-sinais">' +
          '<div class="bc-sinais__c"><div class="bc-sinais__t">Quando alto</div><ul>' + (sinaisAlto || "<li>—</li>") + "</ul></div>" +
          '<div class="bc-sinais__c"><div class="bc-sinais__t">Quando baixo</div><ul>' + (sinaisBaixo || "<li>—</li>") + "</ul></div>" +
        "</div></div>" : "") +

      ((e.estrategia_alto || e.estrategia_baixo) ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🥗</span> Estratégias nutricionais</div>' +
        (e.estrategia_alto ? '<div class="bc-estr"><div class="bc-estr__t">Se estiver alto</div><p>' + esc(e.estrategia_alto) + "</p></div>" : "") +
        (e.estrategia_baixo ? '<div class="bc-estr"><div class="bc-estr__t">Se estiver baixo</div><p>' + esc(e.estrategia_baixo) + "</p></div>" : "") +
        "</div>" : "") +

      (refs ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📚</span> Referências</div>' +
        '<ul class="bc-refsci">' + refs + "</ul></div>" : "") +

      (e.notas_pessoais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📝</span> Minhas notas</div><p>' +
        esc(e.notas_pessoais) + "</p></div>" : "") +

      '<div class="bc-rodape">Conteúdo de apoio à decisão. A conduta clínica final é sempre sua.</div>';
  }

  function abrirDetalhe(id) {
    selecionado = id;
    editando = false;
    var e = todos.find(function (x) { return x.id === id; });
    if (!e) return;
    var el = $("#bc-detail");
    el.innerHTML = detalhe(e);
    el.classList.add("is-open");
    $(".bc-grid").classList.add("has-selection");
    el.scrollTop = 0;
    render();
  }

  /* ---------- Edição ---------- */
  function formEdicao(e) {
    var campo = function (label, name, valor, linhas) {
      return '<div class="bc-sec"><div class="bc-sec__t">' + esc(label) + "</div>" +
        '<textarea name="' + name + '" rows="' + (linhas || 3) + '">' + esc(valor || "") + "</textarea></div>";
    };
    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(e.nome) + "</div>" +
        '<div class="bc-d__sub">Editando</div>' +
      "</div></div>" +
      (e.editavel
        ? '<div class="bc-aviso">Esta já é a sua versão. As alterações valem só para você.</div>'
        : '<div class="bc-aviso">Este é um item da base, com referência científica. Ao salvar, eu crio <b>uma cópia sua</b> e a base fica intacta — assim você edita à vontade sem perder o original.</div>') +
      '<form class="bc-edit" id="bc-form">' +
        campo("Referência convencional", "ref_convencional", e.ref_convencional, 2) +
        campo("Referência funcional", "ref_funcional", e.ref_funcional, 2) +
        campo("Interpretação clínica", "interpretacao_clinica", e.interpretacao_clinica, 6) +
        campo("Interpretação funcional", "interpretacao_funcional", e.interpretacao_funcional, 5) +
        campo("Atenção na interpretação", "atencao", e.atencao, 4) +
        campo("Estratégia se estiver alto", "estrategia_alto", e.estrategia_alto, 4) +
        campo("Estratégia se estiver baixo", "estrategia_baixo", e.estrategia_baixo, 4) +
        campo("Minhas notas", "notas_pessoais", e.notas_pessoais, 3) +
        '<div class="bc-d__acoes">' +
          '<button class="btn btn--primary" type="submit">Salvar</button>' +
          '<button class="btn btn--ghost" type="button" id="bc-cancelar">Cancelar</button>' +
        "</div>" +
      "</form>";
  }

  async function salvar(ev) {
    ev.preventDefault();
    var e = todos.find(function (x) { return x.id === selecionado; });
    if (!e) return;

    var fd = new FormData(ev.target);
    var patch = {};
    ["ref_convencional", "ref_funcional", "interpretacao_clinica", "interpretacao_funcional",
     "atencao", "estrategia_alto", "estrategia_baixo", "notas_pessoais"].forEach(function (k) {
      patch[k] = (fd.get(k) || "").trim() || null;
    });

    var botao = ev.target.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando…";

    var alvoId = e.id;

    // Item base: duplica antes de editar (copy-on-write).
    if (!e.editavel) {
      var dup = await db.rpc("ic_exame_duplicar", { p_exame_id: e.id });
      if (dup.error) {
        alert("Não consegui duplicar para edição: " + dup.error.message);
        botao.disabled = false; botao.textContent = "Salvar";
        return;
      }
      alvoId = dup.data;
    }

    var up = await db.from("ic_exames").update(patch).eq("id", alvoId);
    if (up.error) {
      alert("Não consegui salvar: " + up.error.message);
      botao.disabled = false; botao.textContent = "Salvar";
      return;
    }

    await carregar();
    abrirDetalhe(alvoId);
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".bc-chip");
    if (chip) {
      grupoAtivo = chip.dataset.g;
      renderGrupos();
      render();
      return;
    }

    var item = ev.target.closest(".bc-item");
    if (item) { abrirDetalhe(item.dataset.id); return; }

    if (ev.target.closest("#bc-editar")) {
      var e = todos.find(function (x) { return x.id === selecionado; });
      if (e) { editando = true; $("#bc-detail").innerHTML = formEdicao(e); }
      return;
    }

    if (ev.target.closest("#bc-cancelar")) { abrirDetalhe(selecionado); return; }

    if (ev.target.closest("#bc-voltar")) {
      selecionado = null;
      editando = false;
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

  /* ---------- Estado inicial ---------- */
  function vazioInicial() {
    $("#bc-detail").innerHTML =
      '<div class="bc-vazio"><span class="bc-vazio__ico">🔬</span>' +
      '<div class="bc-vazio__t">Escolha um exame</div>' +
      '<div class="bc-vazio__d">Cada exame traz interpretação clínica e funcional, ' +
      "relação com nutrientes, sinais e sintomas, estratégias e as referências que sustentam o conteúdo.</div></div>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    vazioInicial();
    carregar();
  });
})();
