/* ============================================================
   NOME DE ALIMENTO — como a paciente lê
   A TACO nomeia por chave de busca: "Carne, bovina, patinho, moído, cru",
   "Pão, trigo, forma, integral", "Arroz, tipo 1, cozido". Isso serve para
   ordenar uma tabela, não para uma paciente entender o plano dela.

   Aqui o nome vira português: inverte a vírgula, tira o que só existe para
   catalogar (a espécie antes do corte, o cereal antes do pão, "tipo 1") e
   guarda o preparo para o fim — porque no PLANO o preparo importa (arroz
   cozido, frango grelhado). A lista de compras usa a mesma base sem preparo:
   ninguém compra frango grelhado.

     NomeAlimento.humano("Carne, bovina, patinho, moído, cru") → "Patinho moído cru"
     NomeAlimento.compra("Carne, bovina, patinho, moído, cru") → "Patinho moído"

   Ao carregar, este arquivo REESCREVE window.ALIMENTOS: `nome` passa a ser o
   nome humano e o nome original fica em `taco`. Todo mundo que já lia `nome`
   (editor, PDF, portal, lista de compras) mostra o nome novo sem mudar nada;
   quem precisa do original — busca e planos antigos gravados com o nome da
   TACO — usa `taco`. Carregar DEPOIS de alimentos-data.js e ANTES do resto.
   window.NomeAlimento.
   ============================================================ */
(function () {
  "use strict";

  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // Preparo: sai do meio do nome e volta no fim (ou some, na lista de compras).
  var PREPARO = /^(crua?s?|cozid[oa]s?|grelhad[oa]s?|assad[oa]s?|frit[oa]s?|refogad[oa]s?|desfiad[oa]s?|ensopad[oa]s?|tostad[oa]s?|escaldad[oa]s?|cozinhad[oa]s?|à milanesa|a milanesa|na chapa|na manteiga)$/i;
  var ESPECIE = /^(bovina|suína|suina)$/i;
  // Parte que pede "de" no meio: "Ovo de galinha", "Leite de vaca".
  var DE = /^(galinha|codorna|vaca|cabra|búfala|bufala|soja|milho|trigo|arroz|aveia|centeio|coco|oliva|leite)$/i;
  // Corte, que em português vem antes do animal: "Peito de frango".
  var CORTE = /^(peito|coxa|sobrecoxa|asa|filé|file|posta|lombo|costela|costeleta|bisteca|pernil|paleta|coração|coracao|fígado|figado|moela|rabada|músculo|musculo)$/i;
  // "com casca" só descreve o preparo da fruta; "tipo 1" é código de tabela.
  var RUIDO = /^(com casca|tipo 1)$/i;
  // Onde a regra geral não chega no nome que se fala na cozinha.
  var FIXO = {
    "arroz-tipo-1-cru": "Arroz branco", "arroz-tipo-1-cozido": "Arroz branco",
    "arroz-tipo-2-cru": "Arroz branco", "arroz-tipo-2-cozido": "Arroz branco",
    "pao-trigo-forma-integral": "Pão de forma integral",
    "pao-trigo-frances": "Pão francês",
    "pao-trigo-sovado": "Pão sovado",
    "pao-aveia-forma": "Pão de forma de aveia",
    "pao-milho-forma": "Pão de forma de milho",
    "pao-gluten-forma": "Pão de forma de glúten",
    "queijo-requeijao-cremoso": "Requeijão cremoso",
    "macarrao-trigo-cru": "Macarrão", "macarrao-trigo-cru-com-ovos": "Macarrão com ovos",
    "aveia-flocos-crua": "Aveia em flocos",
    "soja-queijo-tofu": "Tofu (queijo de soja)",
    "linhaca-semente": "Semente de linhaça",
    "carne-bovina-patinho-sem-gordura-cru": "Bife de patinho",
    "carne-bovina-patinho-sem-gordura-grelhado": "Bife de patinho"
  };

  /* Devolve { base, preparo, descartes } de um nome da TACO.
     base     — o alimento em português ("Patinho moído")
     preparo  — como foi preparado ("cru"), na ordem em que aparecia
     descartes— o que saiu do nome e serve para desempatar homônimos */
  function analisa(nome) {
    var bruto = String(nome == null ? "" : nome).trim().replace(/\s+/g, " ");
    var vazio = { base: bruto, preparo: [], descartes: [] };
    if (!bruto) return vazio;

    var partes = bruto.indexOf(",") === -1 ? [bruto]
      : bruto.split(",").map(function (p) { return p.trim(); }).filter(Boolean);

    var preparo = [], resto = [], descartes = [];
    partes.forEach(function (p, i) {
      // "cozido/10minutos" é detalhe de laboratório, não de cozinha.
      var limpo = p.replace(/\s*\/\s*\d+\s*minutos?/i, "").trim();
      if (i > 0 && PREPARO.test(limpo)) preparo.push(limpo.toLowerCase());
      else if (i > 0 && RUIDO.test(limpo)) descartes.push(limpo);
      else resto.push(limpo);
    });

    var fixo = FIXO[slug(bruto)];
    if (fixo) return { base: fixo, preparo: preparo, descartes: descartes.concat(resto.slice(1)) };
    if (partes.length === 1) return { base: resto[0] || bruto, preparo: preparo, descartes: descartes };

    var cabeca = resto.shift();
    // "Carne, bovina, patinho" → no açougue quem identifica é o corte.
    if (/^carnes?$/i.test(cabeca) && resto.length && ESPECIE.test(resto[0])) {
      descartes.push(cabeca, resto.shift());
      if (resto.length) cabeca = resto.shift();
    }
    // "Frango, peito" → "Peito de frango".
    if (resto.length && CORTE.test(resto[0])) {
      var corte = resto.shift();
      cabeca = corte.charAt(0).toUpperCase() + corte.slice(1) + " de " + cabeca.toLowerCase();
    }
    var txt = cabeca;
    resto.forEach(function (p) {
      if (/^conserva$/i.test(p)) txt += " em conserva";       // "Azeitona, preta, conserva"
      else txt += (DE.test(p) ? " de " : " ") + p;
    });
    return { base: txt.charAt(0).toUpperCase() + txt.slice(1), preparo: preparo, descartes: descartes };
  }

  function humano(nome) {
    var a = analisa(nome);
    return a.preparo.length ? a.base + " " + a.preparo.join(" ") : a.base;
  }
  function compra(nome) { return analisa(nome).base; }

  /* Renomeia o banco em memória. Dois alimentos diferentes não podem virar o
     mesmo nome (a nutri escolheria no escuro): quem chega depois leva entre
     parênteses o que o nome perdeu ("Arroz branco cozido (tipo 2)"). */
  function aplicar(lista) {
    var usados = {};
    (lista || []).forEach(function (a) {
      if (!a || !a.nome || a.taco) return;
      var bruto = a.nome;
      var info = analisa(bruto);
      var nome = info.preparo.length ? info.base + " " + info.preparo.join(" ") : info.base;
      if (usados[nome.toLowerCase()]) {
        var extra = info.descartes.filter(function (d) { return !/^carnes?$/i.test(d); }).join(" ");
        nome = nome + " (" + (extra || bruto) + ")";
        if (usados[nome.toLowerCase()]) nome = info.base + " (" + bruto + ")";
      }
      usados[nome.toLowerCase()] = 1;
      a.taco = bruto;
      a.nome = nome;
    });
    return lista;
  }

  /* Nome para mostrar um ITEM de plano. Plano gravado antes desta mudança tem
     o nome da TACO em `it.alimento`; quem manda é o alimento do banco (pelo
     id, senão pelo nome antigo). Sem alimento no banco — texto livre da nutri,
     ingrediente de receita — o próprio texto passa pelo formatador. */
  var PORID = {}, PORNOME = {};
  function indexar(lista) {
    (lista || []).forEach(function (a) {
      if (!a) return;
      PORID[a.id] = a;
      PORNOME[String(a.nome).toLowerCase()] = a;
      if (a.taco) PORNOME[a.taco.toLowerCase()] = a;
    });
  }
  function doItem(it) {
    if (!it) return "";
    var txt = it.alimento || it.nome || "";
    var a = (it.alimentoId != null && PORID[it.alimentoId]) || PORNOME[String(txt).toLowerCase()];
    return a ? a.nome : humano(txt);
  }

  window.NomeAlimento = {
    humano: humano, compra: compra, analisa: analisa,
    aplicar: aplicar, indexar: indexar, doItem: doItem
  };
  aplicar(window.ALIMENTOS);
  indexar(window.ALIMENTOS);
})();
