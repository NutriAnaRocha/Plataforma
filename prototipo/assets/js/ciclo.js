/* ============================================================
   MEU CICLO — registro do ciclo menstrual, sintomas e humor.

   Lado da PACIENTE (window.CicloView): um anel com a fase atual, um
   botão grande de "menstruei hoje", chips de sintoma e humor, dicas de
   chá e alimento da fase, e o histórico de duração dos ciclos.

   Lado da NUTRI (window.CicloNutri): só leitura — regularidade, média
   de duração, sintomas recorrentes.

   TUDO É DERIVADO DO HISTÓRICO. Não existe "duração média" guardada em
   coluna: o primeiro dia com fluxo abre um ciclo, e a média sai da
   série. Número gravado envelhece e passa a discordar do que está
   registrado; cálculo não.

   O QUE ESTE MÓDULO NÃO É: método contraceptivo, cálculo de período
   fértil para evitar gravidez, nem diagnóstico. É registro de sintomas
   para orientação alimentar (Res. CFN 856/2026) — e a tela diz isso.

   Requer supabase-client.js + pacientes-db.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  var FLUXOS = [
    { id: "escape",   emoji: "💧", label: "Escape" },
    { id: "leve",     emoji: "🩸", label: "Leve" },
    { id: "moderado", emoji: "🩸🩸", label: "Moderado" },
    { id: "intenso",  emoji: "🩸🩸🩸", label: "Intenso" }
  ];
  var FLUXO_MAP = { nenhum: { label: "Sem fluxo", emoji: "—" } };
  FLUXOS.forEach(function (f) { FLUXO_MAP[f.id] = f; });

  var SINTOMAS = [
    { id: "colica",   emoji: "🤕", label: "Cólica" },
    { id: "inchaco",  emoji: "🎈", label: "Inchaço" },
    { id: "cefaleia", emoji: "🤯", label: "Dor de cabeça" },
    { id: "seios",    emoji: "💗", label: "Seios sensíveis" },
    { id: "acne",     emoji: "🌋", label: "Acne" },
    { id: "tpm",      emoji: "🌧️", label: "TPM" },
    { id: "cansaco",  emoji: "😴", label: "Cansaço" },
    { id: "intestino",emoji: "🌿", label: "Intestino alterado" },
    { id: "desejo",   emoji: "🍫", label: "Vontade de doce" }
  ];
  var SINT_MAP = {};
  SINTOMAS.forEach(function (s) { SINT_MAP[s.id] = s; });

  var HUMORES = [
    { id: "bem",      emoji: "🙂", label: "Bem" },
    { id: "disposta", emoji: "⚡", label: "Disposta" },
    { id: "irritada", emoji: "😤", label: "Irritada" },
    { id: "ansiosa",  emoji: "😰", label: "Ansiosa" },
    { id: "triste",   emoji: "😢", label: "Triste" }
  ];
  var HUMOR_MAP = {};
  HUMORES.forEach(function (h) { HUMOR_MAP[h.id] = h; });

  var FASES = {
    menstrual:  { lbl: "Menstruação", emoji: "🩸", cor: "menstrual" },
    folicular:  { lbl: "Fase folicular", emoji: "🌱", cor: "folicular" },
    ovulatoria: { lbl: "Ovulação", emoji: "🥚", cor: "ovulatoria" },
    lutea:      { lbl: "Fase lútea", emoji: "🌙", cor: "lutea" }
  };

  var CICLO_PADRAO = 28;   // só enquanto não há histórico suficiente
  var MENSTRUACAO_PADRAO = 5;
  var GAP_NOVO_CICLO = 3;  // dias sem fluxo que fecham a menstruação

  /* ---------- Datas ---------- */
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function hojeISO() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function iso(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function doISO(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function dataBR(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? m[3] + "/" + m[2] : ""; }
  function delta(a, b) { return Math.round((doISO(b) - doISO(a)) / 86400000); }
  function somaDias(s, n) { var d = doISO(s); d.setDate(d.getDate() + n); return iso(d); }
  var MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesDe(s) { var d = doISO(s); return d ? MES_CURTO[d.getMonth()] : ""; }

  /* ============================================================
     ESTADO E CÁLCULO DO CICLO
     ============================================================ */
  var _p = null, _readonly = false;
  var _regs = [], _dicas = [], _dia = hojeISO(), _obsTimer = null;

  function porData(d) {
    for (var i = 0; i < _regs.length; i++) if (_regs[i].data === d) return _regs[i];
    return null;
  }

  /* Inícios de ciclo: dias com fluxo que vêm depois de pelo menos
     GAP_NOVO_CICLO dias sem fluxo. Devolve do mais recente para o mais
     antigo. */
  function iniciosDeCiclo() {
    var comFluxo = _regs.filter(function (r) { return r.fluxo && r.fluxo !== "nenhum"; })
      .map(function (r) { return r.data; })
      .sort();  // crescente
    var inicios = [];
    comFluxo.forEach(function (d, i) {
      if (i === 0) { inicios.push(d); return; }
      if (delta(comFluxo[i - 1], d) > GAP_NOVO_CICLO) inicios.push(d);
    });
    return inicios.reverse();
  }

  // Duração de cada ciclo fechado (do início ao início seguinte).
  function duracoes() {
    var ini = iniciosDeCiclo();  // desc
    var out = [];
    for (var i = 0; i < ini.length - 1; i++) {
      var d = delta(ini[i + 1], ini[i]);
      if (d >= 15 && d <= 60) out.push({ inicio: ini[i + 1], dias: d });  // fora disso é registro furado
    }
    return out;  // do mais recente para o mais antigo
  }

  function mediaCiclo() {
    var ds = duracoes().slice(0, 6);
    if (!ds.length) return null;
    var soma = ds.reduce(function (a, x) { return a + x.dias; }, 0);
    return Math.round(soma / ds.length);
  }

  // Quantos dias seguidos de fluxo teve o ciclo que começou em `inicio`.
  function diasDeFluxo(inicio) {
    var n = 0, d = inicio;
    while (true) {
      var r = porData(d);
      if (!r || !r.fluxo || r.fluxo === "nenhum") break;
      n++; d = somaDias(d, 1);
    }
    return n || MENSTRUACAO_PADRAO;
  }

  /* Situação de hoje: dia do ciclo, fase e previsão. Sem histórico,
     devolve null — a tela pede o primeiro registro em vez de inventar
     um ciclo que ninguém informou. */
  function situacao() {
    var ini = iniciosDeCiclo();
    if (!ini.length) return null;
    var inicio = ini[0];
    var hoje = hojeISO();
    var dia = delta(inicio, hoje) + 1;
    if (dia < 1) return null;
    var media = mediaCiclo() || CICLO_PADRAO;
    // Ciclo muito atrasado: continua contando, mas a tela avisa.
    var menst = diasDeFluxo(inicio);
    var ovul = Math.max(menst + 1, media - 14);

    var fase;
    if (dia <= menst) fase = "menstrual";
    else if (dia < ovul - 1) fase = "folicular";
    else if (dia <= ovul + 1) fase = "ovulatoria";
    else fase = "lutea";

    return {
      inicio: inicio, dia: dia, media: media, menstruacao: menst, ovulacao: ovul,
      fase: fase, proxima: somaDias(inicio, media),
      faltam: delta(hoje, somaDias(inicio, media)),
      atrasado: dia > media + 5,
      temMedia: mediaCiclo() != null
    };
  }

  /* ============================================================
     PORTAL DA PACIENTE
     ============================================================ */
  function portalHTML() {
    return '<div class="cic-wrap" id="cic-wrap">' +
      '<div class="pcard cic-card" id="cic-anel"><div class="empty-state">Carregando seu ciclo…</div></div>' +
      '<div class="pcard cic-card" id="cic-registro"></div>' +
      '<div class="pcard cic-card" id="cic-dicas"></div>' +
      '<div class="pcard cic-card" id="cic-hist"></div>' +
      '<div id="cic-rodape"></div>' +
    '</div>';
  }

  function wire(paciente, opts) {
    _p = paciente;
    _readonly = !!(opts && opts.readonly);
    _dia = hojeISO();

    var pane = el("pane-ciclo");
    if (pane && !pane.__cicWired) {
      pane.__cicWired = true;
      pane.addEventListener("click", onClick);
      pane.addEventListener("input", onInput);
    }

    return Promise.all([
      window.NutriPacientes.listCiclo(_p.id, 400).catch(function () { return []; }),
      window.NutriPacientes.listDicas("ciclo").catch(function () { return []; })
    ]).then(function (r) {
      _regs = r[0] || [];
      _dicas = r[1] || [];
      pintar();
    });
  }

  function pintar() {
    var a = el("cic-anel"), rg = el("cic-registro"), d = el("cic-dicas"), h = el("cic-hist"), rp = el("cic-rodape");
    if (a) a.innerHTML = anelHTML();
    if (rg) rg.innerHTML = registroHTML();
    if (d) d.innerHTML = dicasHTML();
    if (h) h.innerHTML = historicoHTML();
    if (rp) rp.innerHTML = rodapeHTML();
  }

  /* ---------- Anel das fases ----------
     Cada fase é um arco do mesmo círculo (stroke-dasharray recortando o
     perímetro), e um ponto marca o dia de hoje. É a mesma técnica do
     anel de metas, com quatro arcos em vez de um. */
  var R = 52, CIRC = 2 * Math.PI * R;

  function arco(de, ate, cls) {
    var ini = Math.max(0, Math.min(1, de)), fim = Math.max(0, Math.min(1, ate));
    var len = Math.max(0, (fim - ini)) * CIRC;
    if (len <= 0) return "";
    return '<circle class="cic-arc cic-arc--' + cls + '" cx="60" cy="60" r="' + R + '" ' +
      'stroke-dasharray="' + len.toFixed(1) + ' ' + (CIRC - len).toFixed(1) + '" ' +
      'stroke-dashoffset="' + (-ini * CIRC).toFixed(1) + '"></circle>';
  }

  function anelHTML() {
    var s = situacao();
    if (!s) {
      return '<div class="cic-vazio">' +
        '<div class="cic-vazio__ico" aria-hidden="true">🌸</div>' +
        '<h2 class="pcard__title">Vamos começar pelo primeiro dia</h2>' +
        '<p class="pcard__hint">Assim que você marcar o primeiro dia da sua menstruação, eu passo a mostrar aqui a fase do seu ciclo e as dicas de alimentação de cada uma.</p>' +
      '</div>';
    }
    var f = FASES[s.fase];
    var fMenst = s.menstruacao / s.media;
    var fOvIni = (s.ovulacao - 2) / s.media;
    var fOvFim = (s.ovulacao + 1) / s.media;
    var arcos = arco(0, fMenst, "menstrual") +
                arco(fMenst, fOvIni, "folicular") +
                arco(fOvIni, fOvFim, "ovulatoria") +
                arco(fOvFim, 1, "lutea");

    var frac = Math.min(1, (s.dia - 1) / s.media);
    var ang = frac * 2 * Math.PI - Math.PI / 2;
    var mx = (60 + R * Math.cos(ang)).toFixed(1), my = (60 + R * Math.sin(ang)).toFixed(1);

    var legenda = s.atrasado
      ? "Passou de " + s.media + " dias. Atraso acontece por vários motivos — se repetir, vale conversar."
      : s.faltam > 1 ? "faltam " + s.faltam + " dias para a próxima"
      : s.faltam === 1 ? "falta 1 dia para a próxima"
      : s.faltam === 0 ? "a próxima é prevista para hoje"
      : "prevista para " + dataBR(s.proxima);

    return '<div class="cic-hero">' +
        '<div class="cic-ring">' +
          '<svg viewBox="0 0 120 120" aria-hidden="true">' +
            '<circle class="cic-arc cic-arc--bg" cx="60" cy="60" r="' + R + '"></circle>' +
            arcos +
            '<circle class="cic-hoje" cx="' + mx + '" cy="' + my + '" r="6"></circle>' +
          '</svg>' +
          '<div class="cic-ring__mid">' +
            '<strong>Dia ' + s.dia + '</strong>' +
            '<span>' + esc(f.emoji + " " + f.lbl) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="cic-hero__txt">' +
          '<h2 class="pcard__title">🌸 Meu ciclo</h2>' +
          '<p class="cic-hero__msg">' + esc(legenda) + '</p>' +
          '<p class="cic-hero__meta">Ciclo de ' + s.media + ' dias' +
            (s.temMedia ? " (sua média)" : " (referência, até eu ter o seu histórico)") +
            ' · começou em ' + esc(dataBR(s.inicio)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="cic-legenda">' +
        Object.keys(FASES).map(function (k) {
          return '<span class="cic-leg cic-leg--' + FASES[k].cor + (k === s.fase ? " is-on" : "") + '">' +
            FASES[k].emoji + " " + esc(FASES[k].lbl) + '</span>';
        }).join("") +
      '</div>';
  }

  function registroHTML() {
    var reg = porData(_dia);
    var ehHoje = _dia === hojeISO();
    var temFluxo = reg && reg.fluxo && reg.fluxo !== "nenhum";

    var principal = temFluxo || _readonly ? "" :
      '<button type="button" class="btn btn--primary cic-btn-menstruei" data-cic-fluxo="moderado">' +
        '🩸 ' + (ehHoje ? "Menstruei hoje" : "Menstruei em " + dataBR(_dia)) + '</button>';

    var fluxos = FLUXOS.map(function (f) {
      var on = reg && reg.fluxo === f.id;
      return '<button type="button" class="cic-chip cic-chip--fluxo' + (on ? " is-on" : "") + '"' +
        ' data-cic-fluxo="' + f.id + '"' + (_readonly ? " disabled" : "") +
        ' aria-pressed="' + (on ? "true" : "false") + '">' + f.emoji + " " + esc(f.label) + '</button>';
    }).join("");

    var atuais = (reg && Array.isArray(reg.sintomas)) ? reg.sintomas : [];
    var chips = SINTOMAS.map(function (s) {
      var on = atuais.indexOf(s.id) >= 0;
      return '<button type="button" class="cic-chip' + (on ? " is-on" : "") + '" data-cic-sint="' + s.id + '"' +
        (_readonly ? " disabled" : "") + ' aria-pressed="' + (on ? "true" : "false") + '">' +
        s.emoji + " " + esc(s.label) + '</button>';
    }).join("");

    var humores = HUMORES.map(function (h) {
      var on = reg && reg.humor === h.id;
      return '<button type="button" class="cic-humor' + (on ? " is-on" : "") + '" data-cic-humor="' + h.id + '"' +
        (_readonly ? " disabled" : "") + ' aria-pressed="' + (on ? "true" : "false") + '"' +
        ' title="' + esc(h.label) + '"><span aria-hidden="true">' + h.emoji + '</span>' +
        '<small>' + esc(h.label) + '</small></button>';
    }).join("");

    return '<div class="cic-head">' +
        '<h2 class="pcard__title">' + (ehHoje ? "Como você está hoje?" : "Registro de " + esc(dataBR(_dia))) + '</h2>' +
        (ehHoje ? '' : '<button type="button" class="btn btn--ghost btn--sm" data-cic-hoje>Voltar para hoje</button>') +
      '</div>' +
      (principal ? '<div class="cic-principal">' + principal + '</div>' : '') +
      '<div class="cic-bloco"><span class="cic-bloco__lbl">Fluxo</span>' +
        '<div class="cic-chips">' + fluxos +
          (temFluxo && !_readonly ? '<button type="button" class="cic-chip cic-chip--off" data-cic-fluxo="nenhum">Sem fluxo</button>' : '') +
        '</div></div>' +
      '<div class="cic-bloco"><span class="cic-bloco__lbl">Sintomas</span>' +
        '<div class="cic-chips">' + chips + '</div></div>' +
      '<div class="cic-bloco"><span class="cic-bloco__lbl">Humor</span>' +
        '<div class="cic-humores">' + humores + '</div></div>' +
      '<div class="cic-bloco">' +
        '<label class="cic-bloco__lbl" for="cic-obs">Quer anotar mais alguma coisa?</label>' +
        '<textarea class="input cic-obs" id="cic-obs" data-cic-obs rows="2" ' +
          'placeholder="Ex.: dormi mal, treinei pesado, comecei um remédio…"' + (_readonly ? " disabled" : "") + '>' +
          esc((reg && reg.observacao) || "") + '</textarea>' +
      '</div>' +
      (_readonly || !reg ? '' :
        '<div class="cic-acoes-dia"><span class="cic-salvo" id="cic-salvo" hidden>✓ salvo</span>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-cic-apagar>Apagar este dia</button></div>') +
      calendarioHTML();
  }

  // Últimos 28 dias em bolinhas — dá para tocar e corrigir um dia esquecido.
  function calendarioHTML() {
    var hoje = doISO(hojeISO());
    var cels = "";
    for (var i = 27; i >= 0; i--) {
      var d = new Date(hoje.getTime()); d.setDate(d.getDate() - i);
      var dia = iso(d), r = porData(dia);
      var cls = "";
      if (r && r.fluxo && r.fluxo !== "nenhum") cls = " cic-cel--fluxo";
      else if (r) cls = " cic-cel--reg";
      var titulo = dataBR(dia) + (r ? " — " + (FLUXO_MAP[r.fluxo] || {}).label : " — sem registro");
      cels += '<button type="button" class="cic-cel' + cls + (dia === _dia ? " is-sel" : "") + '" ' +
        'data-cic-dia="' + dia + '" title="' + esc(titulo) + '" aria-label="' + esc(titulo) + '">' +
        d.getDate() + '</button>';
    }
    return '<div class="cic-bloco"><span class="cic-bloco__lbl">Últimos 28 dias</span>' +
      '<div class="cic-cal">' + cels + '</div>' +
      '<p class="pcard__hint">Toque num dia para registrar ou corrigir.</p></div>';
  }

  function sintomasFrequentes() {
    var hoje = doISO(hojeISO()), cont = {};
    _regs.forEach(function (r) {
      var dif = Math.round((hoje - doISO(r.data)) / 86400000);
      if (dif < 0 || dif > 6) return;
      (Array.isArray(r.sintomas) ? r.sintomas : []).forEach(function (s) { cont[s] = (cont[s] || 0) + 1; });
    });
    return Object.keys(cont).filter(function (s) { return cont[s] >= 2; });
  }

  function dicasHTML() {
    var s = situacao();
    if (!s) {
      return '<h2 class="pcard__title">💡 O que pode ajudar</h2>' +
        '<div class="empty-state">Assim que você registrar o primeiro dia, mostro aqui as dicas de chá e alimento da sua fase.</div>';
    }
    var gat = ["fase:" + s.fase].concat(sintomasFrequentes().map(function (x) { return "sintoma:" + x; }));
    var lista = [];
    gat.forEach(function (g) { _dicas.forEach(function (d) { if (d.gatilho === g) lista.push(d); }); });
    if (!lista.length) {
      return '<h2 class="pcard__title">💡 O que pode ajudar</h2>' +
        '<div class="empty-state">Ainda não tenho dicas cadastradas para esta fase. Me chame nas mensagens.</div>';
    }
    var itens = lista.map(function (d, i) {
      return '<details class="cic-dica"' + (i === 0 ? " open" : "") + '>' +
        '<summary><span class="cic-dica__e" aria-hidden="true">' + esc(d.emoji || "•") + '</span>' +
        '<span class="cic-dica__t">' + esc(d.titulo) + '</span></summary>' +
        '<p class="cic-dica__x">' + esc(d.texto) + '</p></details>';
    }).join("");

    return '<h2 class="pcard__title">💡 ' + esc(FASES[s.fase].lbl) + ' — o que ajuda</h2>' +
      '<div class="cic-dicas">' + itens + '</div>' +
      '<p class="cic-nota">Orientações gerais para esta fase. Quem ajusta ao seu caso é a sua nutricionista.</p>';
  }

  function historicoHTML() {
    var ds = duracoes().slice(0, 6);
    if (!ds.length) {
      return '<h2 class="pcard__title">Seus ciclos</h2>' +
        '<div class="empty-state">Depois de dois ciclos registrados eu mostro aqui a sua média e se ele está regular.</div>';
    }
    var max = Math.max.apply(null, ds.map(function (x) { return x.dias; }));
    var barras = ds.map(function (x) {
      var pct = Math.round(x.dias * 100 / max);
      return '<div class="cic-bar"><span class="cic-bar__lbl">' + esc(mesDe(x.inicio)) + '</span>' +
        '<span class="cic-bar__track"><i style="width:' + pct + '%"></i></span>' +
        '<span class="cic-bar__v">' + x.dias + 'd</span></div>';
    }).join("");
    var media = mediaCiclo();
    var variacao = Math.max.apply(null, ds.map(function (x) { return x.dias; })) -
                   Math.min.apply(null, ds.map(function (x) { return x.dias; }));
    // Critério de leitura, não de diagnóstico: variação de até 7 dias entre
    // ciclos é o que a literatura trata como dentro do esperado.
    var regular = ds.length >= 2 && variacao <= 7;
    return '<h2 class="pcard__title">Seus ciclos</h2>' +
      '<div class="cic-bars">' + barras + '</div>' +
      '<p class="cic-media">Média de <strong>' + media + ' dias</strong>' +
        (ds.length >= 2 ? ' · variação de ' + variacao + (variacao === 1 ? ' dia' : ' dias') +
          ' — ' + (regular ? 'dentro do esperado ✓' : 'seus ciclos estão variando bastante') : '') + '</p>' +
      (regular ? '' : '<p class="cic-nota">Variação grande, atraso repetido ou sangramento fora do padrão merecem avaliação médica. Me conte nas mensagens para eu acompanhar junto.</p>');
  }

  function rodapeHTML() {
    if (_readonly) {
      return '<div class="pcard cic-card"><p class="pcard__hint">Pré-visualização: no acesso real, a paciente registra e fala com você por aqui.</p></div>';
    }
    return '<div class="pcard cic-card cic-falar">' +
      '<p>Quer conversar sobre o que você está sentindo?</p>' +
      '<button type="button" class="btn btn--primary" data-cic-chat>💬 Falar com a nutri sobre meu ciclo</button>' +
      '<p class="cic-aviso">Este espaço é para acompanhar sintomas e alimentação. Ele não serve como método contraceptivo nem substitui consulta médica.</p>' +
    '</div>';
  }

  /* ---------- Eventos ---------- */
  function onClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var dia = t.closest("[data-cic-dia]");
    if (dia) { _dia = dia.getAttribute("data-cic-dia"); pintar(); return; }
    if (t.closest("[data-cic-hoje]")) { _dia = hojeISO(); pintar(); return; }
    if (_readonly) return;

    var fl = t.closest("[data-cic-fluxo]");
    if (fl) {
      var reg = porData(_dia);
      var v = fl.getAttribute("data-cic-fluxo");
      salvar({ fluxo: (reg && reg.fluxo === v && v !== "nenhum") ? "nenhum" : v }, reg);
      return;
    }

    var sn = t.closest("[data-cic-sint]");
    if (sn) {
      var r2 = porData(_dia);
      var lista = (r2 && Array.isArray(r2.sintomas) ? r2.sintomas : []).slice();
      var id = sn.getAttribute("data-cic-sint");
      var pos = lista.indexOf(id);
      if (pos >= 0) lista.splice(pos, 1); else lista.push(id);
      salvar({ sintomas: lista }, r2);
      return;
    }

    var hm = t.closest("[data-cic-humor]");
    if (hm) {
      var r3 = porData(_dia);
      var h = hm.getAttribute("data-cic-humor");
      salvar({ humor: (r3 && r3.humor === h) ? null : h }, r3);
      return;
    }

    if (t.closest("[data-cic-apagar]")) {
      if (!porData(_dia)) return;
      if (!window.confirm("Apagar o registro de " + dataBR(_dia) + "?")) return;
      window.NutriPacientes.removerCiclo(_p.id, _dia).then(function () {
        _regs = _regs.filter(function (x) { return x.data !== _dia; });
        pintar();
      }).catch(function () { alert("Não foi possível apagar. Tente de novo."); });
      return;
    }

    if (t.closest("[data-cic-chat]")) {
      if (window.PortalChat && window.PortalChat.abrirCom) window.PortalChat.abrirCom(textoParaChat());
    }
  }

  function onInput(e) {
    if (_readonly) return;
    var obs = e.target.closest && e.target.closest("[data-cic-obs]");
    if (!obs) return;
    clearTimeout(_obsTimer);
    var valor = obs.value;
    _obsTimer = setTimeout(function () { salvar({ observacao: valor }, porData(_dia), true); }, 600);
  }

  /* Diferente do intestino, aqui um dia sem fluxo mas com sintoma é
     registro legítimo — por isso não exigimos "fluxo" para gravar. O que
     não se grava é linha totalmente vazia. */
  function salvar(patch, base, silencioso) {
    var reg = Object.assign({
      data: _dia, fluxo: "nenhum", sintomas: [], humor: null, observacao: ""
    }, base || {}, patch);
    var vazio = (reg.fluxo === "nenhum" || !reg.fluxo) && !(reg.sintomas || []).length &&
                !reg.humor && !String(reg.observacao || "").trim();
    if (vazio) {
      if (!base) return;   // nada a gravar
      return window.NutriPacientes.removerCiclo(_p.id, _dia).then(function () {
        _regs = _regs.filter(function (x) { return x.data !== _dia; });
        pintar();
      }).catch(function () {});
    }
    return window.NutriPacientes.salvarCiclo(_p.id, reg).then(function (saved) {
      var achou = false;
      _regs = _regs.map(function (x) { if (x.data === saved.data) { achou = true; return saved; } return x; });
      if (!achou) _regs.unshift(saved);
      if (silencioso) { marcarSalvo(); pintarSecundarios(); }
      else pintar();
    }).catch(function () {
      alert("Não foi possível salvar agora. Verifique a conexão.");
    });
  }
  function pintarSecundarios() {
    var a = el("cic-anel"), d = el("cic-dicas"), h = el("cic-hist");
    if (a) a.innerHTML = anelHTML();
    if (d) d.innerHTML = dicasHTML();
    if (h) h.innerHTML = historicoHTML();
  }
  var _salvoTimer = null;
  function marcarSalvo() {
    var s = el("cic-salvo"); if (!s) return;
    s.hidden = false;
    clearTimeout(_salvoTimer);
    _salvoTimer = setTimeout(function () { s.hidden = true; }, 1600);
  }

  function textoParaChat() {
    var s = situacao();
    var sint = sintomasFrequentes().map(function (x) { return SINT_MAP[x] ? SINT_MAP[x].label.toLowerCase() : x; });
    if (!s) return "Sobre o meu ciclo: ";
    return "Sobre o meu ciclo: estou no dia " + s.dia + " (" + FASES[s.fase].lbl.toLowerCase() + ")" +
      (sint.length ? ", com " + sint.join(" e ") : "") + ". ";
  }

  /* ============================================================
     FICHA DA NUTRI — leitura
     ============================================================ */
  function render(p) {
    return '<section class="fsec" id="cic-sec">' +
      '<div class="fsec__head"><h2 class="fsec__title">🌸 Meu ciclo</h2></div>' +
      '<p class="fmuted">Registro feito pela própria paciente no portal. Você acompanha; o relato é dela.</p>' +
      '<div id="cic-nutri"><div class="empty-state">Carregando registros…</div></div>' +
    '</section>';
  }

  function wireNutri(p, ctx) {
    var host = el("cic-nutri");
    if (!host) return;
    window.NutriPacientes.listCiclo(p.id, 400).then(function (regs) {
      _regs = regs || [];
      host.innerHTML = nutriHTML(_regs, p);
    }).catch(function () {
      host.innerHTML = '<div class="empty-state">Não foi possível carregar os registros.</div>';
      if (ctx && ctx.toast) ctx.toast("Falha ao carregar o ciclo.", true);
    });
  }

  function nutriHTML(regs, p) {
    if (!regs.length) {
      var liberado = (p.portalFeatures || []).indexOf("ciclo") >= 0;
      return '<div class="empty-state">' +
        (liberado
          ? "Nenhum registro ainda. O espaço já está liberado no portal desta paciente."
          : "Esta paciente ainda não tem o espaço liberado. Ligue em <strong>Perfil do Paciente › Portal do paciente</strong>.") +
      '</div>';
    }
    var s = situacao(), ds = duracoes().slice(0, 6), media = mediaCiclo();
    var variacao = ds.length >= 2
      ? Math.max.apply(null, ds.map(function (x) { return x.dias; })) -
        Math.min.apply(null, ds.map(function (x) { return x.dias; }))
      : null;

    var stats =
      '<div class="cic-nstats">' +
        '<div class="cic-nstat"><span>Dia do ciclo</span><strong>' + (s ? s.dia : "—") + '</strong></div>' +
        '<div class="cic-nstat"><span>Fase atual</span><strong>' + (s ? esc(FASES[s.fase].lbl) : "—") + '</strong></div>' +
        '<div class="cic-nstat"><span>Duração média</span><strong>' + (media ? media + " dias" : "—") + '</strong></div>' +
        '<div class="cic-nstat"><span>Variação</span><strong>' + (variacao == null ? "—" : variacao + " dias") + '</strong></div>' +
      '</div>' +
      (s && s.atrasado ? '<p class="cic-nalerta">⚠️ Ciclo atual passou da média em mais de 5 dias.</p>' : '');

    var cont = {};
    regs.forEach(function (r) {
      (Array.isArray(r.sintomas) ? r.sintomas : []).forEach(function (x) { cont[x] = (cont[x] || 0) + 1; });
    });
    var freq = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; }).slice(0, 6)
      .map(function (x) {
        var m = SINT_MAP[x];
        return '<span class="chip">' + (m ? m.emoji + " " + esc(m.label) : esc(x)) + ' · ' + cont[x] + '</span>';
      }).join("");

    var ciclos = ds.length
      ? '<div class="cic-nlista">' + ds.map(function (x) {
          return '<div class="cic-nciclo"><span>' + esc(dataBR(x.inicio)) + '</span><strong>' + x.dias + ' dias</strong></div>';
        }).join("") + '</div>'
      : '<p class="fmuted">Ainda não há dois ciclos completos registrados.</p>';

    var linhas = regs.slice(0, 25).map(function (r) {
      var sn = (Array.isArray(r.sintomas) ? r.sintomas : [])
        .map(function (x) { return SINT_MAP[x] ? SINT_MAP[x].label : x; }).join(", ");
      var hm = HUMOR_MAP[r.humor];
      return '<tr><td>' + esc(dataBR(r.data)) + '</td>' +
        '<td>' + esc((FLUXO_MAP[r.fluxo] || {}).label || "—") + '</td>' +
        '<td>' + (sn ? esc(sn) : "—") + '</td>' +
        '<td>' + (hm ? hm.emoji + " " + esc(hm.label) : "—") + '</td>' +
        '<td>' + (r.observacao ? esc(r.observacao) : "—") + '</td></tr>';
    }).join("");

    return stats +
      '<div class="cic-nbloco"><h3 class="fsec__sub">Últimos ciclos</h3>' + ciclos + '</div>' +
      (freq ? '<div class="cic-nbloco"><h3 class="fsec__sub">Sintomas mais frequentes</h3><div class="cic-nchips">' + freq + '</div></div>' : '') +
      '<div class="in-tabela-wrap"><table class="in-tabela">' +
        '<thead><tr><th>Data</th><th>Fluxo</th><th>Sintomas</th><th>Humor</th><th>Observação</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
  }

  window.CicloView = { portalHTML: portalHTML, wire: wire };
  window.CicloNutri = { render: render, wire: wireNutri };
})();
