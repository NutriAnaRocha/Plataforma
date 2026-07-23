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
  AL.forEach(function (a) { AL_BY_ID[a.id] = a; AL_BY_NOME[a.nome.toLowerCase()] = a; });

  function limpa(s) { return normaliza(s).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
  // Acha o melhor alimento cujo nome contém todos os termos da busca (menor nome vence).
  function acharAlimento(q) {
    var termos = limpa(q).split(" ").filter(Boolean);
    if (!termos.length) return null;
    var best = null;
    for (var i = 0; i < AL.length; i++) {
      var n = limpa(AL[i].nome);
      var ok = termos.every(function (t) { return n.indexOf(t) >= 0; });
      if (ok && (!best || AL[i].nome.length < best.nome.length)) best = AL[i];
    }
    return best;
  }
  function alimentoDoValor(valor) {
    if (!valor) return null;
    return AL_BY_NOME[valor.toLowerCase()] || acharAlimento(valor);
  }

  /* ---------- MODELOS pré-prontos (6 × 4 metas) ----------
     Itens referenciam o alimento por busca (`q`), resolvidos no banco na
     hora de aplicar — assim o modelo não depende de ids fixos.
     Cada modelo tem `variacoes` por meta calórica (1200/1500/1800/2000);
     as porções não são só escaladas — a composição é ajustada por nível. */
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
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 4 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 } ] }
        ],
        1500: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 5 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 } ] }
        ],
        1800: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 2 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 1 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
            { q: "batata, inglesa, cozida", medida: "unidade", qtd: 2 },
            { q: "abobrinha, italiana, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] }
        ],
        2000: [
          { nome: "Café da manhã", hora: "08:00", itens: [
            { q: "ovo, de galinha, inteiro, cozido", medida: "unidade", qtd: 3 },
            { q: "pao, trigo, forma, integral", medida: "fatia", qtd: 3 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Lanche", hora: "10:30", itens: [
            { q: "banana, prata", medida: "unidade", qtd: 1 },
            { q: "aveia, flocos, crua", medida: "colher de sopa", qtd: 2 } ] },
          { nome: "Almoço", hora: "12:30", itens: [
            { q: "arroz, integral, cozido", medida: "colher de sopa", qtd: 6 },
            { q: "frango, peito, sem pele, grelhado", medida: "porcao", qtd: 2 },
            { q: "cenoura, cozida", medida: "colher de sopa", qtd: 3 },
            { q: "azeite, de oliva", medida: "colher de sopa", qtd: 1 } ] },
          { nome: "Lanche da tarde", hora: "16:00", itens: [
            { q: "iogurte, natural, desnatado", medida: "pote", qtd: 1 },
            { q: "mamao, formosa", medida: "fatia", qtd: 1 },
            { q: "banana, prata", medida: "unidade", qtd: 1 } ] },
          { nome: "Jantar", hora: "19:30", itens: [
            { q: "pescada, file, frito", medida: "porcao", qtd: 1 },
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
    }
  ];
  var MODELO_BY_ID = {};
  MODELOS.forEach(function (m) { MODELO_BY_ID[m.id] = m; });

  // Constrói a fonte de expansão para um modelo numa meta calórica.
  function fonteModelo(m, kcal) {
    var refs = (m.variacoes && m.variacoes[kcal]) || (m.variacoes && m.variacoes[1500]) || [];
    return { nome: m.nome, objetivo: m.objetivo, metaKcal: kcal, refeicoes: refs };
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
  function totaisDe(plano) {
    var t = { kcal: 0, cho: 0, ptn: 0, lip: 0 };
    (plano.refeicoes || []).forEach(function (r) {
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
      refeicoes: (fonte.refeicoes || []).map(function (r) {
        return {
          nome: r.nome, hora: r.hora || "",
          itens: (r.itens || []).map(function (it) {
            var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : (it.q ? acharAlimento(it.q) : alimentoDoValor(it.alimento));
            return { alimentoId: al ? al.id : null, alimento: al ? al.nome : (it.alimento || it.q || ""), medida: it.medida || "grama", qtd: it.qtd != null ? it.qtd : 1 };
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
    return '<div id="plano-root">' + (lib.length ? painelHTML(p) : escolhaHTML()) + '</div>' + datalistHTML();
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

  function datalistHTML() {
    // datalist único e reutilizável por todos os inputs de alimento
    var ops = AL.map(function (a) { return '<option value="' + esc(a.nome) + '"></option>'; }).join("");
    return '<datalist id="pl-alimentos">' + ops + '</datalist>';
  }

  /* ---------- Tela de escolha ---------- */
  function escolhaHTML() {
    var modelos = MODELOS.map(function (m) {
      var chips = KCALS.map(function (k) {
        return '<button class="pl-modelo__kcal" type="button" data-modelo="' + m.id + '" data-kcal="' + k + '">' +
          k + '</button>';
      }).join("");
      return '<div class="pl-modelo">' +
        '<span class="pl-modelo__ico">' + m.ico + '</span>' +
        '<span class="pl-modelo__nome">' + esc(m.nome) + '</span>' +
        '<span class="pl-modelo__desc">' + esc(m.desc) + '</span>' +
        '<div class="pl-modelo__kcals" role="group" aria-label="Meta calórica">' +
          '<span class="pl-modelo__kcals-lbl">kcal:</span>' + chips +
        '</div>' +
      '</div>';
    }).join("");
    var voltar = libDe(_p).length
      ? '<button class="btn btn--ghost btn--sm" type="button" data-pl-voltar-lista>← Voltar aos planos</button>' : '';
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head"><h2 class="fsec__title">Novo plano alimentar</h2>' + voltar + '</div>' +
        '<div class="pl-escolha">' +
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
        return '<div class="pl-res__item"><span>' + esc(it.alimento || "—") + '</span>' +
          '<span class="pl-res__qt">' + esc(qtdLabel(it, c)) + '</span>' +
          '<span class="pl-res__kc">' + c.kcal + ' kcal</span></div>';
      }).join("");
      var sub = (rf.itens || []).reduce(function (a, it) { return a + calcItem(it).kcal; }, 0);
      return '<div class="pl-res__meal"><div class="pl-res__head">' +
        '<span class="pl-res__nome">' + esc(rf.nome || "Refeição") + '</span>' +
        '<span class="pl-res__hora">' + esc(rf.hora || "") + '</span>' +
        '<span class="pl-res__mealkc">' + r0(sub) + ' kcal</span></div>' + itens + '</div>';
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
        '<div class="pl-res__meals">' + meals + '</div>' +
      '</section>' +
      (window.ListaCompras ? window.ListaCompras.htmlNutri(plano) : "");
  }
  function qtdLabel(it, c) {
    if (it.medida === "grama") return c.gramas + " g";
    return num(it.qtd) + " " + it.medida + " (" + c.gramas + " g)";
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

  /* ---------- Editor ---------- */
  function editorHTML(plano) {
    var meals = plano.refeicoes.map(function (rf, mi) { return mealHTML(rf, mi); }).join("");
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head">' +
          '<h2 class="fsec__title">Montar plano</h2>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-pl-voltar>← Voltar</button>' +
        '</div>' +
        '<div class="pl-meta">' +
          '<label class="pl-field pl-field--wide"><span>Título</span><input type="text" data-pl-titulo value="' + esc(plano.titulo || "") + '" placeholder="Plano alimentar" /></label>' +
          '<label class="pl-field pl-field--wide"><span>Objetivo</span><input type="text" data-pl-objetivo value="' + esc(plano.objetivo || "") + '" placeholder="Ex.: emagrecimento" /></label>' +
          '<label class="pl-field"><span>Meta kcal</span><input type="number" data-pl-meta value="' + esc(plano.metaKcal || "") + '" placeholder="opcional" /></label>' +
        '</div>' +
        '<div id="pl-meals">' + meals + '</div>' +
        '<button class="btn btn--outline btn--sm pl-addmeal" type="button" data-add-meal>＋ Adicionar refeição</button>' +
      '</section>' +
      '<div class="pl-totbar" id="pl-totbar">' + '</div>' +
      '<div class="pl-actions">' +
        '<button class="btn btn--outline" type="button" data-pl-pdf-edit>🖨️ Gerar PDF</button>' +
        '<button class="btn btn--primary" type="button" data-pl-salvar>💾 Salvar plano</button>' +
      '</div>';
  }

  function mealHTML(rf, mi) {
    var itens = (rf.itens || []).map(function (it, ii) { return itemHTML(it, mi, ii); }).join("");
    return '<div class="pl-meal" data-meal="' + mi + '">' +
      '<div class="pl-meal__head">' +
        '<input class="pl-meal__nome" type="text" data-meal-nome value="' + esc(rf.nome || "") + '" placeholder="Refeição" />' +
        '<input class="pl-meal__hora" type="time" data-meal-hora value="' + esc(rf.hora || "") + '" />' +
        '<span class="pl-meal__kc" data-meal-kc>0 kcal</span>' +
        '<button class="pl-x" type="button" data-rm-meal aria-label="Remover refeição">🗑️</button>' +
      '</div>' +
      '<div class="pl-items">' + itens + '</div>' +
      '<button class="pl-additem" type="button" data-add-item>＋ alimento</button>' +
    '</div>';
  }

  function itemHTML(it, mi, ii) {
    var al = it.alimentoId != null ? AL_BY_ID[it.alimentoId] : alimentoDoValor(it.alimento);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    var opts = medidas.map(function (m) {
      return '<option value="' + esc(m.nome) + '" data-g="' + m.g + '"' + (m.nome === it.medida ? " selected" : "") + '>' + esc(m.nome) + '</option>';
    }).join("");
    return '<div class="pl-item" data-item>' +
      '<input class="pl-item__food" type="text" list="pl-alimentos" data-food value="' + esc(it.alimento || "") + '" placeholder="buscar alimento…" />' +
      '<input class="pl-item__qt" type="number" step="0.5" min="0" data-qt value="' + esc(it.qtd != null ? it.qtd : 1) + '" />' +
      '<select class="pl-item__med" data-med>' + opts + '</select>' +
      '<span class="pl-item__g" data-gramas>—</span>' +
      '<span class="pl-item__kc" data-kc>—</span>' +
      '<button class="pl-x" type="button" data-rm-item aria-label="Remover">✕</button>' +
    '</div>';
  }

  /* ============================================================
     WIRE
     ============================================================ */
  function wire(p, ctx) {
    _p = p; _ctx = ctx || {}; _viewId = null;
    var r = root(); if (!r) return;
    // Estado inicial: se já tem plano(s) salvo(s), mostramos o painel; senão a escolha.
    if (libDe(p).length) bindPainel();
    else bindEscolha();
  }

  function bindEscolha() {
    var r = root(); if (!r) return;
    var vl = r.querySelector("[data-pl-voltar-lista]");
    if (vl) vl.addEventListener("click", function () { mostrarPainel(); });
    var zero = r.querySelector("[data-do-zero]");
    if (zero) zero.addEventListener("click", function () { abrirEditor(planoVazio()); });
    r.querySelectorAll("[data-modelo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = MODELO_BY_ID[b.getAttribute("data-modelo")];
        var kcal = parseInt(b.getAttribute("data-kcal"), 10) || 1500;
        if (m) abrirEditor(expandir(fonteModelo(m, kcal)));
      });
    });
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
  }

  function abrirEditor(plano) {
    _draft = plano;
    var r = root(); if (!r) return;
    r.innerHTML = editorHTML(plano);
    bindEditor();
    recalc();
  }

  function bindEditor() {
    var r = root(); if (!r) return;
    r.querySelector("[data-pl-voltar]").addEventListener("click", function () {
      if (libDe(_p).length) mostrarPainel();
      else { r.innerHTML = escolhaHTML(); bindEscolha(); }
    });
    // recalcula ao vivo
    r.addEventListener("input", function (e) {
      if (e.target.matches("[data-food]")) atualizarMedidas(e.target);
      recalc();
    });
    r.addEventListener("change", function (e) { recalc(); });
    // delegação de cliques (add/remove)
    r.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-add-item]")) { addItem(t.closest("[data-meal]")); }
      else if (t.closest("[data-rm-item]")) { t.closest("[data-item]").remove(); recalc(); }
      else if (t.closest("[data-add-meal]")) { addMeal(); }
      else if (t.closest("[data-rm-meal]")) { t.closest("[data-meal]").remove(); recalc(); }
      else if (t.closest("[data-pl-salvar]")) { salvar(); }
      else if (t.closest("[data-pl-pdf-edit]")) { gerarPDF(coletar()); }
    });
  }

  // Quando o alimento muda, reconstrói o select de medidas com as medidas dele.
  function atualizarMedidas(foodInput) {
    var row = foodInput.closest("[data-item]");
    var sel = row.querySelector("[data-med]");
    var al = alimentoDoValor(foodInput.value);
    var medidas = al ? al.medidas : [{ nome: "grama", g: 1 }];
    var atual = sel.value;
    sel.innerHTML = medidas.map(function (m) {
      var selAttr = (m.nome === atual) ? " selected" : "";
      return '<option value="' + esc(m.nome) + '" data-g="' + m.g + '"' + selAttr + '>' + esc(m.nome) + '</option>';
    }).join("");
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
  }
  function addMeal() {
    var box = document.getElementById("pl-meals");
    var mi = box.querySelectorAll("[data-meal]").length;
    var tmp = document.createElement("div");
    tmp.innerHTML = mealHTML({ nome: "Nova refeição", hora: "", itens: [{ alimentoId: null, alimento: "", medida: "grama", qtd: 1 }] }, mi);
    box.appendChild(tmp.firstChild);
    recalc();
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
      refeicoes: []
    };
    r.querySelectorAll("[data-meal]").forEach(function (m) {
      var rf = {
        nome: (m.querySelector("[data-meal-nome]") || {}).value || "Refeição",
        hora: (m.querySelector("[data-meal-hora]") || {}).value || "",
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
        rf.itens.push({ alimentoId: al ? al.id : null, alimento: al ? al.nome : food, medida: c.medida, qtd: qtd, gramas: c.gramas, kcal: c.kcal, cho: c.cho, ptn: c.ptn, lip: c.lip });
      });
      plano.refeicoes.push(rf);
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
        mealK += c.kcal; tot.kcal += c.kcal; tot.cho += c.cho; tot.ptn += c.ptn; tot.lip += c.lip;
      });
      var mk = m.querySelector("[data-meal-kc]");
      if (mk) mk.textContent = r0(mealK) + " kcal";
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
    if (novo) { plano.id = plano.id || novoId(); plano.publicado = true; lib.push(plano); }
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
    var refs = (plano.refeicoes || []).map(function (rf) {
      var sub = 0;
      var itens = (rf.itens || []).map(function (it) {
        var c = calcItem(it); sub += c.kcal;
        return '<div class="doc-meal__item"><span>' + esc(it.alimento) + '</span>' +
          '<span class="doc-meal__qt">' + esc(qtdLabel(it, c)) + ' · ' + c.kcal + ' kcal</span></div>';
      }).join("");
      return '<div class="doc-meal"><div class="doc-meal__head">' +
        '<span class="doc-meal__nome">' + esc(rf.nome || "Refeição") + '</span>' +
        '<span class="doc-meal__hora">' + esc(rf.hora || "") + '</span>' +
        '<span class="doc-meal__kcal">' + r0(sub) + ' kcal</span></div>' + itens + '</div>';
    }).join("");
    var body = (plano.objetivo ? '<h2>Objetivo: ' + esc(plano.objetivo) + '</h2>' : '') + macros + refs +
      '<div class="doc-note">💡 Beba bastante água ao longo do dia. As medidas caseiras são aproximadas — siga as porções orientadas.</div>' +
      (window.ListaCompras ? window.ListaCompras.pdfHTML(plano) : "");
    window.NutriDoc.imprimir(perfil(), {
      tipo: "Planejamento Alimentar", paciente: _p.nome, data: hojeBR(), bodyHTML: body
    });
  }

  window.PlanoAlimentar = { render: render, wire: wire, MODELOS: MODELOS };
})();
