/* ============================================================
   LISTA DE COMPRAS — gerada automaticamente a partir de um plano
   alimentar. Soma os alimentos de todas as refeições, agrupa por
   seção de mercado (grupo TACO → corredor) e mostra a quantidade
   consolidada. Usada em 3 lugares:
     • painel da nutri (abaixo do plano)   → ListaCompras.htmlNutri(plano)
     • PDF do plano (via NutriDoc)          → ListaCompras.pdfHTML(plano)
     • portal do paciente (com check)       → ListaCompras.htmlPortal(plano, marcas, readonly)
   Também expõe as dicas de congelamento/porcionamento de marmita.
   window.ListaCompras.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function r0(n) { return Math.round(n); }
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
    // Ingrediente de receita é texto livre e vem no plural ("2 bananas
    // maduras"): tenta também sem o -s final das palavras longas, senão
    // metade da receita cai em "Outros".
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

  /* Soma os itens do plano por alimento; devolve corredores ordenados com itens.
     `receitas` (opcional) são as receitas liberadas para o paciente (0058):
     cada ingrediente entra como uma linha do corredor correspondente, com o
     nome da receita no lugar da quantidade — ingrediente de receita é texto
     livre ("2 abobrinhas médias"), não dá para somar em gramas. */
  function gerar(plano, receitas) {
    var mapa = {}; // chave -> { nome, grupo, gramas, medidas:{medida:qtd} }
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
        var chave = "c" + slug(exib);
        // it.grupo cobre o alimento vindo da TACO do banco, que não está
        // no arquivo local; sem ele sobra a pista pelo nome, lá embaixo.
        if (!mapa[chave]) mapa[chave] = { nome: exib, bruto: bruto, al: al, grupo: (al && al.grupo) || it.grupo || null, gramas: 0, medidas: {} };
        var reg = mapa[chave];
        reg.gramas += (+it.gramas || 0);
        var med = it.medida || "grama", qtd = +it.qtd || 0;
        if (med !== "grama" && qtd) reg.medidas[med] = (reg.medidas[med] || 0) + qtd;
      });
    });

    (receitas || []).forEach(function (rc) {
      (rc.ingredientes || []).forEach(function (linha) {
        var txt = String(linha == null ? "" : linha).trim();
        if (!txt) return;
        var chave = "r:" + txt.toLowerCase();
        if (!mapa[chave]) mapa[chave] = { nome: txt, grupo: null, gramas: 0, medidas: {}, receitas: [] };
        var reg = mapa[chave];
        if (reg.receitas && reg.receitas.indexOf(rc.nome) === -1) reg.receitas.push(rc.nome);
      });
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
      // O que veio do plano primeiro; depois o que veio das receitas.
      itens.sort(function (a, b) {
        var ra = a.receitas ? 1 : 0, rb = b.receitas ? 1 : 0;
        if (ra !== rb) return ra - rb;
        return a.nome.localeCompare(b.nome);
      });
      out.push({ key: c.key, ico: c.ico, label: c.label, itens: itens.map(finalizaItem) });
    });
    return { corredores: out, totalItens: Object.keys(mapa).length };
  }

  /* Quantidade: o TOTAL que se compra, e só ele. A medida caseira do plano
     ("2 colheres de sopa", "1 porcao") não serve na feira — ninguém compra
     azeite em colher. Vira grama/quilo, ou unidade quando o alimento é
     contável (ovo, pão, fruta): aí a conta é o total ÷ peso da unidade. */
  function pesoUnidade(al) {
    var meds = (al && al.medidas) || [];
    for (var i = 0; i < meds.length; i++) {
      if (/^unidade/i.test(meds[i].nome) && +meds[i].g > 0) return +meds[i].g;
    }
    return 0;
  }
  function textoPeso(g) {
    if (g >= 1000) return String((g / 1000).toFixed(g % 1000 ? 1 : 0)).replace(".", ",") + " kg";
    return r0(g) + " g";
  }
  function qtdTexto(reg) {
    var g = reg.gramas || 0;
    // Unidade só quando o plano prescreveu em unidade: 2 fatias de pão de
    // forma não devem virar "1 unidade", mas 2 ovos viram "2 unidades".
    var pu = reg.medidas && reg.medidas["unidade"] ? pesoUnidade(reg.al) : 0;
    if (pu > 0) {
      var n = Math.round(g / pu);
      if (n >= 1) return n + (n > 1 ? " unidades" : " unidade") + " (" + textoPeso(g) + ")";
    }
    return textoPeso(g);
  }
  function finalizaItem(reg) {
    // Ingrediente de receita já traz a medida no texto: no lugar da quantidade
    // vai de onde ele veio ("🍳 Lasanha de berinjela").
    if (reg.receitas) {
      return { nome: reg.nome, qtd: "🍳 " + reg.receitas.join(" · "), slug: slug(reg.nome),
               gramas: 0, receitas: reg.receitas };
    }
    return { nome: reg.nome, qtd: qtdTexto(reg), slug: slug(reg.nome), gramas: r0(reg.gramas) };
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

  /* ---------- Render: painel da nutri ---------- */
  function corredoresHTML(lista, opts) {
    opts = opts || {};
    if (!lista.totalItens) return '<div class="empty-state">Adicione alimentos ao plano para gerar a lista de compras.</div>';
    return lista.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        if (opts.check) {
          var key = "compra:" + it.slug;
          var done = opts.marcas && opts.marcas[key] === true;
          return '<li class="lc-item lc-item--check' + (done ? " is-done" : "") + '" data-lc-li="' + esc(key) + '">' +
            '<label><input type="checkbox" data-check="' + esc(key) + '"' +
            (done ? " checked" : "") + (opts.readonly ? " disabled" : "") + '>' +
            '<span class="lc-item__box" aria-hidden="true"></span>' +
            '<span class="lc-item__nome">' + esc(it.nome) + '</span>' +
            '<span class="lc-item__qt">' + esc(it.qtd) + '</span></label></li>';
        }
        return '<li class="lc-item"><span class="lc-item__nome">' + esc(it.nome) + '</span>' +
          '<span class="lc-item__qt">' + esc(it.qtd) + '</span></li>';
      }).join("");
      return '<div class="lc-corr"><div class="lc-corr__head"><span class="lc-corr__ico">' + c.ico + '</span>' +
        '<span class="lc-corr__label">' + esc(c.label) + '</span>' +
        '<span class="lc-corr__n">' + c.itens.length + '</span></div>' +
        '<ul class="lc-list">' + itens + '</ul></div>';
    }).join("");
  }

  function htmlNutri(plano, receitas) {
    var lista = gerar(plano, receitas);
    var comReceitas = !!(receitas && receitas.length);
    return '<section class="fsec lc-sec">' +
      '<div class="fsec__head"><h2 class="fsec__title">🛒 Lista de compras</h2>' +
        '<span class="lc-badge">' + lista.totalItens + ' itens · gerada do plano' +
        (comReceitas ? ' e das receitas' : '') + '</span></div>' +
      '<p class="pl-hint">Consolidada automaticamente a partir das refeições' +
      (comReceitas ? ' e dos ingredientes das receitas liberadas' : '') +
      '. Vai junto quando você libera o plano para o paciente.</p>' +
      '<div class="lc-cols">' + corredoresHTML(lista) + '</div>' +
      dicasHTML(true) +
      '</section>';
  }

  /* ---------- Render: portal do paciente (com check) ---------- */
  function htmlPortal(plano, marcas, readonly, receitas) {
    var lista = gerar(plano, receitas);
    if (!lista.totalItens) return "";
    var comprados = 0;
    lista.corredores.forEach(function (c) {
      c.itens.forEach(function (it) { if (marcas && marcas["compra:" + it.slug] === true) comprados++; });
    });
    return '<div class="pcard lc-portal">' +
      '<div class="lc-portal__head"><h3>🛒 Sua lista de compras</h3>' +
        '<span class="pcard__meta" id="lc-conta">' + comprados + ' de ' + lista.totalItens + ' no carrinho</span></div>' +
      '<div class="lc-prog"><span id="lc-prog-fill" style="width:' +
        (lista.totalItens ? Math.round(comprados * 100 / lista.totalItens) : 0) + '%"></span></div>' +
      '<p class="pcard__hint">Vá marcando o que colocar no carrinho — fica salvo, dá para fechar e voltar no meio do mercado. ' +
      'A lista sai do seu plano alimentar' +
      (receitas && receitas.length ? ' e das receitas que a sua nutricionista liberou' : '') + '.</p>' +
      '<div class="lc-cols">' + corredoresHTML(lista, { check: true, marcas: marcas, readonly: readonly }) + '</div>' +
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
  function pdfHTML(plano) {
    var lista = gerar(plano);
    if (!lista.totalItens) return "";
    var corr = lista.corredores.map(function (c) {
      var itens = c.itens.map(function (it) {
        return '<div class="doc-lc__item"><span>' + esc(it.nome) + '</span><span class="doc-lc__qt">' + esc(it.qtd) + '</span></div>';
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

  window.ListaCompras = {
    gerar: gerar, htmlNutri: htmlNutri, htmlPortal: htmlPortal, pdfHTML: pdfHTML,
    dicasHTML: dicasHTML, refresh: refreshPortal, nomeCompra: nomeCompra
  };
})();
