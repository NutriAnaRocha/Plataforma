/* ============================================================
   PLANO ALIMENTAR — construtor estilo WebDiet na ficha do paciente.
   Ao abrir a seção "Planejamento Alimentar": escolher entre montar do
   zero ou aplicar um modelo pronto; montar refeição por refeição
   escolhendo alimentos (autocomplete sobre window.ALIMENTOS/TACO) com
   medida caseira (colheres) + quantidade → gramas, kcal e macros
   calculados ao vivo. Salva em pacientes.plano (jsonb) e gera PDF com a
   identidade da nutri (window.NutriDoc).
   Exposto como window.PlanoAlimentar; usado pela ficha (pacientes.js).
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) {
    if (v == null || v === "") return 0;
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function r0(n) { return Math.round(n); }
  function hojeBR() {
    var d = new Date();
    return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
  }
  function normaliza(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  /* ---------- Banco de alimentos ---------- */
  var AL = window.ALIMENTOS || [];
  var AL_BY_ID = {}, AL_BY_NOME = {};
  /* `a.nome` já vem em português (nome-alimento.js reescreveu o banco) e
     `a.taco` guarda o nome original. Os dois entram no índice: plano salvo
     antes disso gravou o nome da TACO no item, e a nutri que aprendeu a
     buscar por "carne bovina patinho" continua achando. */
  AL.forEach(function (a) {
    AL_BY_ID[a.id] = a;
    AL_BY_NOME[a.nome.toLowerCase()] = a;
    if (a.taco) AL_BY_NOME[a.taco.toLowerCase()] = a;
  });

  function limpa(s) { return normaliza(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }

  // Índice de nomes já normalizados — a busca roda a cada tecla digitada.
  var AL_NORM = AL.map(function (a) { return limpa(a.nome + " " + (a.taco || "")); });

  /* Palavras de ligação: a TACO escreve "Pão, trigo, forma, integral", mas a
     nutri digita "pão de forma". Sem ignorar o "de" nada casava — e sem
     alimento resolvido o item ficava com a medida "grama" apenas (era a
     causa de "não tem unidade nos pães" e do 0 kcal). */
  var STOP = { de: 1, da: 1, do: 1, das: 1, dos: 1, e: 1, em: 1, no: 1, na: 1, com: 1, a: 1, o: 1, ao: 1 };
  function termosDe(q) {
    var brutos = limpa(q).split(" ").filter(Boolean);
    var uteis = brutos.filter(function (t) { return !STOP[t]; });
    return uteis.length ? uteis : brutos;
  }
  // Pontua um nome já normalizado contra os termos. -1 = não serve.
  // Começo do nome > começo de palavra > meio da palavra; nome curto desempata.
  function pontua(n, ts) {
    var s = 0;
    for (var i = 0; i < ts.length; i++) {
      var p = n.indexOf(ts[i]);
      if (p < 0) return -1;
      if (p === 0) s += 100;
      else if (n.charAt(p - 1) === " ") s += 60;
      else s += 20;
    }
    return s - n.length * 0.15;
  }
  /* Alimentos do dia a dia sobem na lista. A fonte não é um palpite: são os
     itens que os próprios MODELOS deste arquivo usam (arroz integral cozido,
     feijão carioca cozido, frango grelhado…). Sem isso, "feijão" trazia
     "Feijão, jalo, cru" primeiro só por ter o nome mais curto. */
  var COMUNS = null, _montandoComuns = false;
  function comuns() {
    if (COMUNS || _montandoComuns) return COMUNS || {};
    _montandoComuns = true;
    COMUNS = {};
    try {
      MODELOS.forEach(function (m) {
        Object.keys(m.variacoes || {}).forEach(function (k) {
          (m.variacoes[k] || []).forEach(function (rf) {
            (rf.itens || []).forEach(function (it) {
              var a = it.q ? acharAlimento(it.q) : null;
              if (a) COMUNS[a.id] = 1;
            });
          });
        });
      });
    } catch (e) { /* modelo malformado não pode quebrar a busca */ }
    _montandoComuns = false;
    return COMUNS;
  }
  // Lista de alimentos que casam com a busca, do mais provável ao menos.
  function buscar(q, limite) {
    var ts = termosDe(q);
    if (!ts.length) return AL.slice(0, limite || 60);
    var pop = comuns();
    var hits = [];
    for (var i = 0; i < AL.length; i++) {
      var s = pontua(AL_NORM[i], ts);
      if (s >= 0) hits.push({ a: AL[i], s: s + (pop[AL[i].id] ? 30 : 0) });
    }
    hits.sort(function (x, y) { return y.s - x.s; });
    return hits.slice(0, limite || 60).map(function (h) { return h.a; });
  }
  function acharAlimento(q) { return buscar(q, 1)[0] || null; }
  function alimentoDoValor(valor) {
    if (!valor) return null;
    return AL_BY_NOME[valor.toLowerCase()] || acharAlimento(valor);
  }

  /* ---------- Alimentos cadastrados pela nutri ----------
     A TACO não tem tudo: produto de marca (Rap10, requeijão light), corte que
     ela usa com outro nome (frango desfiado) ou receita da casa. Antes disso a
     nutri digitava o nome livre e o item ficava 0 kcal — o plano fechava com
     conta errada. Ficam na tabela alimentos_nutri (uma por nutri, id numérico
     a partir de 900001 para não colidir com a TACO) e entram na mesma busca. */
  function registraAlimento(a) {
    if (!a || AL_BY_ID[a.id]) return null;
    AL.push(a); AL_BY_ID[a.id] = a; AL_BY_NOME[a.nome.toLowerCase()] = a;
    AL_NORM.push(limpa(a.nome));
    return a;
  }
  function linhaParaAlimento(row) {
    var med = (row.medidas && row.medidas.length) ? row.medidas.slice() : [];
    // "grama" sempre presente e sempre em primeiro: é o denominador do cálculo.
    med = med.filter(function (m) { return m && m.nome && num(m.g) > 0 && m.nome !== "grama"; });
    med.unshift({ nome: "grama", g: 1 });
    return {
      id: row.id, nome: row.nome, grupo: row.grupo || "Meus alimentos",
      kcal: num(row.kcal), cho: num(row.cho), ptn: num(row.ptn), lip: num(row.lip), fibra: num(row.fibra),
      medidas: med, meu: true
    };
  }
  var _meusOk = false;
  function carregarMeusAlimentos() {
    if (_meusOk || !window.NutriDBReady) return Promise.resolve();
    _meusOk = true;
    return window.NutriDBReady.then(function (db) {
      return db.from("alimentos_nutri").select("*").order("nome");
    }).then(function (r) {
      ((r && r.data) || []).forEach(function (row) { registraAlimento(linhaParaAlimento(row)); });
    }).catch(function () { _meusOk = false; });
  }

  /* ---------- MODELOS pré-prontos (6 × 4 metas) ----------
     Itens referenciam o alimento por busca (`q`), resolvidos no banco na
     hora de aplicar — assim o modelo não depende de ids fixos.
     Cada modelo tem `variacoes` por meta calórica (1200/1500/1800/2000);
     as porções não são só escaladas — a composição é ajustada por nível.
     Um modelo pode restringir as metas oferecidas com `kcals` (ex.: o de
     canetas GLP-1, que só faz sentido em 1500 e 1800). */
  var KCALS = [1200, 1500, 1800, 2000];

  var MODELOS = [
    {
      id: "emagrecimento", ico: "🔥", nome: "Emagrecimento (déficit)",
      objetivo: "Emagrecimento com déficit calórico moderado",
      desc: "Equilibrado, com boa saciedade.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 5 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 5 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 7 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 6 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ]
      }
    },
    {
      id: "lowcarb", ico: "🥑", nome: "Low carb",
      objetivo: "Redução de carboidratos, foco em proteína e gorduras boas",
      desc: "Baixo carboidrato, mais proteína e gorduras boas.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 1 },
            { q: "abacate", medida: "colher de sopa", qtd: 3 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "16:00", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 2 },
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 },
            { q: "abacate", medida: "colher de sopa", qtd: 3 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "16:00", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 3 },
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 4 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 },
            { q: "abacate", medida: "colher de sopa", qtd: 4 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "16:00", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 4 },
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 },
            { q: "abacate", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 4 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 },
            { q: "abacate", medida: "colher de sopa", qtd: 4 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 2 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "16:00", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 4 },
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 },
            { q: "abacate", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 2 } ] }
        ]
      }
    },
    {
      id: "hipertrofia", ico: "💪", nome: "Hipertrofia / ganho de massa",
      objetivo: "Ganho de massa muscular com superávit e alta proteína",
      desc: "Superávit calórico e proteína elevada.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "07:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 3 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Pré-treino", hora: "16:00", itens: [
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 2 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 2 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "07:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Pré-treino", hora: "16:00", itens: [
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 3 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "07:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Pré-treino", hora: "16:00", itens: [
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "07:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Pré-treino", hora: "16:00", itens: [
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 5 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "20:00", itens: [
            { q: "carne, bovina, patinho, grelhado", medida: "porcao", qtd: 1 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 } ] }
        ]
      }
    },
    {
      id: "intestinal", ico: "🌿", nome: "Saúde intestinal (low-FODMAP)",
      objetivo: "Alívio de sintomas digestivos com abordagem low-FODMAP",
      desc: "Menos fermentáveis; foco em conforto digestivo.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "polvilho, doce", medida: "colher de sopa", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "morango", medida: "unidade", qtd: 8 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "polvilho, doce", medida: "colher de sopa", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "morango", medida: "unidade", qtd: 8 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "polvilho, doce", medida: "colher de sopa", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "morango", medida: "unidade", qtd: 8 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 8 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "polvilho, doce", medida: "colher de sopa", qtd: 3 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "morango", medida: "unidade", qtd: 8 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, mozarela", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 8 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ]
      }
    },
    {
      id: "sop", ico: "🩺", nome: "SOP / resistência à insulina",
      objetivo: "Controle glicêmico e da resistência à insulina (SOP)",
      desc: "Baixo índice glicêmico, fibras e proteína em cada refeição.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "morango", medida: "unidade", qtd: 5 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 2 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "salmao, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "morango", medida: "unidade", qtd: 5 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 3 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 5 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "salmao, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "morango", medida: "unidade", qtd: 6 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 4 },
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 5 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "salmao, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "morango", medida: "unidade", qtd: 6 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 4 },
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 5 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "salmao, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ]
      }
    },
    {
      id: "vegetariano", ico: "🥗", nome: "Vegetariano",
      objetivo: "Plano vegetariano com proteína vegetal e boa combinação",
      desc: "Sem carnes; proteína de leguminosas, ovos e laticínios.",
      variacoes: {
        1200: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "feijao, preto, cozido", medida: "concha", qtd: 1 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "lentilha, cozida", medida: "concha", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "feijao, preto, cozido", medida: "concha", qtd: 1 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "lentilha, cozida", medida: "concha", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "feijao, preto, cozido", medida: "concha", qtd: 1 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "lentilha, cozida", medida: "concha", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 3 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 3 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "feijao, preto, cozido", medida: "concha", qtd: 1 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural", medida: "copo (200 ml)", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "lentilha, cozida", medida: "concha", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 5 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ]
      }
    },
    {
      /* Análogos de GLP-1 (semaglutida, liraglutida, tirzepatida).
         Conduta completa (sintomas, exames, quando encaminhar) na Inteligência
         Clínica: protocolo `analogos-glp1`, migration 0048.
         Alvos conferidos contra três documentos de 2025:
         - Sievenpiper JL et al. Nutritional and lifestyle supportive care
           recommendations for management of obesity with GLP-1-based therapies:
           expert consensus (Delphi). Obes Pillars 2025;17:100228.
         - Mozaffarian D et al. Nutritional priorities to support GLP-1 therapy
           for obesity: joint Advisory ACLM/ASN/OMA/TOS. Obesity 2025;33(8):1475-503.
         - Spreckley E, Ruggiero A, Brown A. Bridging the nutrition guidance gap
           for GLP-1 RA assisted weight loss. Int J Obes 2025. doi 10.1038/s41366-025-01952-w

         Proteína: o risco do tratamento é perder massa magra junto com o peso.
         Consenso = 1,2-1,5 g/kg de peso ATUAL/dia (Advisory aceita até 1,6),
         DISTRIBUÍDA entre as refeições — por isso nenhuma refeição aqui fica
         abaixo de ~20 g, inclusive os lanches, reforçados com itens de pouco
         volume (leite em pó desnatado, ricota, ovo). Os totais (128 g em 1500 e
         140 g em 1800) equivalem a 1,2-1,6 g/kg para 80-100 kg, faixa típica de
         quem usa a caneta; em paciente mais leve, reduzir as porções proteicas.
         Refeições: 4-6 pequenas ao dia (consenso), aqui 5 — o esvaziamento
         gástrico lento traz saciedade precoce, náusea e refluxo.
         Gordura: consenso limita a 25-60 g/dia em 1200-1500 kcal e 35-70 g em
         1500-1800 kcal; este modelo fica em 44 g e 58 g, sem fritura e com o
         azeite dividido entre almoço e jantar (gordura concentrada piora náusea).
         Fibra: ≥25 g/dia (mulheres) e ≥30 g (homens) pela constipação típica;
         aqui 26 g e 31 g. Na fase de titulação da dose, o Advisory sugere segurar
         temporariamente fibra e gordura enquanto a náusea estiver ativa.
         Só 1500 e 1800 kcal: abaixo não fecha a proteína distribuída, e o consenso
         põe o piso de energia em 1000-1200 kcal; acima não costuma ser tolerado. */
      id: "caneta", ico: "💉", nome: "Canetas emagrecedoras (GLP-1)",
      objetivo: "Preservação de massa magra e controle de sintomas em uso de análogo de GLP-1",
      desc: "5 refeições pequenas, proteína alta, sem fritura e com fibra reforçada.",
      kcals: [1500, 1800],
      variacoes: {
        1500: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 },
            { q: "queijo, ricota", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "leite, de vaca, desnatado, po", medida: "colher de sopa", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "colher de sopa", qtd: 4 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 3 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, ricota", medida: "fatia", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 },
            { q: "leite, de vaca, desnatado, po", medida: "colher de sopa", qtd: 2 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 6 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de cha", qtd: 1 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "07:30", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "queijo, minas, frescal", medida: "fatia", qtd: 1 },
            { q: "mamao, formosa", medida: "colher de sopa", qtd: 3 } ] },
          { nome: "Lanche da manhã", hora: "10:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "leite, de vaca, desnatado, po", medida: "colher de sopa", qtd: 2 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 },
            { q: "linhaca, semente", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "feijao, carioca, cozido", medida: "concha", qtd: 1 },
            { q: "brocolis, cozido", medida: "pires", qtd: 1 },
            { q: "cenoura, crua", medida: "colher de sopa", qtd: 2 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "queijo, ricota", medida: "fatia", qtd: 2 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 1 },
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 1 },
            { q: "leite, de vaca, desnatado, po", medida: "colher de sopa", qtd: 1 },
            { q: "castanha, de caju", medida: "colher de sopa", qtd: 1 },
            { q: "morango", medida: "unidade", qtd: 6 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "merluza, file, assado", medida: "porcao", qtd: 1 },
            { q: "batata, doce, cozida", medida: "colher de sopa", qtd: 4 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "alface, crespa, crua", medida: "pires", qtd: 1 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ]
      }
    }
  ];
  var MODELO_BY_ID = {};
  MODELOS.forEach(function (m) { MODELO_BY_ID[m.id] = m; });

  // Constrói a fonte de expansão para um modelo numa meta calórica.
  function fonteModelo(m, kcal) {
    var v = m.variacoes || {};
    // Se o modelo não tem essa meta (ex.: só 1500/1800), cai na mais próxima que existe.
    if (!v[kcal]) {
      var disp = Object.keys(v).map(Number).sort(function (a, b) { return a - b; });
      if (!disp.length) return { nome: m.nome, objetivo: m.objetivo, metaKcal: kcal, refeicoes: [] };
      kcal = disp.reduce(function (a, b) {
        return Math.abs(b - kcal) < Math.abs(a - kcal) ? b : a;
      });
    }
    return { nome: m.nome, objetivo: m.objetivo, metaKcal: kcal, refeicoes: v[kcal] };
  }

  /* ---------- Cálculo ---------- */
  // Resolve gramas + macros de um item cru {alimento(nome)/alimentoId, medida, qtd}.
  function calcItem(it) {
    var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : alimentoDoValor(it.alimento);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    var med = medidas.filter(function (m) { return m.nome === it.medida; })[0] || medidas[0];
    var qtd = num(it.qtd);
    var gramas = qtd * (med ? med.g : 1);
    var f = gramas / 100;
    return {
      al: al, medidas: medidas, medida: med ? med.nome : "grama", qtd: qtd, gramas: r1(gramas),
      kcal: al ? r0(al.kcal * f) : 0,
      cho: al ? r1(al.cho * f) : 0,
      ptn: al ? r1(al.ptn * f) : 0,
      lip: al ? r1(al.lip * f) : 0
    };
  }
  // Refeição alternativa ("Lanche da tarde 2"): existe no plano como opção,
  // mas não entra na soma do dia — senão o total contaria a refeição duas vezes.
  function ehAlternativa(rf) { return !!(rf && rf.alternativa); }
  function totaisDe(plano) {
    var t = { kcal: 0, cho: 0, ptn: 0, lip: 0 };
    (plano.refeicoes || []).forEach(function (r) {
      if (ehAlternativa(r)) return;
      (r.itens || []).forEach(function (it) {
        var c = calcItem(it);
        t.kcal += c.kcal; t.cho += c.cho; t.ptn += c.ptn; t.lip += c.lip;
      });
    });
    return { kcal: r0(t.kcal), cho: r1(t.cho), ptn: r1(t.ptn), lip: r1(t.lip) };
  }
  function pctMacros(t) {
    var k = t.cho * 4 + t.ptn * 4 + t.lip * 9;
    if (k <= 0) return { cho: 0, ptn: 0, lip: 0 };
    return { cho: r0(t.cho * 4 / k * 100), ptn: r0(t.ptn * 4 / k * 100), lip: r0(t.lip * 9 / k * 100) };
  }

  // Expande um modelo (ou plano salvo) num rascunho com itens resolvidos.
  function expandir(fonte) {
    return {
      id: fonte.id || null,
      titulo: fonte.titulo || (fonte.nome ? "Plano — " + fonte.nome : "Plano alimentar"),
      objetivo: fonte.objetivo || "",
      metaKcal: fonte.metaKcal || "",
      // Memória do rascunho gerado da anamnese: viaja com o plano para o
      // editor mostrar as decisões e para o salvamento saber que este
      // plano ainda não pode ir para a paciente.
      rascunho: fonte.rascunho || null,
      refeicoes: (fonte.refeicoes || []).map(function (r) {
        return {
          nome: r.nome, hora: r.hora || "", alternativa: !!r.alternativa,
          // Caminho da foto do prato no bucket 'refeicoes' (só o path; a URL
          // assinada é buscada na hora de exibir).
          foto: r.foto || null,
          itens: (r.itens || []).map(function (it) {
            var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : (it.q ? acharAlimento(it.q) : alimentoDoValor(it.alimento));
            return {
              alimentoId: al ? al.id : null,
              alimento: al ? al.nome : (it.alimento || it.q || ""),
              medida: it.medida || "grama",
              qtd: it.qtd != null ? it.qtd : 1,
              subs: (it.subs || []).map(function (s) {
                var sa = s.alimentoId != null ? AL_BY_ID[s.alimentoId] : (s.q ? acharAlimento(s.q) : alimentoDoValor(s.alimento));
                return {
                  alimentoId: sa ? sa.id : null,
                  alimento: sa ? sa.nome : (s.alimento || s.q || ""),
                  medida: s.medida || "grama",
                  qtd: s.qtd != null ? s.qtd : 1
                };
              })
            };
          })
        };
      })
    };
  }
  function planoVazio() {
    return {
      titulo: "Plano alimentar", objetivo: "", metaKcal: "",
      refeicoes: [
        { nome: "Café da manhã", hora: "07:30", itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] },
        { nome: "Almoço", hora: "12:30", itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] },
        { nome: "Lanche da tarde", hora: "16:00", itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] },
        { nome: "Jantar", hora: "19:30", itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] }
      ]
    };
  }

  /* ============================================================
     RENDER
     ============================================================ */
  var _p = null, _ctx = null, _draft = null, _viewId = null;
  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function perfil() { return (_ctx && _ctx.perfil) || {}; }
  function root() { return document.getElementById("plano-root"); }

  /* ---------- Biblioteca de planos (vários por paciente) ----------
     Para não exigir migração de banco, a biblioteca inteira vive dentro
     da própria coluna `plano` (jsonb): os campos do plano ATIVO ficam no
     topo (compatível com portal/adesão/timeline que leem p.plano.refeicoes),
     e o acervo completo em plano.planos[] + qual é o ativo em plano.ativoId. */
  function novoId() { return "pl" + Date.now() + Math.floor(Math.random() * 1000); }
  function byId(id) { return function (x) { return x && x.id === id; }; }
  function limpaLib(pl) { var c = Object.assign({}, pl); delete c.planos; delete c.ativoId; return c; }
  // Normaliza p.plano para o formato novo (planos[] com id estável + flag
  // `publicado` = liberado para o paciente ver no portal). Muta em memória
  // para que ids não mudem entre chamadas na mesma sessão.
  function garantirLib(p) {
    if (!p) return;
    var pl = p.plano;
    if (pl && Array.isArray(pl.planos)) {
      pl.planos.forEach(function (x) {
        if (!x) return;
        if (!x.id) x.id = novoId();
        // migração: se ainda não tem o flag, o antigo "ativo" (ativoId) vira liberado.
        if (typeof x.publicado !== "boolean") x.publicado = pl.ativoId ? (x.id === pl.ativoId) : true;
      });
      return;
    }
    if (pl && ((pl.refeicoes && pl.refeicoes.length) || pl.titulo)) {
      var e = limpaLib(pl); if (!e.id) e.id = novoId();
      if (typeof e.publicado !== "boolean") e.publicado = true; // plano único antigo: já estava visível
      p.plano = Object.assign({}, e, { planos: [e] });
    }
  }
  // Todos os planos do paciente.
  function libDe(p) {
    garantirLib(p);
    var pl = p && p.plano;
    return (pl && Array.isArray(pl.planos)) ? pl.planos : [];
  }
  // Plano em foco por padrão: o primeiro liberado; senão o mais recente.
  function focoPadrao(lib) {
    var pub = lib.filter(function (x) { return x.publicado; });
    return (pub[0] || lib[lib.length - 1] || null);
  }

  function render(p) {
    var lib = libDe(p);
    // escolhaHTML precisa da paciente NO ARGUMENTO: render() roda antes de
    // wire(), então o _p do módulo ainda é o da ficha anterior (ou nada).
    return '<div id="plano-root">' + (lib.length ? painelHTML(p) : escolhaHTML(p)) + '</div>';
  }

  // Lista de planos + detalhe do plano em foco.
  function painelHTML(p) {
    var lib = libDe(p);
    var foco = (_viewId && lib.some(byId(_viewId))) ? lib.filter(byId(_viewId))[0] : focoPadrao(lib);
    return listaPlanosHTML(lib, foco.id) + resumoHTML(foco);
  }

  function toggleHTML(pl) {
    var on = !!pl.publicado;
    return '<button class="pl-switch' + (on ? " pl-switch--on" : "") + '" type="button" ' +
      'role="switch" aria-checked="' + (on ? "true" : "false") + '" ' +
      'data-toggle-plano="' + esc(pl.id) + '" ' +
      'title="' + (on ? "Liberado para o paciente — clique para ocultar" : "Oculto — clique para liberar para o paciente") + '">' +
      '<span class="pl-switch__knob"></span>' +
      '<span class="pl-switch__lbl">' + (on ? "Liberado" : "Oculto") + '</span>' +
    '</button>';
  }

  function listaPlanosHTML(lib, vid) {
    var cards = lib.map(function (pl) {
      var t = totaisDe(pl);
      var isView = pl.id === vid;
      return '<div class="pl-plano-card' + (isView ? " pl-plano-card--sel" : "") +
          (pl.publicado ? " pl-plano-card--pub" : "") + '" data-plano="' + esc(pl.id) + '">' +
        '<button class="pl-plano-card__open" type="button" data-open-plano="' + esc(pl.id) + '">' +
          '<span class="pl-plano-card__tit">' + esc(pl.titulo || "Plano alimentar") + '</span>' +
          '<span class="pl-plano-card__sub">' + t.kcal + ' kcal' +
            (pl.metaKcal ? ' · meta ' + esc(pl.metaKcal) : '') +
            (pl.atualizadoEm ? ' · ' + esc(pl.atualizadoEm) : '') + '</span>' +
        '</button>' +
        '<div class="pl-plano-card__foot">' + toggleHTML(pl) +
          '<button class="pl-x pl-plano-card__del" type="button" data-del-plano="' + esc(pl.id) + '" aria-label="Excluir plano" title="Excluir plano">🗑️</button>' +
        '</div>' +
      '</div>';
    }).join("");
    var nPub = lib.filter(function (x) { return x.publicado; }).length;
    var sub = nPub === 0 ? "Nenhum liberado para o paciente" :
      nPub === 1 ? "1 liberado para o paciente" : (nPub + " liberados para o paciente");
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head"><h2 class="fsec__title">Planos alimentares (' + lib.length + ')</h2>' +
          '<button class="btn btn--primary btn--sm" type="button" data-pl-add>＋ Novo plano</button>' +
        '</div>' +
        '<p class="pl-hint">' + sub + '. Use o botão <strong>Liberado/Oculto</strong> em cada plano para escolher o que ele vê no portal.</p>' +
        '<div class="pl-planos">' + cards + '</div>' +
      '</section>';
  }

  /* ---------- Tela de escolha ---------- */
  function escolhaHTML(p) {
    p = p || _p;
    // Modelos favoritados (⭐, migração 0060) sobem para o topo.
    var F = window.Favoritos;
    var listaModelos = MODELOS.slice();
    if (F) listaModelos.sort(function (a, b) { return (F.tem("plano", b.id) ? 1 : 0) - (F.tem("plano", a.id) ? 1 : 0); });
    var modelos = listaModelos.map(function (m) {
      var chips = (m.kcals || KCALS).map(function (k) {
        return '<button class="pl-modelo__kcal" type="button" data-modelo="' + m.id + '" data-kcal="' + k + '">' +
          k + '</button>';
      }).join("");
      return '<div class="pl-modelo">' +
        (F ? '<div class="pl-modelo__fav">' + F.botaoHTML("plano", m.id, m.nome) + '</div>' : '') +
        '<span class="pl-modelo__ico">' + m.ico + '</span>' +
        '<span class="pl-modelo__nome">' + esc(m.nome) + '</span>' +
        '<span class="pl-modelo__desc">' + esc(m.desc) + '</span>' +
        '<div class="pl-modelo__kcals" role="group" aria-label="Meta calórica">' +
          '<span class="pl-modelo__kcals-lbl">kcal:</span>' + chips +
        '</div>' +
      '</div>';
    }).join("");
    var voltar = libDe(p).length
      ? '<button class="btn btn--ghost btn--sm" type="button" data-pl-voltar-lista>← Voltar aos planos</button>' : '';
    // Só aparece para quem respondeu a anamnese do programa — é dela que
    // o rascunho sai. Sem anamnese não há o que ler.
    var temAnamnese = !!(window.RascunhoPlano && window.RascunhoPlano.anamneseDe(p));
    var daAnamnese = temAnamnese
      ? '<button class="pl-inicio pl-inicio--rascunho" type="button" data-pl-rascunho>' +
          '<span class="pl-inicio__ico">📋</span>' +
          '<span class="pl-inicio__tit">Gerar rascunho da anamnese</span>' +
          '<span class="pl-inicio__sub">Cálculo, modelo e horários dela — para você revisar e assinar</span>' +
        '</button>'
      : '';
    var meta = (_ctx && _ctx.metaKcal)
      ? '<p class="pl-hint">🧮 Meta de <strong>' + esc(_ctx.metaKcal) + ' kcal</strong> vinda da calculadora — ' +
        'ela já entra preenchida no plano que você abrir.</p>' : '';
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head"><h2 class="fsec__title">Novo plano alimentar</h2>' + voltar + '</div>' + meta +
        '<div class="pl-escolha">' +
          daAnamnese +
          '<button class="pl-inicio pl-inicio--zero" type="button" data-do-zero>' +
            '<span class="pl-inicio__ico">✍️</span>' +
            '<span class="pl-inicio__tit">Começar do zero</span>' +
            '<span class="pl-inicio__sub">Monte refeição por refeição</span>' +
          '</button>' +
        '</div>' +
      '</section>' +
      '<section class="fsec">' +
        '<h2 class="fsec__title">Ou use um modelo pronto</h2>' +
        '<p class="pl-hint">Aplica um plano-base que você ajusta para o paciente.</p>' +
        '<div class="pl-modelos">' + modelos + '</div>' +
      '</section>';
  }

  /* ---------- Resumo do plano salvo ---------- */
  function resumoHTML(plano) {
    var t = totaisDe(plano), pc = pctMacros(t);
    var meals = (plano.refeicoes || []).map(function (rf) {
      var itens = (rf.itens || []).map(function (it) {
        var c = calcItem(it);
        return '<div class="pl-res__item"><span>' + esc(nomeItem(it) || "—") + '</span>' +
          '<span class="pl-res__qt">' + esc(qtdLabel(it, c)) + '</span>' +
          '<span class="pl-res__kc">' + c.kcal + ' kcal</span></div>' + subsResumoHTML(it);
      }).join("");
      var sub = (rf.itens || []).reduce(function (a, it) { return a + calcItem(it).kcal; }, 0);
      var alt = ehAlternativa(rf);
      var foto = rf.foto
        ? '<div class="pl-res__foto"><img data-foto-img alt="Foto de ' + esc(rf.nome || "refeição") + '" /></div>'
        : '';
      return '<div class="pl-res__meal' + (alt ? ' pl-res__meal--alt' : '') + '"' +
          (rf.foto ? ' data-foto="' + esc(rf.foto) + '"' : '') + '><div class="pl-res__head">' +
        '<span class="pl-res__nome">' + esc(rf.nome || "Refeição") +
          (alt ? ' <span class="pl-alt-badge">opção · não soma</span>' : '') + '</span>' +
        '<span class="pl-res__hora">' + esc(rf.hora || "") + '</span>' +
        '<span class="pl-res__mealkc">' + r0(sub) + ' kcal</span></div>' + foto + itens + '</div>';
    }).join("");
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head"><h2 class="fsec__title">' + esc(plano.titulo || "Plano alimentar") +
            (plano.publicado ? ' <span class="pl-plano-card__badge">Liberado</span>' : '') + '</h2>' +
          '<div class="pl-res__acoes">' +
            toggleHTML(plano) +
            '<button class="btn btn--outline btn--sm" type="button" data-pl-pdf>🖨️ PDF</button>' +
            '<button class="btn btn--outline btn--sm" type="button" data-pl-editar>✏️ Editar</button>' +
          '</div></div>' +
        (plano.objetivo ? '<p class="pl-res__obj">🎯 ' + esc(plano.objetivo) + '</p>' : '') +
        totaisBarHTML(t, pc, plano.metaKcal) +
        adesaoDiariaHTML(plano) +
        '<div class="pl-res__meals">' + meals + '</div>' +
      '</section>' +
      (window.ListaCompras ? window.ListaCompras.htmlNutri(plano, comprasCombinadas(plano)) : "");
  }
  /* Adesão dia a dia: o portal zera as caixas todo dia e guarda o que foi
     marcado em marcas.__hist. Aqui isso vira a régua dos últimos 14 dias —
     é o que mostra se a paciente está seguindo de verdade ao longo da
     semana, e não um número acumulado que só cresce. */
  var DIAS_REGUA = 14;
  function adesaoDiariaHTML(plano) {
    if (!plano.publicado || !window.AdesaoDia || !_marcasPac) return "";
    var refs = (plano.refeicoes || []).filter(function (r) { return !ehAlternativa(r); });
    var total = refs.reduce(function (a, r) { return a + ((r.itens || []).length); }, 0);
    if (!total) return "";
    // Chaves ri:ii são contadas sobre TODAS as refeições (é como o portal marca).
    var idx = [];
    (plano.refeicoes || []).forEach(function (r, ri) {
      if (ehAlternativa(r)) return;
      (r.itens || []).forEach(function (_it, ii) { idx.push(ri + ":" + ii); });
    });

    var dias = window.AdesaoDia.ultimosDias(_marcasPac, DIAS_REGUA);
    var comMarca = 0, somaPct = 0;
    var barras = dias.map(function (d) {
      var feitos = idx.reduce(function (a, k) { return a + (d.marcas[k] === true ? 1 : 0); }, 0);
      var pct = Math.round(feitos * 100 / total);
      if (feitos) comMarca++;
      somaPct += pct;
      var cls = pct >= 70 ? " is-alta" : pct >= 40 ? " is-media" : pct > 0 ? " is-baixa" : " is-zero";
      return '<div class="pl-adia__col" title="' + esc(fmtDia(d.dia)) + ' · ' + pct + '% (' + feitos + '/' + total + ')">' +
          '<div class="pl-adia__bar' + cls + '" style="height:' + Math.max(pct, 3) + '%"></div>' +
          '<span class="pl-adia__d">' + esc(d.dia.slice(8)) + '</span>' +
        '</div>';
    }).join("");
    var media = Math.round(somaPct / dias.length);
    return '<div class="pl-adia">' +
      '<div class="pl-adia__head"><strong>Adesão dia a dia</strong>' +
        '<span>últimos ' + DIAS_REGUA + ' dias · média ' + media + '% · marcou em ' + comMarca + ' de ' + DIAS_REGUA + ' dias</span></div>' +
      '<div class="pl-adia__grid">' + barras + '</div>' +
      '<p class="pl-hint">O quadro do paciente zera todo dia; cada coluna é o que ele marcou naquele dia.</p>' +
    '</div>';
  }
  function fmtDia(iso) {
    var p = String(iso).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] : iso;
  }

  function qtdLabel(it, c) {
    if (it.medida === "grama") return c.gramas + " g";
    return num(it.qtd) + " " + it.medida + " (" + c.gramas + " g)";
  }
  // "Frango — ou: Ovo (2 unidades) · Merluza (120 g)". Substituto é opção de
  // troca equivalente; nunca entra na conta do dia.
  function subsTexto(it) {
    return (it.subs || []).filter(function (s) { return s && s.alimento; }).map(function (s) {
      return s.alimento + " (" + qtdLabel(s, calcItem(s)) + ")";
    });
  }
  function subsResumoHTML(it) {
    var t = subsTexto(it);
    if (!t.length) return "";
    return '<div class="pl-res__subs"><span class="pl-res__subs-lbl">ou</span> ' + esc(t.join(" · ")) + '</div>';
  }
  function totaisBarHTML(t, pc, meta) {
    var alvo = meta ? '<span class="pl-tot__alvo">de ' + meta + ' kcal (' + r0(t.kcal / meta * 100) + '%)</span>' : '';
    return '<div class="pl-tot">' +
      '<div class="pl-tot__kcal"><strong id="pl-tot-kcal">' + t.kcal + '</strong> kcal ' + alvo + '</div>' +
      '<div class="pl-tot__macros">' +
        '<span class="pl-macro pl-macro--cho"><b id="pl-tot-cho">' + t.cho + '</b> g carbo · ' + pc.cho + '%</span>' +
        '<span class="pl-macro pl-macro--ptn"><b id="pl-tot-ptn">' + t.ptn + '</b> g prot · ' + pc.ptn + '%</span>' +
        '<span class="pl-macro pl-macro--lip"><b id="pl-tot-lip">' + t.lip + '</b> g gord · ' + pc.lip + '%</span>' +
      '</div></div>';
  }

  /* ---------- Meta calórica vinda do cálculo energético ----------
     A meta do plano era um número digitado à mão. O prontuário já guarda
     TMB/GET/VET calculados (calculos.js → coluna `calculos`); aqui eles
     viram botões: um toque põe o número no campo e o rodapé recalcula.
     VET é o padrão — é a meta do objetivo (déficit/superávit já aplicado);
     GET é a manutenção e TMB o basal, oferecidos porque a Ana às vezes
     prescreve por eles. */
  function calcSalvo() {
    var c = (_ctx && _ctx.calculos) || (_p && _p.calculos);
    return (c && typeof c === "object") ? c : null;
  }
  function metaFonteHTML(metaAtual) {
    var c = calcSalvo();
    if (!c || (c.vet == null && c.get == null && c.tmb == null)) {
      return '<p class="pl-hint pl-metafonte pl-metafonte--vazia">🧮 Nenhum cálculo energético salvo para este paciente. ' +
        'Faça em <strong>Cálculos energéticos</strong>, no prontuário, e o VET aparece aqui para virar a meta em um toque.</p>';
    }
    var chips = [
      { k: "vet", lbl: "VET", sub: c.objetivoNome || "meta do objetivo" },
      { k: "get", lbl: "GET", sub: "manutenção" },
      { k: "tmb", lbl: "TMB", sub: c.formulaNome || "basal" }
    ].filter(function (x) { return c[x.k] != null; }).map(function (x) {
      var on = metaAtual && num(metaAtual) === num(c[x.k]);
      return '<button class="pl-metafonte__chip' + (on ? " is-on" : "") + '" type="button" data-pl-usar-meta="' + esc(c[x.k]) + '" ' +
        'title="Usar ' + esc(x.lbl) + ' como meta do plano">' +
        '<b>' + esc(x.lbl) + '</b> ' + esc(c[x.k]) + ' kcal' +
        '<span class="pl-metafonte__sub">' + esc(x.sub) + '</span></button>';
    }).join("");
    return '<div class="pl-metafonte">' +
      '<span class="pl-metafonte__lbl">🧮 Do prontuário' + (c.atualizadoEm ? ' · ' + esc(c.atualizadoEm) : '') + '</span>' +
      chips + '</div>';
  }

  /* ---------- Editor ---------- */
  function editorHTML(plano) {
    var meals = plano.refeicoes.map(function (rf, mi) { return mealHTML(rf, mi); }).join("");
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head">' +
          '<h2 class="fsec__title">Montar plano</h2>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-pl-voltar>← Voltar</button>' +
        '</div>' +
        rascunhoHTML(plano.rascunho) +
        '<div class="pl-meta">' +
          '<label class="pl-field pl-field--wide"><span>Título</span><input type="text" data-pl-titulo value="' + esc(plano.titulo || "") + '" placeholder="Plano alimentar" /></label>' +
          '<label class="pl-field pl-field--wide"><span>Objetivo</span><input type="text" data-pl-objetivo value="' + esc(plano.objetivo || "") + '" placeholder="Ex.: emagrecimento" /></label>' +
          '<label class="pl-field"><span>Meta kcal</span><input type="number" data-pl-meta value="' + esc(plano.metaKcal || "") + '" placeholder="opcional" /></label>' +
        '</div>' +
        metaFonteHTML(plano.metaKcal) +
        '<div id="pl-meals">' + meals + '</div>' +
        '<div class="pl-addmeals">' +
          '<button class="btn btn--outline btn--sm pl-addmeal" type="button" data-add-meal>＋ Adicionar refeição</button>' +
          '<button class="btn btn--outline btn--sm pl-addmeal pl-addmeal--alt" type="button" data-add-alt>↔ Adicionar opção alternativa</button>' +
        '</div>' +
        '<p class="pl-hint">Para dar outra opção da mesma refeição, use o <strong>⧉ duplicar</strong> no cabeçalho dela: ' +
          'sai um <em>Jantar — Opção 2</em> com os mesmos alimentos, que você troca à vontade. ' +
          'A cópia já entra como opção e <strong>não é somada</strong> no total do dia — o paciente come uma ou a outra. ' +
          'As setas <strong>↑ ↓</strong> mudam a ordem — as do cabeçalho movem a refeição inteira, ' +
          'as da linha do alimento mudam a ordem dentro do prato.</p>' +
      '</section>' +
      '<div class="pl-totbar" id="pl-totbar">' + '</div>' +
      '<div class="pl-actions">' +
        '<button class="btn btn--outline" type="button" data-pl-pdf-edit>🖨️ Gerar PDF</button>' +
        '<button class="btn btn--primary" type="button" data-pl-salvar>💾 Salvar plano</button>' +
      '</div>';
  }

  function mealHTML(rf, mi) {
    var itens = (rf.itens || []).map(function (it, ii) { return itemHTML(it, mi, ii); }).join("");
    var alt = ehAlternativa(rf);
    return '<div class="pl-meal' + (alt ? ' pl-meal--alt' : '') + '" data-meal="' + mi + '" data-alt="' + (alt ? "1" : "0") + '"' +
        (rf.foto ? ' data-foto="' + esc(rf.foto) + '"' : '') + '>' +
      '<div class="pl-meal__head">' +
        '<input class="pl-meal__nome" type="text" data-meal-nome value="' + esc(rf.nome || "") + '" placeholder="Refeição" />' +
        '<input class="pl-meal__hora" type="time" data-meal-hora value="' + esc(rf.hora || "") + '" />' +
        altBtnHTML(alt) +
        '<span class="pl-meal__kc" data-meal-kc>0 kcal</span>' +
        mealAcoesHTML() +
      '</div>' +
      fotoBoxHTML(rf.foto) +
      '<div class="pl-items">' + itens + '</div>' +
      '<button class="pl-additem" type="button" data-add-item>＋ alimento</button>' +
    '</div>';
  }
  /* Foto do prato montado: a paciente entende a porção olhando, não lendo
     "120 g". Fica escondida enquanto não houver foto — o botão 📷 do
     cabeçalho é quem abre o seletor de arquivo. */
  function fotoBoxHTML(path) {
    return '<div class="pl-foto" data-foto-box' + (path ? "" : " hidden") + '>' +
      '<img class="pl-foto__img" data-foto-img alt="Foto da refeição" />' +
      '<div class="pl-foto__acoes">' +
        '<button class="pl-mbtn" type="button" data-foto-trocar>Trocar</button>' +
        '<button class="pl-mbtn pl-mbtn--del" type="button" data-foto-rm>Remover foto</button>' +
      '</div>' +
    '</div>';
  }
  /* Ações da refeição. Duplicar é o que a nutri mais usa: "Jantar — Opção 2"
     sai de uma cópia do jantar, não de uma refeição vazia que ela remonta
     item por item. As setas ordenam; o excluir ganhou rótulo porque só o
     ícone passava despercebido. */
  function mealAcoesHTML() {
    return '<div class="pl-meal__acoes">' +
      '<button class="pl-mbtn" type="button" data-foto-add title="Foto do prato montado (a paciente vê no portal)" aria-label="Foto da refeição">📷<span class="pl-mbtn__t">Foto</span></button>' +
      '<button class="pl-mbtn" type="button" data-dup-meal title="Duplicar como outra opção desta refeição" aria-label="Duplicar refeição">⧉<span class="pl-mbtn__t">Duplicar</span></button>' +
      '<button class="pl-mbtn pl-mbtn--ico" type="button" data-up-meal title="Mover para cima" aria-label="Mover refeição para cima">↑</button>' +
      '<button class="pl-mbtn pl-mbtn--ico" type="button" data-down-meal title="Mover para baixo" aria-label="Mover refeição para baixo">↓</button>' +
      '<button class="pl-mbtn pl-mbtn--del" type="button" data-rm-meal title="Excluir esta refeição" aria-label="Excluir refeição">🗑️ Excluir</button>' +
    '</div>';
  }
  // Chave "soma / não soma" da refeição — é o que permite ter "Lanche da tarde 2"
  // sem inflar o total do dia.
  function altBtnHTML(alt) {
    return '<button class="pl-altbtn' + (alt ? " is-on" : "") + '" type="button" data-alt-meal ' +
      'aria-pressed="' + (alt ? "true" : "false") + '" ' +
      'title="' + (alt ? "Opção alternativa: não entra no total do dia. Clique para voltar a somar." :
                         "Esta refeição soma no total do dia. Clique para transformar em opção alternativa.") + '">' +
      (alt ? "↔ opção · não soma" : "∑ soma no total") + '</button>';
  }

  function medOptsHTML(medidas, sel) {
    return medidas.map(function (m) {
      return '<option value="' + esc(m.nome) + '" data-g="' + m.g + '"' + (m.nome === sel ? " selected" : "") + '>' + esc(m.nome) + '</option>';
    }).join("");
  }
  // Campo de alimento com autocomplete próprio (o <datalist> nativo não
  // filtrava por acento nem deixava rolar a lista — era a queixa da busca).
  function foodInputHTML(valor, attr, ph) {
    return '<div class="pl-foodwrap">' +
      '<input class="pl-item__food pl-food" type="text" ' + attr + ' autocomplete="off" spellcheck="false" ' +
        'role="combobox" aria-expanded="false" aria-autocomplete="list" ' +
        'value="' + esc(valor || "") + '" placeholder="' + esc(ph) + '" />' +
      '<div class="pl-ac" data-ac hidden></div>' +
    '</div>';
  }

  /* Nome do item para EXIBIR. O texto gravado no plano pode ser o nome antigo
     da TACO ("Arroz, tipo 1, cozido"); quem manda é o alimento do banco, que
     nome-alimento.js já deixou em português. */
  function nomeItem(it) {
    if (!it) return "";
    var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : alimentoDoValor(it.alimento);
    return al ? al.nome : (it.alimento || "");
  }

  function itemHTML(it, mi, ii) {
    var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : alimentoDoValor(it.alimento);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    var subs = (it.subs || []).filter(function (s) { return s && s.alimento; });
    return '<div class="pl-itemwrap" data-item>' +
      '<div class="pl-item">' +
        foodInputHTML(nomeItem(it), "data-food", "buscar alimento…") +
        '<input class="pl-item__qt" type="number" step="0.5" min="0" data-qt value="' + esc(it.qtd != null ? it.qtd : 1) + '" />' +
        '<select class="pl-item__med" data-med>' + medOptsHTML(medidas, it.medida) + '</select>' +
        '<span class="pl-item__g" data-gramas>—</span>' +
        '<span class="pl-item__kc" data-kc>—</span>' +
        '<button class="pl-swap' + (subs.length ? " is-on" : "") + '" type="button" data-toggle-subs ' +
          'aria-label="Opções de substituição" title="Alimentos que substituem este">⇄' +
          '<span class="pl-swap__n" data-subs-n>' + (subs.length || "") + '</span></button>' +
        // Ordem dentro da refeição: a nutri monta o prato na ordem que quer que
        // a paciente leia (arroz e feijão no topo, salada depois).
        '<span class="pl-ord">' +
          '<button class="pl-ord__b" type="button" data-up-item title="Mover para cima" aria-label="Mover alimento para cima">↑</button>' +
          '<button class="pl-ord__b" type="button" data-down-item title="Mover para baixo" aria-label="Mover alimento para baixo">↓</button>' +
        '</span>' +
        '<button class="pl-x" type="button" data-rm-item aria-label="Remover">✕</button>' +
      '</div>' +
      subsBoxHTML(subs) +
    '</div>';
  }

  // Painel de substitutos do item — fica recolhido até a nutri abrir (⇄).
  function subsBoxHTML(subs) {
    var linhas = (subs || []).map(subRowHTML).join("");
    return '<div class="pl-subs" data-subs' + (subs && subs.length ? "" : " hidden") + '>' +
      '<div class="pl-subs__lbl">Pode substituir por:</div>' +
      '<div class="pl-subs__rows" data-sub-rows>' + linhas + '</div>' +
      '<button class="pl-additem pl-additem--sub" type="button" data-add-sub>＋ substituto</button>' +
    '</div>';
  }
  function subRowHTML(s) {
    s = s || { alimento: "", medida: "grama", qtd: 1 };
    var al = s.alimentoId != null ? AL_BY_ID[s.alimentoId] : alimentoDoValor(s.alimento);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    return '<div class="pl-sub" data-sub>' +
      '<span class="pl-sub__ico" aria-hidden="true">⇄</span>' +
      foodInputHTML(nomeItem(s), "data-sub-food", "alimento substituto…") +
      '<input class="pl-item__qt" type="number" step="0.5" min="0" data-sub-qt value="' + esc(s.qtd != null ? s.qtd : 1) + '" />' +
      '<select class="pl-item__med" data-sub-med>' + medOptsHTML(medidas, s.medida) + '</select>' +
      '<span class="pl-item__kc" data-sub-kc>—</span>' +
      '<button class="pl-x" type="button" data-rm-sub aria-label="Remover substituto">✕</button>' +
    '</div>';
  }

  /* ============================================================
     WIRE
     ============================================================ */
  function wire(p, ctx) {
    // Salvar re-renderiza a ficha inteira (onSaved -> renderProfile), o que
    // chama render()+wire() de novo. Zerar o foco aqui jogava a nutri de volta
    // para outro plano logo depois de ela salvar o que estava editando —
    // então o foco só se perde quando a ficha muda de paciente.
    if (!_p || _p.id !== p.id) _viewId = null;
    _p = p; _ctx = ctx || {};
    // Os alimentos que a nutri cadastrou entram no banco de busca antes de ela
    // abrir o editor — se chegarem depois, o item já lançado calcula 0 kcal.
    carregarMeusAlimentos();
    carregarMarcasPaciente();
    var r = root(); if (!r) return;
    // Estado inicial: se já tem plano(s) salvo(s), mostramos o painel; senão a escolha.
    // A escolha é re-renderizada aqui (e não só fiada) porque render() roda
    // antes de wire() — sem isso o aviso da meta vinda da calculadora só
    // apareceria na segunda visita à seção.
    // render() monta o HTML do painel, mas quem busca as URLs assinadas das
    // fotos é o wire — render é síncrono e a assinatura é uma ida ao servidor.
    if (libDe(p).length) { bindPainel(); hidratarFotos(r); }
    else { r.innerHTML = escolhaHTML(p); bindEscolha(); }
  }

  function bindEscolha() {
    var r = root(); if (!r) return;
    var vl = r.querySelector("[data-pl-voltar-lista]");
    if (vl) vl.addEventListener("click", function () { mostrarPainel(); });
    var zero = r.querySelector("[data-do-zero]");
    if (zero) zero.addEventListener("click", function () { abrirEditor(planoVazio()); });
    var rasc = r.querySelector("[data-pl-rascunho]");
    if (rasc) rasc.addEventListener("click", function () { gerarRascunho(); });
    r.querySelectorAll("[data-modelo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = MODELO_BY_ID[b.getAttribute("data-modelo")];
        var kcal = parseInt(b.getAttribute("data-kcal"), 10) || 1500;
        if (m) abrirEditor(expandir(fonteModelo(m, kcal)));
      });
    });
  }

  /* ---------- Lista de compras: a metade que é da paciente ----------
     A nutri cura a lista na coluna `plano` (que é dela); a paciente mexe na
     dela em plano_adesao.marcas, que a nutri só pode LER. Sem isso o painel
     mostrava só metade da lista — a paciente via o que a nutri acrescentou,
     mas não o contrário. Uma consulta por ficha aberta, e o painel só é
     redesenhado se a paciente tiver mexido em alguma coisa. */
  var _marcasPac = null, _marcasPacId = null;
  function editsPaciente() {
    return window.ListaCompras ? window.ListaCompras.editsDasMarcas(_marcasPac) : { extras: [], remover: [] };
  }
  function comprasCombinadas(plano) {
    var c = plano && plano.compras;
    return window.ListaCompras ? window.ListaCompras.combinar(c, editsPaciente()) : c;
  }
  function carregarMarcasPaciente() {
    if (!_p || !window.NutriPacientes || !window.NutriPacientes.getAdesao) return;
    if (_marcasPacId === _p.id) return; // já carregado para esta paciente
    _marcasPacId = _p.id;
    _marcasPac = null;
    window.NutriPacientes.getAdesao(_p.id).then(function (m) {
      if (!_p || _marcasPacId !== _p.id) return; // a ficha mudou no meio do caminho
      _marcasPac = m || {};
      // Redesenha sempre: além da lista de compras, o painel agora mostra a
      // régua de adesão dia a dia, que só existe depois destas marcas.
      if (root() && libDe(_p).length) mostrarPainel();
    }).catch(function () {});
  }

  // Devolve o plano em foco (o que está sendo exibido no detalhe).
  function planoEmFoco() {
    var lib = libDe(_p);
    return (_viewId && lib.some(byId(_viewId))) ? lib.filter(byId(_viewId))[0] : focoPadrao(lib);
  }
  function mostrarPainel() {
    var r = root(); if (!r) return;
    r.innerHTML = painelHTML(_p);
    bindPainel();
    hidratarFotos(r);
  }

  function bindPainel() {
    var r = root(); if (!r) return;
    var foco = planoEmFoco();
    // ---- ações do detalhe do plano em foco ----
    var ed = r.querySelector("[data-pl-editar]");
    if (ed) ed.addEventListener("click", function () { abrirEditor(expandir(foco)); });
    var pdf = r.querySelector("[data-pl-pdf]");
    if (pdf) pdf.addEventListener("click", function () { gerarPDF(foco); });
    // ---- lista: novo, trocar foco, liberar/ocultar, excluir ----
    var add = r.querySelector("[data-pl-add]");
    if (add) add.addEventListener("click", function () { r.innerHTML = escolhaHTML(); bindEscolha(); });
    r.querySelectorAll("[data-open-plano]").forEach(function (b) {
      b.addEventListener("click", function () { _viewId = b.getAttribute("data-open-plano"); mostrarPainel(); });
    });
    r.querySelectorAll("[data-toggle-plano]").forEach(function (b) {
      b.addEventListener("click", function () { alternarPublicado(b.getAttribute("data-toggle-plano")); });
    });
    r.querySelectorAll("[data-del-plano]").forEach(function (b) {
      b.addEventListener("click", function () { excluirPlano(b.getAttribute("data-del-plano")); });
    });
    // ---- lista de compras: tirar/acrescentar item ----
    // A curadoria da nutri mora no próprio plano (`plano.compras`), porque a
    // coluna `plano` é a que ela pode gravar — plano_adesao é do paciente.
    if (window.ListaCompras && foco) {
      window.ListaCompras.wireEdicao(r,
        function () { return foco.compras; },
        function (edits) {
          // Item que a paciente tirou da lista dela não volta por acréscimo da
          // nutri (remover ganha de acrescentar, senão ninguém conseguiria tirar
          // nada) — então some da tela dela sem explicação. Daí o aviso.
          var antes = (foco.compras && foco.compras.extras) || [];
          var pacRm = editsPaciente().remover || [];
          var invis = (edits.extras || []).filter(function (n) {
            return antes.indexOf(n) === -1 &&
              pacRm.indexOf(window.ListaCompras.slug(n)) !== -1;
          });
          foco.compras = edits;
          persistir(libDe(_p), foco.id);
          if (invis.length) toast("A paciente tirou " + invis.join(", ") + " da lista dela — não vai reaparecer para ela.", true);
        });
    }
  }

  /* Rascunho da anamnese: quem faz a leitura e a conta é rascunho-plano.js.
     Aqui só se abre o resultado no editor — ou se diz por que não dá.
     Quando o módulo se recusa (gestação, transtorno alimentar), a recusa
     vira o aviso: é informação clínica, não erro de sistema. */
  function gerarRascunho() {
    if (!window.RascunhoPlano) { toast("Módulo do rascunho não carregou.", true); return; }
    var res = window.RascunhoPlano.gerar(_p);
    if (res.erro) { toast(res.erro, true); return; }
    abrirEditor(expandir(res.plano));
    toast("Rascunho gerado — revise antes de liberar.");
  }

  function rascunhoHTML(rasc) {
    if (!rasc) return "";
    var avisos = (rasc.avisos || []).map(function (a) {
      return '<li class="pl-rasc__aviso">' + esc(a) + '</li>';
    }).join("");
    var itens = (rasc.memoria || []).map(function (m) {
      return '<div class="pl-rasc__item"><b>' + esc(m.titulo) + '</b><p>' + esc(m.texto) + '</p></div>';
    }).join("");
    return '' +
      '<div class="pl-rasc">' +
        '<div class="pl-rasc__topo">' +
          '<span class="pl-rasc__selo">Rascunho</span>' +
          '<p class="pl-rasc__intro">Gerado da anamnese dela. <strong>Nada disto vai para a paciente ' +
            'antes de você liberar.</strong> Confira, ajuste e assine — a prescrição é sua.</p>' +
        '</div>' +
        (avisos ? '<ul class="pl-rasc__avisos">' + avisos + '</ul>' : '') +
        '<details class="pl-rasc__memoria"><summary>Como cheguei aqui</summary>' + itens + '</details>' +
      '</div>';
  }

  // Aplica ao campo "Meta kcal" um dos números do cálculo energético.
  function usarMetaDoCalculo(btn) {
    var r = root(); if (!r) return;
    var campo = r.querySelector("[data-pl-meta]"); if (!campo) return;
    campo.value = btn.getAttribute("data-pl-usar-meta");
    r.querySelectorAll("[data-pl-usar-meta]").forEach(function (b) {
      b.classList.toggle("is-on", b === btn);
    });
    recalc();
    toast("Meta de " + campo.value + " kcal aplicada — o total do plano já compara com ela.");
  }

  function abrirEditor(plano) {
    // VET entra como meta do plano quando ele ainda não tem uma: primeiro o
    // que veio da calculadora nesta navegação, senão o último cálculo salvo
    // no prontuário. Assim a Ana não precisa reabrir os Cálculos energéticos
    // só para anotar o número.
    if (!plano.metaKcal && _ctx && _ctx.metaKcal) plano.metaKcal = _ctx.metaKcal;
    if (!plano.metaKcal) { var c = calcSalvo(); if (c && c.vet != null) plano.metaKcal = c.vet; }
    _draft = plano;
    var r = root(); if (!r) return;
    r.innerHTML = editorHTML(plano);
    bindEditor();
    recalc();
    hidratarFotos(r);
  }

  function bindEditor() {
    var r = root(); if (!r) return;
    r.querySelector("[data-pl-voltar]").addEventListener("click", function () {
      if (libDe(_p).length) mostrarPainel();
      else { r.innerHTML = escolhaHTML(); bindEscolha(); }
    });
    // recalcula ao vivo
    r.addEventListener("input", function (e) {
      if (e.target.matches(".pl-food")) { abrirAC(e.target); atualizarMedidas(e.target); }
      recalc();
    });
    r.addEventListener("change", function (e) { recalc(); });
    // autocomplete: abre ao focar, navega pelo teclado, fecha ao sair
    /* Ao entrar num campo que JÁ tem alimento, o texto vem selecionado: digitar
       troca o alimento em vez de grudar no que estava lá. Sem isso, clicar em
       "Sardinha, inteira, crua" e digitar "banana" virava
       "Sardinha, inteira, cruabanana" — nenhum resultado, e a impressão de que
       a busca não achava banana. */
    r.addEventListener("focusin", function (e) {
      if (!e.target.matches(".pl-food")) return;
      if (_vindoDaEscolha) { _vindoDaEscolha = false; return; }
      if (e.target.value) e.target.select();
      abrirAC(e.target);
    });
    r.addEventListener("keydown", onACKey);
    // Uma vez só: o editor é reaberto várias vezes por sessão e o listener é
    // no document (não morre junto com o innerHTML do editor).
    if (!_acForaLigado) { document.addEventListener("click", fecharACForaSeNecessario, true); _acForaLigado = true; }
    // delegação de cliques (add/remove)
    r.addEventListener("click", function (e) {
      var t = e.target;
      var op = t.closest("[data-ac-op]");
      if (op) { escolherAC(op); return; }
      var novo = t.closest("[data-ac-novo]");
      if (novo) { abrirCadastroAlimento(novo); return; }
      if (t.closest("[data-add-item]")) { addItem(t.closest("[data-meal]")); }
      else if (t.closest("[data-rm-item]")) { t.closest("[data-item]").remove(); recalc(); }
      else if (t.closest("[data-toggle-subs]")) { alternarSubs(t.closest("[data-item]")); }
      else if (t.closest("[data-add-sub]")) { addSub(t.closest("[data-item]")); }
      else if (t.closest("[data-rm-sub]")) { var itw = t.closest("[data-item]"); t.closest("[data-sub]").remove(); contarSubs(itw); recalc(); }
      else if (t.closest("[data-alt-meal]")) { alternarAlt(t.closest("[data-meal]")); }
      else if (t.closest("[data-dup-meal]")) { duplicarMeal(t.closest("[data-meal]")); }
      else if (t.closest("[data-up-item]")) { moverItem(t.closest("[data-item]"), -1); }
      else if (t.closest("[data-down-item]")) { moverItem(t.closest("[data-item]"), 1); }
      else if (t.closest("[data-up-meal]")) { moverMeal(t.closest("[data-meal]"), -1); }
      else if (t.closest("[data-down-meal]")) { moverMeal(t.closest("[data-meal]"), 1); }
      else if (t.closest("[data-rm-meal]")) { removerMeal(t.closest("[data-meal]")); }
      else if (t.closest("[data-foto-add]") || t.closest("[data-foto-trocar]")) { pedirFoto(t.closest("[data-meal]")); }
      else if (t.closest("[data-foto-rm]")) { removerFoto(t.closest("[data-meal]")); }
      else if (t.closest("[data-pl-usar-meta]")) { usarMetaDoCalculo(t.closest("[data-pl-usar-meta]")); }
      else if (t.closest("[data-pl-salvar]")) { salvar(); }
      else if (t.closest("[data-pl-pdf-edit]")) { gerarPDF(coletar()); }
    });
  }

  /* ---------- Autocomplete de alimentos ----------
     Lista própria (o <datalist> do navegador ignorava acento, não rolava e
     mostrava sugestões que não tinham nada a ver com o que foi digitado). */
  function acDe(input) { return input.parentNode.querySelector("[data-ac]"); }
  // Escolher uma opção devolve o foco ao input; sem esta trava o focusin
  // reabriria a lista e selecionaria o nome que ela acabou de escolher.
  var _vindoDaEscolha = false, _acForaLigado = false;
  function abrirAC(input) {
    var box = acDe(input); if (!box) return;
    var lista = buscar(input.value, 60);
    var termo = (input.value || "").trim();
    // O "cadastrar" fica sempre à mão, no rodapé da lista: o alimento que
    // falta quase sempre PARECE existir (vem um primo dele na busca), então
    // esperar a lista vazia não resolveria.
    var novo = '<button class="pl-ac__novo" type="button" data-ac-novo tabindex="-1">' +
      "＋ Cadastrar " + (termo ? '“' + esc(termo) + '”' : "um alimento meu") + "</button>";
    if (!lista.length) {
      box.innerHTML = '<div class="pl-ac__vazio">Nenhum alimento encontrado</div>' + novo;
    } else {
      box.innerHTML = lista.map(function (a, i) {
        return '<button class="pl-ac__op' + (i === 0 ? " is-hl" : "") + '" type="button" data-ac-op="' + a.id + '" tabindex="-1">' +
          '<span class="pl-ac__nome">' + esc(a.nome) + (a.meu ? ' <span class="pl-ac__meu">meu</span>' : "") + '</span>' +
          '<span class="pl-ac__kc">' + r0(a.kcal) + ' kcal/100 g</span></button>';
      }).join("") + novo;
    }
    box.hidden = false;
    box.scrollTop = 0;
    input.setAttribute("aria-expanded", "true");
    // Abre para cima quando não cabe abaixo — na última refeição a lista
    // caía fora da tela e ela precisava rolar para "caçar" o alimento.
    box.classList.remove("pl-ac--cima");
    var r = box.getBoundingClientRect();
    var acima = input.getBoundingClientRect().top;
    if (r.bottom > window.innerHeight - 8 && acima > r.height + 16) box.classList.add("pl-ac--cima");
  }
  function fecharAC(box) {
    if (!box || box.hidden) return;
    box.hidden = true;
    var inp = box.parentNode.querySelector(".pl-food");
    if (inp) inp.setAttribute("aria-expanded", "false");
  }
  function fecharACForaSeNecessario(e) {
    var r = root(); if (!r) return;
    r.querySelectorAll("[data-ac]:not([hidden])").forEach(function (box) {
      if (!box.parentNode.contains(e.target)) fecharAC(box);
    });
  }
  function escolherAC(op) {
    /* A lista é reconstruída a cada tecla digitada. Se o clique pegar uma
       opção no exato instante da troca, esse botão já saiu do DOM e não tem
       mais pai — daí caímos na lista que está aberta agora. */
    var box = op.closest("[data-ac]") || (root() || document).querySelector("[data-ac]:not([hidden])");
    if (!box) return;
    var input = box.parentNode.querySelector(".pl-food");
    if (!input) return;
    var al = AL_BY_ID[parseInt(op.getAttribute("data-ac-op"), 10)];
    if (al) input.value = al.nome;
    fecharAC(box);
    atualizarMedidas(input);
    // Escolha explícita já vem na medida caseira (1 fatia, 1 unidade…) em vez
    // de "1 grama" — que é o que a nutri quase nunca quer digitar.
    var ehSub = input.hasAttribute("data-sub-food");
    var sel = input.closest(ehSub ? "[data-sub]" : ".pl-item").querySelector(ehSub ? "[data-sub-med]" : "[data-med]");
    if (sel && sel.value === "grama" && sel.options.length > 1) sel.selectedIndex = 1;
    recalc();
    _vindoDaEscolha = true;
    input.focus();
    _vindoDaEscolha = false;
  }
  /* ---------- Cadastrar alimento (o que a TACO não tem) ----------
     O rótulo do produto quase nunca vem "por 100 g" — vem por porção. Por isso
     o formulário aceita os dois e converte, senão o Rap10 de 40 g entraria como
     se 100 g tivessem 130 kcal. A porção informada já vira medida caseira. */
  function abrirCadastroAlimento(btnNovo) {
    var box = btnNovo.closest("[data-ac]");
    var input = box && box.parentNode.querySelector(".pl-food");
    var termo = input ? (input.value || "").trim() : "";
    if (box) fecharAC(box);
    var host = document.getElementById("ficha-main") || document.body;
    var ov = document.createElement("div"); ov.className = "op-modal"; ov.id = "pl-al-modal";
    ov.innerHTML =
      '<div class="op-modal__box"><div class="op-modal__head"><b>Cadastrar alimento</b>' +
      '<button class="op-modal__x" type="button" data-al-x aria-label="Fechar">✕</button></div>' +
      '<form class="op-form" data-al-form>' +
        '<label>Nome<input name="nome" required placeholder="Ex.: Rap10 integral" value="' + esc(termo) + '" /></label>' +
        '<fieldset class="pl-alfs"><legend>Os valores do rótulo são por:</legend>' +
          '<label class="pl-alradio"><input type="radio" name="base" value="100" checked /> 100 g</label>' +
          '<label class="pl-alradio"><input type="radio" name="base" value="porcao" /> uma porção de' +
            '<input class="pl-alnum" name="porcao_g" type="number" min="1" step="0.1" placeholder="40" /> g</label>' +
        "</fieldset>" +
        '<div class="pl-algrid">' +
          '<label>Calorias (kcal)<input name="kcal" type="number" min="0" step="0.1" required /></label>' +
          '<label>Carboidrato (g)<input name="cho" type="number" min="0" step="0.1" /></label>' +
          '<label>Proteína (g)<input name="ptn" type="number" min="0" step="0.1" /></label>' +
          '<label>Gordura (g)<input name="lip" type="number" min="0" step="0.1" /></label>' +
          '<label>Fibra (g)<input name="fibra" type="number" min="0" step="0.1" /></label>' +
        "</div>" +
        '<label>Medida caseira (opcional) <span class="op-hint">como você vai lançar no plano: unidade, fatia, colher…</span>' +
          '<span class="pl-almed"><input name="med_nome" placeholder="unidade" />' +
          '<input class="pl-alnum" name="med_g" type="number" min="1" step="0.1" placeholder="40" /> g cada</span></label>' +
        '<div class="op-form__acts"><button class="btn btn--primary" type="submit">Salvar alimento</button>' +
          '<button class="btn btn--ghost" type="button" data-al-x>Cancelar</button></div>' +
      "</form></div>";
    host.appendChild(ov);
    var inpNome = ov.querySelector('[name="nome"]'); if (inpNome) inpNome.focus();

    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("[data-al-x]")) ov.remove();
    });
    ov.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var nome = String(fd.get("nome") || "").trim();
      if (!nome) return;
      var porBase = String(fd.get("base") || "100");
      var pg = num(fd.get("porcao_g"));
      if (porBase === "porcao" && pg <= 0) { toast("Diga quantos gramas tem a porção do rótulo.", true); return; }
      var k = porBase === "porcao" ? 100 / pg : 1;   // fator para virar "por 100 g"
      var medNome = String(fd.get("med_nome") || "").trim();
      var medG = num(fd.get("med_g"));
      var medidas = [{ nome: "grama", g: 1 }];
      if (medNome && medG > 0) medidas.push({ nome: medNome, g: medG });
      else if (porBase === "porcao") medidas.push({ nome: "porcao", g: pg });
      var novo = {
        nome: nome, grupo: "Meus alimentos",
        kcal: r1(num(fd.get("kcal")) * k), cho: r1(num(fd.get("cho")) * k), ptn: r1(num(fd.get("ptn")) * k),
        lip: r1(num(fd.get("lip")) * k), fibra: r1(num(fd.get("fibra")) * k), medidas: medidas
      };
      var btn = e.target.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
      salvarAlimentoNovo(novo).then(function (a) {
        ov.remove();
        if (input) {
          input.value = a.nome;
          atualizarMedidas(input);
          var ehSub = input.hasAttribute("data-sub-food");
          var sel = input.closest(ehSub ? "[data-sub]" : ".pl-item").querySelector(ehSub ? "[data-sub-med]" : "[data-med]");
          if (sel && sel.options.length > 1) sel.selectedIndex = 1;
          recalc();
          input.focus();
        }
        toast('"' + a.nome + '" entrou nos seus alimentos');
      }).catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = "Salvar alimento"; }
        toast("Não consegui salvar o alimento. " + (err && err.message || ""), true);
      });
    });
  }
  // Grava na tabela da nutri e devolve o alimento já no formato do banco local.
  // Sem gravar não registra em memória: um alimento que só existe nesta aba
  // faria o plano abrir com 0 kcal na próxima vez.
  function salvarAlimentoNovo(novo) {
    if (!window.NutriDBReady) return Promise.reject(new Error("Sem conexão com o banco."));
    return window.NutriDBReady.then(function (db) {
      return db.from("alimentos_nutri").insert(novo).select().single();
    }).then(function (r) {
      if (r && r.error) throw r.error;
      var row = r && r.data;
      if (!row) throw new Error("Resposta vazia do banco.");
      return registraAlimento(linhaParaAlimento(row)) || AL_BY_ID[row.id];
    });
  }

  function onACKey(e) {
    var input = e.target.closest ? e.target.closest(".pl-food") : null;
    if (!input) return;
    var box = acDe(input); if (!box) return;
    if (e.key === "Escape") { fecharAC(box); return; }
    if (box.hidden) {
      if (e.key === "ArrowDown") { abrirAC(input); e.preventDefault(); }
      return;
    }
    var ops = box.querySelectorAll("[data-ac-op]");
    if (!ops.length) return;
    var i = -1;
    for (var k = 0; k < ops.length; k++) { if (ops[k].classList.contains("is-hl")) { i = k; break; } }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (i >= 0) ops[i].classList.remove("is-hl");
      i = e.key === "ArrowDown" ? (i + 1) % ops.length : (i <= 0 ? ops.length - 1 : i - 1);
      ops[i].classList.add("is-hl");
      ops[i].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (i >= 0) { if (e.key === "Enter") e.preventDefault(); escolherAC(ops[i]); }
      else fecharAC(box);
    }
  }

  // Quando o alimento muda, reconstrói o select de medidas com as medidas dele.
  // Vale para o item principal e para as linhas de substituto.
  function atualizarMedidas(foodInput) {
    var ehSub = foodInput.hasAttribute("data-sub-food");
    var row = foodInput.closest(ehSub ? "[data-sub]" : ".pl-item");
    var sel = row.querySelector(ehSub ? "[data-sub-med]" : "[data-med]");
    if (!sel) return;
    var al = alimentoDoValor(foodInput.value);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    var atual = sel.value;
    sel.innerHTML = medOptsHTML(medidas, atual);
    // se a medida atual não existe mais, escolhe a primeira medida caseira (ou grama)
    if (!medidas.some(function (m) { return m.nome === atual; })) {
      sel.selectedIndex = medidas.length > 1 ? 1 : 0;
    }
  }

  function addItem(mealEl) {
    var box = mealEl.querySelector(".pl-items");
    var tmp = document.createElement("div");
    tmp.innerHTML = itemHTML({ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }, 0, 0);
    box.appendChild(tmp.firstChild);
    recalc();
    // Já entra digitando: era um clique a mais toda vez que ela punha um alimento.
    var inp = box.lastChild.querySelector(".pl-food");
    if (inp) inp.focus();
  }
  // Nova refeição. `alt` = já nasce como opção alternativa, com o nome
  // sugerido a partir da última refeição normal ("Lanche da tarde 2").
  function addMeal(alt) {
    var box = document.getElementById("pl-meals");
    var mi = box.querySelectorAll("[data-meal]").length;
    var nome = "Nova refeição", hora = "";
    if (alt) {
      var normais = [].slice.call(box.querySelectorAll('[data-meal][data-alt="0"]'));
      var ref = normais[normais.length - 1];
      if (ref) {
        var base = (ref.querySelector("[data-meal-nome]") || {}).value || "Refeição";
        hora = (ref.querySelector("[data-meal-hora]") || {}).value || "";
        nome = /\d$/.test(base.trim()) ? base.trim() + " (outra opção)" : base.trim() + " 2";
      } else { nome = "Opção alternativa"; }
    }
    var tmp = document.createElement("div");
    tmp.innerHTML = mealHTML({ nome: nome, hora: hora, alternativa: !!alt, itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] }, mi);
    box.appendChild(tmp.firstChild);
    recalc();
    var novo = box.lastChild;
    if (novo && novo.scrollIntoView) novo.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ---------- Duplicar e reordenar refeição ----------
     "Jantar — Opção 2" é uma CÓPIA do jantar que a nutri ajusta, não uma
     refeição vazia. A cópia já nasce como opção alternativa (não soma no
     total): das duas o paciente come uma só, então somar as duas inflaria
     o dia — que é justamente a conta que a nutri fazia na mão. */
  function baseDoNome(nome) {
    return String(nome || "Refeição").replace(/\s*[—-]\s*Op[çc][ãa]o\s*\d+\s*$/i, "").trim() || "Refeição";
  }
  function proximaOpcao(base) {
    var box = document.getElementById("pl-meals");
    var n = 1;
    box.querySelectorAll("[data-meal-nome]").forEach(function (i) {
      if (baseDoNome(i.value).toLowerCase() === base.toLowerCase()) n++;
    });
    return n;
  }
  function duplicarMeal(mealEl) {
    if (!mealEl) return;
    var rf = coletarMeal(mealEl);
    var base = baseDoNome(rf.nome);
    rf.nome = base + " — Opção " + proximaOpcao(base);
    rf.alternativa = true; // não soma: é uma OU a outra
    // A cópia não herda a foto: é outro prato, e duas refeições apontando
    // para o mesmo arquivo fariam a remoção de uma apagar a foto da outra.
    rf.foto = null;
    var tmp = document.createElement("div");
    tmp.innerHTML = mealHTML(rf, 0);
    var novo = tmp.firstChild;
    mealEl.parentNode.insertBefore(novo, mealEl.nextSibling);
    recalc();
    if (novo.scrollIntoView) novo.scrollIntoView({ block: "nearest", behavior: "smooth" });
    toast('"' + rf.nome + '" criada — é opção, não soma no total do dia.');
  }
  // Excluir refeição. Só pergunta quando há alimento dentro — refeição vazia
  // sai direto, senão confirmar vira estorvo.
  function removerMeal(mealEl) {
    if (!mealEl) return;
    var rf = coletarMeal(mealEl);
    if (rf.itens.length &&
        !window.confirm('Excluir "' + rf.nome + '" e os ' + rf.itens.length + ' alimentos dela?')) return;
    mealEl.remove();
    recalc();
  }
  /* Ordem dos alimentos dentro da refeição. Como coletar() lê o DOM de cima
     para baixo, mover o nó já muda o plano — não há índice a atualizar. */
  function moverItem(itemEl, delta) {
    if (!itemEl) return;
    var box = itemEl.parentNode;
    if (delta < 0) {
      var ant = itemEl.previousElementSibling;
      if (ant) box.insertBefore(itemEl, ant);
    } else {
      var prox = itemEl.nextElementSibling;
      if (prox) box.insertBefore(prox, itemEl);
    }
    if (itemEl.scrollIntoView) itemEl.scrollIntoView({ block: "nearest" });
  }
  function moverMeal(mealEl, delta) {
    if (!mealEl) return;
    var box = mealEl.parentNode;
    if (delta < 0) {
      var ant = mealEl.previousElementSibling;
      if (ant) box.insertBefore(mealEl, ant);
    } else {
      var prox = mealEl.nextElementSibling;
      if (prox) box.insertBefore(prox, mealEl);
    }
    if (mealEl.scrollIntoView) mealEl.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Foto do prato ----------
     O arquivo vai para o bucket privado 'refeicoes' na hora em que a nutri
     escolhe (o plano só guarda o caminho). A URL assinada expira, então
     nunca é gravada: `_fotoUrls` é cache de sessão para exibir.
     Trocar ou remover a foto NÃO apaga o arquivo na hora — o caminho antigo
     entra em `_fotoLixo` e só é apagado depois que o plano salva. Assim, sair
     do editor sem salvar não destrói a foto que ainda está no plano gravado. */
  var _fotoUrls = {};   // { path: signedUrl }
  var _fotoLixo = [];   // paths substituídos/removidos nesta edição
  var _fotoInput = null;
  var _fotoAlvo = null; // refeição que está esperando o arquivo

  function fotoInput() {
    if (_fotoInput) return _fotoInput;
    var i = document.createElement("input");
    i.type = "file"; i.accept = "image/png,image/jpeg,image/webp"; i.hidden = true;
    i.addEventListener("change", function () {
      var file = i.files && i.files[0];
      i.value = "";
      if (file && _fotoAlvo) enviarFoto(_fotoAlvo, file);
      _fotoAlvo = null;
    });
    document.body.appendChild(i);
    _fotoInput = i;
    return i;
  }
  function pedirFoto(mealEl) {
    if (!mealEl) return;
    if (!_p || !_p.id) { toast("Salve a ficha da paciente antes de anexar fotos.", true); return; }
    if (!window.NutriPacientes || !window.NutriPacientes.uploadFotoRefeicao) {
      toast("Envio de fotos indisponível.", true); return;
    }
    _fotoAlvo = mealEl;
    fotoInput().click();
  }
  function enviarFoto(mealEl, file) {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { toast("Use uma imagem JPG, PNG ou WEBP.", true); return; }
    if (file.size > 12 * 1024 * 1024) { toast("A imagem passa de 12 MB. Escolha uma menor.", true); return; }
    var box = mealEl.querySelector("[data-foto-box]");
    var img = mealEl.querySelector("[data-foto-img]");
    if (box) { box.hidden = false; box.classList.add("is-enviando"); }
    var fotoId = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    redimensionarFotoBlob(file, 900, 0.85).then(function (blob) {
      try { if (img) img.src = URL.createObjectURL(blob); } catch (e) {}
      return window.NutriPacientes.uploadFotoRefeicao(_p.id, fotoId, blob);
    }).then(function (path) {
      var antigo = mealEl.getAttribute("data-foto");
      if (antigo && antigo !== path) _fotoLixo.push(antigo);
      mealEl.setAttribute("data-foto", path);
      if (img && img.src) _fotoUrls[path] = img.src; // preview local vale até recarregar
      if (box) box.classList.remove("is-enviando");
      toast("Foto anexada 📸 — salve o plano para valer.");
    }).catch(function (e) {
      if (box) { box.classList.remove("is-enviando"); if (!mealEl.getAttribute("data-foto")) box.hidden = true; }
      toast("Não foi possível enviar a foto. " + (e && e.message ? e.message : ""), true);
    });
  }
  function removerFoto(mealEl) {
    if (!mealEl) return;
    var path = mealEl.getAttribute("data-foto");
    if (path) _fotoLixo.push(path);
    mealEl.removeAttribute("data-foto");
    var box = mealEl.querySelector("[data-foto-box]");
    var img = mealEl.querySelector("[data-foto-img]");
    if (img) img.removeAttribute("src");
    if (box) box.hidden = true;
  }
  /* Busca as URLs assinadas dos caminhos que aparecem em `escopo` e preenche
     as <img>. Uma chamada só para todas as fotos da tela. */
  function hidratarFotos(escopo) {
    if (!escopo) return;
    var alvos = [];
    escopo.querySelectorAll("[data-foto]").forEach(function (el) {
      var img = el.querySelector("[data-foto-img]");
      var path = el.getAttribute("data-foto");
      if (!img || !path) return;
      var box = el.querySelector("[data-foto-box]");
      if (box) box.hidden = false;
      if (_fotoUrls[path]) { img.src = _fotoUrls[path]; return; }
      alvos.push({ img: img, path: path });
    });
    if (!alvos.length || !window.NutriPacientes || !window.NutriPacientes.assinarFotosRefeicao) return;
    var paths = alvos.map(function (a) { return a.path; });
    window.NutriPacientes.assinarFotosRefeicao(paths).then(function (mapa) {
      alvos.forEach(function (a) {
        if (!mapa[a.path]) return;
        _fotoUrls[a.path] = mapa[a.path];
        a.img.src = mapa[a.path];
      });
    }).catch(function () { /* sem foto é degradação aceitável */ });
  }
  // Apaga do bucket as fotos trocadas/removidas — só depois que o plano salvou
  // sem elas, senão um erro de gravação deixaria o plano apontando para o vazio.
  function limparFotosLixo() {
    if (!_fotoLixo.length || !window.NutriPacientes || !window.NutriPacientes.removerFotoRefeicao) { _fotoLixo = []; return; }
    var emUso = {};
    libDe(_p).forEach(function (pl) {
      (pl.refeicoes || []).forEach(function (rf) { if (rf && rf.foto) emUso[rf.foto] = true; });
    });
    _fotoLixo.forEach(function (path) {
      if (emUso[path]) return; // outro plano ainda usa este arquivo
      window.NutriPacientes.removerFotoRefeicao(path).catch(function () {});
      delete _fotoUrls[path];
    });
    _fotoLixo = [];
  }
  /* Redimensiona para no máx. `max` px no lado maior e devolve um Blob JPEG
     (mesma receita das fotos de evolução em antropometria.js — o módulo do
     plano é autossuficiente de propósito). */
  function redimensionarFotoBlob(file, max, q) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("img")); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var s = Math.min(1, max / Math.max(w, h));
          var cw = Math.round(w * s), ch = Math.round(h * s);
          var cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          if (cv.toBlob) {
            cv.toBlob(function (b) { b ? resolve(b) : reject(new Error("blob")); }, "image/jpeg", q || 0.85);
          } else {
            try {
              var d = cv.toDataURL("image/jpeg", q || 0.85), bin = atob(d.split(",")[1]);
              var arr = new Uint8Array(bin.length);
              for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
              resolve(new Blob([arr], { type: "image/jpeg" }));
            } catch (e) { reject(e); }
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Substitutos e refeição alternativa ---------- */
  function alternarSubs(itemEl) {
    var box = itemEl.querySelector("[data-subs]");
    if (!box) return;
    box.hidden = !box.hidden;
    if (!box.hidden && !box.querySelector("[data-sub]")) addSub(itemEl);
    else contarSubs(itemEl);
  }
  function addSub(itemEl) {
    var box = itemEl.querySelector("[data-subs]");
    var rows = itemEl.querySelector("[data-sub-rows]");
    if (!box || !rows) return;
    box.hidden = false;
    var tmp = document.createElement("div");
    tmp.innerHTML = subRowHTML(null);
    rows.appendChild(tmp.firstChild);
    contarSubs(itemEl);
    var inp = rows.lastChild.querySelector(".pl-food");
    if (inp) inp.focus();
  }
  // Mantém o contador no botão ⇄ em dia (só conta substituto preenchido).
  function contarSubs(itemEl) {
    if (!itemEl) return;
    var n = 0;
    itemEl.querySelectorAll("[data-sub]").forEach(function (s) {
      if (((s.querySelector("[data-sub-food]") || {}).value || "").trim()) n++;
    });
    var btn = itemEl.querySelector("[data-toggle-subs]");
    var lbl = itemEl.querySelector("[data-subs-n]");
    if (lbl) lbl.textContent = n || "";
    if (btn) btn.classList.toggle("is-on", n > 0);
  }
  function alternarAlt(mealEl) {
    if (!mealEl) return;
    var alt = mealEl.getAttribute("data-alt") !== "1";
    mealEl.setAttribute("data-alt", alt ? "1" : "0");
    mealEl.classList.toggle("pl-meal--alt", alt);
    var btn = mealEl.querySelector("[data-alt-meal]");
    if (btn) {
      var tmp = document.createElement("div");
      tmp.innerHTML = altBtnHTML(alt);
      btn.replaceWith(tmp.firstChild);
    }
    recalc();
  }

  // Lê UMA refeição do DOM -> objeto. Usado pelo coletar() e pelo duplicar.
  function coletarMeal(m) {
    var rf = {
      nome: (m.querySelector("[data-meal-nome]") || {}).value || "Refeição",
      hora: (m.querySelector("[data-meal-hora]") || {}).value || "",
      alternativa: m.getAttribute("data-alt") === "1",
      foto: m.getAttribute("data-foto") || null,
      itens: []
    };
    m.querySelectorAll("[data-item]").forEach(function (it) {
      var food = (it.querySelector("[data-food]") || {}).value || "";
      if (!food.trim()) return;
      var al = alimentoDoValor(food);
      var sel = it.querySelector("[data-med]");
      var medida = sel ? sel.value : "grama";
      var qtd = num((it.querySelector("[data-qt]") || {}).value);
      var c = calcItem({ alimentoId: al ? al.id : null, alimento: al ? al.nome : food, medida: medida, qtd: qtd });
      var item = { alimentoId: al ? al.id : null, alimento: al ? al.nome : food, medida: c.medida, qtd: qtd, gramas: c.gramas, kcal: c.kcal, cho: c.cho, ptn: c.ptn, lip: c.lip };
      // Substitutos: gravados junto do item, nunca somados ao dia.
      var subs = [];
      it.querySelectorAll("[data-sub]").forEach(function (s) {
        var sf = (s.querySelector("[data-sub-food]") || {}).value || "";
        if (!sf.trim()) return;
        var sal = alimentoDoValor(sf);
        var smed = (s.querySelector("[data-sub-med]") || {}).value || "grama";
        var sq = num((s.querySelector("[data-sub-qt]") || {}).value);
        var sc = calcItem({ alimentoId: sal ? sal.id : null, alimento: sal ? sal.nome : sf, medida: smed, qtd: sq });
        subs.push({ alimentoId: sal ? sal.id : null, alimento: sal ? sal.nome : sf, medida: sc.medida, qtd: sq, gramas: sc.gramas, kcal: sc.kcal });
      });
      if (subs.length) item.subs = subs;
      rf.itens.push(item);
    });
    return rf;
  }

  // Lê o editor do DOM -> objeto plano.
  function coletar() {
    var r = root();
    var plano = {
      id: (_draft && _draft.id) || null,
      titulo: (r.querySelector("[data-pl-titulo]") || {}).value || "Plano alimentar",
      objetivo: (r.querySelector("[data-pl-objetivo]") || {}).value || "",
      metaKcal: num((r.querySelector("[data-pl-meta]") || {}).value) || "",
      atualizadoEm: hojeBR(),
      rascunho: (_draft && _draft.rascunho) || null,
      refeicoes: []
    };
    r.querySelectorAll("[data-meal]").forEach(function (m) {
      plano.refeicoes.push(coletarMeal(m));
    });
    plano.totais = totaisDe(plano);
    return plano;
  }

  // Recalcula displays (gramas/kcal por item, kcal por refeição, totais).
  function recalc() {
    var r = root(); if (!r) return;
    var tot = { kcal: 0, cho: 0, ptn: 0, lip: 0 };
    r.querySelectorAll("[data-meal]").forEach(function (m) {
      var mealK = 0;
      var alt = m.getAttribute("data-alt") === "1";
      m.querySelectorAll("[data-item]").forEach(function (it) {
        var food = (it.querySelector("[data-food]") || {}).value || "";
        var sel = it.querySelector("[data-med]");
        var medida = sel ? sel.value : "grama";
        var qtd = num((it.querySelector("[data-qt]") || {}).value);
        var al = alimentoDoValor(food);
        var c = calcItem({ alimentoId: al ? al.id : null, alimento: food, medida: medida, qtd: qtd });
        var gEl = it.querySelector("[data-gramas]"), kEl = it.querySelector("[data-kc]");
        if (gEl) gEl.textContent = food.trim() ? c.gramas + " g" : "—";
        if (kEl) kEl.textContent = food.trim() ? c.kcal + " kcal" : "—";
        // substitutos: mostram gramas/kcal só para a nutri conferir a troca
        it.querySelectorAll("[data-sub]").forEach(function (s) {
          var sf = ((s.querySelector("[data-sub-food]") || {}).value || "").trim();
          var smed = (s.querySelector("[data-sub-med]") || {}).value || "grama";
          var sq = num((s.querySelector("[data-sub-qt]") || {}).value);
          var sal = alimentoDoValor(sf);
          var sc = calcItem({ alimentoId: sal ? sal.id : null, alimento: sf, medida: smed, qtd: sq });
          var skEl = s.querySelector("[data-sub-kc]");
          if (skEl) skEl.textContent = sf ? sc.gramas + " g · " + sc.kcal + " kcal" : "—";
        });
        contarSubs(it);
        mealK += c.kcal;
        if (!alt) { tot.kcal += c.kcal; tot.cho += c.cho; tot.ptn += c.ptn; tot.lip += c.lip; }
      });
      var mk = m.querySelector("[data-meal-kc]");
      if (mk) mk.textContent = r0(mealK) + " kcal" + (alt ? " · não soma" : "");
    });
    tot = { kcal: r0(tot.kcal), cho: r1(tot.cho), ptn: r1(tot.ptn), lip: r1(tot.lip) };
    var meta = num((r.querySelector("[data-pl-meta]") || {}).value);
    var bar = document.getElementById("pl-totbar");
    if (bar) bar.innerHTML = totaisBarHTML(tot, pctMacros(tot), meta || "");
  }

  /* ---------- Persistência (biblioteca dentro da coluna `plano`) ---------- */
  // Monta o objeto da coluna `plano`: o 1º plano LIBERADO fica espelhado no topo
  // (portal/adesão/timeline seguem lendo plano.refeicoes) e o acervo em .planos.
  // Se nada está liberado, o topo fica vazio (portal mostra "ainda não publicado").
  function montarColuna(lib) {
    var pub = lib.filter(function (x) { return x.publicado; });
    var espelho = pub[0] || null;
    var base = espelho ? limpaLib(espelho) : { titulo: null, refeicoes: [], publicado: false };
    base.planos = lib.map(limpaLib);
    return base;
  }
  // Grava a biblioteca no banco; ao concluir, re-renderiza o painel (ou a escolha).
  function persistir(lib, viewId, okMsg, btn, btnLabel) {
    if (!window.NutriPacientes) { toast("Banco indisponível.", true); return; }
    var coluna = lib.length ? montarColuna(lib) : { titulo: null, refeicoes: [] };
    var patch = Object.assign({}, _p, { plano: coluna });
    window.NutriPacientes.update(_p.id, patch).then(function (saved) {
      _p = saved;
      _viewId = (viewId && libDe(_p).some(byId(viewId))) ? viewId : null;
      limparFotosLixo(); // o plano já está gravado sem elas
      var r = root();
      if (r) {
        if (libDe(_p).length) { mostrarPainel(); }
        else { r.innerHTML = escolhaHTML(); bindEscolha(); }
      }
      if (okMsg) toast(okMsg);
      if (_ctx.onSaved) _ctx.onSaved(saved);
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  /* ---------- Salvar (cria novo ou atualiza o editado) ---------- */
  function salvar() {
    var plano = coletar();
    if (!plano.refeicoes.some(function (rf) { return rf.itens.length; })) {
      toast("Adicione ao menos um alimento.", true); return;
    }
    var lib = libDe(_p).slice();
    var idx = plano.id ? lib.map(function (x) { return x.id; }).indexOf(plano.id) : -1;
    var novo = idx < 0;
    // Plano novo já nasce liberado — a nutri montou, a nutri assina. A
    // exceção é o rascunho gerado da anamnese: esse nasce OCULTO, porque
    // ninguém o revisou ainda (Art. 34 — o sistema não prescreve).
    if (novo) { plano.id = plano.id || novoId(); plano.publicado = !plano.rascunho; lib.push(plano); }
    else { plano.publicado = !!lib[idx].publicado; lib[idx] = plano; } // edição preserva liberado/oculto
    var btn = root().querySelector("[data-pl-salvar]");
    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    persistir(lib, plano.id, "Plano salvo", btn, "💾 Salvar plano");
  }

  /* ---------- Liberar / ocultar plano para o paciente ---------- */
  function alternarPublicado(id) {
    var lib = libDe(_p);
    var alvo = lib.filter(byId(id))[0];
    if (!alvo) return;
    alvo.publicado = !alvo.publicado;
    _viewId = id;
    persistir(lib, id, alvo.publicado ? "Plano liberado para o paciente" : "Plano ocultado do paciente");
  }

  /* ---------- Excluir plano ---------- */
  function excluirPlano(id) {
    var lib = libDe(_p);
    var alvo = lib.filter(byId(id))[0];
    if (!alvo) return;
    var msg = 'Excluir o plano "' + (alvo.titulo || "Plano alimentar") + '"? Esta ação não pode ser desfeita.';
    if (!window.confirm(msg)) return;
    var restante = lib.filter(function (x) { return x.id !== id; });
    // As fotos do plano excluído viram lixo (limparFotosLixo ainda confere se
    // outro plano não aponta para o mesmo arquivo antes de apagar).
    (alvo.refeicoes || []).forEach(function (rf) { if (rf && rf.foto) _fotoLixo.push(rf.foto); });
    if (_viewId === id) _viewId = null;
    persistir(restante, null, "Plano excluído");
  }

  /* ---------- PDF (reusa NutriDoc) ---------- */
  function gerarPDF(plano) {
    if (!window.NutriDoc) { toast("Motor de documento indisponível.", true); return; }
    var t = totaisDe(plano), pc = pctMacros(t);
    var macros = '<div class="doc-macros">' +
      '<div class="doc-macro"><div class="doc-macro__v">' + pc.cho + '%</div><div class="doc-macro__l">Carboidrato</div></div>' +
      '<div class="doc-macro"><div class="doc-macro__v">' + pc.ptn + '%</div><div class="doc-macro__l">Proteína</div></div>' +
      '<div class="doc-macro"><div class="doc-macro__v">' + pc.lip + '%</div><div class="doc-macro__l">Gordura</div></div>' +
      '<div class="doc-macro"><div class="doc-macro__v">' + t.kcal + '</div><div class="doc-macro__l">kcal/dia</div></div>' +
    '</div>';
    var temAlt = (plano.refeicoes || []).some(ehAlternativa);
    var temSub = (plano.refeicoes || []).some(function (rf) {
      return (rf.itens || []).some(function (it) { return subsTexto(it).length; });
    });
    var refs = (plano.refeicoes || []).map(function (rf) {
      var sub = 0;
      var itens = (rf.itens || []).map(function (it) {
        var c = calcItem(it); sub += c.kcal;
        var st = subsTexto(it);
        return '<div class="doc-meal__item"><span>' + esc(nomeItem(it)) +
            (st.length ? '<span class="doc-meal__sub"> ou ' + esc(st.join(" · ")) + '</span>' : '') + '</span>' +
          '<span class="doc-meal__qt">' + esc(qtdLabel(it, c)) + ' · ' + c.kcal + ' kcal</span></div>';
      }).join("");
      var alt = ehAlternativa(rf);
      // A foto só entra no PDF se a URL assinada já estiver em cache (a tela
      // que abriu o plano a buscou). Sem cache, o PDF sai só com o texto —
      // imprimir não pode esperar por rede.
      var url = rf.foto ? _fotoUrls[rf.foto] : null;
      var foto = url ? '<div class="doc-meal__foto"><img src="' + esc(url) + '" alt="" /></div>' : '';
      return '<div class="doc-meal"><div class="doc-meal__head">' +
        '<span class="doc-meal__nome">' + esc(rf.nome || "Refeição") +
          (alt ? ' <em>(opção alternativa)</em>' : '') + '</span>' +
        '<span class="doc-meal__hora">' + esc(rf.hora || "") + '</span>' +
        '<span class="doc-meal__kcal">' + r0(sub) + ' kcal</span></div>' + foto + itens + '</div>';
    }).join("");
    var legenda = "";
    if (temSub) legenda += '<div class="doc-note">⇄ Onde há “ou”, você pode <strong>trocar</strong> o alimento pela opção indicada, na quantidade descrita.</div>';
    if (temAlt) legenda += '<div class="doc-note">↔ As refeições marcadas como <strong>opção alternativa</strong> substituem a refeição do mesmo horário — escolha uma das duas, não as duas. Por isso elas não entram no total de kcal do dia.</div>';
    var body = (plano.objetivo ? '<h2>Objetivo: ' + esc(plano.objetivo) + '</h2>' : '') + macros + refs + legenda +
      '<div class="doc-note">💡 Beba bastante água ao longo do dia. As medidas caseiras são aproximadas — siga as porções orientadas.</div>' +
      (window.ListaCompras ? window.ListaCompras.pdfHTML(plano, comprasCombinadas(plano)) : "");
    window.NutriDoc.imprimir(perfil(), {
      tipo: "Planejamento Alimentar", paciente: _p.nome, data: hojeBR(), bodyHTML: body
    });
  }

  window.PlanoAlimentar = { render: render, wire: wire, MODELOS: MODELOS };
})();
