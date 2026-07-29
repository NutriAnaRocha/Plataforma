/* ============================================================
   RASCUNHO DE PLANO A PARTIR DA ANAMNESE

   O que isto é: um PONTO DE PARTIDA para a nutricionista. Lê a anamnese
   que a paciente respondeu no portal, calcula TMB/GET/VET com as mesmas
   fórmulas da calculadora (calculos.js), escolhe um dos modelos do
   construtor (plano-alimentar.js), encaixa as refeições nos horários que
   ela relatou e tira da mesa o que ela não pode ou não quer comer.

   O que isto NÃO é: prescrição. O Art. 34 da Res. CFN 856/2026 é
   explícito — sistema automatizado não substitui a nutricionista. Por
   isso o resultado nasce com título "Rascunho", NÃO publicado para a
   paciente, e vem acompanhado da memória de cálculo: cada escolha diz de
   onde veio, para a Ana poder discordar de cada uma. Quem assina é ela.

   Também por isso ele se RECUSA a gerar em dois casos (gestação/
   amamentação e transtorno alimentar): não são casos de ajustar o
   rascunho, são casos de conduta própria desde a primeira linha.

   window.RascunhoPlano = { anamneseDe, gerar }
   Requer calculos.js e plano-alimentar.js carregados antes.
   ============================================================ */
(function () {
  "use strict";

  var MODELO_ANAMNESE = "anamnese-programa";

  function num(v) {
    if (v == null || v === "") return 0;
    var n = parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  function r0(n) { return Math.round(n); }
  function normaliza(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function temAlgum(txt, termos) {
    var t = normaliza(txt);
    return termos.some(function (x) { return t.indexOf(x) >= 0; });
  }

  /* ============================================================
     1) LER A ANAMNESE
     ============================================================ */
  // Devolve { respostas: {id: valor}, instancia } da anamnese mais
  // recente, ou null se a paciente ainda não respondeu.
  function anamneseDe(p) {
    var qs = (p && p.questionarios) || [];
    var achada = null;
    qs.forEach(function (q) {
      if (q && q.modeloId === MODELO_ANAMNESE && q.origem === "portal") achada = q;
    });
    if (!achada) return null;
    var mapa = {};
    (achada.respostas || []).forEach(function (r) { if (r && r.id) mapa[r.id] = r.valor; });
    return { respostas: mapa, instancia: achada };
  }

  /* ============================================================
     2) DOS DADOS DA ANAMNESE PARA OS DA CALCULADORA
     ============================================================ */
  function idadeDe(nascimento) {
    var s = String(nascimento || "").trim();
    var iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    var br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
    var ano, mes, dia;
    if (iso) { ano = +iso[1]; mes = +iso[2]; dia = +iso[3]; }
    else if (br) { dia = +br[1]; mes = +br[2]; ano = +br[3]; }
    else return 0;
    var hoje = new Date();
    var i = hoje.getFullYear() - ano;
    var passou = (hoje.getMonth() + 1) > mes || ((hoje.getMonth() + 1) === mes && hoje.getDate() >= dia);
    if (!passou) i -= 1;
    return i > 0 && i < 120 ? i : 0;
  }

  // As opções são as da anamnese (anamnese-paciente.js, campo "atividade").
  // Os fatores são os mesmos da tabela de PAL de calculos.js.
  var ATIVIDADE = [
    { op: "não pratico", fa: 1.3, nome: "Sedentário" },
    { op: "1 a 2 vezes", fa: 1.375, nome: "Levemente ativa" },
    { op: "3 a 4 vezes", fa: 1.55, nome: "Moderadamente ativa" },
    { op: "5 ou mais", fa: 1.725, nome: "Muito ativa" }
  ];
  function atividadeDe(valor) {
    var t = normaliza(valor);
    for (var i = 0; i < ATIVIDADE.length; i++) {
      if (t.indexOf(normaliza(ATIVIDADE[i].op)) >= 0) return ATIVIDADE[i];
    }
    // Sem resposta, o conservador é assumir MENOS gasto: um VET
    // superestimado vira déficit que não existe.
    return { op: "", fa: 1.3, nome: "Sedentário (não respondido)" };
  }

  /* O objetivo sai de texto livre, então só se afirma o que está escrito.
     Sem sinal claro, assume MANUTENÇÃO e avisa: errar para o lado de não
     restringir é o erro seguro. */
  function objetivoDe(texto) {
    var t = normaliza(texto);
    if (/massa muscular|hipertrofia|ganhar musculo|musculo/.test(t)) {
      return { id: "hipertrofia", porque: 'você escreveu sobre ganho de massa' };
    }
    if (/ganhar peso|engordar|aumentar de peso/.test(t)) {
      return { id: "ganhar", porque: 'você escreveu sobre ganhar peso' };
    }
    if (/emagrec|perder peso|perder \d|eliminar|secar|reduzir medidas|enxugar/.test(t)) {
      return { id: "emagrecer_mod", porque: 'o objetivo escrito fala em emagrecer' };
    }
    if (/manter|manuten/.test(t)) {
      return { id: "manter", porque: 'o objetivo escrito fala em manter' };
    }
    return { id: "manter", porque: null };
  }

  /* ============================================================
     3) QUE MODELO USAR
     Ordem de prioridade: o que é seguro antes do que é preferência.
     ============================================================ */
  function modeloDe(R) {
    var digestivos = String(R.digestivos || "");
    var nDigestivos = digestivos.split(",").filter(function (x) {
      return x.trim() && normaliza(x).indexOf("nenhum") < 0;
    }).length;
    var intestinoRuim = temAlgum(R.intestino_freq, ["2 a 3 vezes", "menos de 2 vezes"]);

    if (temAlgum(R.caneta, ["uso atualmente"])) {
      return { id: "caneta", porque: "você respondeu que usa caneta emagrecedora hoje — o esvaziamento gástrico lento pede refeições menores e mais proteína" };
    }
    if (temAlgum(R.restricao, ["vegana"])) {
      return { id: "vegetariano", porque: "você marcou alimentação vegana", ajusteVegano: true };
    }
    if (temAlgum(R.restricao, ["vegetariana"])) {
      return { id: "vegetariano", porque: "você marcou alimentação vegetariana" };
    }
    if (temAlgum(R.gineco, ["sop"])) {
      return { id: "sop", porque: "você marcou SOP" };
    }
    if (nDigestivos >= 2 || intestinoRuim) {
      return { id: "intestinal", porque: "os sintomas digestivos e o funcionamento do intestino que você relatou" };
    }
    var obj = objetivoDe(R.objetivo);
    if (obj.id === "hipertrofia" || obj.id === "ganhar") {
      return { id: "hipertrofia", porque: "o objetivo que você escreveu" };
    }
    return { id: "emagrecimento", porque: "é o modelo equilibrado que serve de base" };
  }

  /* ============================================================
     4) OS HORÁRIOS DELA
     A paciente escreve "café às 7h, correndo" — daqui sai o 07:00.
     ============================================================ */
  function horaDe(texto) {
    var t = normaliza(texto);
    // 7h, 7:30, 07h30, 19h, "às 12", "meio-dia"
    if (/meio.?dia/.test(t)) return "12:00";
    var m = /(\d{1,2})\s*(?::|h)\s*(\d{2})/.exec(t);
    if (m) return pad(+m[1]) + ":" + m[2];
    m = /(\d{1,2})\s*h/.exec(t);
    if (m) return pad(+m[1]) + ":00";
    m = /(?:as|às|por volta de|umas)\s+(\d{1,2})\b/.exec(t);
    if (m) return pad(+m[1]) + ":00";
    return null;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Casa o nome da refeição do modelo com o campo da anamnese.
  var CAMPO_DA_REFEICAO = [
    { termos: ["cafe da manha", "cafe"], campo: "cafe" },
    { termos: ["lanche da manha"], campo: "lanche_manha" },
    { termos: ["almoco"], campo: "almoco" },
    { termos: ["lanche da tarde", "lanche"], campo: "lanche_tarde" },
    { termos: ["jantar", "janta"], campo: "jantar" },
    { termos: ["ceia"], campo: "ceia" }
  ];
  function campoDaRefeicao(nome) {
    var n = normaliza(nome);
    for (var i = 0; i < CAMPO_DA_REFEICAO.length; i++) {
      if (CAMPO_DA_REFEICAO[i].termos.some(function (t) { return n.indexOf(t) >= 0; })) {
        return CAMPO_DA_REFEICAO[i].campo;
      }
    }
    return null;
  }

  /* ============================================================
     5) O QUE SAI DA MESA
     ============================================================ */
  // Termos que caracterizam cada restrição estruturada. Ficam soltos de
  // propósito: casam por "contém" no nome TACO do alimento.
  var LACTEOS = ["leite", "queijo", "iogurte", "requeijao", "manteiga", "creme de leite",
                 "coalhada", "ricota", "mussarela", "muzzarela", "cheddar", "doce de leite",
                 "achocolatado", "nata"];
  var GLUTEN = ["trigo", "pao", "macarrao", "biscoito", "bolo", "cevada", "centeio",
                "farinha de rosca", "torrada", "cuscuz", "massa"];
  var CARNES = ["carne", "bife", "frango", "peixe", "porco", "lombo", "linguica", "presunto",
                "salsicha", "atum", "sardinha", "camarao", "peru", "bacon", "mortadela",
                "file", "costela", "coxa", "sobrecoxa", "peito de", "figado", "maminha",
                "patinho", "acem", "alcatra", "musculo, bovino", "pescada", "merluza",
                "tilapia", "salmao", "bacalhau"];
  var OVO_MEL = ["ovo", "clara,", "gema,", "mel"];

  // Salvo-conduto: nomes que contêm o termo vetado mas não são o alimento
  // vetado. Sem isto "leite de coco" cai junto com o leite de vaca e
  // "manteiga de amendoim" some de uma dieta sem lactose.
  var SALVOS = ["coco", "soja", "amendoa", "amendoim", "castanha", "arroz,", "aveia",
                "vegetal", "girassol", "gergelim"];

  function ehSalvo(nome) {
    var n = normaliza(nome);
    return SALVOS.some(function (s) { return n.indexOf(s) >= 0; });
  }

  // Palavras que a paciente escreveu em "alergias" e "detesta". Vira lista
  // de termos de busca: some o que é ruído e sobra o que é comida.
  var RUIDO = ["nenhuma", "nenhum", "nao", "nada", "tenho", "como", "gosto", "muito",
               "pouco", "sou", "tudo", "quase", "mas", "que", "com", "sem", "para", "por",
               "dos", "das", "uma", "uns", "meu", "minha", "jeito", "nenhuma.", "de", "do",
               "da", "e", "ou", "a", "o", "os", "as", "em", "no", "na", "se", "ja", "nunca",
               "intolerancia", "alergia", "alergica", "intolerante", "detesto", "odeio",
               "aplica", "aplicavel", "aviso", "obs"];
  function termosLivres(texto) {
    return normaliza(texto)
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(function (w) { return w.length >= 4 && RUIDO.indexOf(w) < 0; });
  }

  // Monta a lista final de vetos, cada um sabendo de onde veio — é o que
  // deixa a Ana desfazer um veto errado sem adivinhar.
  function vetosDe(R) {
    var vetos = [];
    function juntar(termos, motivo) {
      termos.forEach(function (t) { vetos.push({ termo: t, motivo: motivo }); });
    }
    if (temAlgum(R.restricao, ["sem lactose"])) juntar(LACTEOS, "você marcou “sem lactose”");
    if (temAlgum(R.restricao, ["sem gluten"])) juntar(GLUTEN, "você marcou “sem glúten”");
    if (temAlgum(R.restricao, ["vegetariana", "vegana"])) juntar(CARNES, "alimentação vegetariana/vegana");
    if (temAlgum(R.restricao, ["vegana"])) juntar(LACTEOS.concat(OVO_MEL), "alimentação vegana");

    // Texto livre de alergias vale mais que qualquer marcação.
    termosLivres(R.alergias).forEach(function (t) {
      vetos.push({ termo: t, motivo: "alergia/intolerância que você relatou" });
      if (t.indexOf("lactose") >= 0 || t.indexOf("leite") >= 0) juntar(LACTEOS, "intolerância à lactose");
      if (t.indexOf("gluten") >= 0) juntar(GLUTEN, "restrição ao glúten");
    });
    termosLivres(R.detesta).forEach(function (t) {
      vetos.push({ termo: t, motivo: "você disse que não come" });
    });
    return vetos;
  }

  function vetoDe(nomeAlimento, vetos) {
    if (ehSalvo(nomeAlimento)) return null;
    var n = normaliza(nomeAlimento);
    for (var i = 0; i < vetos.length; i++) {
      if (n.indexOf(vetos[i].termo) >= 0) return vetos[i];
    }
    return null;
  }

  /* ---------- Substituição ----------
     Trocar dentro do mesmo grupo TACO e pela caloria mais próxima mantém
     a estrutura da refeição de pé. Se não houver substituto limpo, o item
     sai e isso é dito em voz alta — melhor um buraco visível do que uma
     troca que a Ana não faria. */
  function substituto(al, vetos) {
    var banco = window.ALIMENTOS || [];
    var melhor = null;
    for (var i = 0; i < banco.length; i++) {
      var c = banco[i];
      if (c.id === al.id || c.grupo !== al.grupo) continue;
      if (vetoDe(c.nome, vetos)) continue;
      if (!melhor || Math.abs(c.kcal - al.kcal) < Math.abs(melhor.kcal - al.kcal)) melhor = c;
    }
    return melhor;
  }

  /* ============================================================
     6) GERAR
     ============================================================ */
  function gerar(p) {
    var A = anamneseDe(p);
    if (!A) return { erro: "Esta paciente ainda não enviou a anamnese do programa." };
    var R = A.respostas;

    // --- Portões: casos que não são de ajustar rascunho ---
    if (temAlgum(R.gestacao, ["estou gravida", "estou amamentando"])) {
      return { erro: "Gestação e amamentação pedem conduta própria desde a primeira linha — " +
                     "os modelos e o cálculo daqui não cobrem esse caso. Monte este plano do zero." };
    }
    if (temAlgum(R.transtorno, ["sim, tenho", "sim, ja tive", "sim"])) {
      return { erro: "A paciente relatou diagnóstico de transtorno alimentar. Prescrever meta " +
                     "calórica automaticamente aqui pode fazer mal — monte este plano do zero, " +
                     "junto com quem acompanha o caso." };
    }

    var memoria = [], avisos = [];

    // --- Dados do cálculo ---
    var idade = idadeDe(R.nascimento);
    var peso = num(R.peso), altura = num(R.altura);
    if (!peso || !altura || !idade) {
      return { erro: "Faltam peso, altura ou data de nascimento na anamnese para calcular o gasto energético." };
    }
    var ativ = atividadeDe(R.atividade);
    var obj = objetivoDe(R.objetivo);
    if (!obj.porque) {
      avisos.push("Não deu para identificar o objetivo no texto que ela escreveu, então o cálculo " +
                  "assumiu MANUTENÇÃO de peso. Confira antes de aprovar.");
    }
    if (!ativ.op) {
      avisos.push("Ela não respondeu sobre atividade física; o cálculo assumiu sedentária, " +
                  "que é a hipótese que não infla o gasto.");
    }

    var C = window.CalcTMB.calcular({
      sexo: p.sexo || "F", idade: idade, peso: peso, altura: altura, massaMagra: "",
      formula: "mifflin",         // a mais precisa para a maioria dos adultos
      fatorAtividade: ativ.fa, fatorInjuria: 1, objetivo: obj.id
    });
    if (!C || C.vet == null) return { erro: "Não foi possível calcular o gasto energético com estes dados." };

    memoria.push({
      titulo: "De onde vieram as calorias",
      texto: "Mifflin-St Jeor com " + peso + " kg, " + altura + " cm e " + idade + " anos: " +
             "TMB " + r0(C.tmb) + " kcal. Fator de atividade " + ativ.fa + " (" + ativ.nome + ") → " +
             "GET " + r0(C.get) + " kcal. Objetivo “" + C.obj.nome + "” → VET " + r0(C.vet) + " kcal" +
             (obj.porque ? " — " + obj.porque + "." : " (assumido, veja o aviso acima).")
    });

    // --- Modelo e meta ---
    var esc = modeloDe(R);
    var MODELOS = (window.PlanoAlimentar && window.PlanoAlimentar.MODELOS) || [];
    var modelo = MODELOS.filter(function (m) { return m.id === esc.id; })[0] || MODELOS[0];
    if (!modelo) return { erro: "Os modelos de plano não carregaram." };

    var disponiveis = (modelo.kcals || Object.keys(modelo.variacoes).map(Number))
      .slice().sort(function (a, b) { return a - b; });
    var meta = disponiveis.reduce(function (a, b) {
      return Math.abs(b - C.vet) < Math.abs(a - C.vet) ? b : a;
    });
    memoria.push({
      titulo: "Por que este modelo",
      texto: "“" + modelo.nome + "” porque " + esc.porque + ". A meta ficou em " + meta +
             " kcal, que é a variação do modelo mais perto do VET de " + r0(C.vet) + " kcal."
    });
    if (Math.abs(meta - C.vet) > 150) {
      avisos.push("A variação mais próxima do modelo (" + meta + " kcal) está a " +
                  r0(Math.abs(meta - C.vet)) + " kcal do VET calculado — vale ajustar as porções.");
    }

    // --- Monta as refeições ---
    var fonte = modelo.variacoes[meta] || [];
    var vetos = vetosDe(R);
    var trocas = [], removidos = [], horas = [];

    var refeicoes = fonte.map(function (rf) {
      var campo = campoDaRefeicao(rf.nome);
      var hora = campo ? horaDe(R[campo]) : null;
      if (hora) horas.push(rf.nome + " às " + hora);

      var itens = [];
      (rf.itens || []).forEach(function (it) {
        var al = acharNoBanco(it.q);
        if (!al) { itens.push({ q: it.q, medida: it.medida, qtd: it.qtd }); return; }
        var veto = vetoDe(al.nome, vetos);
        if (!veto) { itens.push({ q: it.q, medida: it.medida, qtd: it.qtd }); return; }

        var sub = substituto(al, vetos);
        if (sub) {
          // Mantém as gramas: a medida caseira do substituto pode ser outra.
          var gGramas = gramasDe(al, it.medida, it.qtd);
          var med = escolherMedida(sub, it.medida);
          var qtd = med.g > 0 ? Math.max(0.5, Math.round(gGramas / med.g * 2) / 2) : it.qtd;
          itens.push({ q: sub.nome, medida: med.nome, qtd: qtd });
          trocas.push(al.nome + " → " + sub.nome + " (" + veto.motivo + ")");
        } else {
          removidos.push(al.nome + " (" + veto.motivo + ")");
        }
      });
      return { nome: rf.nome, hora: hora || rf.hora, itens: itens };
    });

    if (horas.length) {
      memoria.push({
        titulo: "Horários",
        texto: "Encaixados no que ela contou na anamnese: " + horas.join("; ") +
               ". As refeições sem horário na resposta dela ficaram no horário padrão do modelo."
      });
    }
    if (trocas.length) {
      memoria.push({ titulo: "Trocas por restrição", texto: trocas.join(" · ") });
    }
    if (removidos.length) {
      memoria.push({ titulo: "Itens retirados sem substituto", texto: removidos.join(" · ") });
      avisos.push("Saiu item sem substituto equivalente — a refeição ficou mais leve do que a meta. " +
                  "Reponha à mão antes de aprovar.");
    }
    if (R.adora && normaliza(R.adora).length > 3) {
      memoria.push({
        titulo: "O que ela pediu para não tirar",
        texto: String(R.adora).trim() + " — o rascunho não força nada disso no cardápio; " +
               "encaixar é decisão sua."
      });
    }
    if (temAlgum(R.cozinha, ["nao cozinho", "ate 15 minutos"])) {
      avisos.push("Ela tem pouco ou nenhum tempo de cozinhar (“" + R.cozinha + "”) — " +
                  "vale revisar os preparos antes de liberar.");
    }

    var plano = {
      titulo: "Rascunho — " + modelo.nome,
      objetivo: C.obj.nome,
      metaKcal: meta,
      refeicoes: refeicoes,
      publicado: false,
      rascunho: {
        gerado_em: new Date().toISOString(),
        anamnese_em: A.instancia.data || null,
        memoria: memoria,
        avisos: avisos
      }
    };
    return { plano: plano, memoria: memoria, avisos: avisos };
  }

  /* ---------- Apoio ao banco de alimentos ---------- */
  function acharNoBanco(q) {
    var banco = window.ALIMENTOS || [];
    var termos = normaliza(q).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    if (!termos.length) return null;
    var best = null;
    for (var i = 0; i < banco.length; i++) {
      var n = normaliza(banco[i].nome);
      var ok = termos.every(function (t) { return n.indexOf(t) >= 0; });
      if (ok && (!best || banco[i].nome.length < best.nome.length)) best = banco[i];
    }
    return best;
  }
  function gramasDe(al, medida, qtd) {
    var m = (al.medidas || []).filter(function (x) { return x.nome === medida; })[0];
    return num(qtd) * (m ? m.g : 1);
  }
  // Prefere a mesma medida caseira; se o substituto não tiver, usa a
  // primeira que não seja "grama" (mais legível para a paciente).
  function escolherMedida(al, medida) {
    var meds = al.medidas || [{ nome: "grama", g: 1 }];
    var igual = meds.filter(function (m) { return m.nome === medida; })[0];
    if (igual) return igual;
    return meds.filter(function (m) { return m.nome !== "grama"; })[0] || meds[0];
  }

  window.RascunhoPlano = { anamneseDe: anamneseDe, gerar: gerar };
})();
