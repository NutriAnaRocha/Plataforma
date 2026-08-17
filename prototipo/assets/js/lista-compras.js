/* ============================================================
   LISTA DE COMPRAS — sai do plano alimentar e só dele. Junta os
   alimentos de todas as refeições e agrupa por seção de mercado
   (pista pelo nome → corredor). Usada em 3 lugares:
     • painel da nutri (abaixo do plano)   → ListaCompras.htmlNutri(plano, edits)
     • PDF do plano (via NutriDoc)          → ListaCompras.pdfHTML(plano, edits)
     • portal do paciente (com check)       → ListaCompras.htmlPortal(plano, marcas, readonly, edits)
   Também expõe as dicas de congelamento/porcionamento de marmita.

   Duas decisões da Ana (16/08/2026), que desfazem features anteriores:

   1. SEM QUANTIDADE. Quanto comprar é critério de quem compra — a
      família toda come do mesmo arroz, e "487 g de patinho" era um número
      falso de precisão.

   2. SEM INGREDIENTE DE RECEITA. As receitas liberadas já mostram os
      ingredientes organizados na própria receita; repetir aqui inchava a
      lista com texto livre ("Recheio: 1 cenoura ralada, 1 xícara de
      brócolis picado, ...") que não é item de mercado, não agrupa e, com
      o nome da receita ocupando a coluna da direita, espremia o nome do
      item numa palavra por linha no celular.

   A lista é EDITÁVEL dos dois lados, e cada lado grava no que é seu:
     • nutri    → plano.compras = { extras: [nome], remover: [slug] },
                  dentro da coluna `plano` do paciente (que é dela).
     • paciente → marcas["lc:extra"] / marcas["lc:rm"], em plano_adesao
                  (que a RLS deixa só o paciente gravar; a nutri só lê).
   Quem monta as duas metades numa lista só é `combinar()`.
   window.ListaCompras.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  var AL = window.ALIMENTOS || [];
  var AL_BY_ID = {}, AL_BY_NOME = {}, AL_BY_SLUG = {};
  AL.forEach(function (a) {
    AL_BY_ID[a.id] = a;
    AL_BY_NOME[a.nome.toLowerCase()] = a;
    // Índice por slug: o nome gravado no plano volta com espaço a mais
    // ("Feijão vermelho , cozido") e o casamento exato falha — o item
    // perdia o grupo e caía em "Outros" na lista de compras.
    AL_BY_SLUG[slug(a.nome)] = a;
    // Plano salvo antes da humanização gravou o nome da TACO no item.
    if (a.taco) { AL_BY_NOME[a.taco.toLowerCase()] = a; AL_BY_SLUG[slug(a.taco)] = a; }
  });

  /* grupo do alimento → corredor de mercado (ordem = ordem de exibição).
     Os grupos aparecem com DUAS grafias na base (a da TACO oficial e a
     do arquivo local — "Gorduras e óleos" vs "Óleos e gorduras"), por
     isso as duas estão mapeadas: só uma delas fazia azeite, açúcar e
     industrializados caírem em "Outros". */
  /* A ordem é a do trajeto dentro do mercado: hortifrúti na entrada,
     açougue e frios no fundo, mercearia no meio, doces e bebidas por
     último. Quem compra com a lista na mão anda uma vez só.

     Os grupos da TACO são grossos demais para isto — "Carnes e
     derivados" mistura boi e frango, "Verduras, hortaliças e derivados"
     mistura alface e batata. Por isso o grupo é só a rede de segurança:
     quem decide o corredor é a pista pelo nome (PISTAS, abaixo), e o
     grupo entra apenas quando nenhuma pista reconhece o alimento. */
  var CORREDORES = [
    { key: "folhas", ico: "🥬", label: "Verduras & folhas", grupos: [] },
    { key: "legumes", ico: "🥕", label: "Legumes & hortaliças", grupos: ["Verduras, hortaliças e derivados"] },
    { key: "tuberculos", ico: "🥔", label: "Tubérculos & raízes", grupos: [] },
    { key: "frutas", ico: "🍎", label: "Frutas", grupos: ["Frutas e derivados"] },
    { key: "carnes", ico: "🥩", label: "Carnes", grupos: ["Carnes e derivados"] },
    { key: "aves", ico: "🍗", label: "Aves", grupos: [] },
    { key: "peixes", ico: "🐟", label: "Peixes & frutos do mar", grupos: ["Pescados e frutos do mar"] },
    { key: "ovos", ico: "🥚", label: "Ovos", grupos: ["Ovos e derivados"] },
    { key: "laticinios", ico: "🧀", label: "Laticínios & frios", grupos: ["Leite e derivados"] },
    { key: "padaria", ico: "🍞", label: "Padaria", grupos: [] },
    { key: "cereais", ico: "🌾", label: "Grãos & cereais", grupos: ["Cereais e derivados"] },
    { key: "leguminosas", ico: "🫘", label: "Feijões & leguminosas", grupos: ["Leguminosas e derivados"] },
    { key: "nozes", ico: "🥜", label: "Castanhas & sementes", grupos: ["Nozes e sementes"] },
    { key: "oleos", ico: "🫒", label: "Óleos, azeites & temperos", grupos: ["Óleos e gorduras", "Gorduras e óleos", "Miscelâneas", "Alimentos preparados"] },
    { key: "mercearia", ico: "🛒", label: "Mercearia", grupos: ["Outros alimentos industrializados"] },
    { key: "acucar", ico: "🍯", label: "Açúcares & doces", grupos: ["Açúcares e produtos de confeitaria", "Produtos açucarados"] },
    { key: "bebidas", ico: "🥤", label: "Bebidas", grupos: ["Bebidas (alcoólicas e não alcoólicas)"] }
  ];
  var GRUPO2CORR = {};
  CORREDORES.forEach(function (c) { c.grupos.forEach(function (g) { GRUPO2CORR[g] = c.key; }); });
  var OUTROS = { key: "outros", ico: "🛒", label: "Outros" };

  /* Quem decide o corredor: o nome do alimento. É a única forma de
     separar frango de carne bovina e alface de batata — a TACO não
     separa. A ordem importa: a primeira pista que casar vence, então as
     mais específicas vêm antes ("leite de coco" é laticínio? não: cai em
     óleos/mercearia antes de bater em "leite", por isso está listada
     acima). O que nenhuma pista reconhecer cai no grupo da TACO, e só
     depois em "Outros". */
  var PISTAS = [
    // Exceções primeiro: nomes que enganariam uma pista mais abaixo.
    { k: "mercearia", re: /\b(leite de coco|leite condensado|leite de amendoa|leite vegetal|bebida vegetal)\b/ },
    { k: "laticinios", re: /\b(peito de peru|blanquet)\b/ },        // frios, não açougue
    { k: "legumes", re: /\b(milho verde|milho em conserva)\b/ },    // não é o grão de cereais
    { k: "folhas", re: /\bcouve\b/ },            // "couve, manteiga" não é laticínio
    { k: "tuberculos", re: /\bbatata\b/ },       // "batata, doce" não é doce
    { k: "oleos", re: /\b(oleo de coco|azeite|oleo|banha|vinagre|sal\b|pimenta|pepper|paprica|curcuma|acafrao|chimichurri|ervas finas|especiaria|alho|cebola em po|colorau|oregano|louro|cominho|tempero|caldo de|molho de soja|shoyu|mostarda|ketchup|maionese)\b/ },
    { k: "mercearia", re: /\b(psyllium|psilio|fibra em po)\b/ },

    { k: "aves", re: /\b(frango|peito de frango|coxa|sobrecoxa|file de frango|peru|chester|codorna|ave)\b/ },
    { k: "peixes", re: /\b(peixe|salmao|tilapia|sardinha|atum|bacalhau|merluza|pescada|camarao|lula|polvo|mexilhao|marisco|frutos do mar)\b/ },
    { k: "carnes", re: /\b(carne|bovina|patinho|acem|alcatra|coxao|musculo|file mignon|maminha|fraldinha|costela|suina|porco|lombo|pernil|bisteca|cordeiro|carneiro|figado|moida)\b/ },
    { k: "ovos", re: /\bovo(s)?\b/ },
    { k: "laticinios", re: /\b(leite|iogurte|queijo|requeijao|ricota|cottage|coalhada|manteiga|creme de leite|nata|kefir|presunto|peito de peru|mussarela|muçarela|frios)\b/ },

    { k: "padaria", re: /\b(pao|paes|baguete|bisnaguinha|torrada|croissant|bolo|tapioca|cuscuz|beiju|wrap|tortilha)\b/ },
    { k: "leguminosas", re: /\b(feijao|lentilha|grao de bico|grao-de-bico|ervilha|soja|edamame|tremoco|fava)\b/ },
    { k: "cereais", re: /\b(arroz|aveia|macarrao|massa|espaguete|penne|farinha|fuba|polenta|quinoa|milho|granola|biscoito|bolacha|cereal|trigo|centeio|cevada|amido|maisena|nhoque)\b/ },
    { k: "nozes", re: /\b(castanha|noz|nozes|amendoa|amendoim|semente|sementes|chia|linhaca|gergelim|girassol|abobora torrada|pasta de amendoim|tahine|pistache|macadamia|avela)\b/ },

    { k: "bebidas", re: /\b(agua|suco|refrigerante|cafe|cha\b|cerveja|vinho|isotonico|energetico|kombucha)\b/ },
    // "doce" sozinho fora: pegava "batata, doce" e "goiabada de corte" é rara.
    { k: "acucar", re: /\b(acucar|mel|melado|rapadura|chocolate|cacau|achocolatado|doce de leite|doce em calda|geleia|adocante|xilitol|eritritol|sorvete)\b/ },

    { k: "frutas", re: /\b(banana|maca|mamao|laranja|abacaxi|manga|melancia|melao|uva|morango|abacate|pera|kiwi|goiaba|acerola|limao|tangerina|mexerica|ameixa|coco|caju|maracuja|figo|pessego|nectarina|cereja|framboesa|mirtilo|amora|romã|roma|jabuticaba|graviola|tamarindo|damasco|tamara|uva passa)\b/ },

    { k: "tuberculos", re: /\b(batata|batata doce|mandioca|aipim|macaxeira|inhame|cara|mandioquinha|batata baroa|beterraba|nabo|rabanete)\b/ },
    { k: "folhas", re: /\b(alface|rucula|couve|espinafre|agriao|acelga|escarola|chicoria|almeirao|repolho|salsa|salsinha|cebolinha|coentro|manjericao|hortela|broto|rama)\b/ },
    { k: "legumes", re: /\b(tomate|cenoura|abobrinha|abobora|jerimum|berinjela|chuchu|pepino|vagem|quiabo|pimentao|cebola|brocolis|couve flor|couve-flor|maxixe|palmito|cogumelo|champignon|shitake|shimeji|milho verde|alho poro|aspargo|alcachofra|salsao|pimenta biquinho)\b/ }
  ];
  function corredorPeloNome(nome) {
    var s = slug(nome).replace(/-/g, " ");
    // Item posto à mão é texto livre e costuma vir no plural ("bananas
    // maduras"): tenta também sem o -s final das palavras longas, senão cai
    // em "Outros" quem tinha corredor certo.
    var sing = s.replace(/(\w{4,})s\b/g, "$1");
    for (var i = 0; i < PISTAS.length; i++) {
      if (PISTAS[i].re.test(s) || PISTAS[i].re.test(sing)) return PISTAS[i].k;
    }
    return null;
  }

  /* ---------- Nome de compra ----------
     O formatador de nome mora em nome-alimento.js (o mesmo que renomeia o
     banco inteiro). Aqui entra a versão SEM preparo: na feira não se compra
     "grelhado". Se o arquivo não estiver na página, o nome sai como está. */
  function nomeCompra(nome) {
    var N = window.NomeAlimento;
    return N ? N.compra(nome) : String(nome == null ? "" : nome);
  }

  function alimentoDe(it) {
    if (it.alimentoId != null && AL_BY_ID[it.alimentoId]) return AL_BY_ID[it.alimentoId];
    if (!it.alimento) return null;
    return AL_BY_NOME[it.alimento.toLowerCase()] || AL_BY_SLUG[slug(it.alimento)] || null;
  }

  /* ---------- Edições das duas pontas ----------
     Junta o que a nutri curou (plano.compras) com o que o paciente mexeu
     (marcas["lc:extra"] / ["lc:rm"]) numa estrutura só. Remover ganha de
     adicionar: se um lado tirou o item, ele não volta porque o outro lado
     o tinha adicionado — senão não haveria como tirar item nenhum. */
  function lista(v) { return Array.isArray(v) ? v : []; }
  function combinar(doPlano, doPaciente) {
    doPlano = doPlano || {};
    doPaciente = doPaciente || {};
    var extras = [], vistos = {};
    lista(doPlano.extras).concat(lista(doPaciente.extras)).forEach(function (nome) {
      var txt = String(nome == null ? "" : nome).trim();
      var s = slug(txt);
      if (!txt || vistos[s]) return;
      vistos[s] = true;
      extras.push(txt);
    });
    return { extras: extras, remover: lista(doPlano.remover).concat(lista(doPaciente.remover)) };
  }
  /* O que o paciente guarda em plano_adesao.marcas, no formato de edits. */
  function editsDasMarcas(marcas) {
    marcas = marcas || {};
    return { extras: lista(marcas["lc:extra"]), remover: lista(marcas["lc:rm"]) };
  }

  /* Junta os itens do plano por alimento; devolve corredores ordenados com
     itens. `edits` (opcional) é { extras:[nome], remover:[slug] } — ver
     combinar(), acima. */
  function gerar(plano, edits) {
    edits = edits || {};
    var fora = {};
    lista(edits.remover).forEach(function (s) { fora[s] = true; });

    var mapa = {}; // chave -> { nome, bruto, grupo }
    (plano && plano.refeicoes || []).forEach(function (rf) {
      (rf.itens || []).forEach(function (it) {
        var nome = it.alimento || (it.nome) || "";
        if (!nome.trim()) return;
        var al = alimentoDe(it);
        // `taco` é o nome original; `nome` já vem humanizado por nome-alimento.js.
        var bruto = al ? (al.taco || al.nome) : nome;
        var exib = nomeCompra(bruto);
        // A chave é o nome DE COMPRA: patinho cru e patinho grelhado viram a
        // mesma linha da lista — na feira é a mesma carne, e duas linhas com
        // o mesmo nome é justamente o que se quer evitar.
        var s = slug(exib);
        if (fora[s]) return;
        // it.grupo cobre o alimento vindo da TACO do banco, que não está
        // no arquivo local; sem ele sobra a pista pelo nome, lá embaixo.
        if (!mapa["c" + s]) mapa["c" + s] = { nome: exib, bruto: bruto, grupo: (al && al.grupo) || it.grupo || null };
      });
    });

    // Item posto à mão entra como qualquer outro: o corredor sai da pista
    // pelo nome, então "papel toalha" cai em Outros e "banana" em Frutas.
    lista(edits.extras).forEach(function (nome) {
      var txt = String(nome == null ? "" : nome).trim();
      var s = slug(txt);
      if (!txt || fora[s] || mapa["c" + s]) return;
      mapa["c" + s] = { nome: txt, bruto: txt, grupo: null, extra: true };
    });

    var buckets = {};
    Object.keys(mapa).forEach(function (k) {
      var reg = mapa[k];
      // Nome primeiro: é o que distingue frango de carne e folha de raiz.
      // O grupo da TACO só entra quando o nome não diz nada.
      // Pista pelo nome da TACO, não pelo de compra: as pistas foram escritas
      // sobre o nome cru ("Carne, bovina, ...") e o de compra já perdeu palavra.
      var corr = corredorPeloNome(reg.bruto || reg.nome) || corredorPeloNome(reg.nome) ||
                 (reg.grupo && GRUPO2CORR[reg.grupo]) || OUTROS.key;
      (buckets[corr] = buckets[corr] || []).push(reg);
    });

    var out = [];
    CORREDORES.concat([OUTROS]).forEach(function (c) {
      var itens = buckets[c.key];
      if (!itens || !itens.length) return;
      itens.sort(function (a, b) { return a.nome.localeCompare(b.nome); });
      out.push({ key: c.key, ico: c.ico, label: c.label, itens: itens.map(finalizaItem) });
    });
    return { corredores: out, totalItens: Object.keys(mapa).length };
  }

  function finalizaItem(reg) {
    return { nome: reg.nome, slug: slug(reg.nome), extra: !!reg.extra };
  }

  /* ---------- Dicas de congelamento & porcionamento de marmita ---------- */
  var DICAS = [
    { ico: "❄️", t: "Congele em porções individuais", d: "Divida em potes do tamanho de uma refeição antes de congelar. Assim você descongela só o que vai comer e evita recongelar." },
    { ico: "🍚", t: "Resfrie antes de fechar", d: "Deixe a comida esfriar até a temperatura ambiente (máx. 1–2 h fora) antes de tampar e levar ao freezer. Fechar quente cria gelo e umidade." },
    { ico: "🏷️", t: "Etiquete com data", d: "Escreva o nome e a data no pote. Congelados caseiros duram bem por até 3 meses; arroz e feijão, até 3 meses; carnes cozidas, 2–3 meses." },
    { ico: "🥦", t: "Legumes: branqueie", d: "Ferva os legumes por 2–3 min e mergulhe em água gelada antes de congelar. Conserva cor, textura e nutrientes." },
    { ico: "🍗", t: "Separe proteína e carboidrato", d: "Congele arroz, feijão e a proteína em potes separados. Na hora, você monta a marmita do jeito que quiser." },
    { ico: "🔥", t: "Descongele na geladeira", d: "Passe do freezer para a geladeira na véspera. Requentar bem (fervura/vapor no micro-ondas com tampa) garante segurança." },
    { ico: "🥣", t: "Potes certos", d: "Use potes de vidro ou plástico livre de BPA, próprios para freezer e micro-ondas. Deixe 1–2 cm de folga: a comida expande ao congelar." },
    { ico: "🚫", t: "O que NÃO congela bem", d: "Folhas cruas (alface), batata cozida inteira, ovo cozido e preparações com muita maionese perdem textura. Prefira consumir frescos." }
  ];
  function dicasHTML(compact) {
    var cards = DICAS.map(function (d) {
      return '<div class="lc-dica"><span class="lc-dica__ico">' + d.ico + '</span>' +
        '<div><strong>' + esc(d.t) + '</strong><p>' + esc(d.d) + '</p></div></div>';
    }).join("");
    return '<div class="lc-dicas' + (compact ? " lc-dicas--compact" : "") + '">' +
      '<h3 class="lc-dicas__tit">🍱 Marmita sem erro — congelamento & porcionamento</h3>' +
      '<div class="lc-dicas__grid">' + cards + '</div></div>';
  }

  /* ---------- Render ----------
     `opts.check`  → checkbox do mercado (portal).
     `opts.editar` → botão de tirar item da lista, e o campo de adicionar. */
  function corredoresHTML(lst, opts) {
    opts = opts || {};
    if (!lst.totalItens) {
      return '<div class="empty-state">' + (opts.editar
        ? "Nada na lista ainda. Adicione alimentos ao plano, ou ponha um item à mão no campo acima."
        : "Adicione alimentos ao plano para gerar a lista de compras.") + '</div>';
    }
    return lst.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        var tirar = opts.editar
          ? '<button class="lc-item__x" type="button" data-lc-rm="' + esc(it.slug) + '"' +
            ' title="Tirar da lista" aria-label="Tirar ' + esc(it.nome) + ' da lista">✕</button>'
          : "";
        var marca = it.extra ? '<span class="lc-item__extra" title="Item posto à mão">+</span>' : "";
        if (opts.check) {
          var key = "compra:" + it.slug;
          var done = opts.marcas && opts.marcas[key] === true;
          return '<li class="lc-item lc-item--check' + (done ? " is-done" : "") + '" data-lc-li="' + esc(key) + '">' +
            '<label><input type="checkbox" data-check="' + esc(key) + '"' +
            (done ? " checked" : "") + (opts.readonly ? " disabled" : "") + '>' +
            '<span class="lc-item__box" aria-hidden="true"></span>' +
            '<span class="lc-item__nome">' + esc(it.nome) + marca + '</span></label>' + tirar + '</li>';
        }
        return '<li class="lc-item"><span class="lc-item__nome">' + esc(it.nome) + marca + '</span>' + tirar + '</li>';
      }).join("");
      return '<div class="lc-corr"><div class="lc-corr__head"><span class="lc-corr__ico">' + c.ico + '</span>' +
        '<span class="lc-corr__label">' + esc(c.label) + '</span>' +
        '<span class="lc-corr__n">' + c.itens.length + '</span></div>' +
        '<ul class="lc-list">' + itens + '</ul></div>';
    }).join("");
  }

  /* Campo de adicionar. O corredor é decidido pela pista do nome, então não
     há o que escolher: digita e entra no lugar certo. */
  function addHTML(ph) {
    return '<form class="lc-add" data-lc-add>' +
      '<input class="lc-add__input" type="text" name="item" autocomplete="off" maxlength="60" placeholder="' + esc(ph) + '" aria-label="Adicionar item à lista" />' +
      '<button class="btn btn--outline btn--sm" type="submit">Adicionar</button></form>';
  }

  function htmlNutri(plano, edits) {
    var lst = gerar(plano, edits);
    return '<section class="fsec lc-sec">' +
      '<div class="fsec__head"><h2 class="fsec__title">🛒 Lista de compras</h2>' +
        '<span class="lc-badge">' + lst.totalItens + ' itens</span></div>' +
      '<p class="pl-hint">Sai dos alimentos do plano — sem quantidade, porque quanto comprar é ' +
      'critério de quem compra. Você pode tirar o que não faz sentido e acrescentar o que quiser; ' +
      'o que a paciente ajustou na lista dela já aparece aqui. Vai junto quando você libera o plano.</p>' +
      addHTML("Acrescentar item (ex.: café)") +
      '<div class="lc-cols">' + corredoresHTML(lst, { editar: true }) + '</div>' +
      dicasHTML(true) +
      '</section>';
  }

  /* ---------- Render: portal do paciente (com check) ---------- */
  function htmlPortal(plano, marcas, readonly, edits) {
    var lst = gerar(plano, edits);
    var comprados = 0;
    lst.corredores.forEach(function (c) {
      c.itens.forEach(function (it) { if (marcas && marcas["compra:" + it.slug] === true) comprados++; });
    });
    return '<div class="pcard lc-portal">' +
      '<div class="lc-portal__head"><h3>🛒 Sua lista de compras</h3>' +
        '<span class="pcard__meta" id="lc-conta">' + comprados + ' de ' + lst.totalItens + ' no carrinho</span></div>' +
      '<div class="lc-prog"><span id="lc-prog-fill" style="width:' +
        (lst.totalItens ? Math.round(comprados * 100 / lst.totalItens) : 0) + '%"></span></div>' +
      '<p class="pcard__hint">Vá marcando o que colocar no carrinho — fica salvo, dá para fechar e voltar no meio do mercado. ' +
      'A lista sai do seu plano alimentar, sem quantidade: leve o que a sua casa consome. ' +
      'Pode tirar o que já tem e acrescentar o que faltar.</p>' +
      (readonly ? "" : addHTML("Acrescentar item (ex.: café)")) +
      '<div class="lc-cols">' + corredoresHTML(lst, { check: true, marcas: marcas, readonly: readonly, editar: !readonly }) + '</div>' +
      dicasHTML(false) +
      '</div>';
  }

  /* Contador + barra ao marcar, sem redesenhar a lista (redesenhar no meio
     do mercado faria a página pular de volta para o topo). */
  function refreshPortal(marcas) {
    var itens = [].slice.call(document.querySelectorAll("[data-lc-li]"));
    if (!itens.length) return;
    var feitos = 0;
    itens.forEach(function (li) {
      var done = marcas && marcas[li.getAttribute("data-lc-li")] === true;
      if (done) feitos++;
      li.classList.toggle("is-done", !!done);
    });
    var conta = document.getElementById("lc-conta");
    if (conta) conta.textContent = feitos + " de " + itens.length + " no carrinho";
    var fill = document.getElementById("lc-prog-fill");
    if (fill) fill.style.width = (itens.length ? Math.round(feitos * 100 / itens.length) : 0) + "%";
  }

  /* ---------- Render: PDF (classes doc-*) ---------- */
  function pdfHTML(plano, edits) {
    var lst = gerar(plano, edits);
    if (!lst.totalItens) return "";
    var corr = lst.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        // Quadradinho para riscar no papel: no PDF não há checkbox, e a lista
        // impressa vai para o mercado.
        return '<div class="doc-lc__item"><span class="doc-lc__box">☐</span><span>' + esc(it.nome) + '</span></div>';
      }).join("");
      return '<div class="doc-lc__corr"><div class="doc-lc__corrhead">' + c.ico + ' ' + esc(c.label) + '</div>' + itens + '</div>';
    }).join("");
    var dicas = DICAS.slice(0, 6).map(function (d) {
      return '<div class="doc-lc__dica"><strong>' + d.ico + ' ' + esc(d.t) + '</strong> ' + esc(d.d) + '</div>';
    }).join("");
    return '<div class="doc-pagebreak"></div>' +
      '<h2>🛒 Lista de compras</h2>' +
      '<div class="doc-lc">' + corr + '</div>' +
      '<h2 style="margin-top:14px">🍱 Marmita sem erro — congelamento & porcionamento</h2>' +
      '<div class="doc-lc__dicas">' + dicas + '</div>';
  }

  /* ---------- Edição (nutri e portal usam o mesmo wire) ----------
     `raiz` é o container onde a lista foi desenhada; `onChange(edits)` recebe
     os edits DAQUELE lado já atualizados e é quem grava (a nutri na coluna
     `plano`, o paciente em plano_adesao.marcas) e redesenha.

     Tirar item do plano vira uma entrada em `remover`; tirar item que o
     próprio lado tinha acrescentado só sai de `extras` — senão a lista
     acumularia lixo, e o item nunca mais poderia ser adicionado de novo. */
  function wireEdicao(raiz, getEdits, onChange) {
    if (!raiz) return;
    // O container sobrevive ao redesenho (só o innerHTML troca), então chamar
    // de novo empilharia listeners: o handler velho, com o estado velho em
    // closure, gravaria por cima do novo. Um listener só, callbacks trocados.
    raiz.__lcEdicao = { get: getEdits, change: onChange };
    if (raiz.__lcWired) return;
    raiz.__lcWired = true;
    function getE() { return raiz.__lcEdicao.get(); }
    function change(edits) { raiz.__lcEdicao.change(edits); }
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lc-rm]");
      if (!b || !raiz.contains(b)) return;
      e.preventDefault();
      var s = b.getAttribute("data-lc-rm");
      var ed = getE() || {};
      var extras = lista(ed.extras).filter(function (n) { return slug(n) !== s; });
      // Cópia: `remover` recebe push logo abaixo, e mutar o array de quem
      // chamou faria o onChange comparar o novo estado com ele mesmo.
      var remover = lista(ed.remover).slice();
      if (extras.length === lista(ed.extras).length && remover.indexOf(s) === -1) remover.push(s);
      change({ extras: extras, remover: remover });
    });
    raiz.addEventListener("submit", function (e) {
      var f = e.target.closest && e.target.closest("[data-lc-add]");
      if (!f || !raiz.contains(f)) return;
      e.preventDefault();
      var campo = f.querySelector("input[name=item]");
      var txt = String((campo && campo.value) || "").trim();
      if (!txt) return;
      var s = slug(txt);
      var ed = getE() || {};
      var extras = lista(ed.extras).slice(); // idem: `extras` recebe push abaixo
      var remover = lista(ed.remover);
      // O que já está desenhado na tela — é assim que se sabe se o item já
      // vem do plano sem precisar conhecer o plano aqui.
      var naTela = {};
      [].forEach.call(raiz.querySelectorAll("[data-lc-rm]"), function (b) {
        naTela[b.getAttribute("data-lc-rm")] = true;
      });
      // Acrescentar o que tinha sido tirado é o desfazer do ✕: basta sair de
      // `remover`. Virar também item avulso em `extras` deixaria o item
      // grudado na lista mesmo depois de sair do plano.
      var desfaz = remover.indexOf(s) !== -1;
      remover = remover.filter(function (x) { return x !== s; });
      if (!desfaz && !naTela[s] && !extras.some(function (n) { return slug(n) === s; })) extras.push(txt);
      if (campo) campo.value = "";
      change({ extras: extras, remover: remover });
    });
  }

  window.ListaCompras = {
    gerar: gerar, htmlNutri: htmlNutri, htmlPortal: htmlPortal, pdfHTML: pdfHTML,
    dicasHTML: dicasHTML, refresh: refreshPortal, nomeCompra: nomeCompra, slug: slug,
    combinar: combinar, editsDasMarcas: editsDasMarcas, wireEdicao: wireEdicao
  };
})();
