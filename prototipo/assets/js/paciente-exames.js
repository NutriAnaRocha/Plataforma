/* ============================================================
   PACIENTE — EXAMES: solicitação, registro e interpretação por IA.
   Três frentes numa tela só, dentro da ficha do paciente:
     1) Solicitar   — checklist por painel → gera PDF "Solicitação de
                      Exames" com a identidade da nutri (motor NutriDoc).
     2) Registrar   — digita os resultados; o sistema marca se está
                      dentro da referência (por sexo) e explica o que
                      aquele marcador significa (base de conhecimento).
     3) IA          — foto/PDF do exame → Edge Function (OpenAI visão)
                      devolve uma leitura em linguagem clara.
   Guarda tudo em pacientes.exames (jsonb, array de itens).
   Exposto como window.Exames; usado pela ficha (pacientes.js).
   (Não confundir com exames.js, que é a página exames.html.)
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) {
    if (v == null || v === "") return null;
    var n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }
  function uid() { return "ex" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function hojeISO() { return new Date().toISOString().slice(0, 10); }
  function fmtData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || "—");
  }

  /* ============================================================
     BASE DE CONHECIMENTO DOS MARCADORES
     ref: faixa de referência adulta usual. Pode ser um objeto único
     { min, max } ou variar por sexo { F:{min,max}, M:{min,max} }.
     Valores de referência variam entre laboratórios/métodos — servem
     de apoio à decisão, não substituem o laudo nem o julgamento clínico.
     alto/baixo: o que o resultado pode sugerir (foco nutricional).
     ============================================================ */
  var MARC = [
    /* ---- Glicêmico ---- */
    { key: "glicose",  cat: "Glicêmico", lbl: "Glicose em jejum", un: "mg/dL", ref: { min: 70, max: 99 },
      alto: "Acima de 99 sugere pré-diabetes (100–125) ou diabetes (≥126). Reforça controle de carboidratos simples e perda de peso.",
      baixo: "Hipoglicemia. Avaliar jejum prolongado, medicação ou padrão alimentar." },
    { key: "hba1c",    cat: "Glicêmico", lbl: "Hemoglobina glicada (HbA1c)", un: "%", ref: { min: 4, max: 5.6 },
      alto: "5,7–6,4% = pré-diabetes; ≥6,5% = diabetes. Reflete a glicemia média dos últimos ~3 meses.",
      baixo: "Incomum; avaliar anemia ou hipoglicemias frequentes." },
    { key: "insulina", cat: "Glicêmico", lbl: "Insulina de jejum", un: "µUI/mL", ref: { min: 2, max: 25 },
      alto: "Sugere resistência à insulina, comum no excesso de peso e SOP. Base para calcular o HOMA-IR.",
      baixo: "Geralmente sem relevância clínica isolada." },
    { key: "homa",     cat: "Glicêmico", lbl: "HOMA-IR", un: "", ref: { min: 0, max: 2.7 },
      alto: "Acima de ~2,7 indica resistência à insulina. Trabalhar composição corporal e qualidade dos carboidratos.",
      baixo: "Boa sensibilidade à insulina." },

    /* ---- Lipídico ---- */
    { key: "colesterol", cat: "Lipídico", lbl: "Colesterol total", un: "mg/dL", ref: { min: 0, max: 190 },
      alto: "Desejável < 190. Avaliar perfil completo (LDL/HDL) e risco cardiovascular.",
      baixo: "Raramente problema; muito baixo pode acompanhar desnutrição." },
    { key: "hdl", cat: "Lipídico", lbl: "HDL (colesterol bom)", un: "mg/dL", ref: { F: { min: 50, max: 999 }, M: { min: 40, max: 999 } },
      alto: "HDL alto é protetor cardiovascular.",
      baixo: "HDL baixo aumenta risco cardiovascular. Atividade física e gorduras boas ajudam a elevar." },
    { key: "ldl", cat: "Lipídico", lbl: "LDL (colesterol ruim)", un: "mg/dL", ref: { min: 0, max: 130 },
      alto: "Meta varia com o risco (< 130, ou < 100/70 em maior risco). Reduzir gordura saturada e trans.",
      baixo: "Em geral favorável." },
    { key: "triglic", cat: "Lipídico", lbl: "Triglicerídeos", un: "mg/dL", ref: { min: 0, max: 150 },
      alto: "Ligado a açúcar, álcool e excesso calórico. Muito sensível à dieta.",
      baixo: "Sem relevância clínica isolada." },

    /* ---- Hepático ---- */
    { key: "tgo", cat: "Hepático", lbl: "TGO / AST", un: "U/L", ref: { min: 0, max: 34 },
      alto: "Pode indicar sofrimento hepático (esteatose, álcool) ou muscular.",
      baixo: "Sem relevância." },
    { key: "tgp", cat: "Hepático", lbl: "TGP / ALT", un: "U/L", ref: { min: 0, max: 49 },
      alto: "Mais específico do fígado — comum na gordura no fígado (esteatose). Melhora com perda de peso.",
      baixo: "Sem relevância." },
    { key: "ggt", cat: "Hepático", lbl: "Gama GT (GGT)", un: "U/L", ref: { F: { min: 0, max: 38 }, M: { min: 0, max: 55 } },
      alto: "Sensível a álcool e esteatose hepática.",
      baixo: "Sem relevância." },

    /* ---- Renal ---- */
    { key: "ureia", cat: "Renal", lbl: "Ureia", un: "mg/dL", ref: { min: 15, max: 45 },
      alto: "Pode refletir função renal, desidratação ou dieta muito rica em proteína.",
      baixo: "Dieta pobre em proteína ou hidratação elevada." },
    { key: "creatinina", cat: "Renal", lbl: "Creatinina", un: "mg/dL", ref: { F: { min: 0.5, max: 0.9 }, M: { min: 0.7, max: 1.2 } },
      alto: "Avaliar função renal (calcular TFG). Considerar massa muscular e hidratação.",
      baixo: "Comum em baixa massa muscular." },
    { key: "acido_urico", cat: "Renal", lbl: "Ácido úrico", un: "mg/dL", ref: { F: { min: 2.4, max: 6 }, M: { min: 3.4, max: 7 } },
      alto: "Risco de gota. Reduzir purinas, álcool e frutose; hidratar bem.",
      baixo: "Sem relevância clínica isolada." },

    /* ---- Tireoide ---- */
    { key: "tsh", cat: "Tireoide", lbl: "TSH", un: "µUI/mL", ref: { min: 0.4, max: 4 },
      alto: "Sugere hipotireoidismo (tireoide lenta) — pode dificultar a perda de peso. Encaminhar/avaliar.",
      baixo: "Sugere hipertireoidismo. Avaliar com T4 livre." },
    { key: "t4l", cat: "Tireoide", lbl: "T4 livre", un: "ng/dL", ref: { min: 0.7, max: 1.8 },
      alto: "Compatível com hipertireoidismo.",
      baixo: "Compatível com hipotireoidismo." },

    /* ---- Hemograma / ferro ---- */
    { key: "hemoglobina", cat: "Hemograma", lbl: "Hemoglobina", un: "g/dL", ref: { F: { min: 12, max: 16 }, M: { min: 13, max: 17 } },
      alto: "Avaliar desidratação ou outras causas.",
      baixo: "Anemia. Investigar ferro, B12 e folato; ajustar a dieta." },
    { key: "ferritina", cat: "Hemograma", lbl: "Ferritina (estoque de ferro)", un: "ng/mL", ref: { F: { min: 15, max: 150 }, M: { min: 30, max: 300 } },
      alto: "Pode subir em inflamação, esteatose ou sobrecarga de ferro.",
      baixo: "Estoque de ferro baixo — primeiro sinal de deficiência, mesmo sem anemia ainda." },

    /* ---- Vitaminas / minerais ---- */
    { key: "vitd", cat: "Vitaminas", lbl: "Vitamina D (25-OH)", un: "ng/mL", ref: { min: 30, max: 100 },
      alto: "Acima de 100 pode indicar excesso de suplementação.",
      baixo: "Insuficiência (<30) / deficiência (<20). Muito comum; avaliar sol e suplementação." },
    { key: "b12", cat: "Vitaminas", lbl: "Vitamina B12", un: "pg/mL", ref: { min: 200, max: 900 },
      alto: "Geralmente por suplementação.",
      baixo: "Deficiência — comum em vegetarianos/veganos e uso de metformina/omeprazol. Risco de anemia e neuro." },
    { key: "folato", cat: "Vitaminas", lbl: "Ácido fólico (folato)", un: "ng/mL", ref: { min: 3, max: 20 },
      alto: "Sem relevância clínica isolada.",
      baixo: "Deficiência de folato — importante na gestação e na formação do sangue." },
    { key: "calcio", cat: "Minerais", lbl: "Cálcio total", un: "mg/dL", ref: { min: 8.5, max: 10.5 },
      alto: "Investigar paratireoide/vitamina D.",
      baixo: "Avaliar ingestão de cálcio, vitamina D e albumina." },
    { key: "magnesio", cat: "Minerais", lbl: "Magnésio", un: "mg/dL", ref: { min: 1.6, max: 2.6 },
      alto: "Raro; avaliar função renal.",
      baixo: "Comum; associado a cãibras, fadiga e resistência à insulina." },

    /* ---- Inflamação / proteínas ---- */
    { key: "pcr", cat: "Inflamação", lbl: "Proteína C reativa (PCR)", un: "mg/L", ref: { min: 0, max: 3 },
      alto: "Inflamação. PCR-us alta associa-se a risco cardiovascular e adiposidade.",
      baixo: "Sem inflamação detectável." },
    { key: "albumina", cat: "Inflamação", lbl: "Albumina", un: "g/dL", ref: { min: 3.5, max: 5.2 },
      alto: "Geralmente desidratação.",
      baixo: "Pode indicar desnutrição proteica ou inflamação crônica." }
  ];

  var MARC_BY_KEY = {};
  MARC.forEach(function (m) { MARC_BY_KEY[m.key] = m; });

  // Ordem das categorias (também usada como painéis na solicitação).
  var CATS = [];
  MARC.forEach(function (m) { if (CATS.indexOf(m.cat) < 0) CATS.push(m.cat); });

  // Faixa de referência efetiva para o sexo do paciente.
  function refPara(m, sexo) {
    var r = m.ref || {};
    if (r.min != null || r.max != null) return r;
    var s = (sexo === "M") ? "M" : "F";
    return r[s] || r.F || r.M || {};
  }
  function refTexto(m, sexo) {
    var r = refPara(m, sexo);
    if (r.min != null && r.max != null && r.max < 900) return r.min + "–" + r.max;
    if (r.max != null && r.max < 900) return "≤ " + r.max;
    if (r.min != null) return "≥ " + r.min;
    return "—";
  }
  // Classifica um valor: "baixo" | "normal" | "alto" | null.
  function classificar(m, valor, sexo) {
    var v = num(valor); if (v == null) return null;
    var r = refPara(m, sexo);
    if (r.min != null && v < r.min) return "baixo";
    if (r.max != null && v > r.max) return "alto";
    return "normal";
  }
  var STAT_LBL = { baixo: "Baixo", normal: "Normal", alto: "Alto" };

  /* ============================================================
     RENDER
     ============================================================ */
  function render(p) {
    var exames = (p.exames || []).slice().reverse(); // mais recentes primeiro
    return '' +
      '<section class="fsec exsec">' +
        '<div class="extabs" role="tablist">' +
          '<button class="extab is-active" type="button" data-extab="solicitar">📝 Solicitar</button>' +
          '<button class="extab" type="button" data-extab="registrar">🧾 Registrar resultados</button>' +
          '<button class="extab" type="button" data-extab="ia">🤖 Interpretar com IA</button>' +
        '</div>' +
        '<div class="expane" data-expane="solicitar">' + paneSolicitar(p) + '</div>' +
        '<div class="expane is-hidden" data-expane="registrar">' + paneRegistrar(p) + '</div>' +
        '<div class="expane is-hidden" data-expane="ia">' + paneIA(p) + '</div>' +
      '</section>' +
      '<section class="fsec">' +
        '<h2 class="fsec__title">Histórico de exames</h2>' +
        histHTML(exames) +
      '</section>';
  }

  /* ---------- Painel 1: Solicitar ---------- */
  function paneSolicitar(p) {
    var grupos = CATS.map(function (cat) {
      var itens = MARC.filter(function (m) { return m.cat === cat; }).map(function (m) {
        return '<label class="exchk"><input type="checkbox" data-sol="' + esc(m.key) + '" /> <span>' + esc(m.lbl) + '</span></label>';
      }).join("");
      return '<div class="exgrp">' +
        '<div class="exgrp__head"><label class="exchk exchk--all"><input type="checkbox" data-sol-cat="' + esc(cat) + '" /> <strong>' + esc(cat) + '</strong></label></div>' +
        '<div class="exgrp__itens">' + itens + '</div>' +
      '</div>';
    }).join("");
    return '' +
      '<p class="exhint">Marque os exames que deseja solicitar. Gera um PDF com a sua identidade para enviar ao paciente.</p>' +
      '<div class="exgrid">' + grupos + '</div>' +
      '<div class="exobs">' +
        '<label for="ex-sol-obs">Observações para o laboratório / paciente (opcional)</label>' +
        '<textarea id="ex-sol-obs" rows="2" placeholder="Ex.: comparecer em jejum de 12h, trazer exames anteriores…"></textarea>' +
      '</div>' +
      '<div class="exactions">' +
        '<span class="exsel-count" id="ex-sol-count">0 selecionados</span>' +
        '<button class="btn btn--outline btn--sm" type="button" id="ex-sol-clear">Limpar</button>' +
        '<button class="btn btn--primary btn--sm" type="button" id="ex-sol-pdf">🖨️ Gerar solicitação (PDF)</button>' +
      '</div>';
  }

  /* ---------- Painel 2: Registrar ---------- */
  function paneRegistrar(p) {
    var sexo = p.sexo;
    var linhas = CATS.map(function (cat) {
      var itens = MARC.filter(function (m) { return m.cat === cat; }).map(function (m) {
        return '<div class="exrow" data-key="' + esc(m.key) + '">' +
          '<div class="exrow__lbl">' + esc(m.lbl) + '</div>' +
          '<div class="exrow__in">' +
            '<input type="text" inputmode="decimal" data-val="' + esc(m.key) + '" placeholder="—" />' +
            '<span class="exrow__un">' + esc(m.un || "") + '</span>' +
          '</div>' +
          '<div class="exrow__ref">ref: ' + esc(refTexto(m, sexo)) + '</div>' +
          '<div class="exrow__stat" data-stat="' + esc(m.key) + '"></div>' +
        '</div>' +
        '<div class="exrow__meaning" data-meaning="' + esc(m.key) + '"></div>';
      }).join("");
      return '<div class="exregcat"><h3 class="exregcat__tit">' + esc(cat) + '</h3>' + itens + '</div>';
    }).join("");
    return '' +
      '<div class="exreg-top">' +
        '<label>Data do exame <input type="date" id="ex-reg-data" value="' + hojeISO() + '" /></label>' +
        '<label>Laboratório (opcional) <input type="text" id="ex-reg-lab" placeholder="Nome do laboratório" /></label>' +
      '</div>' +
      '<p class="exhint">Digite apenas os que tiver. A cor mostra se está dentro da referência (por sexo) e o texto explica o significado.</p>' +
      '<div class="exreg">' + linhas + '</div>' +
      '<p class="exdisc">⚠️ Valores de referência variam por laboratório e método — use como apoio, sempre confira o laudo.</p>' +
      '<div class="exactions">' +
        '<button class="btn btn--primary btn--sm" type="button" id="ex-reg-save">💾 Salvar resultados</button>' +
      '</div>';
  }

  /* ---------- Painel 3: IA ---------- */
  function paneIA(p) {
    return '' +
      '<p class="exhint">Tire uma foto ou envie o PDF/imagem do exame. A IA lê e resume os principais achados em linguagem clara. ' +
      '<strong>Revise sempre</strong> — é um apoio, não um laudo.</p>' +
      '<div class="exia-drop" id="ex-ia-drop">' +
        '<input type="file" id="ex-ia-file" accept="image/*,.pdf" capture="environment" multiple hidden />' +
        '<span class="exia-drop__ico">📷</span>' +
        '<p>Toque para <strong>tirar foto</strong> ou escolher o arquivo do exame.</p>' +
        '<button class="btn btn--outline btn--sm" type="button" id="ex-ia-pick">Escolher exame</button>' +
      '</div>' +
      '<div class="exia-thumbs" id="ex-ia-thumbs"></div>' +
      '<div class="exactions">' +
        '<button class="btn btn--primary btn--sm" type="button" id="ex-ia-run" disabled>🤖 Interpretar exame</button>' +
      '</div>' +
      '<div class="exia-result is-hidden" id="ex-ia-result"></div>';
  }

  /* ---------- Histórico ---------- */
  function histHTML(exames) {
    if (!exames.length) return '<div class="empty-state">Nenhum exame registrado ainda. Use as abas acima para solicitar, registrar ou interpretar.</div>';
    return '<div class="exhist">' + exames.map(function (x) {
      var ico = x.tipo === "solicitacao" ? "📝" : x.tipo === "ia" ? "🤖" : "🧾";
      var det = "";
      if (x.tipo === "resultado" && x.avaliacoes) {
        var fora = x.avaliacoes.filter(function (a) { return a.stat === "alto" || a.stat === "baixo"; });
        det = fora.length ? '<span class="exhist__flag">' + fora.length + ' fora da referência</span>'
                          : '<span class="exhist__ok">tudo dentro da referência</span>';
      } else if (x.tipo === "solicitacao") {
        det = '<span class="exhist__meta">' + (x.itens ? x.itens.length : 0) + ' exames</span>';
      }
      return '<button class="exhist__item" type="button" data-exabrir="' + esc(x.id) + '">' +
        '<span class="exhist__ico">' + ico + '</span>' +
        '<span class="exhist__info"><span class="exhist__tit">' + esc(x.titulo || "Exame") + '</span>' +
        '<span class="exhist__date">' + esc(fmtData(x.data)) + '</span></span>' + det +
      '</button>';
    }).join("") + '</div>';
  }

  /* ============================================================
     WIRE — liga os eventos da seção.
     ctx: { toast, perfil, onSaved }
     ============================================================ */
  function wire(p, ctx) {
    ctx = ctx || {};
    var root = document.getElementById("ficha-main");
    if (!root) return;
    var toast = ctx.toast || function () {};

    // --- Trocar de aba ---
    root.querySelectorAll("[data-extab]").forEach(function (b) {
      b.addEventListener("click", function () {
        var alvo = b.getAttribute("data-extab");
        root.querySelectorAll("[data-extab]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        root.querySelectorAll("[data-expane]").forEach(function (pane) {
          pane.classList.toggle("is-hidden", pane.getAttribute("data-expane") !== alvo);
        });
      });
    });

    wireSolicitar(p, ctx, root, toast);
    wireRegistrar(p, ctx, root, toast);
    wireIA(p, ctx, root, toast);
    wireHistorico(p, ctx, root);
  }

  /* ---------- Solicitar ---------- */
  function wireSolicitar(p, ctx, root, toast) {
    var count = root.querySelector("#ex-sol-count");
    function selecionados() {
      return Array.prototype.slice.call(root.querySelectorAll('[data-sol]:checked')).map(function (i) {
        return i.getAttribute("data-sol");
      });
    }
    function atualiza() {
      var n = selecionados().length;
      if (count) count.textContent = n + (n === 1 ? " selecionado" : " selecionados");
    }
    root.querySelectorAll("[data-sol]").forEach(function (i) { i.addEventListener("change", atualiza); });
    // Marcar categoria inteira
    root.querySelectorAll("[data-sol-cat]").forEach(function (chk) {
      chk.addEventListener("change", function () {
        var cat = chk.getAttribute("data-sol-cat");
        MARC.filter(function (m) { return m.cat === cat; }).forEach(function (m) {
          var box = root.querySelector('[data-sol="' + m.key + '"]');
          if (box) box.checked = chk.checked;
        });
        atualiza();
      });
    });
    var clear = root.querySelector("#ex-sol-clear");
    if (clear) clear.addEventListener("click", function () {
      root.querySelectorAll('[data-sol]:checked, [data-sol-cat]:checked').forEach(function (i) { i.checked = false; });
      atualiza();
    });

    var pdf = root.querySelector("#ex-sol-pdf");
    if (pdf) pdf.addEventListener("click", function () {
      var keys = selecionados();
      if (!keys.length) { toast("Selecione ao menos um exame.", true); return; }
      var obs = (root.querySelector("#ex-sol-obs") || {}).value || "";
      gerarPDFSolicitacao(p, ctx, keys, obs);
      // registra no histórico
      var labels = keys.map(function (k) { return MARC_BY_KEY[k] ? MARC_BY_KEY[k].lbl : k; });
      var item = { id: uid(), tipo: "solicitacao", titulo: "Solicitação de exames", data: hojeISO(),
        status: "solicitado", itens: labels, obs: obs };
      salvarExame(p, ctx, item, "Solicitação gerada");
    });
  }

  function gerarPDFSolicitacao(p, ctx, keys, obs) {
    if (!window.NutriDoc) { (ctx.toast || alert)("Motor de documento indisponível."); return; }
    var porCat = {};
    keys.forEach(function (k) {
      var m = MARC_BY_KEY[k]; if (!m) return;
      (porCat[m.cat] = porCat[m.cat] || []).push(m.lbl);
    });
    var body = Object.keys(porCat).map(function (cat) {
      var lis = porCat[cat].map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("");
      return '<h3>' + esc(cat) + '</h3><ul>' + lis + '</ul>';
    }).join("");
    if (obs && obs.trim()) body += '<div class="doc-note">📌 ' + esc(obs.trim()) + '</div>';
    body += '<div class="doc-note">Paciente deve comparecer conforme orientação do laboratório. ' +
      'Em caso de dúvidas, entrar em contato pelo canal do cabeçalho.</div>';
    window.NutriDoc.imprimir(ctx.perfil || {}, {
      tipo: "Solicitação de Exames",
      paciente: p.nome,
      data: fmtData(hojeISO()),
      bodyHTML: body
    });
  }

  /* ---------- Registrar ---------- */
  function wireRegistrar(p, ctx, root, toast) {
    var sexo = p.sexo;
    function avaliaCampo(key) {
      var inp = root.querySelector('[data-val="' + key + '"]');
      var statBox = root.querySelector('[data-stat="' + key + '"]');
      var meanBox = root.querySelector('[data-meaning="' + key + '"]');
      if (!inp || !statBox) return;
      var m = MARC_BY_KEY[key];
      var stat = classificar(m, inp.value, sexo);
      statBox.className = "exrow__stat" + (stat ? " is-" + stat : "");
      statBox.textContent = stat ? STAT_LBL[stat] : "";
      if (meanBox) {
        var txt = "";
        if (stat === "alto") txt = m.alto;
        else if (stat === "baixo") txt = m.baixo;
        meanBox.className = "exrow__meaning" + (txt ? " is-open is-" + stat : "");
        meanBox.textContent = txt || "";
      }
    }
    root.querySelectorAll("[data-val]").forEach(function (inp) {
      inp.addEventListener("input", function () { avaliaCampo(inp.getAttribute("data-val")); });
    });

    var save = root.querySelector("#ex-reg-save");
    if (save) save.addEventListener("click", function () {
      var data = (root.querySelector("#ex-reg-data") || {}).value || hojeISO();
      var lab = (root.querySelector("#ex-reg-lab") || {}).value || "";
      var valores = {}, avaliacoes = [];
      MARC.forEach(function (m) {
        var inp = root.querySelector('[data-val="' + m.key + '"]');
        var v = inp ? num(inp.value) : null;
        if (v == null) return;
        valores[m.key] = v;
        avaliacoes.push({ key: m.key, valor: v, stat: classificar(m, v, sexo) });
      });
      if (!avaliacoes.length) { toast("Digite ao menos um resultado.", true); return; }
      var item = { id: uid(), tipo: "resultado", titulo: "Resultados de exames" + (lab ? " — " + lab : ""),
        data: data, status: "registrado", lab: lab, sexo: sexo, valores: valores, avaliacoes: avaliacoes };
      salvarExame(p, ctx, item, "Resultados salvos", save);
    });
  }

  /* ---------- IA ---------- */
  function wireIA(p, ctx, root, toast) {
    var drop = root.querySelector("#ex-ia-drop");
    var file = root.querySelector("#ex-ia-file");
    var pick = root.querySelector("#ex-ia-pick");
    var thumbs = root.querySelector("#ex-ia-thumbs");
    var run = root.querySelector("#ex-ia-run");
    var result = root.querySelector("#ex-ia-result");
    if (!file || !run) return;
    var arquivos = []; // { name, dataUrl, mime }

    function pintarThumbs() {
      thumbs.innerHTML = arquivos.map(function (a, i) {
        var vis = /^image\//.test(a.mime)
          ? '<img src="' + a.dataUrl + '" alt="" />'
          : '<span class="exia-thumb__pdf">PDF</span>';
        return '<div class="exia-thumb">' + vis +
          '<button class="exia-thumb__x" type="button" data-rm="' + i + '" aria-label="Remover">×</button></div>';
      }).join("");
      run.disabled = arquivos.length === 0;
    }
    function addFiles(list) {
      var arr = Array.prototype.slice.call(list || []);
      if (!arr.length) return;
      arr.forEach(function (f) {
        if (f.size > 8 * 1024 * 1024) { toast("Arquivo muito grande (máx 8MB): " + f.name, true); return; }
        var r = new FileReader();
        r.onload = function () { arquivos.push({ name: f.name, dataUrl: r.result, mime: f.type || "image/jpeg" }); pintarThumbs(); };
        r.readAsDataURL(f);
      });
    }
    if (pick) pick.addEventListener("click", function () { file.click(); });
    if (drop) drop.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      file.click();
    });
    file.addEventListener("change", function () { addFiles(file.files); file.value = ""; });
    thumbs.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]");
      if (rm) { arquivos.splice(+rm.getAttribute("data-rm"), 1); pintarThumbs(); }
    });

    run.addEventListener("click", function () {
      if (!arquivos.length) return;
      if (!window.NutriDBReady) { toast("Banco indisponível.", true); return; }
      run.disabled = true; run.textContent = "🤖 Interpretando…";
      result.classList.remove("is-hidden");
      result.innerHTML = '<div class="exia-loading">Lendo o exame e resumindo os achados… isso leva alguns segundos.</div>';

      window.NutriDBReady.then(function (c) {
        return c.functions.invoke("interpretar-exame", {
          body: {
            paciente: { nome: p.nome, sexo: p.sexo, idade: p.idade },
            imagens: arquivos.map(function (a) { return a.dataUrl; })
          }
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        var d = res.data || {};
        if (d.error) throw new Error(d.error);
        var texto = d.interpretacao || d.texto || "";
        result.innerHTML = '<div class="exia-out">' +
          '<div class="exia-out__badge">🤖 Leitura da IA — revise sempre</div>' +
          '<div class="exia-out__body">' + formatarTexto(texto) + '</div>' +
          '<div class="exactions">' +
            '<button class="btn btn--primary btn--sm" type="button" id="ex-ia-save">💾 Salvar no histórico</button>' +
          '</div></div>';
        var sv = result.querySelector("#ex-ia-save");
        if (sv) sv.addEventListener("click", function () {
          var item = { id: uid(), tipo: "ia", titulo: "Interpretação por IA", data: hojeISO(),
            status: "analisado", texto: texto };
          salvarExame(p, ctx, item, "Interpretação salva", sv);
        });
      }).catch(function (e) {
        result.innerHTML = '<div class="exia-erro">Não foi possível interpretar agora. ' +
          esc(e && e.message ? e.message : "Verifique a conexão e a configuração da IA.") + '</div>';
      }).then(function () {
        run.disabled = false; run.textContent = "🤖 Interpretar exame";
      });
    });
  }

  // Converte texto simples (quebras/linhas com •) em HTML leve.
  function formatarTexto(t) {
    var linhas = String(t || "").split(/\n+/).filter(function (l) { return l.trim(); });
    return linhas.map(function (l) {
      l = esc(l.trim());
      if (/^[-•*]\s*/.test(l)) return '<li>' + l.replace(/^[-•*]\s*/, "") + '</li>';
      if (/[:：]\s*$/.test(l)) return '<h4>' + l + '</h4>';
      return '<p>' + l + '</p>';
    }).join("").replace(/(<li>[\s\S]*?<\/li>)+/g, function (m) { return '<ul>' + m + '</ul>'; });
  }

  /* ---------- Histórico (abrir item) ---------- */
  function wireHistorico(p, ctx, root) {
    root.querySelectorAll("[data-exabrir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-exabrir");
        var x = (p.exames || []).filter(function (e) { return e.id === id; })[0];
        if (x) abrirDetalhe(x, p.sexo);
      });
    });
  }

  function abrirDetalhe(x, sexo) {
    var corpo = "";
    if (x.tipo === "resultado") {
      corpo = '<div class="exdet-tabwrap"><table class="exdet-tab"><thead><tr><th>Marcador</th><th>Valor</th><th>Referência</th><th>Situação</th></tr></thead><tbody>' +
        (x.avaliacoes || []).map(function (a) {
          var m = MARC_BY_KEY[a.key]; if (!m) return "";
          return '<tr><td>' + esc(m.lbl) + '</td><td>' + esc(a.valor) + ' ' + esc(m.un || "") + '</td>' +
            '<td>' + esc(refTexto(m, x.sexo || sexo)) + '</td>' +
            '<td><span class="exbadge is-' + esc(a.stat || "normal") + '">' + esc(STAT_LBL[a.stat] || "—") + '</span></td></tr>';
        }).join("") + '</tbody></table></div>';
    } else if (x.tipo === "solicitacao") {
      corpo = '<ul class="exdet-list">' + (x.itens || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("") + '</ul>' +
        (x.obs ? '<p class="exdet-obs">📌 ' + esc(x.obs) + '</p>' : "");
    } else {
      corpo = '<div class="exia-out__body">' + formatarTexto(x.texto || "") + '</div>';
    }
    var ov = document.createElement("div");
    ov.className = "exmodal";
    ov.innerHTML = '<div class="exmodal__box"><button class="exmodal__x" type="button" aria-label="Fechar">×</button>' +
      '<h3 class="exmodal__tit">' + esc(x.titulo || "Exame") + '</h3>' +
      '<p class="exmodal__date">' + esc(fmtData(x.data)) + '</p>' + corpo + '</div>';
    document.body.appendChild(ov);
    function fecha() { ov.remove(); }
    ov.addEventListener("click", function (e) { if (e.target === ov || e.target.closest(".exmodal__x")) fecha(); });
  }

  /* ---------- Persistência ---------- */
  function salvarExame(p, ctx, item, msgOk, btn) {
    if (!window.NutriPacientes) { (ctx.toast || function () {})("Banco indisponível.", true); return; }
    var t0 = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    var lista = (p.exames || []).slice();
    lista.push(item);
    var patch = Object.assign({}, p, { exames: lista });
    window.NutriPacientes.update(p.id, patch).then(function (saved) {
      (ctx.toast || function () {})(msgOk || "Salvo");
      if (ctx.onSaved) ctx.onSaved(saved);
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = t0; }
      (ctx.toast || function () {})("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  window.Exames = { render: render, wire: wire, MARC: MARC };
})();
