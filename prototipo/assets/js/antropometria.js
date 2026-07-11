/* ============================================================
   ANTROPOMETRIA — avaliação completa do paciente.
   Peso/altura (+ estimativa pela altura do joelho), 8 circunferências,
   7 dobras cutâneas (Pollock → % gordura por Siri) e bioimpedância.
   Cada medida traz uma FIGURA de referência (silhueta com o ponto) e
   o "como medir". Salva em pacientes.antropometria (jsonb).
   Exposto como window.Antropometria; usado pela ficha do paciente.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; }
  function idadeDe(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return null;
    var h = new Date(), a = h.getFullYear() - (+m[1]), d = (h.getMonth() + 1) - (+m[2]);
    if (d < 0 || (d === 0 && h.getDate() < (+m[3]))) a--;
    return (a >= 0 && a < 130) ? a : null;
  }

  /* ---------- Silhueta de referência (SVG schematic) ---------- */
  var SILHUETA =
    '<g class="antro-fig__body">' +
      '<circle cx="40" cy="14" r="9"/>' +
      '<rect x="36.5" y="22" width="7" height="6" rx="2"/>' +
      '<path d="M27 31 Q40 26 53 31 L55 92 Q40 99 25 92 Z"/>' +
      '<path d="M28 33 L17 72 L22 74 L33 39 Z"/>' +
      '<path d="M52 33 L63 72 L58 74 L47 39 Z"/>' +
      '<path d="M30 92 L26 151 L33 151 L38 96 Z"/>' +
      '<path d="M50 92 L54 151 L47 151 L42 96 Z"/>' +
    '</g>';
  function figura(x, y) {
    return '<svg class="antro-fig" viewBox="0 0 80 165" aria-hidden="true">' + SILHUETA +
      '<g class="antro-fig__mk" transform="translate(' + x + ',' + y + ')">' +
        '<circle r="8" class="antro-fig__ring"/><circle r="2.6" class="antro-fig__dot"/>' +
      '</g></svg>';
  }

  /* ---------- Catálogo de medidas ---------- */
  // Circunferências (cm)
  var CIRC = [
    { key: "pescoco",     lbl: "Pescoço",          x: 40, y: 27, como: "Logo abaixo da laringe (pomo de adão), fita perpendicular ao pescoço." },
    { key: "braco_rel",   lbl: "Braço relaxado",   x: 22, y: 54, como: "Ponto médio do braço, relaxado ao lado do corpo." },
    { key: "braco_con",   lbl: "Braço contraído",  x: 22, y: 51, como: "Maior perímetro do braço com o bíceps contraído." },
    { key: "cintura",     lbl: "Cintura",          x: 40, y: 77, como: "Menor circunferência entre a última costela e a crista ilíaca." },
    { key: "abdomen",     lbl: "Abdômen",          x: 40, y: 86, como: "Na altura da cicatriz umbilical, sem contrair." },
    { key: "quadril",     lbl: "Quadril",          x: 40, y: 95, como: "Maior perímetro da região dos glúteos." },
    { key: "coxa",        lbl: "Coxa",             x: 34, y: 112, como: "Abaixo da prega glútea (coxa proximal) ou no ponto médio." },
    { key: "panturrilha", lbl: "Panturrilha",      x: 31, y: 140, como: "Maior perímetro da perna." }
  ];

  // 7 dobras cutâneas (mm) — protocolo de Pollock
  var DOBRAS = [
    { key: "peitoral",     lbl: "Peitoral (torácica)", x: 33, y: 46, lado: "frente", como: "Dobra diagonal entre a axila e o mamilo. Homens: ½ da distância; mulheres: ⅓." },
    { key: "axilar",       lbl: "Axilar média",        x: 27, y: 60, lado: "frente", como: "Dobra vertical na linha axilar média, na altura do apêndice xifoide." },
    { key: "triceps",      lbl: "Tríceps",             x: 57, y: 52, lado: "costas", como: "Dobra vertical na face posterior do braço, ponto médio entre acrômio e olécrano." },
    { key: "subescapular", lbl: "Subescapular",        x: 48, y: 49, lado: "costas", como: "Dobra a 45° logo abaixo do ângulo inferior da escápula." },
    { key: "suprailiaca",  lbl: "Suprailíaca",         x: 29, y: 78, lado: "frente", como: "Dobra diagonal acima da crista ilíaca, na linha axilar média." },
    { key: "abdominal",    lbl: "Abdominal",           x: 45, y: 86, lado: "frente", como: "Dobra vertical cerca de 2 cm ao lado da cicatriz umbilical." },
    { key: "coxa",         lbl: "Coxa",                x: 34, y: 110, lado: "frente", como: "Dobra vertical na face anterior da coxa, ponto médio entre a virilha e a patela." }
  ];

  var BIO = [
    { key: "gordura_pct",     lbl: "% Gordura",          un: "%" },
    { key: "massa_magra",     lbl: "Massa magra",        un: "kg" },
    { key: "massa_muscular",  lbl: "Massa muscular",     un: "kg" },
    { key: "agua_pct",        lbl: "Água corporal",      un: "%" },
    { key: "gordura_visc",    lbl: "Gordura visceral",   un: "nível" },
    { key: "tmb",             lbl: "Taxa metab. basal",  un: "kcal" }
  ];

  /* ---------- Cálculos ---------- */
  function somaDobras(d) {
    var s = 0, n = 0;
    DOBRAS.forEach(function (x) { var v = num(d[x.key]); if (v != null) { s += v; n++; } });
    return { soma: s, completo: n === DOBRAS.length, n: n };
  }
  function densidade(soma, idade, sexo) {
    if (sexo === "M") return 1.112 - 0.00043499 * soma + 0.00000055 * soma * soma - 0.00028826 * idade;
    return 1.097 - 0.00046971 * soma + 0.00000056 * soma * soma - 0.00012828 * idade;
  }
  function siri(dc) { return (495 / dc) - 450; }
  function estaturaJoelho(cm, idade, sexo) {
    if (cm == null || idade == null) return null;
    if (sexo === "M") return 64.19 - 0.04 * idade + 2.02 * cm;
    return 84.88 - 0.24 * idade + 1.83 * cm;
  }
  function imcClasse(imc) {
    if (imc == null) return "";
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Eutrófico";
    if (imc < 30) return "Sobrepeso";
    return "Obesidade";
  }

  /* ---------- Render ---------- */
  function inputMed(grupo, item, unidade, valor) {
    return '<div class="antro-card">' +
      '<div class="antro-card__fig">' + figura(item.x, item.y) +
        (item.lado ? '<span class="antro-card__lado">' + item.lado + '</span>' : '') + '</div>' +
      '<div class="antro-card__body">' +
        '<div class="antro-card__lbl">' + esc(item.lbl) + '</div>' +
        '<div class="antro-card__input"><input type="number" step="0.1" inputmode="decimal" ' +
          'data-antro="' + grupo + ':' + item.key + '" value="' + (valor == null ? "" : esc(valor)) + '" placeholder="0" />' +
          '<span class="antro-card__un">' + unidade + '</span></div>' +
        '<p class="antro-card__como">' + esc(item.como) + '</p>' +
      '</div>' +
    '</div>';
  }

  function field(lbl, key, val, un, ph) {
    return '<label class="antro-field"><span class="antro-field__lbl">' + esc(lbl) + '</span>' +
      '<span class="antro-field__wrap"><input type="number" step="0.1" inputmode="decimal" data-antro="' + key + '" ' +
      'value="' + (val == null ? "" : esc(val)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : "") + ' />' +
      (un ? '<span class="antro-field__un">' + un + '</span>' : "") + '</span></label>';
  }

  function render(p) {
    var a = p.antropometria || {};
    var d = a.dobras || {}, c = a.circunferencias || {}, b = a.bio || {};
    var sexo = a.sexo || p.sexo || "";
    var idade = idadeDe(p.dataNascimento);

    var topo =
      '<section class="fsec"><h2 class="fsec__title">Medidas básicas</h2>' +
        '<div class="antro-basic">' +
          '<label class="antro-field"><span class="antro-field__lbl">Sexo</span>' +
            '<span class="antro-field__wrap"><select data-antro="sexo">' +
              '<option value=""' + (!sexo ? " selected" : "") + '>—</option>' +
              '<option value="F"' + (sexo === "F" ? " selected" : "") + '>Feminino</option>' +
              '<option value="M"' + (sexo === "M" ? " selected" : "") + '>Masculino</option>' +
            '</select></span></label>' +
          '<label class="antro-field"><span class="antro-field__lbl">Idade</span>' +
            '<span class="antro-field__wrap"><input type="text" value="' + (idade != null ? idade + " anos" : "informe o nascimento") + '" disabled /></span></label>' +
          field("Peso", "peso", a.peso != null ? a.peso : p.pesoAtual, "kg", "0.0") +
          field("Altura", "altura", a.altura != null ? a.altura : p.altura, "m", "1.68") +
        '</div>' +
        '<div class="antro-joelho">' +
          '<div class="antro-joelho__lbl">Não sabe a altura? Estime pela <strong>altura do joelho</strong> (Chumlea):</div>' +
          field("Altura do joelho", "altura_joelho", a.alturaJoelho, "cm", "ex.: 48") +
          '<button class="btn btn--outline btn--sm" type="button" id="antro-usar-joelho">Usar estimativa</button>' +
          '<span class="antro-joelho__out" id="antro-est-joelho">—</span>' +
        '</div>' +
      '</section>';

    var circ =
      '<section class="fsec"><h2 class="fsec__title">Circunferências <small class="antro-un-hint">(cm)</small></h2>' +
        '<div class="antro-grid">' + CIRC.map(function (x) { return inputMed("circ", x, "cm", c[x.key]); }).join("") + '</div>' +
      '</section>';

    var dobras =
      '<section class="fsec"><h2 class="fsec__title">Dobras cutâneas <small class="antro-un-hint">(mm) · 7 dobras (Pollock)</small></h2>' +
        '<div class="antro-grid">' + DOBRAS.map(function (x) { return inputMed("dobra", x, "mm", d[x.key]); }).join("") + '</div>' +
      '</section>';

    var bio =
      '<section class="fsec"><h2 class="fsec__title">Bioimpedância <small class="antro-un-hint">(opcional — do aparelho)</small></h2>' +
        '<div class="antro-basic">' + BIO.map(function (x) { return field(x.lbl, "bio:" + x.key, b[x.key], x.un); }).join("") + '</div>' +
      '</section>';

    var result =
      '<section class="fsec antro-result"><h2 class="fsec__title">Resultados</h2>' +
        '<div class="fmetric-grid">' +
          resCard("IMC", "res-imc") + resCard("Classificação", "res-imc-cls") +
          resCard("Σ 7 dobras", "res-soma") + resCard("% Gordura", "res-gord") +
          resCard("Massa gorda", "res-mg") + resCard("Massa magra", "res-mm") +
        '</div>' +
        '<p class="antro-obs" id="res-obs"></p>' +
        '<div class="cfg-actions" style="justify-content:flex-end;margin-top:var(--sp-4)">' +
          '<button class="btn btn--primary" type="button" id="antro-salvar">Salvar avaliação</button>' +
        '</div>' +
      '</section>';

    return '<div class="antro" id="antro-root">' + topo + circ + dobras + bio + result + '</div>';
  }
  function resCard(lbl, id) {
    return '<div class="fmetric"><div class="fmetric__lbl">' + lbl + '</div>' +
      '<div class="fmetric__val" id="' + id + '">—</div></div>';
  }

  /* ---------- Leitura + cálculo ao vivo ---------- */
  function coletar(root) {
    var out = { dobras: {}, circunferencias: {}, bio: {} };
    root.querySelectorAll("[data-antro]").forEach(function (inp) {
      var k = inp.getAttribute("data-antro");
      var v = inp.value;
      if (k.indexOf("circ:") === 0) out.circunferencias[k.slice(5)] = v;
      else if (k.indexOf("dobra:") === 0) out.dobras[k.slice(6)] = v;
      else if (k.indexOf("bio:") === 0) out.bio[k.slice(4)] = v;
      else if (k === "sexo") out.sexo = v;
      else if (k === "peso") out.peso = num(v);
      else if (k === "altura") out.altura = num(v);
      else if (k === "altura_joelho") out.alturaJoelho = num(v);
    });
    return out;
  }

  function calcular(dados, idade) {
    var r = { imc: null, imcCls: "", soma: null, gord: null, mg: null, mm: null, obs: [] };
    if (dados.peso != null && dados.altura) {
      r.imc = +(dados.peso / (dados.altura * dados.altura)).toFixed(1);
      r.imcCls = imcClasse(r.imc);
    }
    var s = somaDobras(dados.dobras);
    if (s.n > 0) r.soma = +s.soma.toFixed(1);
    if (s.completo && idade != null && (dados.sexo === "M" || dados.sexo === "F")) {
      var dc = densidade(s.soma, idade, dados.sexo);
      var g = siri(dc);
      if (g > 0 && g < 70) {
        r.gord = +g.toFixed(1);
        if (dados.peso != null) {
          r.mg = +(dados.peso * g / 100).toFixed(1);
          r.mm = +(dados.peso - r.mg).toFixed(1);
        }
      }
    } else if (s.n > 0 && s.n < 7) {
      r.obs.push("Preencha as 7 dobras para calcular o % de gordura.");
    } else if (s.completo && (!dados.sexo || idade == null)) {
      r.obs.push("Informe sexo e data de nascimento para calcular o % de gordura.");
    }
    return r;
  }

  function pintar(root, r) {
    function set(id, v) { var e = root.querySelector("#" + id); if (e) e.textContent = v; }
    set("res-imc", r.imc != null ? r.imc : "—");
    set("res-imc-cls", r.imcCls || "—");
    set("res-soma", r.soma != null ? r.soma + " mm" : "—");
    set("res-gord", r.gord != null ? r.gord + " %" : "—");
    set("res-mg", r.mg != null ? r.mg + " kg" : "—");
    set("res-mm", r.mm != null ? r.mm + " kg" : "—");
    var obs = root.querySelector("#res-obs");
    if (obs) obs.textContent = (r.obs || []).join(" ");
  }

  /* ---------- Fiação ---------- */
  function wire(p, opts) {
    opts = opts || {};
    var root = document.getElementById("antro-root");
    if (!root) return;
    var idade = idadeDe(p.dataNascimento);

    function recalc() {
      var dados = coletar(root);
      var id2 = idade;
      pintar(root, calcular(dados, id2));
      // estimativa por altura do joelho (mostra, não aplica sozinho)
      var est = estaturaJoelho(dados.alturaJoelho, idade, dados.sexo);
      var out = root.querySelector("#antro-est-joelho");
      if (out) out.textContent = est != null ? "≈ " + (est / 100).toFixed(2) + " m" : "—";
    }
    root.addEventListener("input", recalc);
    root.addEventListener("change", recalc);
    recalc();

    var usarJoelho = root.querySelector("#antro-usar-joelho");
    if (usarJoelho) usarJoelho.addEventListener("click", function () {
      var dados = coletar(root);
      var est = estaturaJoelho(dados.alturaJoelho, idade, dados.sexo);
      if (est == null) { opts.toast && opts.toast("Informe a altura do joelho, o sexo e a data de nascimento.", true); return; }
      var alt = root.querySelector('[data-antro="altura"]');
      if (alt) { alt.value = (est / 100).toFixed(2); recalc(); }
    });

    var salvar = root.querySelector("#antro-salvar");
    if (salvar) salvar.addEventListener("click", function () {
      var dados = coletar(root);
      var r = calcular(dados, idade);
      var antropo = {
        sexo: dados.sexo || null,
        peso: dados.peso, altura: dados.altura, alturaJoelho: dados.alturaJoelho,
        circunferencias: dados.circunferencias, dobras: dados.dobras, bio: dados.bio,
        imc: r.imc, somaDobras: r.soma, gorduraPct: r.gord, massaGorda: r.mg, massaMagra: r.mm,
        atualizadoEm: new Date().toISOString()
      };
      if (!window.NutriPacientes) { opts.toast && opts.toast("Banco indisponível.", true); return; }
      salvar.disabled = true; salvar.textContent = "Salvando…";
      var patch = Object.assign({}, p, {
        antropometria: antropo,
        sexo: dados.sexo || p.sexo,
        pesoAtual: dados.peso != null ? dados.peso : p.pesoAtual,
        altura: dados.altura != null ? dados.altura : p.altura,
        imc: r.imc != null ? r.imc : p.imc
      });
      window.NutriPacientes.update(p.id, patch).then(function (saved) {
        opts.toast && opts.toast("Avaliação salva");
        opts.onSaved && opts.onSaved(saved);
      }).catch(function (e) {
        salvar.disabled = false; salvar.textContent = "Salvar avaliação";
        opts.toast && opts.toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
      });
    });
  }

  window.Antropometria = { render: render, wire: wire };
})();
