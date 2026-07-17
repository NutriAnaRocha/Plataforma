/* ============================================================
   BANCO DE PROTOCOLOS — consulta rápida por condição clínica.
   Mesmo modelo da Biblioteca de Exames: lê ic_protocolos_meus (base +
   próprios), e editar um protocolo base duplica antes (copy-on-write).

   Os exames de cada protocolo viram link para a Biblioteca Clínica —
   é a mesma ponte, no sentido inverso.
   ============================================================ */
(function () {
  "use strict";

  var db = null;
  var todos = [];
  var nomeExame = {};      // slug -> nome, para rotular os links de exame
  var eixoAtivo = "todos";
  var termo = "";
  var selecionado = null;

  var $ = function (s) { return document.querySelector(s); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  async function carregar() {
    db = await window.NutriDBReady;

    var r = await db.from("ic_protocolos_meus").select("*").order("eixo").order("nome");
    if (r.error) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">⚠️</span>' +
        '<div class="bc-vazio__t">Não consegui carregar os protocolos</div>' +
        '<div class="bc-vazio__d">' + esc(r.error.message) + "</div></div>";
      return;
    }
    todos = r.data || [];

    // nomes dos exames citados, para os links ficarem legíveis
    var ex = await db.from("ic_exames_meus").select("slug,nome");
    if (!ex.error && ex.data) {
      ex.data.forEach(function (e) { nomeExame[e.slug] = e.nome; });
    }

    renderEixos();
    render();

    var slug = new URLSearchParams(location.search).get("protocolo");
    if (slug) {
      var alvo = todos.find(function (p) { return p.slug === slug; });
      if (alvo) abrirDetalhe(alvo.id);
    }
  }

  function filtrados() {
    var t = termo.trim().toLowerCase();
    return todos.filter(function (p) {
      if (eixoAtivo !== "todos" && p.eixo !== eixoAtivo) return false;
      if (!t) return true;
      var alvo = [
        p.nome, p.eixo, p.grupo, p.objetivo_clinico, p.estrategia,
        (p.sinonimos || []).join(" "),
        (p.sinais_sintomas || []).join(" "),
        (p.exames_slugs || []).map(function (s) { return s + " " + (nomeExame[s] || ""); }).join(" "),
        (p.nutrientes || []).map(function (n) { return n.nutriente; }).join(" ")
      ].join(" ").toLowerCase();
      return alvo.indexOf(t) !== -1;
    });
  }

  function renderEixos() {
    var mapa = {};
    todos.forEach(function (p) { mapa[p.eixo] = (mapa[p.eixo] || 0) + 1; });
    var html = '<button class="bc-chip' + (eixoAtivo === "todos" ? " is-active" : "") +
      '" data-g="todos" type="button">Todos<span class="bc-chip__n">' + todos.length + "</span></button>";
    Object.keys(mapa).sort().forEach(function (g) {
      html += '<button class="bc-chip' + (eixoAtivo === g ? " is-active" : "") +
        '" data-g="' + esc(g) + '" type="button">' + esc(g) +
        '<span class="bc-chip__n">' + mapa[g] + "</span></button>";
    });
    $("#bc-grupos").innerHTML = html;
  }

  function render() {
    var lista = filtrados();
    $("#bc-count").textContent =
      lista.length + (lista.length === 1 ? " protocolo" : " protocolos") +
      (eixoAtivo !== "todos" ? " em " + eixoAtivo : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou limpe o filtro de eixo.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (p) {
      return '<button class="bc-item' + (selecionado === p.id ? " is-active" : "") +
        '" data-id="' + p.id + '" type="button">' +
        '<div class="bc-item__nome">' + esc(p.nome) +
          (p.editavel ? '<span class="bc-selo">meu</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + esc(p.grupo) + "</span>" +
          '<span>' + (p.exames_slugs || []).length + " exames</span>" +
        "</div></button>";
    }).join("");
  }

  function detalhe(p) {
    var nutri = (p.nutrientes || []).map(function (n) {
      return '<div class="bc-nutri__i"><div class="bc-nutri__n">' + esc(n.nutriente) + "</div>" +
        '<div class="bc-nutri__r">' + esc(n.papel || "") +
        (n.dose ? ' <b style="color:var(--vinho)">· ' + esc(n.dose) + "</b>" : "") +
        "</div></div>";
    }).join("");

    // exames viram link para a Biblioteca Clínica — ponte no sentido inverso
    var exames = (p.exames_slugs || []).map(function (s) {
      var nome = nomeExame[s];
      if (!nome) return '<span class="bc-exame bc-exame--off">' + esc(s) + "</span>";
      return '<a class="bc-exame" href="biblioteca-clinica.html?exame=' + encodeURIComponent(s) +
        '">' + esc(nome) + "</a>";
    }).join("");

    var sintomas = (p.sinais_sintomas || []).map(function (s) {
      return "<li>" + esc(s) + "</li>";
    }).join("");

    var materiais = (p.materiais_apoio || []).map(function (m) {
      return '<div class="bc-estr"><div class="bc-estr__t">' + esc(m.titulo) + "</div>" +
        "<p>" + esc(m.detalhe || "") + "</p></div>";
    }).join("");

    var refs = (p.referencias || []).map(function (r) {
      return "<li><b>" + esc(r.fonte) + (r.ano ? " (" + esc(r.ano) + ")" : "") + "</b>" +
        (r.detalhe ? " — " + esc(r.detalhe) : "") + "</li>";
    }).join("");

    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(p.nome) +
          (p.editavel ? ' <span class="bc-selo">meu</span>' : "") + "</div>" +
        '<div class="bc-d__sub">' + esc(p.eixo) + " · " + esc(p.grupo) +
          ((p.sinonimos || []).length ? " · " + esc(p.sinonimos.join(", ")) : "") + "</div>" +
      "</div>" +
      '<div class="bc-d__acoes"><button class="btn btn--ghost" id="bc-editar" type="button">✏️ Editar</button></div>' +
      "</div>" +

      (p.objetivo_clinico ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🎯</span> Objetivo clínico</div><p>' +
        esc(p.objetivo_clinico) + "</p></div>" : "") +

      (p.estrategia ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🥗</span> Estratégia nutricional</div><p>' +
        esc(p.estrategia) + "</p></div>" : "") +

      (nutri ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🧬</span> Nutrientes envolvidos</div>' +
        '<div class="bc-nutri">' + nutri + "</div></div>" : "") +

      (exames ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">🧪</span> Exames relacionados</div>' +
        '<div class="bc-exames">' + exames + "</div></div>" : "") +

      (sintomas ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📋</span> Sinais e sintomas</div>' +
        '<div class="bc-sinais__c"><ul>' + sintomas + "</ul></div></div>" : "") +

      (materiais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📘</span> Materiais de apoio</div>' +
        materiais + "</div>" : "") +

      (p.quando_encaminhar ? '<div class="bc-sec bc-encaminhar"><div class="bc-sec__t"><span class="ico">🚩</span> Quando encaminhar</div><p>' +
        esc(p.quando_encaminhar) + "</p></div>" : "") +

      (p.atencao ? '<div class="bc-sec bc-atencao"><div class="bc-sec__t"><span class="ico">⚠️</span> Atenção</div><p>' +
        esc(p.atencao) + "</p></div>" : "") +

      (refs ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📚</span> Referências</div>' +
        '<ul class="bc-refsci">' + refs + "</ul></div>" : "") +

      (p.notas_pessoais ? '<div class="bc-sec"><div class="bc-sec__t"><span class="ico">📝</span> Minhas notas</div><p>' +
        esc(p.notas_pessoais) + "</p></div>" : "") +

      '<div class="bc-rodape">Conteúdo de apoio à decisão. A conduta clínica final é sempre sua.</div>';
  }

  function abrirDetalhe(id) {
    selecionado = id;
    var p = todos.find(function (x) { return x.id === id; });
    if (!p) return;
    var el = $("#bc-detail");
    el.innerHTML = detalhe(p);
    el.classList.add("is-open");
    $(".bc-grid").classList.add("has-selection");
    el.scrollTop = 0;
    render();
  }

  function formEdicao(p) {
    var campo = function (label, name, valor, linhas) {
      return '<div class="bc-sec"><div class="bc-sec__t">' + esc(label) + "</div>" +
        '<textarea name="' + name + '" rows="' + (linhas || 3) + '">' + esc(valor || "") + "</textarea></div>";
    };
    return '' +
      '<button class="bc-voltar" id="bc-voltar" type="button">← Voltar à lista</button>' +
      '<div class="bc-d__head"><div>' +
        '<div class="bc-d__nome">' + esc(p.nome) + "</div>" +
        '<div class="bc-d__sub">Editando</div></div></div>' +
      (p.editavel
        ? '<div class="bc-aviso">Esta já é a sua versão. As alterações valem só para você.</div>'
        : '<div class="bc-aviso">Este é um protocolo da base, com referência científica. Ao salvar, eu crio <b>uma cópia sua</b> e a base fica intacta.</div>') +
      '<form class="bc-edit" id="bc-form">' +
        campo("Objetivo clínico", "objetivo_clinico", p.objetivo_clinico, 3) +
        campo("Estratégia nutricional", "estrategia", p.estrategia, 8) +
        campo("Quando encaminhar", "quando_encaminhar", p.quando_encaminhar, 4) +
        campo("Atenção", "atencao", p.atencao, 4) +
        campo("Minhas notas", "notas_pessoais", p.notas_pessoais, 3) +
        '<div class="bc-d__acoes">' +
          '<button class="btn btn--primary" type="submit">Salvar</button>' +
          '<button class="btn btn--ghost" type="button" id="bc-cancelar">Cancelar</button>' +
        "</div></form>";
  }

  async function salvar(ev) {
    ev.preventDefault();
    var p = todos.find(function (x) { return x.id === selecionado; });
    if (!p) return;

    var fd = new FormData(ev.target);
    var patch = {};
    ["objetivo_clinico", "estrategia", "quando_encaminhar", "atencao", "notas_pessoais"]
      .forEach(function (k) { patch[k] = (fd.get(k) || "").trim() || null; });

    var botao = ev.target.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando…";

    var alvoId = p.id;
    if (!p.editavel) {
      var dup = await db.rpc("ic_protocolo_duplicar", { p_id: p.id });
      if (dup.error) {
        alert("Não consegui duplicar para edição: " + dup.error.message);
        botao.disabled = false; botao.textContent = "Salvar";
        return;
      }
      alvoId = dup.data;
    }

    var up = await db.from("ic_protocolos").update(patch).eq("id", alvoId);
    if (up.error) {
      alert("Não consegui salvar: " + up.error.message);
      botao.disabled = false; botao.textContent = "Salvar";
      return;
    }

    await carregar();
    abrirDetalhe(alvoId);
  }

  document.addEventListener("click", function (ev) {
    var chip = ev.target.closest(".bc-chip");
    if (chip) { eixoAtivo = chip.dataset.g; renderEixos(); render(); return; }

    var item = ev.target.closest(".bc-item");
    if (item) { abrirDetalhe(item.dataset.id); return; }

    if (ev.target.closest("#bc-editar")) {
      var p = todos.find(function (x) { return x.id === selecionado; });
      if (p) $("#bc-detail").innerHTML = formEdicao(p);
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
      '<div class="bc-vazio"><span class="bc-vazio__ico">📑</span>' +
      '<div class="bc-vazio__t">Escolha um protocolo</div>' +
      '<div class="bc-vazio__d">Cada protocolo traz objetivo, estratégia, nutrientes, ' +
      "exames relacionados, sinais e sintomas, materiais de apoio, referências — e quando encaminhar.</div></div>";
    carregar();
  });
})();
