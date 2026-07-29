/* ============================================================
   CÁLCULOS NUTRICIONAIS — TMB, GET e VET.
   Calcula a Taxa Metabólica Basal por várias fórmulas (Harris-Benedict
   original e revisada, Mifflin-St Jeor, OMS/FAO 1985, Cunningham e
   Katch-McArdle), aplica fator de atividade (sedentário → atleta),
   fator injúria/estresse (paciente acamado/clínico) e ajuste por
   objetivo (emagrecer, manter, ganhar peso, hipertrofia), chegando ao
   GET e ao VET com distribuição de macronutrientes.
   Exposto como window.CalcTMB. Usado pelo Prontuário (prontuario.js).
   ============================================================ */
(function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(v) { if (v == null || v === "") return 0; var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; }
  function r0(n) { return Math.round(n); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function dec(n) { return String(r1(n)).replace(".", ","); }        // 12.9 → "12,9"
  function mil(n) { return String(r0(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }  // 46200 → "46.200"
  function hojeBR() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }

  /* ---------- Fórmulas de TMB ----------
     sexo: "M"/"F"; peso kg; altura cm; idade anos; mm = massa magra kg. */
  function faixaOMS(idade) {
    if (idade < 3) return "0-3"; if (idade < 10) return "3-10"; if (idade < 18) return "10-18";
    if (idade < 30) return "18-30"; if (idade < 60) return "30-60"; return "60+";
  }
  var OMS = {
    M: { "0-3": [60.9, -54], "3-10": [22.7, 495], "10-18": [17.5, 651], "18-30": [15.3, 679], "30-60": [11.6, 879], "60+": [13.5, 487] },
    F: { "0-3": [61.0, -51], "3-10": [22.5, 499], "10-18": [12.2, 746], "18-30": [14.7, 496], "30-60": [8.7, 829], "60+": [10.5, 596] }
  };
  var FORMULAS = [
    { id: "hb_rev", nome: "Harris-Benedict revisada (1984)", precisaMM: false, ref: "Roza & Shizgal",
      calc: function (s, p, a, i) { return s === "M" ? 88.362 + 13.397 * p + 4.799 * a - 5.677 * i : 447.593 + 9.247 * p + 3.098 * a - 4.330 * i; } },
    { id: "hb_orig", nome: "Harris-Benedict original (1919)", precisaMM: false, ref: "Harris & Benedict",
      calc: function (s, p, a, i) { return s === "M" ? 66.5 + 13.75 * p + 5.003 * a - 6.755 * i : 655.1 + 9.563 * p + 1.850 * a - 4.676 * i; } },
    { id: "mifflin", nome: "Mifflin-St Jeor (1990)", precisaMM: false, ref: "mais precisa p/ maioria",
      calc: function (s, p, a, i) { return 10 * p + 6.25 * a - 5 * i + (s === "M" ? 5 : -161); } },
    { id: "oms", nome: "OMS / FAO / UNU (1985)", precisaMM: false, ref: "por faixa etária, base peso",
      calc: function (s, p, a, i) { var c = OMS[s][faixaOMS(i)]; return c[0] * p + c[1]; } },
    { id: "cunningham", nome: "Cunningham (1980)", precisaMM: true, ref: "atletas — usa massa magra",
      calc: function (s, p, a, i, mm) { return mm ? 500 + 22 * mm : null; } },
    { id: "katch", nome: "Katch-McArdle", precisaMM: true, ref: "usa massa magra",
      calc: function (s, p, a, i, mm) { return mm ? 370 + 21.6 * mm : null; } }
  ];
  var FORMULA_BY_ID = {}; FORMULAS.forEach(function (f) { FORMULA_BY_ID[f.id] = f; });

  function tmbDe(f, inp) {
    var v = f.calc(inp.sexo, inp.peso, inp.altura, inp.idade, inp.massaMagra);
    return (v == null || !isFinite(v) || v <= 0) ? null : v;
  }

  /* ---------- Fatores de atividade (PAL) ---------- */
  var ATIVIDADE = [
    { v: 1.2, nome: "Acamado / repouso no leito", desc: "paciente acamado, sem deambular" },
    { v: 1.3, nome: "Sedentário", desc: "pouco ou nenhum exercício; trabalho sentado" },
    { v: 1.375, nome: "Levemente ativo", desc: "exercício leve 1–3×/semana" },
    { v: 1.55, nome: "Moderadamente ativo", desc: "exercício moderado 3–5×/semana" },
    { v: 1.725, nome: "Muito ativo", desc: "exercício intenso 6–7×/semana" },
    { v: 1.9, nome: "Extremamente ativo / atleta", desc: "2×/dia ou trabalho físico pesado" }
  ];
  /* ---------- Fatores de injúria / estresse (paciente clínico) ---------- */
  var INJURIA = [
    { v: 1.0, nome: "Nenhum (paciente estável)" },
    { v: 1.1, nome: "Pós-operatório eletivo" },
    { v: 1.2, nome: "Infecção leve / cirurgia de médio porte" },
    { v: 1.3, nome: "Sepse / trauma" },
    { v: 1.4, nome: "Politrauma / infecção grave" },
    { v: 1.5, nome: "Queimadura 30–50% SCQ" },
    { v: 1.7, nome: "Queimadura > 50% SCQ" }
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
  var KCAL_POR_KG = 7700;
  var VET_MINIMO = { F: 1200, M: 1500 };   // piso de segurança usual p/ dieta ambulatorial

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

  /* ============================================================ */
  var _inp = null, _ctx = null;

  // base = { sexo, idade, peso, altura(cm), massaMagra } vindos do paciente;
  // saved = cálculo salvo (para reabrir com as mesmas escolhas).
  function render(base, saved) {
    base = base || {};
    var s = saved || {};
    _inp = {
      sexo: s.sexo || base.sexo || "F",
      idade: s.idade != null ? s.idade : (base.idade || ""),
      peso: s.peso != null ? s.peso : (base.peso || ""),
      altura: s.altura != null ? s.altura : (base.altura || ""),
      massaMagra: s.massaMagra != null ? s.massaMagra : (base.massaMagra || ""),
      formula: s.formula || "hb_rev",
      fatorAtividade: s.fatorAtividade != null ? s.fatorAtividade : 1.375,
      fatorInjuria: s.fatorInjuria != null ? s.fatorInjuria : 1.0,
      objetivo: s.objetivo || (base.objetivoId) || "manter",
      ptnGkg: s.ptnGkg != null ? s.ptnGkg : null,
      lipPct: s.lipPct != null ? s.lipPct : null,
      // Meta de peso: peso desejado + prazo. Vazio = usa só o % do objetivo.
      pesoMeta: s.pesoMeta != null ? s.pesoMeta : (base.pesoMeta || ""),
      prazoDias: s.prazoDias != null ? s.prazoDias : ""
    };
    return '<div id="calc-root" class="calc">' + formHTML() + '<div id="calc-out">' + resultadosHTML() + '</div></div>';
  }

  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (String(sel) === String(v) ? " selected" : "") + '>' + esc(label) + "</option>"; }

  function formHTML() {
    var i = _inp;
    var ativ = ATIVIDADE.map(function (a) { return opt(a.v, a.nome + " (× " + a.v + ")", i.fatorAtividade); }).join("");
    var inj = INJURIA.map(function (a) { return opt(a.v, a.nome + (a.v !== 1 ? " (× " + a.v + ")" : ""), i.fatorInjuria); }).join("");
    var obj = OBJETIVOS.map(function (o) { return opt(o.id, o.nome, i.objetivo); }).join("");
    var forms = FORMULAS.map(function (f) { return opt(f.id, f.nome, i.formula); }).join("");
    return '' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">1 · Dados do paciente</div>' +
        '<div class="calc-grid">' +
          field("Sexo", '<select data-c="sexo">' + opt("F", "Feminino", i.sexo) + opt("M", "Masculino", i.sexo) + '</select>') +
          field("Idade (anos)", inputNum("idade", i.idade)) +
          field("Peso (kg)", inputNum("peso", i.peso)) +
          field("Altura (cm)", inputNum("altura", i.altura)) +
          field("Massa magra (kg)", inputNum("massaMagra", i.massaMagra), "opcional — habilita Cunningham/Katch") +
        '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">2 · Fórmula e fatores</div>' +
        '<div class="calc-grid">' +
          field("Fórmula da TMB", '<select data-c="formula">' + forms + '</select>') +
          field("Fator de atividade", '<select data-c="fatorAtividade">' + ativ + '</select>') +
          field("Fator injúria / estresse", '<select data-c="fatorInjuria">' + inj + '</select>', "para paciente acamado/hospitalar") +
        '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">3 · Objetivo e macros</div>' +
        '<div class="calc-grid">' +
          field("Objetivo", '<select data-c="objetivo">' + obj + '</select>') +
          field("Proteína (g/kg)", inputNum("ptnGkg", i.ptnGkg == null ? "" : i.ptnGkg), "vazio = sugestão do objetivo") +
          field("Gordura (% do VET)", inputNum("lipPct", i.lipPct == null ? "" : i.lipPct), "vazio = sugestão do objetivo") +
        '</div>' +
      '</div>' +
      '<div class="calc-card">' +
        '<div class="calc-card__t">4 · Programar meta de peso <span class="calc-tag">opcional</span></div>' +
        '<div class="calc-grid">' +
          field("Peso desejado (kg)", inputNum("pesoMeta", i.pesoMeta), "onde o paciente quer chegar") +
          field("Prazo (dias)", inputNum("prazoDias", i.prazoDias) + prazoChips(), "em quanto tempo") +
        '</div>' +
        '<p class="calc-hint">Com os dois campos preenchidos, o ajuste calórico sai da meta (7700 kcal por kg) e <strong>substitui</strong> o percentual do objetivo. Deixe em branco para usar só o objetivo.</p>' +
      '</div>';
  }
  function prazoChips() {
    return '<div class="calc-chips">' + [30, 60, 90, 180].map(function (d) {
      return '<button type="button" class="calc-chip" data-prazo="' + d + '">' + d + " dias</button>";
    }).join("") + '</div>';
  }
  function field(lbl, ctrl, hint) {
    return '<label class="calc-field"><span class="calc-field__lbl">' + esc(lbl) + '</span>' + ctrl +
      (hint ? '<span class="calc-field__hint">' + esc(hint) + '</span>' : "") + '</label>';
  }
  function inputNum(key, val, hint) {
    return '<input type="number" step="any" inputmode="decimal" data-c="' + key + '" value="' + esc(val === 0 ? "0" : (val || "")) + '" />';
  }

  /* ---------- Cálculo ---------- */
  // inp opcional: sem ele calcula o que está na tela. Com ele, calcula
  // qualquer entrada sem tocar na UI — é assim que o rascunho de plano
  // (rascunho-plano.js) usa as mesmas fórmulas que a Ana vê aqui, em vez
  // de manter uma segunda cópia que envelhece sozinha.
  function calcular(inp) {
    var i = inp || _inp;
    var base = { sexo: i.sexo, idade: num(i.idade), peso: num(i.peso), altura: num(i.altura), massaMagra: num(i.massaMagra) };
    var f = FORMULA_BY_ID[i.formula] || FORMULAS[0];
    var tmb = tmbDe(f, base);
    var todas = FORMULAS.map(function (ff) { return { id: ff.id, nome: ff.nome, ref: ff.ref, precisaMM: ff.precisaMM, tmb: tmbDe(ff, base) }; });
    var fa = num(i.fatorAtividade) || 1, fi = num(i.fatorInjuria) || 1;
    var get = tmb != null ? tmb * fa * fi : null;
    var obj = OBJ_BY_ID[i.objetivo] || OBJ_BY_ID.manter;
    // A meta de peso, quando programada, manda no VET; o objetivo segue
    // valendo para sugerir os macros.
    var meta = metaDe(i, base, get, tmb);
    var vet = meta ? meta.vet : (get != null ? get * (1 + obj.ajuste) : null);

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
    return { base: base, formula: f, tmb: tmb, todas: todas, fa: fa, fi: fi, get: get, obj: obj, meta: meta, vet: vet, macros: macros, ptnGkg: ptnGkg, lipPct: lipPct };
  }

  function resultadosHTML() {
    var R = calcular();
    if (R.tmb == null) {
      var falta = R.formula.precisaMM ? "Informe a massa magra para usar esta fórmula." : "Preencha peso, altura e idade para calcular.";
      return '<div class="calc-card"><div class="empty-state">' + esc(falta) + '</div></div>';
    }
    var sinal = R.obj.ajuste === 0 ? "" : (R.obj.ajuste > 0 ? "+" : "−") + Math.abs(R.obj.ajuste * 100) + "%";
    var subVet = R.meta
      ? kcalSinal(R.meta.kcalDia) + " kcal/dia · meta de " + kgSinal(R.meta.delta) + " kg em " + R.meta.dias + " dias"
      : R.obj.nome + (sinal ? " · " + sinal : "");
    var big = '<div class="calc-results">' +
      resTile("TMB", r0(R.tmb), "kcal/dia", "metabolismo basal") +
      resTile("GET", r0(R.get), "kcal/dia", "× ativ. " + R.fa + (R.fi !== 1 ? " × injúria " + R.fi : "")) +
      resTile("VET", r0(R.vet), "kcal/dia", subVet, true) +
    '</div>';

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
        var val = t.tmb == null ? (t.precisaMM ? "precisa massa magra" : "—") : r0(t.tmb) + " kcal";
        return '<div class="calc-comp__row' + (ativa ? " is-active" : "") + '"><span class="calc-comp__nome">' + esc(t.nome) +
          '<small>' + esc(t.ref) + '</small></span><span class="calc-comp__val">' + val + '</span></div>';
      }).join("") + '</div></div>';

    var memoria = '<div class="calc-card"><div class="calc-card__t">Memória de cálculo</div>' +
      '<div class="calc-mem">' + memoriaLinhas(R).map(function (l) { return '<div>' + l + '</div>'; }).join("") + '</div></div>';

    var acoes = '<div class="calc-actions">' +
      '<button class="btn btn--outline btn--sm" type="button" data-calc-plano>➕ Usar VET no plano alimentar</button>' +
      '<button class="btn btn--primary" type="button" data-calc-salvar>💾 Salvar cálculo</button>' +
    '</div>';

    return big + meta + macros + comp + memoria + acoes;
  }

  // −0,5 / +0,5 com vírgula decimal, como a Ana escreve.
  function kgSinal(v) { return (v > 0 ? "+" : "−") + String(r1(Math.abs(v))).replace(".", ","); }
  function kcalSinal(v) { return (v > 0 ? "+" : "−") + r0(Math.abs(v)); }
  function metaRow(lbl, val, sub) {
    return '<div class="calc-meta__row"><span class="calc-meta__lbl">' + esc(lbl) + '</span>' +
      '<span class="calc-meta__val">' + esc(val) + '<small>' + esc(sub) + '</small></span></div>';
  }

  function resTile(t, v, u, sub, destaque) {
    return '<div class="calc-tile' + (destaque ? " calc-tile--vet" : "") + '"><div class="calc-tile__lbl">' + esc(t) + '</div>' +
      '<div class="calc-tile__val">' + esc(v) + '<small>' + esc(u) + '</small></div>' +
      '<div class="calc-tile__sub">' + esc(sub) + '</div></div>';
  }
  function macroBar(lbl, g, kcal, pct, extra, cls) {
    return '<div class="calc-macro calc-macro--' + cls + '">' +
      '<div class="calc-macro__top"><span class="calc-macro__lbl">' + esc(lbl) + '</span>' +
        '<span class="calc-macro__g">' + esc(g) + ' g</span></div>' +
      '<div class="calc-bar"><span style="width:' + Math.min(100, pct) + '%"></span></div>' +
      '<div class="calc-macro__foot">' + esc(pct) + '% · ' + esc(kcal) + ' kcal' + (extra ? ' · ' + esc(extra) : '') + '</div></div>';
  }
  function memoriaLinhas(R) {
    var b = R.base, out = [];
    out.push("<strong>" + esc(R.formula.nome) + "</strong> — sexo " + (b.sexo === "M" ? "masc." : "fem.") +
      ", " + b.idade + " anos, " + r1(b.peso) + " kg, " + r1(b.altura) + " cm" + (b.massaMagra ? ", massa magra " + r1(b.massaMagra) + " kg" : ""));
    out.push("TMB = <strong>" + r0(R.tmb) + "</strong> kcal");
    out.push("GET = TMB × fator atividade (" + R.fa + ")" + (R.fi !== 1 ? " × fator injúria (" + R.fi + ")" : "") + " = <strong>" + r0(R.get) + "</strong> kcal");
    if (R.meta) {
      var M = R.meta;
      out.push("Meta: " + kgSinal(M.delta) + " kg em " + M.dias + " dias → " + kgSinal(M.delta) + " × " + mil(KCAL_POR_KG) + " = " +
        (M.kcalTotal > 0 ? "+" : "−") + mil(Math.abs(M.kcalTotal)) + " kcal ÷ " + M.dias + " dias = <strong>" + kcalSinal(M.kcalDia) + "</strong> kcal/dia");
      out.push("VET = GET " + (M.kcalDia > 0 ? "+ " : "− ") + r0(Math.abs(M.kcalDia)) + " kcal (meta de peso) = <strong>" + r0(R.vet) + "</strong> kcal");
      out.push("<small>Macros pelo objetivo “" + esc(R.obj.nome) + "”; o percentual dele não entra no VET porque a meta manda.</small>");
    } else {
      out.push("VET = GET " + (R.obj.ajuste === 0 ? "(sem ajuste)" : (R.obj.ajuste > 0 ? "+ " : "− ") + Math.abs(R.obj.ajuste * 100) + "% [" + R.obj.nome + "]") + " = <strong>" + r0(R.vet) + "</strong> kcal");
    }
    return out;
  }

  /* ---------- Wire ---------- */
  function wire(ctx) {
    _ctx = ctx || {};
    var r = document.getElementById("calc-root"); if (!r) return;
    r.addEventListener("input", onChange);
    r.addEventListener("change", onChange);
    r.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-prazo]");
      if (chip) { setPrazo(chip.getAttribute("data-prazo")); return; }
      if (e.target.closest("[data-calc-salvar]")) salvar(e.target.closest("[data-calc-salvar]"));
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
    repintar();
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

  function coletar() {
    var R = calcular();
    return {
      sexo: _inp.sexo, idade: num(_inp.idade), peso: num(_inp.peso), altura: num(_inp.altura),
      massaMagra: num(_inp.massaMagra) || null,
      formula: _inp.formula, formulaNome: R.formula.nome,
      fatorAtividade: R.fa, fatorInjuria: R.fi, objetivo: _inp.objetivo, objetivoNome: R.obj.nome,
      ptnGkg: R.ptnGkg, lipPct: R.lipPct,
      pesoMeta: num(_inp.pesoMeta) || null, prazoDias: Math.round(num(_inp.prazoDias)) || null,
      meta: R.meta ? {
        pesoMeta: R.meta.pesoMeta, prazoDias: R.meta.dias, deltaKg: r1(R.meta.delta),
        kgSemana: r1(R.meta.kgSem), kcalDia: r0(R.meta.kcalDia), dataAlvo: R.meta.dataAlvo,
        alertas: R.meta.alertas
      } : null,
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
    FORMULAS: FORMULAS, ATIVIDADE: ATIVIDADE, OBJETIVOS: OBJETIVOS
  };
})();
