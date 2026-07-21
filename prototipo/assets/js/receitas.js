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
  var escopo = "todas";      // "todas" (padrão do sistema + minhas) | "minhas"
  var termo = "";
  var selecionado = null;

  var CAT_LABEL = { "cafe-lanche": "Café & lanches", "refeicao": "Refeições", "doce": "Doces fit", "bebida": "Bebidas" };
  var CAT_ICO = { "cafe-lanche": "🥪", "refeicao": "🍲", "doce": "🍫", "bebida": "🥤" };

  // ---- Lista de compras (seleção + agregação por setor do mercado) ----
  var modoCompras = false;
  var cesta = [];            // ids das receitas marcadas para a lista

  // Setores do mercado, na ordem em que aparecem na lista, com palavras-chave.
  var SETORES = [
    { id: "hortifruti", lbl: "Hortifrúti", ico: "🥬", kw: ["banana","maçã","maca","morango","limão","limao","laranja","abacaxi","manga","maracujá","maracuja","uva","fruta","frutas vermelhas","mirtilo","figo","damasco","tâmara","tamara","couve","espinafre","alface","folha","rúcula","rucula","agrião","agriao","tomate","cebola","alho","abobrinha","berinjela","abóbora","abobora","cenoura","couve-flor","brócolis","brocolis","batata","batata-doce","batata doce","inhame","pepino","hortelã","hortela","salsinha","cheiro-verde","gengibre","ervas","legume","ervilha","palmito"] },
    { id: "proteina", lbl: "Proteínas, ovos & peixes", ico: "🥚", kw: ["ovo","ovos","clara","frango","carne","peixe","salmão","salmao","atum","tofu","proteína de soja","proteina de soja"] },
    { id: "laticinios", lbl: "Laticínios", ico: "🧀", kw: ["leite","iogurte","queijo","requeijão","requeijao","muçarela","mucarela","minas","cream cheese","manteiga","ghee","búfala","bufala"] },
    { id: "mercearia", lbl: "Mercearia (grãos & secos)", ico: "🌾", kw: ["aveia","farinha","tapioca","goma","quinoa","grão-de-bico","grao-de-bico","grão de bico","arroz","chia","linhaça","linhaca","psyllium","castanha","castanhas","noz","nozes","amêndoa","amendoa","amendoim","gergelim","macadâmia","macadamia","pistache","coco","cacau","alfarroba","passas","fermento","adoçante","adocante","fibra"] },
    { id: "diversos", lbl: "Temperos, óleos & outros", ico: "🧂", kw: ["sal","azeite","óleo","oleo","água","agua","água de coco","agua de coco","leite de coco","bebida vegetal","suco","canela","cúrcuma","curcuma","noz-moscada","noz moscada","páprica","paprica","pimenta","cominho","orégano","oregano","sálvia","salvia","vinagre","mostarda","néctar","nectar","caldo","nori","alga","tahine","pasta de amendoim"] }
  ];

  function setorDe(linha) {
    var t = (linha || "").toLowerCase();
    for (var i = 0; i < SETORES.length; i++) {
      var kws = SETORES[i].kw;
      for (var j = 0; j < kws.length; j++) {
        if (t.indexOf(kws[j]) !== -1) return SETORES[i].id;
      }
    }
    return "diversos";
  }

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
      if (escopo === "minhas" && !o.editavel) return false;
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
    var nMinhas = todos.filter(function (o) { return o.editavel; }).length;
    var scope = '<span class="bc-scope">' +
      '<button class="sc-chip' + (escopo === "todas" ? " is-active" : "") + '" data-escopo="todas" type="button">Todas</button>' +
      '<button class="sc-chip' + (escopo === "minhas" ? " is-active" : "") + '" data-escopo="minhas" type="button">Só as minhas' +
        (nMinhas ? ' (' + nMinhas + ")" : "") + "</button></span>";
    $("#bc-grupos").innerHTML = scope + html;
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
      (escopo === "minhas" ? " · só as minhas" : "") +
      (catAtiva !== "todos" ? " · " + (CAT_LABEL[catAtiva] || catAtiva) : "");

    if (!lista.length) {
      $("#bc-list").innerHTML =
        '<div class="bc-vazio"><span class="bc-vazio__ico">🔍</span>' +
        '<div class="bc-vazio__t">Nada encontrado</div>' +
        '<div class="bc-vazio__d">Tente outro termo, ou crie uma nova receita.</div></div>';
      return;
    }

    $("#bc-list").innerHTML = lista.map(function (o) {
      var picked = cesta.indexOf(o.id) !== -1;
      return '<button class="bc-item' + (selecionado === o.id ? " is-active" : "") +
        (modoCompras ? " is-pickmode" : "") + (picked ? " is-picked" : "") +
        '" data-id="' + o.id + '" type="button"' +
        (modoCompras ? ' aria-pressed="' + (picked ? "true" : "false") + '"' : "") + ">" +
        (modoCompras ? '<span class="bc-item__check" aria-hidden="true">' + (picked ? "✓" : "") + "</span>" : "") +
        '<div class="bc-item__nome">' + (CAT_ICO[o.categoria] || "") + " " + esc(o.nome) +
          (o.editavel ? '<span class="bc-selo">minha</span>' : "") +
        "</div>" +
        '<div class="bc-item__meta"><span>' + (o.tempo_min ? o.tempo_min + " min" : esc(CAT_LABEL[o.categoria] || "")) + "</span>" +
          (o.kcal_porcao ? "<span>" + o.kcal_porcao + " kcal</span>" : "") +
        "</div></button>";
    }).join("");

    renderBarraCompras();
  }

  // Barra flutuante com o contador e o botão de gerar a lista.
  function renderBarraCompras() {
    var barra = $("#rc-compras-bar");
    if (!modoCompras || !cesta.length) {
      if (barra) barra.remove();
      return;
    }
    if (!barra) {
      barra = document.createElement("div");
      barra.id = "rc-compras-bar";
      barra.className = "rc-compras-bar";
      document.body.appendChild(barra);
    }
    var n = cesta.length;
    barra.innerHTML =
      '<span class="rc-compras-bar__n">🛒 ' + n + (n === 1 ? " receita" : " receitas") + "</span>" +
      '<button class="btn btn--ghost btn--sm" id="rc-compras-limpar" type="button">Limpar</button>' +
      '<button class="btn btn--primary btn--sm" id="rc-compras-gerar" type="button">Gerar lista de compras</button>';
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
        ? '<div class="bc-aviso">Esta é uma versão <b>privada da sua conta</b> — só você vê e edita.</div>'
        : '<div class="bc-aviso">Esta é uma receita <b>padrão do sistema</b>. Ao salvar, eu crio <b>uma cópia privada sua</b> e o padrão fica intacto.</div>') +
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

  // ---- Lista de compras ----
  function toggleModoCompras() {
    modoCompras = !modoCompras;
    var btn = $("#rc-modo-compras");
    if (btn) {
      btn.setAttribute("aria-pressed", modoCompras ? "true" : "false");
      btn.classList.toggle("is-active", modoCompras);
      btn.textContent = modoCompras ? "✕ Sair da seleção" : "🛒 Lista de compras";
    }
    if (!modoCompras) cesta = [];
    // Sair do detalhe ao entrar no modo seleção (a lista fica em foco).
    if (modoCompras && selecionado) {
      selecionado = null;
      $("#bc-detail").classList.remove("is-open");
      $(".bc-grid").classList.remove("has-selection");
    }
    render();
  }

  function togglePick(id) {
    var i = cesta.indexOf(id);
    if (i === -1) cesta.push(id); else cesta.splice(i, 1);
    render();
  }

  // Agrega os ingredientes das receitas marcadas, agrupados por setor.
  function montarLista() {
    var receitas = cesta
      .map(function (id) { return todos.find(function (x) { return x.id === id; }); })
      .filter(Boolean);
    var grupos = {};                       // setorId -> [ { texto, receitas:[nomes] } ]
    receitas.forEach(function (r) {
      (r.ingredientes || []).forEach(function (linha) {
        var s = setorDe(linha);
        grupos[s] = grupos[s] || [];
        // Junta itens iguais (mesmo texto), acumulando de quais receitas vieram.
        var chave = linha.trim().toLowerCase();
        var achado = grupos[s].find(function (it) { return it.chave === chave; });
        if (achado) { if (achado.receitas.indexOf(r.nome) === -1) achado.receitas.push(r.nome); }
        else grupos[s].push({ chave: chave, texto: linha.trim(), receitas: [r.nome] });
      });
    });
    return { receitas: receitas, grupos: grupos };
  }

  function listaEmTexto(dados) {
    var l = ["LISTA DE COMPRAS", "", "Receitas: " + dados.receitas.map(function (r) { return r.nome; }).join(", "), ""];
    SETORES.forEach(function (setor) {
      var itens = dados.grupos[setor.id];
      if (!itens || !itens.length) return;
      l.push(setor.lbl.toUpperCase());
      itens.forEach(function (it) { l.push("[ ] " + it.texto); });
      l.push("");
    });
    return l.join("\n");
  }

  function abrirLista() {
    var dados = montarLista();
    var totalItens = Object.keys(dados.grupos).reduce(function (a, k) { return a + dados.grupos[k].length; }, 0);

    var corpo = SETORES.map(function (setor) {
      var itens = dados.grupos[setor.id];
      if (!itens || !itens.length) return "";
      var lis = itens.map(function (it) {
        var origem = it.receitas.length > 1
          ? '<span class="rc-lc__origem">' + it.receitas.length + " receitas</span>"
          : "";
        return '<li class="rc-lc__item"><label><input type="checkbox" /> <span>' + esc(it.texto) + "</span>" + origem + "</label></li>";
      }).join("");
      return '<div class="rc-lc__setor"><h4 class="rc-lc__setor-t">' + setor.ico + " " + esc(setor.lbl) +
        '<span class="rc-lc__setor-n">' + itens.length + "</span></h4><ul class=\"rc-lc__lista\">" + lis + "</ul></div>";
    }).join("");

    var receitasNomes = dados.receitas.map(function (r) { return esc(r.nome); }).join(" · ");

    var ov = document.createElement("div");
    ov.className = "rc-lc-overlay";
    ov.id = "rc-lc-overlay";
    ov.innerHTML =
      '<div class="rc-lc" role="dialog" aria-modal="true" aria-label="Lista de compras">' +
        '<div class="rc-lc__head">' +
          '<div><h3 class="rc-lc__titulo">🛒 Lista de compras</h3>' +
            '<p class="rc-lc__sub">' + totalItens + " itens · " + dados.receitas.length +
            (dados.receitas.length === 1 ? " receita" : " receitas") + "</p></div>" +
          '<button class="icon-btn" id="rc-lc-fechar" type="button" aria-label="Fechar">✕</button>' +
        "</div>" +
        '<p class="rc-lc__receitas">' + receitasNomes + "</p>" +
        '<div class="rc-lc__corpo">' + corpo + "</div>" +
        '<div class="rc-lc__acoes">' +
          '<button class="btn btn--ghost" id="rc-lc-copiar" type="button">📋 Copiar</button>' +
          '<button class="btn btn--ghost" id="rc-lc-imprimir" type="button">🖨 Imprimir</button>' +
          '<button class="btn btn--primary" id="rc-lc-ok" type="button">Concluir</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(ov);
    ov.__texto = listaEmTexto(dados);
  }

  function fecharLista() {
    var ov = $("#rc-lc-overlay");
    if (ov) ov.remove();
  }

  function imprimirLista(texto) {
    var w = window.open("", "_blank");
    if (!w) { alert("Libere pop-ups para imprimir."); return; }
    w.document.write('<pre style="font:14px/1.6 monospace;padding:24px;white-space:pre-wrap">' +
      texto.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</pre>");
    w.document.close(); w.focus(); w.print();
  }

  document.addEventListener("click", function (ev) {
    // ----- Lista de compras -----
    if (ev.target.closest("#rc-modo-compras")) { toggleModoCompras(); return; }
    if (ev.target.closest("#rc-compras-limpar")) { cesta = []; render(); return; }
    if (ev.target.closest("#rc-compras-gerar")) {
      if (!cesta.length) return;
      abrirLista(); return;
    }
    if (ev.target.closest("#rc-lc-fechar") || ev.target.closest("#rc-lc-ok")) { fecharLista(); return; }
    if (ev.target.id === "rc-lc-overlay") { fecharLista(); return; }
    if (ev.target.closest("#rc-lc-copiar")) {
      var ov = $("#rc-lc-overlay");
      if (ov && ov.__texto) {
        navigator.clipboard.writeText(ov.__texto).then(function () {
          var b = $("#rc-lc-copiar"); if (b) { b.textContent = "✓ Copiada"; setTimeout(function () { b.textContent = "📋 Copiar"; }, 1500); }
        }).catch(function () { alert("Não consegui copiar automaticamente."); });
      }
      return;
    }
    if (ev.target.closest("#rc-lc-imprimir")) {
      var ov2 = $("#rc-lc-overlay");
      if (ov2 && ov2.__texto) imprimirLista(ov2.__texto);
      return;
    }

    var sc = ev.target.closest(".sc-chip");
    if (sc) { escopo = sc.dataset.escopo; renderCats(); render(); return; }

    var chip = ev.target.closest(".bc-chip");
    if (chip) { catAtiva = chip.dataset.g; renderCats(); render(); return; }

    if (ev.target.closest("#rc-nova")) { novaReceita(); return; }

    var item = ev.target.closest(".bc-item");
    if (item) {
      if (modoCompras) togglePick(item.dataset.id);
      else abrirDetalhe(item.dataset.id);
      return;
    }

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
      "As da base são o <b>padrão do sistema</b>; ao editar ou criar, vira uma versão <b>privada da sua conta</b>.</div></div>";
    carregar();
  });
})();
