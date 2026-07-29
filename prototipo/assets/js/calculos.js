/* ============================================================
   CÁLCULOS NUTRICIONAIS — TMB, GET e VET.

   Estima a necessidade energética por várias fórmulas, agrupadas por
   público (adultos e idosos, crianças e adolescentes, massa magra/atletas,
   ou valor medido por calorimetria), aplica fator de atividade, fator
   injúria e fator térmico (Long, 1979), adicional por MET, adicional de
   gestação/lactação (IOM, 2005) e chega ao GET. Do GET sai o VET, ajustado
   ou pelo percentual do objetivo ou por uma meta de peso programada
   (kg + prazo), com distribuição de macronutrientes.

   Duas famílias de fórmula convivem aqui e a diferença importa:
   - tipo "tmb": estimam o metabolismo BASAL. O GET vem de multiplicar
     pelo fator de atividade.
   - tipo "get": as EER das DRIs já estimam o gasto TOTAL (a atividade
     entra dentro da equação, pelo CAF). Nessas, o fator de atividade é
     desligado — multiplicar de novo contaria a atividade duas vezes.

   Toda fórmula e todo fator carregam a citação da fonte em refFull, que
   aparece no painel "Ver referências" (exigência de rastreabilidade do
   Código de Ética do nutricionista).

   Exposto como window.CalcTMB. Usado pelo Prontuário (prontuario.js), pela
   ficha do paciente (pacientes.js) e pelo rascunho de plano
   (rascunho-plano.js), que chama calcular() sem tocar na UI.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(v) { if (v == null || v === "") return 0; var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
  function r0(n) { return Math.round(n); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function dec(n) { return String(r1(n)).replace(".", ","); }        // 12.9 → "12,9"
  function mil(n) { return String(r0(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }  // 46200 → "46.200"
  function fat(n) { return String(n).replace(".", ","); }            // fator 1.375 → "1,375"
  function hojeBR() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }

  /* ============================================================
     TABELAS CLÍNICAS
     ============================================================ */

  /* FAO/OMS/ONU 1985 (equações de Schofield) — TMB a partir do peso,
     por faixa etária. Cobre de 0 a 60+ anos. */
  function faixaOMS(idade) {
    if (idade < 3) return "0-3"; if (idade < 10) return "3-10"; if (idade < 18) return "10-18";
    if (idade < 30) return "18-30"; if (idade < 60) return "30-60"; return "60+";
  }
  var OMS = {
    M: { "0-3": [60.9, -54], "3-10": [22.7, 495], "10-18": [17.5, 651], "18-30": [15.3, 679], "30-60": [11.6, 879], "60+": [13.5, 487] },
    F: { "0-3": [61.0, -51], "3-10": [22.5, 499], "10-18": [12.2, 746], "18-30": [14.7, 496], "30-60": [8.7, 829], "60+": [10.5, 596] }
  };

  /* Henry & Rees 1991 — populações tropicais. As equações originais dão
     MJ/dia; o fator 239 converte para kcal. Só existem faixas de 3 a 60. */
  var MJ_KCAL = 239;
  var HENRY = {
    M: [[3, 10, 0.113, 1.689], [10, 18, 0.084, 2.122], [18, 30, 0.056, 2.800], [30, 60, 0.046, 3.160]],
    F: [[3, 10, 0.063, 2.466], [10, 18, 0.047, 2.951], [18, 30, 0.048, 2.562], [30, 60, 0.048, 2.448]]
  };
  function henry(sexo, peso, idade) {
    var t = HENRY[sexo] || HENRY.F;
    for (var k = 0; k < t.length; k++) {
      if (idade >= t[k][0] && idade < t[k][1]) return (t[k][2] * peso + t[k][3]) * MJ_KCAL;
    }
    return null;   // fora de 3–60 anos: a fórmula não tem coeficiente
  }

  /* Coeficiente de atividade física (CAF) das DRIs — IOM 2005.
     Muda por sexo e por faixa (crianças/adolescentes 3–18 vs adultos 19+). */
  var CAF_NIVEIS = [
    { nome: "Sedentário", desc: "atividades do dia a dia, várias horas sentado" },
    { nome: "Pouco ativo", desc: "caminhadas (~6,4 km/h) além do cotidiano" },
    { nome: "Ativo", desc: "ginástica aeróbica, corrida, natação, tênis" },
    { nome: "Muito ativo", desc: "ciclismo moderado, corrida, pular corda" }
  ];
  var CAF = {
    adulto: { M: [1.00, 1.11, 1.25, 1.48], F: [1.00, 1.12, 1.27, 1.45] },
    crianca: { M: [1.00, 1.13, 1.26, 1.42], F: [1.00, 1.16, 1.31, 1.56] }
  };

  /* Energia para deposição em lactentes (IOM 2005), por faixa de meses. */
  function deposicaoBebe(meses) {
    if (meses < 4) return 175; if (meses < 7) return 56; if (meses < 13) return 22; return 20;
  }

  /* Adicionais de gestação e lactação — IOM 2005. Entram sobre o GET,
     que é exatamente como as DRIs definem (EER da não-gestante + adicional). */
  // Guardados por ÍNDICE, não pelo valor: "Não se aplica" e "1º trimestre"
  // somam 0 kcal os dois, e dois <option> com o mesmo value se atropelam na
  // hora de marcar o selecionado (além de perder o rótulo no prontuário).
  var GESTACAO = [
    { v: 0, nome: "Não se aplica" },
    { v: 0, nome: "1º trimestre (+ 0 kcal)" },
    { v: 340, nome: "2º trimestre (+ 340 kcal)" },
    { v: 452, nome: "3º trimestre (+ 452 kcal)" }
  ];
  var LACTACAO = [
    { v: 0, nome: "Não se aplica" },
    { v: 330, nome: "1os 6 meses (+ 330 kcal)" },
    { v: 400, nome: "2os 6 meses (+ 400 kcal)" }
  ];
  function itemPorIndice(lista, v) { return lista[Math.round(num(v))] || lista[0]; }

  var KCAL_POR_KG = 7700;
  var VET_MINIMO = { F: 1200, M: 1500 };   // piso de segurança usual p/ dieta ambulatorial

  /* ---------- Referências das fontes usadas ---------- */
  var REF_IOM = "INSTITUTE OF MEDICINE. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids. Washington: National Academies Press, 2005.";
  var REF_LONG = "LONG, C. L. et al. Metabolic response to injury and illness: estimation of energy and protein needs from indirect calorimetry and nitrogen balance. JPEN, v. 3, p. 452-456, 1979.";

  /* ============================================================
     FÓRMULAS
     grupos  — em quais optgroups do seletor a fórmula aparece
     tipo    — "tmb" (basal, precisa de fator atividade) ou "get" (total)
     idade   — faixa de validade em anos (só gera aviso, não bloqueia)
     precisa — "mm" quando depende da massa magra
     campo   — campo extra que a fórmula exige no formulário
     ============================================================ */
  var G_ADULTO = "Adultos e idosos", G_CRIANCA = "Crianças e adolescentes",
      G_MAGRA = "Massa magra e atletas", G_MEDIDO = "Medido / informado";

  var FORMULAS = [
    /* ---- Adultos e idosos (TMB) ---- */
    { id: "hb_rev", grupos: [G_ADULTO], nome: "Harris-Benedict revisada (1984)", tipo: "tmb", ref: "Roza & Shizgal", idade: [18, 120],
      refFull: "ROZA, A. M.; SHIZGAL, H. M. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. American Journal of Clinical Nutrition, v. 40, n. 1, p. 168-182, 1984.",
      calc: function (c) { return c.sexo === "M" ? 88.362 + 13.397 * c.peso + 4.799 * c.altura - 5.677 * c.idade : 447.593 + 9.247 * c.peso + 3.098 * c.altura - 4.330 * c.idade; } },

    { id: "hb_orig", grupos: [G_ADULTO], nome: "Harris-Benedict original (1919)", tipo: "tmb", ref: "Harris & Benedict", idade: [18, 120],
      refFull: "HARRIS, J. A.; BENEDICT, F. G. A biometric study of basal metabolism in man. Washington: Carnegie Institution of Washington, 1919.",
      calc: function (c) { return c.sexo === "M" ? 66.5 + 13.75 * c.peso + 5.003 * c.altura - 6.755 * c.idade : 655.1 + 9.563 * c.peso + 1.850 * c.altura - 4.676 * c.idade; } },

    { id: "mifflin", grupos: [G_ADULTO], nome: "Mifflin-St Jeor (1990)", tipo: "tmb", ref: "boa acurácia p/ adultos", idade: [19, 120],
      refFull: "MIFFLIN, M. D. et al. A new predictive equation for resting energy expenditure in healthy individuals. American Journal of Clinical Nutrition, v. 51, n. 2, p. 241-247, 1990.",
      calc: function (c) { return 10 * c.peso + 6.25 * c.altura - 5 * c.idade + (c.sexo === "M" ? 5 : -161); } },

    { id: "oms", grupos: [G_ADULTO, G_CRIANCA], nome: "FAO/OMS/ONU (1985) — Schofield", tipo: "tmb", ref: "por faixa etária, base peso",
      refFull: "FAO/WHO/UNU. Energy and protein requirements: report of a joint FAO/WHO/UNU expert consultation. Geneva: WHO, 1985. (equações de SCHOFIELD, W. N. Predicting basal metabolic rate, new standards and review of previous work. Human Nutrition: Clinical Nutrition, v. 39, supl. 1, p. 5-41, 1985.)",
      calc: function (c) { var t = OMS[c.sexo] || OMS.F; var k = t[faixaOMS(c.idade)]; return k[0] * c.peso + k[1]; } },

    { id: "henry", grupos: [G_ADULTO, G_CRIANCA], nome: "Henry & Rees (1991) — populações tropicais", tipo: "tmb", ref: "3 a 60 anos", idade: [3, 60],
      refFull: "HENRY, C. J. K.; REES, D. G. New predictive equations for the estimation of basal metabolic rate in tropical peoples. European Journal of Clinical Nutrition, v. 45, n. 4, p. 177-185, 1991.",
      calc: function (c) { return henry(c.sexo, c.peso, c.idade); } },

    { id: "eer_adulto", grupos: [G_ADULTO], nome: "EER / IOM (2005) — adultos 19+", tipo: "get", usaCAF: true, cafGrupo: "adulto",
      ref: "estima o GET direto (DRIs)", idade: [19, 120], refFull: REF_IOM,
      calc: function (c) {
        return c.sexo === "M" ? 662 - 9.53 * c.idade + c.caf * (15.91 * c.peso + 539.6 * c.alturaM)
                              : 354 - 6.91 * c.idade + c.caf * (9.36 * c.peso + 726 * c.alturaM);
      } },

    /* ---- Massa magra e atletas (TMB) ---- */
    { id: "cunningham", grupos: [G_MAGRA], nome: "Cunningham (1980)", tipo: "tmb", precisa: "mm", ref: "atletas — usa massa magra",
      refFull: "CUNNINGHAM, J. J. A reanalysis of the factors influencing basal metabolic rate in normal adults. American Journal of Clinical Nutrition, v. 33, n. 11, p. 2372-2374, 1980.",
      calc: function (c) { return 500 + 22 * c.massaMagra; } },

    { id: "katch", grupos: [G_MAGRA], nome: "Katch-McArdle", tipo: "tmb", precisa: "mm", ref: "usa massa magra",
      refFull: "McARDLE, W. D.; KATCH, F. I.; KATCH, V. L. Exercise physiology: energy, nutrition and human performance. Philadelphia: Lea & Febiger.",
      calc: function (c) { return 370 + 21.6 * c.massaMagra; } },

    { id: "mifflin_mlg", grupos: [G_MAGRA], nome: "Mifflin-St Jeor por massa magra (1990)", tipo: "tmb", precisa: "mm", ref: "MLG foi o melhor preditor isolado",
      refFull: "MIFFLIN, M. D. et al. A new predictive equation for resting energy expenditure in healthy individuals. American Journal of Clinical Nutrition, v. 51, n. 2, p. 241-247, 1990. (equação por massa livre de gordura)",
      calc: function (c) { return 19.7 * c.massaMagra + 413; } },

    { id: "tinsley_peso", grupos: [G_MAGRA], nome: "Tinsley por peso (2018)", tipo: "tmb", ref: "praticantes de musculação",
      refFull: "TINSLEY, G. M. et al. Resting metabolic rate in muscular physique athletes: validity of existing methods and development of new prediction equations. Applied Physiology, Nutrition, and Metabolism, v. 44, n. 4, p. 397-406, 2018.",
      calc: function (c) { return 24.8 * c.peso + 10; } },

    { id: "tinsley_mlg", grupos: [G_MAGRA], nome: "Tinsley por massa magra (2018)", tipo: "tmb", precisa: "mm", ref: "praticantes de musculação",
      refFull: "TINSLEY, G. M. et al. Resting metabolic rate in muscular physique athletes: validity of existing methods and development of new prediction equations. Applied Physiology, Nutrition, and Metabolism, v. 44, n. 4, p. 397-406, 2018. (equação por massa livre de gordura)",
      calc: function (c) { return 25.9 * c.massaMagra + 284; } },

    /* ---- Crianças e adolescentes (EER — GET direto) ---- */
    { id: "eer_bebe", grupos: [G_CRIANCA], nome: "EER / IOM (2005) — 0 a 35 meses", tipo: "get", campo: "idadeMeses",
      ref: "usa idade em meses e peso", refFull: REF_IOM,
      calc: function (c) { return (89 * c.peso - 100) + deposicaoBebe(c.idadeMeses); } },

    { id: "eer_3_8", grupos: [G_CRIANCA], nome: "EER / IOM (2005) — 3 a 8 anos", tipo: "get", usaCAF: true, cafGrupo: "crianca",
      ref: "+ 20 kcal de deposição", idade: [3, 9], refFull: REF_IOM,
      calc: function (c) { return eerCrianca(c, 20); } },

    { id: "eer_9_18", grupos: [G_CRIANCA], nome: "EER / IOM (2005) — 9 a 18 anos", tipo: "get", usaCAF: true, cafGrupo: "crianca",
      ref: "+ 25 kcal de deposição", idade: [9, 19], refFull: REF_IOM,
      calc: function (c) { return eerCrianca(c, 25); } },

    /* ---- Medido / informado ---- */
    { id: "tmb_manual", grupos: [G_MEDIDO], nome: "TMB medida (calorimetria indireta)", tipo: "tmb", campo: "tmbManual",
      ref: "valor medido no paciente", refFull: "Valor informado pelo profissional (calorimetria indireta ou outra medição direta). Nenhuma equação de predição é aplicada.",
      calc: function (c) { return c.tmbManual || null; } },

    { id: "get_manual", grupos: [G_MEDIDO], nome: "GET medido / informado", tipo: "get", campo: "getManual",
      ref: "gasto total já conhecido", refFull: "Valor informado pelo profissional (calorimetria indireta, monitor metabólico ou estimativa própria). Nenhuma equação de predição é aplicada.",
      calc: function (c) { return c.getManual || null; } }
  ];
  function eerCrianca(c, deposicao) {
    return c.sexo === "M"
      ? 88.5 - 61.9 * c.idade + c.caf * (26.7 * c.peso + 903 * c.alturaM) + deposicao
      : 135.3 - 30.8 * c.idade + c.caf * (10.0 * c.peso + 934 * c.alturaM) + deposicao;
  }
  var FORMULA_BY_ID = {}; FORMULAS.forEach(function (f) { FORMULA_BY_ID[f.id] = f; });
  var GRUPOS = [G_ADULTO, G_MAGRA, G_CRIANCA, G_MEDIDO];

  /* ---------- Fatores de atividade ---------- */
  var ATIVIDADE = [
    { v: 1.2, nome: "Acamado / repouso no leito", desc: "Long 1979: acamado = 1,2" },
    { v: 1.25, nome: "Acamado, porém móvel", desc: "Long 1979: acamado + móvel = 1,25" },
    { v: 1.3, nome: "Sedentário / ambulante", desc: "Long 1979: ambulante = 1,3; pouco ou nenhum exercício" },
    { v: 1.375, nome: "Levemente ativo", desc: "exercício leve 1–3×/semana" },
    { v: 1.55, nome: "Moderadamente ativo", desc: "exercício moderado 3–5×/semana" },
    { v: 1.725, nome: "Muito ativo", desc: "exercício intenso 6–7×/semana" },
    { v: 1.9, nome: "Extremamente ativo / atleta", desc: "2×/dia ou trabalho físico pesado" }
  ];

  /* ---------- Fator injúria / estresse — Long (1979) ---------- */
  var INJURIA = [
    { v: 1.0, nome: "Paciente não complicado" },
    { v: 1.1, nome: "Pós-operatório de câncer" },
    { v: 1.2, nome: "Fratura" },
    { v: 1.3, nome: "Sepse" },
    { v: 1.4, nome: "Peritonite" },
    { v: 1.5, nome: "Multitrauma em reabilitação" },
    { v: 1.6, nome: "Multitrauma + sepse" },
    { v: 1.7, nome: "Queimadura 30 a 50%" },
    { v: 1.8, nome: "Queimadura 50 a 70%" },
    { v: 2.0, nome: "Queimadura 70 a 90%" }
  ];
  /* ---------- Fator térmico — Long (1979) ---------- */
  var TERMICO = [
    { v: 1.0, nome: "Sem febre" },
    { v: 1.1, nome: "38 °C" },
    { v: 1.2, nome: "39 °C" },
    { v: 1.3, nome: "40 °C" },
    { v: 1.4, nome: "41 °C" }
  ];

  /* ---------- Objetivos (ajuste sobre o GET) ---------- */
  var OBJETIVOS = [
    { id: "emagrecer_mod", nome: "Emagrecimento (déficit moderado)", ajuste: -0.20, ptn: 2.0, lip: 25 },
    { id: "emagrecer_leve", nome: "Emagrecimento leve", ajuste: -0.10, ptn: 1.8, lip: 27 },
    { id: "emagrecer_agr", nome: "Emagrecimento agressivo", ajuste: -0.30, ptn: 2.2, lip: 25 },
    { id: "manter", nome: "Manutenção de peso", ajuste: 0, ptn: 1.6, lip: 28 },
    { id: "ganhar", nome: "Ganho de peso", ajuste: 0.15, ptn: 1.6, lip: 27 },
    { id: "hipertrofia", nome: "Ganho de massa muscular (hipertrofia)", ajuste: 0.12, ptn: 2.0, lip: 25 },
    { id: "recuperacao", nome: "Recuperação / repleção (acamado)", ajuste: 0.20, ptn: 1.5, lip: 30 }
  ];
  var OBJ_BY_ID = {}; OBJETIVOS.forEach(function (o) { OBJ_BY_ID[o.id] = o; });

  /* ---------- Meta de peso programada ----------
     1 kg de tecido adiposo ≈ 7700 kcal (Wishnofsky, 1958). Com o peso
     desejado e o prazo em dias, o ajuste diário sai direto: o total de
     kcal a poupar (ou somar) dividido pelo número de dias. Quando a meta
     está preenchida ela SUBSTITUI o ajuste percentual do objetivo — o
     objetivo continua valendo só para sugerir os macros. */
  function metaDe(i, base, get, tmb) {
    var pesoMeta = num(i.pesoMeta), dias = Math.round(num(i.prazoDias));
    if (!pesoMeta || !dias || dias < 1 || !base.peso || get == null) return null;
    var delta = pesoMeta - base.peso;                    // + ganhar, − perder
    if (!delta) return null;                             // peso desejado = atual → sem meta
    var semanas = dias / 7;
    var kcalDia = delta * KCAL_POR_KG / dias;
    var kgSem = delta / semanas;
    var pctSem = Math.abs(kgSem) / base.peso * 100;
    var vet = get + kcalDia;
    var alertas = [];
    if (Math.abs(kgSem) > 1) alertas.push("Ritmo de " + dec(Math.abs(kgSem)) + " kg/semana — acima do recomendado (0,5 a 1 kg/semana). Amplie o prazo.");
    else if (pctSem > 1) alertas.push("Variação de " + dec(pctSem) + "% do peso por semana — acima de 1%/semana. Considere um prazo maior.");
    if (vet <= 0) alertas.push("A meta é matematicamente impossível: exigiria gastar mais do que o paciente consome (VET negativo).");
    else if (tmb != null && vet < tmb) alertas.push("O VET (" + mil(vet) + " kcal) fica abaixo da TMB (" + mil(tmb) + " kcal).");
    var piso = VET_MINIMO[base.sexo] || 1200;
    if (vet > 0 && vet < piso) alertas.push("O VET fica abaixo do piso de " + mil(piso) + " kcal/dia — dieta desse nível exige acompanhamento próximo.");
    var alvo = new Date(); alvo.setDate(alvo.getDate() + dias);
    return {
      pesoMeta: pesoMeta, dias: dias, semanas: semanas, delta: delta,
      kcalTotal: delta * KCAL_POR_KG, kcalDia: kcalDia, kgSem: kgSem, pctSem: pctSem,
      pctGet: kcalDia / get * 100, vet: vet, alertas: alertas,
      dataAlvo: ("0" + alvo.getDate()).slice(-2) + "/" + ("0" + (alvo.getMonth() + 1)).slice(-2) + "/" + alvo.getFullYear()
    };
  }

  /* ============================================================
     ESTADO
     ============================================================ */
  var _inp = null, _ctx = null, _base = null;

  // base = { sexo, idade, peso, altura(cm), massaMagra } vindos do paciente;
  // saved = cálculo salvo (para reabrir com as mesmas escolhas).
  function render(base, saved) {
    _base = base || {};
    var s = saved || {};
    _inp = {
      sexo: s.sexo || _base.sexo || "F",
      idade: s.idade != null ? s.idade : (_base.idade || ""),
      peso: s.peso != null ? s.peso : (_base.peso || ""),
      altura: s.altura != null ? s.altura : (_base.altura || ""),
      massaMagra: s.massaMagra != null ? s.massaMagra : (_base.massaMagra || ""),
      idadeMeses: s.idadeMeses != null ? s.idadeMeses : "",
      formula: s.formula || "hb_rev",
      caf: s.caf != null ? s.caf : 0,
      fatorAtividade: s.fatorAtividade != null ? s.fatorAtividade : 1.375,
      fatorInjuria: s.fatorInjuria != null ? s.fatorInjuria : 1.0,
      fatorTermico: s.fatorTermico != null ? s.fatorTermico : 1.0,
      tmbManual: s.tmbManual != null ? s.tmbManual : "",
      getManual: s.getManual != null ? s.getManual : "",
      mets: s.mets != null ? s.mets : "",
      metHoras: s.metHoras != null ? s.metHoras : "",
      gestacao: s.gestacao != null ? s.gestacao : 0,
      lactacao: s.lactacao != null ? s.lactacao : 0,
      objetivo: s.objetivo || (_base.objetivoId) || "manter",
      ptnGkg: s.ptnGkg != null ? s.ptnGkg : null,
      lipPct: s.lipPct != null ? s.lipPct : null,
      // Meta de peso: peso desejado + prazo. Vazio = usa só o % do objetivo.
      pesoMeta: s.pesoMeta != null ? s.pesoMeta : (_base.pesoMeta || ""),
      prazoDias: s.prazoDias != null ? s.prazoDias : ""
    };
    return '<div id="calc-root" class="calc">' +
      '<div id="calc-form">' + formHTML() + '</div>' +
      '<div id="calc-out">' + resultadosHTML() + '</div>' +
    '</div>';
  }

  /* ============================================================
     FORMULÁRIO
     ============================================================ */
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (String(sel) === String(v) ? " selected" : "") + '>' + esc(label) + "</option>"; }
  function field(lbl, ctrl, hint) {
    return '<label class="calc-field"><span class="calc-field__lbl">' + esc(lbl) + '</span>' + ctrl +
      (hint ? '<span class="calc-field__hint">' + esc(hint) + '</span>' : "") + '</label>';
  }
  function inputNum(key, val) {
    return '<input type="number" step="any" inputmode="decimal" data-c="' + key + '" value="' + esc(val === 0 ? "0" : (val || "")) + '" />';
  }
  function selectDe(key, itens, sel, desabilitado) {
    return '<select data-c="' + key + '"' + (desabilitado ? " disabled" : "") + '>' +
      itens.map(function (a) { return opt(a.v, a.nome + (a.v !== 1 ? " (× " + fat(a.v) + ")" : ""), sel); }).join("") + '</select>';
  }

  function formulaSelectHTML(sel) {
    return '<select data-c="formula">' + GRUPOS.map(function (g) {
      var itens = FORMULAS.filter(function (f) { return f.grupos.indexOf(g) >= 0; });
      if (!itens.length) return "";
      return '<optgroup label="' + esc(g) + '">' +
        itens.map(function (f) { return opt(f.id, f.nome, sel); }).join("") + '</optgroup>';
    }).join("") + '</select>';
  }

  function formHTML() {
    var i = _inp, f = FORMULA_BY_ID[i.formula] || FORMULAS[0];
    var ehGet = f.tipo === "get";
    var obj = OBJETIVOS.map(function (o) { return opt(o.id, o.nome, i.objetivo); }).join("");

    // Campos do paciente + o campo extra que a fórmula escolhida exigir.
    var dados = field("Sexo", '<select data-c="sexo">' + opt("F", "Feminino", i.sexo) + opt("M", "Masculino", i.sexo) + '</select>') +
      field("Idade (anos)", inputNum("idade", i.idade)) +
      field("Peso (kg)", inputNum("peso", i.peso)) +
      field("Altura (cm)", inputNum("altura", i.altura)) +
      field("Massa magra (kg)", inputNum("massaMagra", i.massaMagra), "opcional — habilita as fórmulas por MLG");
    if (f.campo === "idadeMeses") dados += field("Idade (meses)", inputNum("idadeMeses", i.idadeMeses), "0 a 35 meses — define a deposição");

    // Fórmula e fatores. Em fórmula do tipo GET o fator de atividade sai do
    // caminho: a atividade já entrou pelo CAF dentro da própria equação.
    var fatores = field("Fórmula", formulaSelectHTML(i.formula), f.ref);
    if (f.usaCAF) {
      var tab = CAF[f.cafGrupo] || CAF.adulto;
      var vals = tab[i.sexo] || tab.F;
      fatores += field("Nível de atividade (CAF)", '<select data-c="caf">' + CAF_NIVEIS.map(function (n, k) {
        return opt(k, n.nome + " (CAF " + fat(vals[k]) + ")", i.caf);
      }).join("") + '</select>', "coeficiente das DRIs, dentro da equação");
    }
    if (f.campo === "tmbManual") fatores += field("TMB medida (kcal/dia)", inputNum("tmbManual", i.tmbManual), "valor da calorimetria");
    if (f.campo === "getManual") fatores += field("GET medido (kcal/dia)", inputNum("getManual", i.getManual), "valor da calorimetria");
    fatores += field("Fator de atividade", selectDe("fatorAtividade", ATIVIDADE, i.fatorAtividade, ehGet),
      ehGet ? "desligado: esta fórmula já estima o GET" : "multiplica a TMB");
    fatores += field("Fator injúria / estresse", selectDe("fatorInjuria", INJURIA, i.fatorInjuria), "Long (1979)");
    fatores += field("Fator térmico (febre)", selectDe("fatorTermico", TERMICO, i.fatorTermico), "Long (1979)");

    return '' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">1 · Dados do paciente' + botaoImportar() + '</div>' +
        '<div class="calc-grid">' + dados + '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">2 · Fórmula e fatores</div>' +
        '<div class="calc-grid">' + fatores + '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">3 · Adicionais <span class="calc-tag">opcional</span></div>' +
        '<div class="calc-grid">' +
          field("Gestação", '<select data-c="gestacao">' + GESTACAO.map(function (g, k) { return opt(k, g.nome, i.gestacao); }).join("") + '</select>', "adicional IOM (2005)") +
          field("Lactação", '<select data-c="lactacao">' + LACTACAO.map(function (g, k) { return opt(k, g.nome, i.lactacao); }).join("") + '</select>', "adicional IOM (2005)") +
          field("Atividade extra (METs)", inputNum("mets", i.mets), "ex.: 6 METs de corrida") +
          field("Horas por dia (MET)", inputNum("metHoras", i.metHoras), "1 MET ≈ 1 kcal/kg/hora") +
        '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">4 · Objetivo e macros</div>' +
        '<div class="calc-grid">' +
          field("Objetivo", '<select data-c="objetivo">' + obj + '</select>') +
          field("Proteína (g/kg)", inputNum("ptnGkg", i.ptnGkg == null ? "" : i.ptnGkg), "vazio = sugestão do objetivo") +
          field("Gordura (% do VET)", inputNum("lipPct", i.lipPct == null ? "" : i.lipPct), "vazio = sugestão do objetivo") +
        '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">5 · Programar meta de peso <span class="calc-tag">opcional</span></div>' +
        '<div class="calc-grid">' +
          field("Peso desejado (kg)", inputNum("pesoMeta", i.pesoMeta), "onde o paciente quer chegar") +
          field("Prazo (dias)", inputNum("prazoDias", i.prazoDias) + prazoChips(), "em quanto tempo") +
        '</div>' +
        '<p class="calc-hint">Com os dois campos preenchidos, o ajuste calórico sai da meta (7700 kcal por kg) e <strong>substitui</strong> o percentual do objetivo. Deixe em branco para usar só o objetivo.</p>' +
      '</div>';
  }
  function botaoImportar() {
    if (!_base || (!_base.peso && !_base.altura)) return "";
    return '<button type="button" class="calc-link" data-calc-importar>⤵ Importar de antropometria</button>';
  }
  function prazoChips() {
    return '<div class="calc-chips">' + [30, 60, 90, 180].map(function (d) {
      return '<button type="button" class="calc-chip" data-prazo="' + d + '">' + d + " dias</button>";
    }).join("") + '</div>';
  }

  /* ============================================================
     CÁLCULO
     inp opcional: sem ele calcula o que está na tela. Com ele, calcula
     qualquer entrada sem tocar na UI — é assim que o rascunho de plano
     (rascunho-plano.js) usa as mesmas fórmulas que a Ana vê aqui, em vez
     de manter uma segunda cópia que envelhece sozinha.
     ============================================================ */
  function ctxDe(i, base) {
    var f = FORMULA_BY_ID[i.formula] || FORMULAS[0];
    var tab = CAF[f.cafGrupo] || CAF.adulto;
    var vals = tab[base.sexo] || tab.F;
    return {
      sexo: base.sexo, peso: base.peso, altura: base.altura, alturaM: base.altura / 100,
      idade: base.idade, idadeMeses: num(i.idadeMeses), massaMagra: base.massaMagra,
      caf: f.usaCAF ? (vals[Math.round(num(i.caf))] || vals[0]) : 1,
      tmbManual: num(i.tmbManual), getManual: num(i.getManual)
    };
  }
  function valorDe(f, c) {
    if (f.precisa === "mm" && !c.massaMagra) return null;
    if (f.campo === "idadeMeses" && !c.idadeMeses && c.idadeMeses !== 0) return null;
    var v;
    try { v = f.calc(c); } catch (e) { return null; }
    return (v == null || !isFinite(v) || v <= 0) ? null : v;
  }
  // Por que a fórmula não deu conta — mensagem específica em vez de um "—".
  function porqueFalta(f, c) {
    if (f.precisa === "mm" && !c.massaMagra) return "Informe a massa magra para usar esta fórmula.";
    if (f.campo === "idadeMeses" && !c.idadeMeses) return "Informe a idade em meses.";
    if (f.campo === "tmbManual") return "Informe a TMB medida na calorimetria.";
    if (f.campo === "getManual") return "Informe o GET medido.";
    if (f.id === "henry" && (c.idade < 3 || c.idade >= 60)) return "Henry & Rees (1991) só tem coeficientes de 3 a 60 anos. Escolha outra fórmula.";
    return "Preencha peso, altura e idade para calcular.";
  }
  // Fora da faixa de validade a conta sai, mas com aviso: a nutri precisa
  // saber que está extrapolando a população em que a equação foi validada.
  function avisosDe(f, base) {
    var out = [];
    if (f.idade && base.idade) {
      if (base.idade < f.idade[0] || base.idade > f.idade[1]) {
        out.push("A fórmula “" + f.nome + "” foi validada para " + f.idade[0] + " a " + f.idade[1] +
          " anos, e o paciente tem " + dec(base.idade) + ". O resultado é uma extrapolação.");
      }
    }
    return out;
  }
  function metKcal(i, peso) {
    var m = num(i.mets), h = num(i.metHoras);
    return (m > 0 && h > 0 && peso > 0) ? m * peso * h : 0;
  }

  function calcular(inp) {
    var i = inp || _inp;
    var base = { sexo: i.sexo, idade: num(i.idade), peso: num(i.peso), altura: num(i.altura), massaMagra: num(i.massaMagra) };
    var f = FORMULA_BY_ID[i.formula] || FORMULAS[0];
    var c = ctxDe(i, base);
    var bruto = valorDe(f, c);
    var ehGet = f.tipo === "get";
    var tmb = ehGet ? null : bruto;

    // Fórmula que já estima o GET não leva fator de atividade (evita contar
    // a atividade duas vezes). Injúria e térmico continuam valendo.
    var fa = ehGet ? 1 : (num(i.fatorAtividade) || 1);
    var fi = num(i.fatorInjuria) || 1;
    var ft = num(i.fatorTermico) || 1;
    var met = metKcal(i, base.peso);
    var gest = itemPorIndice(GESTACAO, i.gestacao), lact = itemPorIndice(LACTACAO, i.lactacao);
    var adGest = gest.v, adLact = lact.v;
    var get = bruto != null ? bruto * fa * fi * ft + met + adGest + adLact : null;

    var obj = OBJ_BY_ID[i.objetivo] || OBJ_BY_ID.manter;
    // A meta de peso, quando programada, manda no VET; o objetivo segue
    // valendo para sugerir os macros.
    var meta = metaDe(i, base, get, tmb);
    var vet = meta ? meta.vet : (get != null ? get * (1 + obj.ajuste) : null);

    var todas = FORMULAS.filter(function (ff) { return ff.tipo === "tmb" && !ff.campo; })
      .map(function (ff) {
        return { id: ff.id, nome: ff.nome, ref: ff.ref, precisaMM: ff.precisa === "mm", tmb: valorDe(ff, ctxDe(i, base)) };
      });

    // Macros
    var ptnGkg = i.ptnGkg != null && i.ptnGkg !== "" ? num(i.ptnGkg) : obj.ptn;
    var lipPct = i.lipPct != null && i.lipPct !== "" ? num(i.lipPct) : obj.lip;
    var ptnG = base.peso * ptnGkg;
    var ptnKcal = ptnG * 4;
    var lipKcal = vet != null ? vet * (lipPct / 100) : 0;
    var lipG = lipKcal / 9;
    var choKcal = vet != null ? Math.max(0, vet - ptnKcal - lipKcal) : 0;
    var choG = choKcal / 4;
    var macros = null;
    if (vet != null && vet > 0) {
      macros = {
        ptn: { g: r0(ptnG), kcal: r0(ptnKcal), pct: r0(ptnKcal / vet * 100), gkg: r1(ptnGkg) },
        lip: { g: r0(lipG), kcal: r0(lipKcal), pct: r0(lipPct) },
        cho: { g: r0(choG), kcal: r0(choKcal), pct: r0(choKcal / vet * 100), gkg: r1(choG / (base.peso || 1)) }
      };
    }
    return {
      base: base, formula: f, ctx: c, ehGet: ehGet, tmb: tmb, bruto: bruto, todas: todas,
      fa: fa, fi: fi, ft: ft, met: met, adGest: adGest, adLact: adLact,
      gestNome: gest.nome, lactNome: lact.nome,
      get: get, obj: obj, meta: meta, vet: vet, macros: macros,
      ptnGkg: ptnGkg, lipPct: lipPct, caf: c.caf, avisos: avisosDe(f, base)
    };
  }

  /* ============================================================
     RESULTADOS
     ============================================================ */
  function resultadosHTML() {
    var R = calcular();
    if (R.get == null) {
      return '<div class="calc-card"><div class="empty-state">' + esc(porqueFalta(R.formula, R.ctx)) + '</div></div>' + refsHTML();
    }
    var sinal = R.obj.ajuste === 0 ? "" : (R.obj.ajuste > 0 ? "+" : "−") + Math.abs(R.obj.ajuste * 100) + "%";
    var subVet = R.meta
      ? kcalSinal(R.meta.kcalDia) + " kcal/dia · meta de " + kgSinal(R.meta.delta) + " kg em " + R.meta.dias + " dias"
      : R.obj.nome + (sinal ? " · " + sinal : "");

    var subGet = [];
    if (!R.ehGet) subGet.push("× ativ. " + fat(R.fa));
    else subGet.push("CAF " + fat(R.caf));
    if (R.fi !== 1) subGet.push("× injúria " + fat(R.fi));
    if (R.ft !== 1) subGet.push("× térmico " + fat(R.ft));
    if (R.met) subGet.push("+ " + r0(R.met) + " MET");
    if (R.adGest) subGet.push("+ " + R.adGest + " gestação");
    if (R.adLact) subGet.push("+ " + R.adLact + " lactação");

    var big = '<div class="calc-results">' +
      (R.ehGet
        ? resTile("TMB", "—", "", "a fórmula estima o GET direto")
        : resTile("TMB", r0(R.tmb), "kcal/dia", "metabolismo basal")) +
      resTile("GET", r0(R.get), "kcal/dia", subGet.join(" ")) +
      resTile("VET", r0(R.vet), "kcal/dia", subVet, true) +
    '</div>';

    var avisos = R.avisos.length
      ? '<div class="calc-alerts">' + R.avisos.map(function (a) { return '<p class="calc-alert">⚠️ ' + esc(a) + '</p>'; }).join("") + '</div>' : "";

    var meta = "";
    if (R.meta) {
      var M = R.meta;
      var ganho = M.delta > 0;
      meta = '<div class="calc-card calc-card--meta"><div class="calc-card__t">🎯 Meta de peso programada</div>' +
        '<div class="calc-meta">' +
          metaRow("Diferença", kgSinal(M.delta) + " kg", dec(R.base.peso) + " kg → " + dec(M.pesoMeta) + " kg") +
          metaRow("Prazo", M.dias + " dias", "≈ " + dec(M.semanas) + " semanas · até " + M.dataAlvo) +
          metaRow("Ritmo", kgSinal(M.kgSem) + " kg/semana", dec(M.pctSem) + "% do peso corporal por semana") +
          metaRow((ganho ? "Superávit" : "Déficit") + " energético", kcalSinal(M.kcalDia) + " kcal/dia",
            r0(Math.abs(M.pctGet)) + "% do GET · " + mil(Math.abs(M.kcalTotal)) + " kcal no total") +
        '</div>' +
        (M.alertas.length
          ? '<div class="calc-alerts">' + M.alertas.map(function (a) { return '<p class="calc-alert">⚠️ ' + esc(a) + '</p>'; }).join("") + '</div>'
          : '<p class="calc-hint">Ritmo dentro da faixa recomendada (até 1 kg ou 1% do peso por semana).</p>') +
      '</div>';
    }

    var macros = "";
    if (R.macros) {
      var m = R.macros;
      macros = '<div class="calc-card"><div class="calc-card__t">Distribuição de macronutrientes</div>' +
        '<div class="calc-macros">' +
          macroBar("Proteínas", m.ptn.g, m.ptn.kcal, m.ptn.pct, dec(m.ptn.gkg) + " g/kg", "cho") +
          macroBar("Carboidratos", m.cho.g, m.cho.kcal, m.cho.pct, dec(m.cho.gkg) + " g/kg", "carb") +
          macroBar("Gorduras", m.lip.g, m.lip.kcal, m.lip.pct, "", "lip") +
        '</div>' +
        '<p class="calc-hint">Proteína ' + dec(m.ptn.gkg) + ' g/kg · gordura ' + m.lip.pct + '% do VET · carboidrato preenche o restante. Ajuste nos campos acima.</p>' +
      '</div>';
    }

    var comp = '<div class="calc-card"><div class="calc-card__t">Comparativo entre fórmulas (TMB)</div>' +
      '<div class="calc-comp">' + R.todas.map(function (t) {
        var ativa = t.id === R.formula.id;
        var val = t.tmb == null ? (t.precisaMM ? "precisa massa magra" : "—") : mil(t.tmb) + " kcal";
        return '<div class="calc-comp__row' + (ativa ? " is-active" : "") + '"><span class="calc-comp__nome">' + esc(t.nome) +
          '<small>' + esc(t.ref) + '</small></span><span class="calc-comp__val">' + val + '</span></div>';
      }).join("") + '</div>' +
      '<p class="calc-hint">Só fórmulas de TMB entram aqui. As EER das DRIs estimam o GET direto e não são comparáveis linha a linha.</p></div>';

    var memoria = '<div class="calc-card"><div class="calc-card__t">Memória de cálculo</div>' +
      '<div class="calc-mem">' + memoriaLinhas(R).map(function (l) { return '<div>' + l + '</div>'; }).join("") + '</div></div>';

    var acoes = '<div class="calc-actions">' +
      '<button class="btn btn--outline btn--sm" type="button" data-calc-plano>➕ Usar VET no plano alimentar</button>' +
      '<button class="btn btn--primary" type="button" data-calc-salvar>💾 Salvar cálculo</button>' +
    '</div>';

    return big + avisos + meta + macros + comp + memoria + refsHTML() + acoes;
  }

  function resTile(t, v, u, sub, destaque) {
    return '<div class="calc-tile' + (destaque ? " calc-tile--vet" : "") + '"><div class="calc-tile__lbl">' + esc(t) + '</div>' +
      '<div class="calc-tile__val">' + esc(v) + (u ? '<small>' + esc(u) + '</small>' : "") + '</div>' +
      '<div class="calc-tile__sub">' + esc(sub) + '</div></div>';
  }
  function macroBar(lbl, g, kcal, pct, extra, cls) {
    return '<div class="calc-macro calc-macro--' + cls + '">' +
      '<div class="calc-macro__top"><span class="calc-macro__lbl">' + esc(lbl) + '</span>' +
        '<span class="calc-macro__g">' + esc(g) + ' g</span></div>' +
      '<div class="calc-bar"><span style="width:' + Math.min(100, pct) + '%"></span></div>' +
      '<div class="calc-macro__foot">' + esc(pct) + '% · ' + esc(kcal) + ' kcal' + (extra ? ' · ' + esc(extra) : '') + '</div></div>';
  }
  // −0,5 / +0,5 com vírgula decimal, como a Ana escreve.
  function kgSinal(v) { return (v > 0 ? "+" : "−") + dec(Math.abs(v)); }
  function kcalSinal(v) { return (v > 0 ? "+" : "−") + r0(Math.abs(v)); }
  function metaRow(lbl, val, sub) {
    return '<div class="calc-meta__row"><span class="calc-meta__lbl">' + esc(lbl) + '</span>' +
      '<span class="calc-meta__val">' + esc(val) + '<small>' + esc(sub) + '</small></span></div>';
  }

  function memoriaLinhas(R) {
    var b = R.base, out = [];
    out.push("<strong>" + esc(R.formula.nome) + "</strong> — sexo " + (b.sexo === "M" ? "masc." : "fem.") +
      ", " + dec(b.idade) + " anos, " + dec(b.peso) + " kg, " + dec(b.altura) + " cm" + (b.massaMagra ? ", massa magra " + dec(b.massaMagra) + " kg" : ""));
    if (R.ehGet) {
      out.push("A equação estima o gasto <strong>total</strong>" + (R.formula.usaCAF ? " (CAF " + fat(R.caf) + " embutido)" : "") +
        ": <strong>" + mil(R.bruto) + "</strong> kcal — sem fator de atividade por fora.");
    } else {
      out.push("TMB = <strong>" + mil(R.tmb) + "</strong> kcal");
      out.push("GET = TMB × fator atividade (" + fat(R.fa) + ")" +
        (R.fi !== 1 ? " × injúria (" + fat(R.fi) + ")" : "") + (R.ft !== 1 ? " × térmico (" + fat(R.ft) + ")" : ""));
    }
    var extras = [];
    if (R.met) extras.push("+ " + mil(R.met) + " kcal de atividade extra (METs × peso × horas)");
    if (R.adGest) extras.push("+ " + R.adGest + " kcal de gestação");
    if (R.adLact) extras.push("+ " + R.adLact + " kcal de lactação");
    if (extras.length) out.push(extras.join(" · "));
    out.push("GET = <strong>" + mil(R.get) + "</strong> kcal");
    if (R.meta) {
      var M = R.meta;
      out.push("Meta: " + kgSinal(M.delta) + " kg em " + M.dias + " dias → " + kgSinal(M.delta) + " × " + mil(KCAL_POR_KG) + " = " +
        (M.kcalTotal > 0 ? "+" : "−") + mil(Math.abs(M.kcalTotal)) + " kcal ÷ " + M.dias + " dias = <strong>" + kcalSinal(M.kcalDia) + "</strong> kcal/dia");
      out.push("VET = GET " + (M.kcalDia > 0 ? "+ " : "− ") + mil(Math.abs(M.kcalDia)) + " kcal (meta de peso) = <strong>" + mil(R.vet) + "</strong> kcal");
      out.push("<small>Macros pelo objetivo “" + esc(R.obj.nome) + "”; o percentual dele não entra no VET porque a meta manda.</small>");
    } else {
      out.push("VET = GET " + (R.obj.ajuste === 0 ? "(sem ajuste)" : (R.obj.ajuste > 0 ? "+ " : "− ") + Math.abs(R.obj.ajuste * 100) + "% [" + R.obj.nome + "]") + " = <strong>" + mil(R.vet) + "</strong> kcal");
    }
    return out;
  }

  /* ---------- Painel de referências ----------
     Fica fechado por padrão. A citação de cada fórmula e de cada tabela de
     fator tem de estar à mão: é o que sustenta a conduta no prontuário. */
  function refsHTML() {
    var linhas = FORMULAS.map(function (f) {
      return '<div class="calc-ref"><strong>' + esc(f.nome) + '</strong><span>' + esc(f.refFull) + '</span></div>';
    }).join("");
    linhas += '<div class="calc-ref"><strong>Fatores de atividade, injúria e térmico</strong><span>' + esc(REF_LONG) + '</span></div>';
    linhas += '<div class="calc-ref"><strong>Adicionais de gestação e lactação · CAF</strong><span>' + esc(REF_IOM) + '</span></div>';
    linhas += '<div class="calc-ref"><strong>Meta de peso (7700 kcal/kg)</strong><span>WISHNOFSKY, M. Caloric equivalents of gained or lost weight. American Journal of Clinical Nutrition, v. 6, n. 5, p. 542-546, 1958.</span></div>';
    return '<details class="calc-card calc-refs"><summary class="calc-card__t">📚 Ver referências das fórmulas e fatores</summary>' +
      '<div class="calc-refs__lista">' + linhas + '</div>' +
      '<p class="calc-hint">As equações de predição estimam; quando a decisão clínica exigir precisão, a calorimetria indireta é a referência — e o valor medido pode ser informado direto no grupo “Medido / informado”.</p>' +
    '</details>';
  }

  /* ============================================================
     FIAÇÃO
     ============================================================ */
  function wire(ctx) {
    _ctx = ctx || {};
    var r = document.getElementById("calc-root"); if (!r) return;
    r.addEventListener("input", onChange);
    r.addEventListener("change", onChange);
    r.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-prazo]");
      if (chip) { setPrazo(chip.getAttribute("data-prazo")); return; }
      if (e.target.closest("[data-calc-importar]")) importarAntropometria();
      else if (e.target.closest("[data-calc-salvar]")) salvar(e.target.closest("[data-calc-salvar]"));
      else if (e.target.closest("[data-calc-plano]")) usarNoPlano();
    });
  }
  function onChange(e) {
    var t = e.target;
    if (!t.matches("[data-c]")) return;
    var k = t.getAttribute("data-c");
    // "input" e "change" disparam pelo MESMO valor (o change vem no blur).
    // Repintar de novo aí destrói o botão que a nutri está clicando e o
    // clique se perde no meio do caminho — então só repinta se mudou.
    if (String(_inp[k]) === String(t.value)) return;
    _inp[k] = t.value;
    // Trocar de fórmula (ou de sexo, que muda a tabela de CAF) mexe em quais
    // campos existem no formulário, então o formulário inteiro é redesenhado.
    if (k === "formula" || k === "sexo") repintarTudo(k);
    else repintar();
  }
  // Os chips escrevem no input de prazo (o campo continua editável à mão).
  function setPrazo(dias) {
    _inp.prazoDias = dias;
    var el = document.querySelector('#calc-root [data-c="prazoDias"]');
    if (el) el.value = dias;
    repintar();
  }
  function repintar() {
    var out = document.getElementById("calc-out");
    if (out) out.innerHTML = resultadosHTML();
  }
  function repintarTudo(foco) {
    var form = document.getElementById("calc-form");
    if (form) form.innerHTML = formHTML();
    repintar();
    // Redesenhar o formulário tira o foco do campo que a nutri acabou de
    // usar; devolver o foco evita que ela perca o lugar no teclado.
    if (foco) {
      var el = document.querySelector('#calc-form [data-c="' + foco + '"]');
      if (el) el.focus();
    }
  }
  // Traz de volta os valores do cadastro/antropometria, desfazendo ajustes
  // feitos à mão na tela.
  function importarAntropometria() {
    if (!_base) return;
    ["sexo", "idade", "peso", "altura", "massaMagra"].forEach(function (k) {
      if (_base[k] != null && _base[k] !== "") _inp[k] = _base[k];
    });
    repintarTudo();
    if (_ctx.toast) _ctx.toast("Dados recarregados do cadastro e da antropometria.");
  }

  /* ============================================================
     PERSISTÊNCIA E SAÍDAS
     ============================================================ */
  function coletar() {
    var R = calcular();
    return {
      sexo: _inp.sexo, idade: num(_inp.idade), peso: num(_inp.peso), altura: num(_inp.altura),
      massaMagra: num(_inp.massaMagra) || null, idadeMeses: num(_inp.idadeMeses) || null,
      formula: _inp.formula, formulaNome: R.formula.nome, formulaTipo: R.formula.tipo,
      formulaRef: R.formula.refFull,
      caf: R.formula.usaCAF ? Math.round(num(_inp.caf)) : null, cafValor: R.formula.usaCAF ? R.caf : null,
      fatorAtividade: R.fa, fatorInjuria: R.fi, fatorTermico: R.ft,
      tmbManual: num(_inp.tmbManual) || null, getManual: num(_inp.getManual) || null,
      mets: num(_inp.mets) || null, metHoras: num(_inp.metHoras) || null, metKcal: R.met ? r0(R.met) : null,
      gestacao: Math.round(num(_inp.gestacao)) || null, gestacaoKcal: R.adGest || null, gestacaoNome: R.adGest ? R.gestNome : null,
      lactacao: Math.round(num(_inp.lactacao)) || null, lactacaoKcal: R.adLact || null, lactacaoNome: R.adLact ? R.lactNome : null,
      objetivo: _inp.objetivo, objetivoNome: R.obj.nome,
      ptnGkg: R.ptnGkg, lipPct: R.lipPct,
      pesoMeta: num(_inp.pesoMeta) || null, prazoDias: Math.round(num(_inp.prazoDias)) || null,
      meta: R.meta ? {
        pesoMeta: R.meta.pesoMeta, prazoDias: R.meta.dias, deltaKg: r1(R.meta.delta),
        kgSemana: r1(R.meta.kgSem), kcalDia: r0(R.meta.kcalDia), dataAlvo: R.meta.dataAlvo,
        alertas: R.meta.alertas
      } : null,
      avisos: R.avisos,
      tmb: R.tmb != null ? r0(R.tmb) : null, get: R.get != null ? r0(R.get) : null, vet: R.vet != null ? r0(R.vet) : null,
      macros: R.macros, atualizadoEm: hojeBR()
    };
  }
  function salvar(btn) {
    var calc = coletar();
    if (calc.vet == null) { if (_ctx.toast) _ctx.toast("Preencha os dados para calcular antes de salvar.", true); return; }
    if (!_ctx.save) { if (_ctx.toast) _ctx.toast("Cálculo pronto (salvamento indisponível nesta tela)."); return; }
    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    _ctx.save(calc).then(function () {
      if (_ctx.toast) _ctx.toast("Cálculo salvo no prontuário.");
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "💾 Salvar cálculo"; }
      if (_ctx.toast) _ctx.toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }
  function usarNoPlano() {
    var calc = coletar();
    // VET negativo/zero é meta impossível — não deixa vazar para o plano.
    if (calc.vet == null || calc.vet <= 0) {
      if (_ctx.toast) _ctx.toast("O VET calculado não é válido. Revise a meta de peso ou o prazo.", true);
      return;
    }
    if (_ctx.usarNoPlano) _ctx.usarNoPlano(calc);
    else if (_ctx.toast) _ctx.toast("VET de " + (calc.vet || "—") + " kcal — leve para o plano ao montar as refeições.");
  }

  window.CalcTMB = {
    render: render, wire: wire, calcular: calcular,
    FORMULAS: FORMULAS, ATIVIDADE: ATIVIDADE, INJURIA: INJURIA, TERMICO: TERMICO,
    OBJETIVOS: OBJETIVOS, CAF_NIVEIS: CAF_NIVEIS
  };
})();
