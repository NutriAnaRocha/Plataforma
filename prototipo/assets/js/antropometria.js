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

  /* 7 dobras cutâneas (mm) — protocolo de Pollock, hemicorpo direito.
     `como`      = referência curta, visível no card (mantém a grade densa).
     `protocolo` = coordenada anatômica precisa + posição + pinçamento,
                   sob demanda (o card ficaria alto demais com tudo aberto).
     A convenção seguida é a de Jackson & Pollock, que é a das equações
     calculadas aqui. Onde outros autores divergem (axilar, abdominal,
     coxa), `protocolo` avisa: medir por um autor e calcular pela equação
     de outro introduz erro sistemático. */
  var DOBRAS = [
    { key: "peitoral",     lbl: "Peitoral (torácica)", x: 33, y: 46, lado: "frente",
      como: "Oblíqua, dirigida ao mamilo. Homens: ½ da distância axila–mamilo; mulheres: ⅓.",
      protocolo: "Marcação: homens, metade da distância entre a linha axilar anterior e o mamilo; mulheres, a um terço dessa distância a partir da linha axilar anterior. Direção: oblíqua ao eixo longitudinal, para baixo e para dentro. Avaliado em pé, braço ligeiramente afastado do tronco. Destacar a dobra no sentido da linha axila–mamilo e aplicar o plicômetro 1 cm abaixo dos dedos." },
    { key: "axilar",       lbl: "Axilar média",        x: 27, y: 60, lado: "frente",
      como: "Linha axilar média, na altura do apêndice xifoide. Braço deslocado para trás.",
      protocolo: "Marcação: intersecção da linha axilar média com uma horizontal na altura do apêndice xifoide do esterno. Direção: transversal por Jackson et al. (1978) — convenção das equações usadas aqui; oblíqua por Petroski (1995). Os autores divergem: use uma e mantenha a MESMA nas reavaliações. Avaliado em pé, braço deslocado para trás para expor o ponto." },
    { key: "triceps",      lbl: "Tríceps",             x: 57, y: 52, lado: "costas",
      como: "Vertical, face posterior do braço, ponto médio entre acrômio e olécrano.",
      protocolo: "Marcação: ponto médio entre a borda súpero-lateral do acrômio e o olécrano, na face posterior. Marcar com o cotovelo flexionado a 90°; medir com o braço relaxado e pendente ao lado do corpo. Direção: paralela ao eixo longitudinal. Destacar a dobra 1 cm acima da marca, polegar e indicador afastados ~8 cm." },
    { key: "subescapular", lbl: "Subescapular",        x: 48, y: 49, lado: "costas",
      como: "2 cm abaixo do ângulo inferior da escápula, oblíqua a ~45°.",
      protocolo: "Marcação: dois centímetros abaixo do ângulo inferior da escápula. Direção: oblíqua a ~45°, seguindo a orientação natural dos arcos costais (dirigida ínfero-lateralmente). Avaliado em pé, ombros relaxados e braços soltos. Se o ângulo for difícil de palpar, pedir para levar o braço às costas e devolver à posição antes de medir." },
    { key: "suprailiaca",  lbl: "Suprailíaca",         x: 29, y: 78, lado: "frente",
      como: "Metade da distância entre o último arco costal e a crista ilíaca, na linha axilar média.",
      protocolo: "Marcação: ponto médio entre o último arco costal e a crista ilíaca, sobre a linha axilar média. Direção: oblíqua, acompanhando a linha natural da pele (ântero-inferior). Avaliado em pé, braço afastado para trás para liberar o ponto. Palpar as duas referências ósseas antes de marcar." },
    { key: "abdominal",    lbl: "Abdominal",           x: 45, y: 86, lado: "frente",
      como: "2 cm à direita da cicatriz umbilical, vertical.",
      protocolo: "Marcação: aproximadamente dois centímetros à direita da cicatriz umbilical. Direção: paralela ao eixo longitudinal (vertical) — convenção de Pollock e Petroski, usada nas equações daqui. Lohman (1988) mede transversalmente. Avaliado em pé, abdome relaxado, respiração normal, sem prender o ar nem contrair." },
    { key: "coxa",         lbl: "Coxa",                x: 34, y: 110, lado: "frente",
      como: "Vertical, sobre o reto femoral, na metade entre a prega inguinal e a patela.",
      protocolo: "Marcação: face anterior, sobre o reto femoral, na linha média, na metade da distância entre a prega inguinal e a borda superior da patela (Pollock & Wilmore, 1993 — convenção das equações daqui). Guedes (1985) marca a um terço. Avaliado em pé, perna direita à frente, joelho em semiflexão, peso do corpo na perna esquerda. O relaxamento do quadríceps é essencial: sem ele a dobra não se destaca." }
  ];
  // Foto de referência de cada dobra (mostra o ponto exato ao passar o mouse / tocar).
  DOBRAS.forEach(function (x) { x.img = "assets/img/dobras/" + x.key + ".jpg"; });

  /* Bioimpedância — leitura direta do aparelho (InBody, Omron, Tanita…).
     A nutri digita o PERCENTUAL de gordura e de músculo; o sistema calcula
     o equivalente em kg usando o peso atual (kg = peso × % / 100). `hint` =
     referência curta de interpretação, mostrada abaixo do campo. */
  var BIO = [
    { key: "gordura_pct",   lbl: "% Gordura",          un: "%",     deriv: "gordura_kg", derivLbl: "Massa de gordura" },
    { key: "musculo_pct",   lbl: "% Massa muscular",   un: "%",     deriv: "musculo_kg", derivLbl: "Massa muscular" },
    { key: "gordura_visc",  lbl: "Gordura visceral",   un: "nível",
      hint: "Saudável até 9; atenção de 10 a 14; alto ≥ 15 (nível InBody)." },
    { key: "idade_metab",   lbl: "Idade metabólica",   un: "anos" },
    { key: "agua_pct",      lbl: "Água corporal",      un: "%" },
    { key: "peso_osseo",    lbl: "Peso ósseo",         un: "kg" },
    { key: "tmb",           lbl: "Taxa metab. basal",  un: "kcal" }
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

  /* ============================================================
     RAIO X CORPORAL — estimativas a partir das CIRCUNFERÊNCIAS
     (não das fotos: nenhuma equação valida % de gordura por foto;
     as fotos servem de acompanhamento visual). Todas as fórmulas
     abaixo são validadas na literatura e usam medidas que a nutri
     já coleta na antropometria.
     ============================================================ */
  var COR = { verde: "#1B8A5A", teal: "#2E9E6B", ambar: "#E0A100", vermelho: "#B23A3A", vinho: "#840B55", cinza: "#8A8A8A" };

  // RFM — Relative Fat Mass (Woolcott & Bergman, 2018; validado vs DXA).
  // Usa altura e cintura na MESMA unidade (cm). Devolve % de gordura.
  function rfm(alturaCm, cinturaCm, sexo) {
    if (!alturaCm || !cinturaCm || (sexo !== "M" && sexo !== "F")) return null;
    var base = sexo === "M" ? 64 : 76;
    var v = base - 20 * (alturaCm / cinturaCm);
    return (v > 3 && v < 75) ? +v.toFixed(1) : null;
  }
  // US Navy (circunferências) — outra estimativa de % de gordura.
  // Homem: cintura no umbigo (usamos abdômen); mulher: cintura + quadril.
  function navyBF(sexo, alturaCm, pescoco, cintura, abdomen, quadril) {
    if (!alturaCm || !pescoco) return null;
    var v;
    if (sexo === "M") {
      var waist = abdomen || cintura;
      if (!waist || waist - pescoco <= 0) return null;
      v = 495 / (1.0324 - 0.19077 * Math.log10(waist - pescoco) + 0.15456 * Math.log10(alturaCm)) - 450;
    } else if (sexo === "F") {
      if (!cintura || !quadril || cintura + quadril - pescoco <= 0) return null;
      v = 495 / (1.29579 - 0.35004 * Math.log10(cintura + quadril - pescoco) + 0.22100 * Math.log10(alturaCm)) - 450;
    } else return null;
    return (v > 3 && v < 75) ? +v.toFixed(1) : null;
  }

  // Faixa de % de gordura (referência ACE) → nome + cor + índice (0..4) na escala.
  function faixaGordura(pct, sexo) {
    if (pct == null || (sexo !== "M" && sexo !== "F")) return null;
    var cortes = sexo === "M" ? [6, 14, 18, 25] : [14, 21, 25, 32];
    var nomes = ["Essencial", "Atlético", "Em forma", "Aceitável", "Elevado"];
    var cores = [COR.teal, COR.verde, COR.verde, COR.ambar, COR.vermelho];
    var i = 0;
    while (i < cortes.length && pct >= cortes[i]) i++;
    return { nome: nomes[i], cor: cores[i], i: i };
  }

  // Risco cardiovascular por circunferência (cintura absoluta + RCE + RCQ).
  function riscoCardio(cinturaCm, alturaCm, quadrilCm, sexo) {
    var motivos = [], pontos = 0, ind = {};
    if (cinturaCm && (sexo === "M" || sexo === "F")) {
      var alto = sexo === "M" ? 102 : 88, aum = sexo === "M" ? 94 : 80;
      ind.cintura = cinturaCm;
      if (cinturaCm >= alto) { pontos += 2; motivos.push("Cintura ≥ " + alto + " cm (risco alto)"); }
      else if (cinturaCm >= aum) { pontos += 1; motivos.push("Cintura ≥ " + aum + " cm (risco aumentado)"); }
    }
    if (cinturaCm && alturaCm) {
      var rce = +(cinturaCm / alturaCm).toFixed(2); ind.rce = rce;
      if (rce >= 0.6) { pontos += 2; motivos.push("Cintura/estatura ≥ 0,60 (risco alto)"); }
      else if (rce >= 0.5) { pontos += 1; motivos.push("Cintura/estatura ≥ 0,50 (risco aumentado)"); }
    }
    if (cinturaCm && quadrilCm) {
      var rcq = +(cinturaCm / quadrilCm).toFixed(2); ind.rcq = rcq;
      var lim = sexo === "M" ? 0.90 : 0.85;
      if (rcq >= lim) { pontos += 1; motivos.push("Cintura/quadril ≥ " + lim.toFixed(2).replace(".", ",") + " (adiposidade central)"); }
    }
    var nivel, cor;
    if (!Object.keys(ind).length) { nivel = null; cor = COR.cinza; }
    else if (pontos >= 3) { nivel = "Alto"; cor = COR.vermelho; }
    else if (pontos >= 1) { nivel = "Moderado"; cor = COR.ambar; }
    else { nivel = "Baixo"; cor = COR.verde; }
    return { nivel: nivel, cor: cor, pontos: pontos, motivos: motivos, ind: ind };
  }

  /* Silhueta que "engorda/emagrece" conforme o % de gordura e muda de cor
     conforme a faixa. scaleX no tronco/membros dá a leitura visual pedida. */
  function corpoSilhueta(bf, faixa) {
    var cor = faixa ? faixa.cor : COR.rosa;
    // 15% ≈ referência magra; cada ponto acima alarga um pouco o corpo.
    var sx = bf == null ? 1 : Math.max(0.84, Math.min(1.22, 0.9 + (bf - 15) / 90));
    return '<svg class="bc-fig" viewBox="0 0 80 165" aria-hidden="true">' +
      '<g class="bc-fig__body" style="fill:' + cor + '" transform="translate(40,0) scale(' + sx.toFixed(3) + ',1) translate(-40,0)">' +
        '<circle cx="40" cy="14" r="9"/>' +
        '<rect x="36.5" y="22" width="7" height="6" rx="2"/>' +
        '<path d="M27 31 Q40 26 53 31 L55 92 Q40 99 25 92 Z"/>' +
        '<path d="M28 33 L17 72 L22 74 L33 39 Z"/>' +
        '<path d="M52 33 L63 72 L58 74 L47 39 Z"/>' +
        '<path d="M30 92 L26 151 L33 151 L38 96 Z"/>' +
        '<path d="M50 92 L54 151 L47 151 L42 96 Z"/>' +
      '</g></svg>';
  }
  // Anel (donut) de percentual.
  function donut(pct, cor, lbl) {
    var p = (pct == null || pct < 0) ? 0 : Math.min(100, pct);
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - p / 100);
    return '<div class="bc-donut">' +
      '<svg viewBox="0 0 64 64"><circle class="bc-donut__bg" cx="32" cy="32" r="' + r + '"/>' +
        '<circle class="bc-donut__fg" cx="32" cy="32" r="' + r + '" style="stroke:' + cor + ';stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + off.toFixed(1) + '"/></svg>' +
      '<div class="bc-donut__mid"><strong>' + (pct == null ? "—" : pct.toFixed(1).replace(".", ",")) + '</strong><span>%</span></div>' +
      '<div class="bc-donut__lbl">' + esc(lbl) + '</div></div>';
  }
  /* Composição corporal visual reaproveitada pela bioimpedância e pelo raio X.
     gord/musc em %; sexo p/ faixa; kgPeso p/ converter (opcional). */
  function bodyComp(gord, musc, sexo, kgPeso, origem, musLbl) {
    musLbl = musLbl || "Músculo";
    var faixa = faixaGordura(gord, sexo);
    var escala = "";
    if (faixa) {
      var seg = ["Essencial", "Atlético", "Em forma", "Aceitável", "Elevado"];
      var cores = [COR.teal, COR.verde, COR.verde, COR.ambar, COR.vermelho];
      escala = '<div class="bc-scale"><div class="bc-scale__track">' +
        seg.map(function (s, i) { return '<span class="bc-scale__seg' + (i === faixa.i ? " is-on" : "") + '" style="--c:' + cores[i] + '" title="' + s + '"></span>'; }).join("") +
        '</div><div class="bc-scale__now" style="color:' + faixa.cor + '">' + esc(faixa.nome) + '</div></div>';
    }
    var mgKg = (gord != null && kgPeso) ? (kgPeso * gord / 100) : null;
    var mmKg = (musc != null && kgPeso) ? (kgPeso * musc / 100) : null;
    var extra = '';
    if (mgKg != null || mmKg != null) {
      extra = '<div class="bc-kgs">' +
        (mgKg != null ? '<span class="bc-kg"><b style="color:' + COR.ambar + '">' + mgKg.toFixed(1).replace(".", ",") + ' kg</b> gordura</span>' : '') +
        (mmKg != null ? '<span class="bc-kg"><b style="color:' + COR.vinho + '">' + mmKg.toFixed(1).replace(".", ",") + ' kg</b> ' + esc(musLbl.toLowerCase()) + '</span>' : '') +
        '</div>';
    }
    return '<div class="bc">' +
      '<div class="bc__fig">' + corpoSilhueta(gord, faixa) + '</div>' +
      '<div class="bc__data">' +
        '<div class="bc__donuts">' + donut(gord, COR.ambar, "Gordura") + donut(musc, COR.vinho, musLbl) + '</div>' +
        escala + extra +
        (origem ? '<p class="bc__src">' + esc(origem) + '</p>' : '') +
      '</div></div>';
  }

  /* ---------- Render ---------- */
  function inputMed(grupo, item, unidade, valor) {
    var lado = item.lado ? '<span class="antro-card__lado">' + item.lado + '</span>' : '';
    var fig;
    if (item.img) {
      // Figura clicável: mostra a foto de referência no hover (desktop) e no toque (mobile).
      fig = '<button type="button" class="antro-card__fig antro-card__fig--img" ' +
          'aria-label="Ver foto de referência: ' + esc(item.lbl) + '">' +
          figura(item.x, item.y) + lado +
          '<span class="antro-card__zoom" aria-hidden="true">🔍</span>' +
          '<span class="antro-pop" role="tooltip">' +
            '<img class="antro-pop__img" src="' + esc(item.img) + '" alt="Referência anatômica da dobra ' + esc(item.lbl) + '" loading="lazy" />' +
            '<span class="antro-pop__cap">' + esc(item.lbl) + '</span>' +
          '</span>' +
        '</button>';
    } else {
      fig = '<div class="antro-card__fig">' + figura(item.x, item.y) + lado + '</div>';
    }
    return '<div class="antro-card">' + fig +
      '<div class="antro-card__body">' +
        '<div class="antro-card__lbl">' + esc(item.lbl) + '</div>' +
        '<div class="antro-card__input"><input type="number" step="0.1" inputmode="decimal" ' +
          'data-antro="' + grupo + ':' + item.key + '" value="' + (valor == null ? "" : esc(valor)) + '" placeholder="0" />' +
          '<span class="antro-card__un">' + unidade + '</span></div>' +
        '<p class="antro-card__como">' + esc(item.como) + '</p>' +
        (item.protocolo
          ? '<details class="antro-card__prot"><summary>Protocolo completo</summary>' +
              '<p>' + esc(item.protocolo) + '</p></details>'
          : '') +
      '</div>' +
    '</div>';
  }

  function field(lbl, key, val, un, ph, hint, extra) {
    return '<label class="antro-field"><span class="antro-field__lbl">' + esc(lbl) + '</span>' +
      '<span class="antro-field__wrap"><input type="number" step="0.1" inputmode="decimal" data-antro="' + key + '" ' +
      'value="' + (val == null ? "" : esc(val)) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : "") + ' />' +
      (un ? '<span class="antro-field__un">' + un + '</span>' : "") + '</span>' +
      (extra || "") +
      (hint ? '<span class="antro-field__hint">' + esc(hint) + '</span>' : "") + '</label>';
  }
  function bioField(x, val) {
    // Campos comuns: layout padrão (rótulo em cima, input embaixo).
    if (!x.deriv) return field(x.lbl, "bio:" + x.key, val, x.un, null, x.hint);
    // Campos de %: input e o kg calculado LADO A LADO, na mesma linha.
    return '<label class="antro-field antro-field--deriv">' +
        '<span class="antro-field__lbl">' + esc(x.lbl) + '</span>' +
        '<span class="antro-field__row">' +
          '<span class="antro-field__wrap"><input type="number" step="0.1" inputmode="decimal" ' +
            'data-antro="bio:' + x.key + '" value="' + (val == null ? "" : esc(val)) + '" />' +
            '<span class="antro-field__un">' + x.un + '</span></span>' +
          '<span class="antro-field__deriv" id="bio-deriv-' + x.deriv + '" aria-live="polite">' +
            '<span class="antro-field__deriv-lbl">' + esc(x.derivLbl) + '</span>' +
            '<strong class="antro-field__deriv-val">—</strong></span>' +
        '</span>' +
      '</label>';
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
      '<section class="fsec"><h2 class="fsec__title">Dobras cutâneas <small class="antro-un-hint">(mm) · 7 dobras (Pollock)</small>' +
          '<a class="antro-doc-link" href="assets/docs/protocolo-dobras-cutaneas.pdf" target="_blank" rel="noopener" ' +
            'title="Guia de técnica: localização, pinçamento, ordem e registro">📄 Protocolo de dobras (PDF)</a>' +
        '</h2>' +
        '<div class="antro-grid">' + DOBRAS.map(function (x) { return inputMed("dobra", x, "mm", d[x.key]); }).join("") + '</div>' +
      '</section>';

    var bio =
      '<section class="fsec"><h2 class="fsec__title">Bioimpedância <small class="antro-un-hint">(opcional — do aparelho; kg calculado pelo peso)</small></h2>' +
        '<div class="antro-basic">' + BIO.map(function (x) { return bioField(x, b[x.key]); }).join("") + '</div>' +
        '<div class="bc-wrap" id="bio-corpo"></div>' +
      '</section>';

    var raiox =
      '<section class="fsec antro-raiox"><h2 class="fsec__title">Raio X corporal ' +
          '<small class="antro-un-hint">estimativa a partir das circunferências</small></h2>' +
        '<div class="bc-wrap" id="raiox-corpo"></div>' +
        '<div class="raiox-grid" id="raiox-ind"></div>' +
        '<div class="raiox-risco" id="raiox-risco"></div>' +
        '<p class="antro-obs" id="raiox-obs"></p>' +
      '</section>';

    var fotos = secFotos(p);

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

    return '<div class="antro" id="antro-root">' + topo + circ + dobras + bio + raiox + fotos + result + '</div>';
  }
  function resCard(lbl, id) {
    return '<div class="fmetric"><div class="fmetric__lbl">' + lbl + '</div>' +
      '<div class="fmetric__val" id="' + id + '">—</div></div>';
  }

  /* ---------- Evolução com foto ---------- */
  var FOTO_TIPOS = [
    { key: "frente", lbl: "Frente" },
    { key: "lado",   lbl: "Lado" },
    { key: "costas", lbl: "Costas" }
  ];
  function fmtDataFoto(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  function fotoCard(f) {
    var tipo = (FOTO_TIPOS.filter(function (t) { return t.key === f.tipo; })[0] || {}).lbl || "Foto";
    var meta = [tipo];
    if (f.peso != null && f.peso !== "") meta.push(String(f.peso).replace(".", ",") + " kg");
    return '<figure class="evo-card" data-foto-id="' + esc(f.id) + '">' +
      '<button type="button" class="evo-card__img" data-foto-zoom="' + esc(f.id) + '" aria-label="Ampliar foto">' +
        '<img src="' + esc(f.data) + '" alt="Foto de evolução — ' + esc(tipo) + '" loading="lazy" /></button>' +
      '<figcaption class="evo-card__cap">' +
        '<span class="evo-card__date">' + esc(fmtDataFoto(f.dataISO)) + '</span>' +
        '<span class="evo-card__meta">' + esc(meta.join(" · ")) + '</span>' +
        (f.obs ? '<span class="evo-card__obs">' + esc(f.obs) + '</span>' : '') +
      '</figcaption>' +
      '<button type="button" class="evo-card__del" data-foto-del="' + esc(f.id) + '" aria-label="Remover foto" title="Remover">✕</button>' +
    '</figure>';
  }
  function secFotos(p) {
    var fotos = ((p.antropometria || {}).fotos || []).slice().sort(function (a, b) {
      return String(b.dataISO || "").localeCompare(String(a.dataISO || ""));
    });
    var hoje = new Date().toISOString().slice(0, 10);
    var galeria = fotos.length
      ? '<div class="evo-grid" id="evo-grid">' + fotos.map(fotoCard).join("") + '</div>'
      : '<div class="evo-empty" id="evo-grid"><span class="evo-empty__ico">📸</span>' +
          '<p>Nenhuma foto ainda. Envie a primeira para começar o acompanhamento visual do paciente.</p></div>';
    return '<section class="fsec antro-fotos"><h2 class="fsec__title">Evolução com foto ' +
        '<small class="antro-un-hint">o paciente vê no portal</small></h2>' +
      '<div class="evo-add">' +
        '<label class="antro-field"><span class="antro-field__lbl">Data</span>' +
          '<span class="antro-field__wrap"><input type="date" id="evo-data" value="' + hoje + '" /></span></label>' +
        '<label class="antro-field"><span class="antro-field__lbl">Ângulo</span>' +
          '<span class="antro-field__wrap"><select id="evo-tipo">' +
            FOTO_TIPOS.map(function (t) { return '<option value="' + t.key + '">' + t.lbl + '</option>'; }).join("") +
          '</select></span></label>' +
        '<label class="antro-field"><span class="antro-field__lbl">Peso (opcional)</span>' +
          '<span class="antro-field__wrap"><input type="number" step="0.1" inputmode="decimal" id="evo-peso" placeholder="kg" /></span></label>' +
        '<label class="antro-field evo-add__obs"><span class="antro-field__lbl">Observação (opcional)</span>' +
          '<span class="antro-field__wrap"><input type="text" id="evo-obs" placeholder="ex.: pós 30 dias" /></span></label>' +
        '<div class="evo-add__actions">' +
          '<input type="file" id="evo-file" accept="image/png,image/jpeg,image/webp" hidden />' +
          '<button type="button" class="btn btn--primary btn--sm" id="evo-add-btn">＋ Enviar foto</button>' +
        '</div>' +
      '</div>' +
      galeria +
    '</section>';
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

  // Bioimpedância: kg = peso × (% / 100). Devolve null se faltar dado.
  function bioKg(pct, peso) {
    var p = num(pct);
    if (p == null || peso == null || p <= 0 || p > 100) return null;
    return +(peso * p / 100).toFixed(1);
  }
  function pintarBioKg(root, dados) {
    var peso = dados.peso, b = dados.bio || {};
    var mapa = { gordura_kg: b.gordura_pct, musculo_kg: b.musculo_pct };
    Object.keys(mapa).forEach(function (id) {
      var box = root.querySelector("#bio-deriv-" + id);
      var el = box && box.querySelector(".antro-field__deriv-val");
      if (!el) return;
      var pct = num(mapa[id]);
      var kg = bioKg(mapa[id], peso);
      // Sem peso não há como converter — avisa em vez de deixar "—" mudo.
      var faltaPeso = pct != null && pct > 0 && peso == null;
      box.classList.toggle("is-hint", faltaPeso);
      el.textContent = kg != null
        ? "≈ " + kg.toFixed(1).replace(".", ",") + " kg"
        : (faltaPeso ? "informe o peso" : "—");
    });
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

  /* Raio X: combina RFM + US Navy (média) e o risco cardiovascular. */
  function calcRaioX(dados) {
    var sexo = dados.sexo;
    var alturaCm = dados.altura ? +(dados.altura * 100).toFixed(1) : null;
    var c = dados.circunferencias || {};
    var cintura = num(c.cintura), abdomen = num(c.abdomen), quadril = num(c.quadril), pescoco = num(c.pescoco);
    var peso = dados.peso;
    var bfRfm = rfm(alturaCm, cintura, sexo);
    var bfNavy = navyBF(sexo, alturaCm, pescoco, cintura, abdomen, quadril);
    var ests = [bfRfm, bfNavy].filter(function (v) { return v != null; });
    var bf = ests.length ? +(ests.reduce(function (a, b) { return a + b; }, 0) / ests.length).toFixed(1) : null;
    var mgKg = (bf != null && peso) ? +(peso * bf / 100).toFixed(1) : null;
    var mmKg = (bf != null && peso) ? +(peso - mgKg).toFixed(1) : null;
    var mmPct = (mmKg != null && peso) ? +(mmKg / peso * 100).toFixed(1) : null;
    var risco = riscoCardio(cintura, alturaCm, quadril, sexo);
    return { bf: bf, bfRfm: bfRfm, bfNavy: bfNavy, mgKg: mgKg, mmKg: mmKg, mmPct: mmPct,
      risco: risco, alturaCm: alturaCm, cintura: cintura, abdomen: abdomen, quadril: quadril, pescoco: pescoco, peso: peso, sexo: sexo };
  }

  function raioxIndCard(lbl, val, ref, cor) {
    return '<div class="raiox-ind" style="--c:' + (cor || COR.cinza) + '">' +
      '<div class="raiox-ind__lbl">' + esc(lbl) + '</div>' +
      '<div class="raiox-ind__val">' + val + '</div>' +
      (ref ? '<div class="raiox-ind__ref">' + esc(ref) + '</div>' : '') + '</div>';
  }
  function pintarRaioX(root, dados) {
    var host = root.querySelector("#raiox-corpo");
    if (!host) return;
    var rx = calcRaioX(dados);
    var falta = [];
    if (rx.sexo !== "M" && rx.sexo !== "F") falta.push("sexo");
    if (!rx.alturaCm) falta.push("altura");
    if (!rx.cintura) falta.push("circunferência da cintura");

    if (rx.bf == null && rx.risco.nivel == null) {
      host.innerHTML = '<div class="raiox-hint">Informe ' + falta.join(", ") +
        ' para gerar o raio X. A estimativa usa cintura, quadril, pescoço e altura.</div>';
      root.querySelector("#raiox-ind").innerHTML = "";
      root.querySelector("#raiox-risco").innerHTML = "";
      var o0 = root.querySelector("#raiox-obs"); if (o0) o0.textContent = "";
      return;
    }
    host.innerHTML = bodyComp(rx.bf, rx.mmPct, rx.sexo, rx.peso, null, "Massa magra");

    // Indicadores
    var cards = "";
    if (rx.bfRfm != null) cards += raioxIndCard("% Gordura (RFM)", rx.bfRfm.toFixed(1).replace(".", ",") + "%", "vs. DXA", COR.ambar);
    if (rx.bfNavy != null) cards += raioxIndCard("% Gordura (Navy)", rx.bfNavy.toFixed(1).replace(".", ",") + "%", "circunferências", COR.ambar);
    if (rx.mmKg != null) cards += raioxIndCard("Massa magra", rx.mmKg.toFixed(1).replace(".", ",") + " kg", (rx.mmPct != null ? rx.mmPct.toFixed(0) + "% do peso" : ""), COR.vinho);
    if (rx.risco.ind.rce != null) {
      var rce = rx.risco.ind.rce, corRce = rce >= 0.6 ? COR.vermelho : rce >= 0.5 ? COR.ambar : COR.verde;
      cards += raioxIndCard("Cintura/estatura", String(rce).replace(".", ","), "ideal < 0,50", corRce);
    }
    if (rx.risco.ind.rcq != null) {
      var lim = rx.sexo === "M" ? 0.90 : 0.85, corRcq = rx.risco.ind.rcq >= lim ? COR.ambar : COR.verde;
      cards += raioxIndCard("Cintura/quadril", String(rx.risco.ind.rcq).replace(".", ","), "limite " + lim.toFixed(2).replace(".", ","), corRcq);
    }
    if (rx.cintura) {
      var limA = rx.sexo === "M" ? 94 : 80, limB = rx.sexo === "M" ? 102 : 88;
      var corCin = rx.cintura >= limB ? COR.vermelho : rx.cintura >= limA ? COR.ambar : COR.verde;
      cards += raioxIndCard("Cintura", rx.cintura.toFixed(1).replace(".", ",") + " cm", "alerta ≥ " + limA + " cm", corCin);
    }
    root.querySelector("#raiox-ind").innerHTML = cards;

    // Risco cardiovascular
    var rk = rx.risco, rbox = root.querySelector("#raiox-risco");
    if (rk.nivel) {
      rbox.innerHTML = '<div class="raiox-risco__card" style="--c:' + rk.cor + '">' +
        '<div class="raiox-risco__top"><span class="raiox-risco__dot"></span>' +
          '<span class="raiox-risco__lbl">Risco cardiovascular</span>' +
          '<span class="raiox-risco__nivel">' + esc(rk.nivel) + '</span></div>' +
        (rk.motivos.length
          ? '<ul class="raiox-risco__motivos">' + rk.motivos.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join("") + '</ul>'
          : '<p class="raiox-risco__ok">Nenhum marcador de adiposidade central elevado. 👏</p>') +
      '</div>';
    } else { rbox.innerHTML = ""; }

    var obs = root.querySelector("#raiox-obs");
    if (obs) obs.textContent = "Estimativas por fórmulas validadas (RFM, US Navy, OMS). Não substituem DXA/bioimpedância; use como triagem e acompanhamento.";
  }

  // Bioimpedância: monta o corpo visual a partir do que a nutri digitou.
  function pintarBioCorpo(root, dados) {
    var host = root.querySelector("#bio-corpo");
    if (!host) return;
    var b = dados.bio || {};
    var g = num(b.gordura_pct), m = num(b.musculo_pct);
    if (g == null && m == null) {
      host.innerHTML = '<div class="raiox-hint">Digite o % de gordura e de músculo do aparelho para ver a composição corporal ilustrada.</div>';
      return;
    }
    var chips = "";
    var visc = num(b.gordura_visc);
    if (visc != null) {
      var corV = visc >= 15 ? COR.vermelho : visc >= 10 ? COR.ambar : COR.verde;
      chips += '<span class="bc-chip" style="--c:' + corV + '"><b>' + visc + '</b> gordura visceral</span>';
    }
    if (num(b.agua_pct) != null) chips += '<span class="bc-chip" style="--c:' + COR.teal + '"><b>' + num(b.agua_pct) + '%</b> água</span>';
    if (num(b.idade_metab) != null) chips += '<span class="bc-chip" style="--c:' + COR.vinho + '"><b>' + num(b.idade_metab) + '</b> idade metab.</span>';
    if (num(b.tmb) != null) chips += '<span class="bc-chip" style="--c:' + COR.vinho + '"><b>' + num(b.tmb) + '</b> kcal TMB</span>';
    if (num(b.peso_osseo) != null) chips += '<span class="bc-chip" style="--c:' + COR.cinza + '"><b>' + num(b.peso_osseo) + '</b> kg ósseo</span>';
    host.innerHTML = bodyComp(g, m, dados.sexo, dados.peso, null, "Músculo") +
      (chips ? '<div class="bc-chips">' + chips + '</div>' : '');
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
      // Bioimpedância: converte % → kg com o peso atual (mostra ao vivo).
      pintarBioKg(root, dados);
      pintarBioCorpo(root, dados);
      // Raio X corporal ao vivo a partir das circunferências.
      pintarRaioX(root, dados);
    }
    root.addEventListener("input", recalc);
    root.addEventListener("change", recalc);
    recalc();

    // Foto de referência das dobras: toque abre/fecha (no desktop o hover já resolve).
    root.querySelectorAll(".antro-card__fig--img").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var abrir = !btn.classList.contains("is-open");
        root.querySelectorAll(".antro-card__fig--img.is-open").forEach(function (o) { o.classList.remove("is-open"); });
        if (abrir) btn.classList.add("is-open");
      });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".antro-card__fig--img")) {
        root.querySelectorAll(".antro-card__fig--img.is-open").forEach(function (o) { o.classList.remove("is-open"); });
      }
    });

    /* ----- Evolução com foto ----- */
    // Lista viva das fotos (persistida na hora, independente do "Salvar avaliação").
    var fotos = (((p.antropometria || {}).fotos) || []).slice();
    var addBtn = root.querySelector("#evo-add-btn");
    var fileInp = root.querySelector("#evo-file");

    // Monta o objeto antropometria a partir do que está AGORA no formulário
    // + as fotos. Usado tanto pelo "Salvar avaliação" quanto pelo salvar de
    // fotos, para que nenhuma medida digitada se perca no re-render.
    function buildPatch() {
      var dados = coletar(root);
      var r = calcular(dados, idade);
      var bio = Object.assign({}, dados.bio, {
        gordura_kg: bioKg(dados.bio.gordura_pct, dados.peso),
        musculo_kg: bioKg(dados.bio.musculo_pct, dados.peso)
      });
      var rx = calcRaioX(dados);
      var antropo = {
        sexo: dados.sexo || null,
        peso: dados.peso, altura: dados.altura, alturaJoelho: dados.alturaJoelho,
        circunferencias: dados.circunferencias, dobras: dados.dobras, bio: bio,
        imc: r.imc, somaDobras: r.soma, gorduraPct: r.gord, massaGorda: r.mg, massaMagra: r.mm,
        fotos: fotos,
        raioX: {
          gorduraPct: rx.bf, gorduraRFM: rx.bfRfm, gorduraNavy: rx.bfNavy,
          massaGordaKg: rx.mgKg, massaMagraKg: rx.mmKg, massaMagraPct: rx.mmPct,
          riscoCardio: rx.risco.nivel, riscoPontos: rx.risco.pontos,
          rce: rx.risco.ind.rce, rcq: rx.risco.ind.rcq, cintura: rx.cintura
        },
        atualizadoEm: new Date().toISOString()
      };
      return { patch: Object.assign({}, p, {
        antropometria: antropo,
        sexo: dados.sexo || p.sexo,
        pesoAtual: dados.peso != null ? dados.peso : p.pesoAtual,
        altura: dados.altura != null ? dados.altura : p.altura,
        imc: r.imc != null ? r.imc : p.imc
      }), r: r };
    }

    function refreshFotos() {
      var grid = root.querySelector("#evo-grid");
      if (!grid) return;
      var ord = fotos.slice().sort(function (a, b) { return String(b.dataISO || "").localeCompare(String(a.dataISO || "")); });
      if (!ord.length) {
        grid.className = "evo-empty"; grid.id = "evo-grid";
        grid.innerHTML = '<span class="evo-empty__ico">📸</span><p>Nenhuma foto ainda. Envie a primeira para começar o acompanhamento visual do paciente.</p>';
      } else {
        grid.className = "evo-grid"; grid.id = "evo-grid";
        grid.innerHTML = ord.map(fotoCard).join("");
      }
    }
    function salvarFotos(cb) {
      if (!window.NutriPacientes) { opts.toast && opts.toast("Banco indisponível.", true); return; }
      var patch = buildPatch().patch;
      window.NutriPacientes.update(p.id, patch).then(function (saved) {
        p = saved;
        opts.onSaved && opts.onSaved(saved);
        cb && cb(true);
      }).catch(function (e) {
        opts.toast && opts.toast("Não foi possível salvar a foto. " + (e && e.message ? e.message : ""), true);
        cb && cb(false);
      });
    }
    if (addBtn && fileInp) {
      addBtn.addEventListener("click", function () { fileInp.click(); });
      fileInp.addEventListener("change", function () {
        var file = fileInp.files && fileInp.files[0];
        fileInp.value = "";
        if (!file) return;
        if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { opts.toast && opts.toast("Use uma imagem JPG, PNG ou WEBP.", true); return; }
        if (file.size > 8 * 1024 * 1024) { opts.toast && opts.toast("A imagem passa de 8 MB. Escolha uma menor.", true); return; }
        addBtn.disabled = true; addBtn.textContent = "Enviando…";
        redimensionarFoto(file, 720, 0.82).then(function (dataUrl) {
          var dataInp = root.querySelector("#evo-data");
          var pesoInp = root.querySelector("#evo-peso");
          var novo = {
            id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            data: dataUrl,
            tipo: (root.querySelector("#evo-tipo") || {}).value || "frente",
            dataISO: (dataInp && dataInp.value) || new Date().toISOString().slice(0, 10),
            peso: pesoInp && pesoInp.value !== "" ? num(pesoInp.value) : null,
            obs: ((root.querySelector("#evo-obs") || {}).value || "").trim() || null
          };
          fotos.push(novo);
          refreshFotos();
          salvarFotos(function (ok) {
            addBtn.disabled = false; addBtn.textContent = "＋ Enviar foto";
            if (ok) { opts.toast && opts.toast("Foto adicionada 📸"); if (pesoInp) pesoInp.value = ""; var ob = root.querySelector("#evo-obs"); if (ob) ob.value = ""; }
            else { fotos = fotos.filter(function (f) { return f.id !== novo.id; }); refreshFotos(); }
          });
        }).catch(function () {
          addBtn.disabled = false; addBtn.textContent = "＋ Enviar foto";
          opts.toast && opts.toast("Não foi possível carregar a foto.", true);
        });
      });
    }
    // Remover / ampliar foto (delegação de eventos na grade).
    root.addEventListener("click", function (e) {
      var del = e.target.closest && e.target.closest("[data-foto-del]");
      if (del) {
        var idDel = del.getAttribute("data-foto-del");
        if (!window.confirm("Remover esta foto de evolução?")) return;
        var bkp = fotos.slice();
        fotos = fotos.filter(function (f) { return f.id !== idDel; });
        refreshFotos();
        salvarFotos(function (ok) { if (!ok) { fotos = bkp; refreshFotos(); } else { opts.toast && opts.toast("Foto removida"); } });
        return;
      }
      var zoom = e.target.closest && e.target.closest("[data-foto-zoom]");
      if (zoom) {
        var idZ = zoom.getAttribute("data-foto-zoom");
        var f = fotos.filter(function (x) { return x.id === idZ; })[0];
        if (f) abrirLightbox(f);
      }
    });

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
      if (!window.NutriPacientes) { opts.toast && opts.toast("Banco indisponível.", true); return; }
      salvar.disabled = true; salvar.textContent = "Salvando…";
      var patch = buildPatch().patch;
      window.NutriPacientes.update(p.id, patch).then(function (saved) {
        opts.toast && opts.toast("Avaliação salva");
        opts.onSaved && opts.onSaved(saved);
      }).catch(function (e) {
        salvar.disabled = false; salvar.textContent = "Salvar avaliação";
        opts.toast && opts.toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
      });
    });
  }

  /* Redimensiona a foto para no máx. `max` px (lado maior) e devolve JPEG data URL. */
  function redimensionarFoto(file, max, q) {
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
          resolve(cv.toDataURL("image/jpeg", q || 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* Lightbox simples para ver a foto ampliada. */
  function abrirLightbox(f) {
    var tipo = (FOTO_TIPOS.filter(function (t) { return t.key === f.tipo; })[0] || {}).lbl || "Foto";
    var cap = [fmtDataFoto(f.dataISO), tipo];
    if (f.peso != null && f.peso !== "") cap.push(String(f.peso).replace(".", ",") + " kg");
    var ov = document.createElement("div");
    ov.className = "evo-lb";
    ov.innerHTML = '<button class="evo-lb__close" aria-label="Fechar">✕</button>' +
      '<figure class="evo-lb__fig"><img src="' + esc(f.data) + '" alt="Foto de evolução ampliada" />' +
      '<figcaption>' + esc(cap.join(" · ")) + (f.obs ? ' — ' + esc(f.obs) : '') + '</figcaption></figure>';
    function fechar() { ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") fechar(); }
    ov.addEventListener("click", function (e) { if (e.target === ov || e.target.closest(".evo-lb__close")) fechar(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
  }

  window.Antropometria = { render: render, wire: wire };
})();
