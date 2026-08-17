/* ============================================================
   MEU INTESTINO FELIZ — registro diário do funcionamento intestinal.

   Lado do PACIENTE (window.IntestinoView): três carinhas grandes
   (constipado / regular / diarreia), escala de Bristol, sintomas em
   chips, observação livre. Salva sozinho, sem botão: o registro que
   depende de "não esquecer de salvar" é o registro que não acontece.

   Lado da NUTRI (window.IntestinoNutri): só leitura. O relato é do
   paciente — a nutri lê o padrão, não reescreve o que ele viveu.

   As dicas vêm da tabela editorial `dicas_conteudo` (migração 0067),
   curadas pela Ana. Nada aqui é diagnóstico nem prescrição: é
   orientação alimentar geral, e a tela diz isso (Res. CFN 856/2026).

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

  var CLASSES = [
    { id: "constipado", emoji: "😣", label: "Constipado", hint: "Ressecado, com esforço ou sem ir" },
    { id: "regular",    emoji: "😊", label: "Regular",    hint: "Saiu fácil, no seu normal" },
    { id: "diarreia",   emoji: "💧", label: "Diarreia",   hint: "Muito mole ou líquido" }
  ];
  var CLS_MAP = {};
  CLASSES.forEach(function (c) { CLS_MAP[c.id] = c; });

  var SINTOMAS = [
    { id: "inchaco",  emoji: "🎈", label: "Inchaço" },
    { id: "gases",    emoji: "💨", label: "Gases" },
    { id: "dor",      emoji: "😖", label: "Dor ou cólica" },
    { id: "esforco",  emoji: "😤", label: "Esforço para evacuar" },
    { id: "urgencia", emoji: "🏃", label: "Urgência" },
    { id: "incompleto", emoji: "🌀", label: "Sensação de não esvaziar" },
    { id: "sangue",   emoji: "🩸", label: "Sangue" }
  ];
  var SINT_MAP = {};
  SINTOMAS.forEach(function (s) { SINT_MAP[s.id] = s; });

  // Escala de Bristol em linguagem de gente. O número técnico fica só
  // para a nutri ler na ficha.
  var BRISTOL = [
    "Bolinhas duras separadas",
    "Em forma de salsicha, mas com rachaduras… e dura",
    "Salsicha com rachaduras na superfície",
    "Lisa e macia, como uma salsicha",
    "Pedaços macios com bordas definidas",
    "Pedaços moles e esfarelados",
    "Totalmente líquida, sem pedaços"
  ];

  /* ---------- Datas ---------- */
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function hojeISO() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function iso(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function doISO(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function dataBR(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || "")); return m ? m[3] + "/" + m[2] : ""; }

  /* ============================================================
     PORTAL DO PACIENTE
     ============================================================ */
  var _p = null, _readonly = false;
  var _regs = [];            // registros carregados (mais novo primeiro)
  var _dicas = [];           // conteúdo editorial
  var _dia = hojeISO();      // dia em edição
  var _obsTimer = null;

  function porData(d) {
    for (var i = 0; i < _regs.length; i++) if (_regs[i].data === d) return _regs[i];
    return null;
  }

  function portalHTML() {
    return '<div class="int-wrap" id="int-wrap">' +
      '<div class="pcard int-card" id="int-hoje"><div class="empty-state">Carregando seus registros…</div></div>' +
      '<div class="pcard int-card" id="int-mes"></div>' +
      '<div class="pcard int-card" id="int-dicas"></div>' +
      '<div id="int-rodape"></div>' +
    '</div>';
  }

  function wire(paciente, opts) {
    _p = paciente;
    _readonly = !!(opts && opts.readonly);
    _dia = hojeISO();

    var pane = el("pane-intestino");
    if (pane && !pane.__intWired) {
      pane.__intWired = true;
      pane.addEventListener("click", onClick);
      pane.addEventListener("input", onInput);
    }

    return Promise.all([
      window.NutriPacientes.listIntestino(_p.id, 60).catch(function () { return []; }),
      window.NutriPacientes.listDicas("intestino").catch(function () { return []; })
    ]).then(function (r) {
      _regs = r[0] || [];
      _dicas = r[1] || [];
      pintar();
    });
  }

  function pintar() {
    var h = el("int-hoje"), m = el("int-mes"), d = el("int-dicas"), rp = el("int-rodape");
    if (h) h.innerHTML = editorHTML();
    if (m) m.innerHTML = calendarioHTML();
    if (d) d.innerHTML = dicasHTML();
    if (rp) rp.innerHTML = rodapeHTML();
  }

  function editorHTML() {
    var reg = porData(_dia);
    var ehHoje = _dia === hojeISO();
    var titulo = ehHoje ? "Como foi hoje?" : "Como foi em " + dataBR(_dia) + "?";

    var botoes = CLASSES.map(function (c) {
      var on = reg && reg.classificacao === c.id;
      return '<button type="button" class="int-op' + (on ? " is-on" : "") + ' int-op--' + c.id + '"' +
        ' data-int-cls="' + c.id + '"' + (_readonly ? " disabled" : "") +
        ' aria-pressed="' + (on ? "true" : "false") + '">' +
        '<span class="int-op__emoji" aria-hidden="true">' + c.emoji + '</span>' +
        '<span class="int-op__lbl">' + esc(c.label) + '</span>' +
        '<span class="int-op__hint">' + esc(c.hint) + '</span></button>';
    }).join("");

    var detalhe = "";
    if (reg) {
      var bris = BRISTOL.map(function (txt, i) {
        var n = i + 1, on = reg.bristol === n;
        return '<button type="button" class="int-bris' + (on ? " is-on" : "") + '" data-int-bristol="' + n + '"' +
          (_readonly ? " disabled" : "") + ' title="' + esc(txt) + '" aria-label="' + esc(txt) + '">' +
          '<span class="int-bris__n">' + n + '</span></button>';
      }).join("");
      var atuais = Array.isArray(reg.sintomas) ? reg.sintomas : [];
      var chips = SINTOMAS.map(function (s) {
        var on = atuais.indexOf(s.id) >= 0;
        return '<button type="button" class="int-chip' + (on ? " is-on" : "") + '" data-int-sint="' + s.id + '"' +
          (_readonly ? " disabled" : "") + ' aria-pressed="' + (on ? "true" : "false") + '">' +
          s.emoji + " " + esc(s.label) + '</button>';
      }).join("");

      detalhe =
        '<div class="int-detalhe">' +
          '<div class="int-bloco">' +
            '<span class="int-bloco__lbl">Quantas vezes você foi?</span>' +
            '<div class="int-num">' +
              '<button type="button" class="int-num__b" data-int-vezes="-1"' + (_readonly ? " disabled" : "") + ' aria-label="Menos uma vez">–</button>' +
              '<span class="int-num__v" id="int-vezes">' + (reg.evacuacoes || 0) + '</span>' +
              '<button type="button" class="int-num__b" data-int-vezes="1"' + (_readonly ? " disabled" : "") + ' aria-label="Mais uma vez">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="int-bloco">' +
            '<span class="int-bloco__lbl">Como estava? <small>(escala de Bristol — passe o dedo para ver a descrição)</small></span>' +
            '<div class="int-brisrow">' + bris + '</div>' +
            '<p class="int-bris__txt" id="int-bris-txt">' + esc(reg.bristol ? BRISTOL[reg.bristol - 1] : "Opcional — se quiser detalhar.") + '</p>' +
          '</div>' +
          '<div class="int-bloco">' +
            '<span class="int-bloco__lbl">Sentiu mais alguma coisa?</span>' +
            '<div class="int-chips">' + chips + '</div>' +
          '</div>' +
          '<div class="int-bloco">' +
            '<label class="int-bloco__lbl" for="int-obs">Quer me contar mais alguma coisa?</label>' +
            '<textarea class="input int-obs" id="int-obs" data-int-obs rows="2" ' +
              'placeholder="Ex.: comi fora, tomei antibiótico, dormi mal…"' + (_readonly ? " disabled" : "") + '>' +
              esc(reg.observacao || "") + '</textarea>' +
          '</div>' +
          (_readonly ? "" :
            '<div class="int-acoes-dia">' +
              '<span class="int-salvo" id="int-salvo" hidden>✓ salvo</span>' +
              '<button type="button" class="btn btn--ghost btn--sm" data-int-apagar>Apagar este dia</button>' +
            '</div>') +
        '</div>';
    }

    return '<div class="int-head">' +
        '<h2 class="pcard__title">🌿 ' + esc(titulo) + '</h2>' +
        (ehHoje ? '' : '<button type="button" class="btn btn--ghost btn--sm" data-int-hoje>Voltar para hoje</button>') +
      '</div>' +
      '<div class="int-ops">' + botoes + '</div>' +
      detalhe +
      (reg ? '' : '<p class="pcard__hint">Toque na carinha que mais parece com o seu dia. Leva dez segundos e é o que me mostra o seu padrão.</p>');
  }

  /* Calendário dos últimos 30 dias, alinhado por dia da semana.
     Bolinha vazia = dia sem registro, e isso também é informação. */
  function calendarioHTML() {
    var hoje = doISO(hojeISO());
    var dias = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(hoje.getTime()); d.setDate(d.getDate() - i);
      dias.push(iso(d));
    }
    var pad = doISO(dias[0]).getDay(); // 0 = domingo
    var celulas = "";
    for (var k = 0; k < pad; k++) celulas += '<span class="int-cel int-cel--vazia"></span>';
    dias.forEach(function (dia) {
      var reg = porData(dia);
      var c = reg ? CLS_MAP[reg.classificacao] : null;
      var num = doISO(dia).getDate();
      var titulo = dataBR(dia) + (c ? " — " + c.label : " — sem registro");
      celulas += '<button type="button" class="int-cel' + (c ? " int-cel--" + reg.classificacao : "") +
        (dia === _dia ? " is-sel" : "") + '" data-int-dia="' + dia + '" title="' + esc(titulo) + '"' +
        ' aria-label="' + esc(titulo) + '">' +
        '<span class="int-cel__e" aria-hidden="true">' + (c ? c.emoji : "") + '</span>' +
        '<span class="int-cel__n">' + num + '</span></button>';
    });

    var cont = { constipado: 0, regular: 0, diarreia: 0 }, total = 0;
    dias.forEach(function (dia) {
      var reg = porData(dia);
      if (reg && cont[reg.classificacao] != null) { cont[reg.classificacao]++; total++; }
    });
    var resumo = total
      ? CLASSES.map(function (c) {
          return '<span class="int-res"><b>' + c.emoji + " " + cont[c.id] + '</b> ' + esc(c.label.toLowerCase()) + '</span>';
        }).join("") + '<span class="int-res int-res--tot">' + total + ' de 30 dias registrados</span>'
      : '<span class="int-res">Seus registros aparecem aqui — o valor está no histórico.</span>';

    return '<h2 class="pcard__title">Seu mês</h2>' +
      '<div class="int-cal">' +
        '<div class="int-cal__dow"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>' +
        '<div class="int-cal__grid">' + celulas + '</div>' +
      '</div>' +
      '<div class="int-resumo">' + resumo + '</div>' +
      '<p class="pcard__hint">Toque em qualquer dia para registrar ou corrigir.</p>';
  }

  /* Padrão dos últimos 7 dias — não o dia isolado. Um dia ruim não muda
     a orientação; uma semana ruim, sim. */
  function padraoRecente() {
    var hoje = doISO(hojeISO());
    var cont = { constipado: 0, regular: 0, diarreia: 0 }, sint = {}, total = 0;
    _regs.forEach(function (r) {
      var dif = Math.round((hoje - doISO(r.data)) / 86400000);
      if (dif < 0 || dif > 6) return;
      if (cont[r.classificacao] != null) { cont[r.classificacao]++; total++; }
      (Array.isArray(r.sintomas) ? r.sintomas : []).forEach(function (s) { sint[s] = (sint[s] || 0) + 1; });
    });
    var dom = null;
    Object.keys(cont).forEach(function (k) { if (!dom || cont[k] > cont[dom]) dom = k; });
    if (!total) dom = null;
    var sintFreq = Object.keys(sint).filter(function (s) { return sint[s] >= 2; });
    return { dominante: dom, total: total, sintomas: sintFreq };
  }

  function dicasDe(gatilhos) {
    var out = [];
    gatilhos.forEach(function (g) {
      _dicas.forEach(function (d) { if (d.gatilho === g) out.push(d); });
    });
    return out;
  }

  function dicasHTML() {
    var pad = padraoRecente();
    if (!pad.total) {
      return '<h2 class="pcard__title">💡 O que pode ajudar</h2>' +
        '<div class="empty-state">Registre alguns dias e eu mostro aqui as dicas de chá e de alimento que combinam com o seu padrão.</div>';
    }
    var gatilhos = [pad.dominante].concat(pad.sintomas.map(function (s) { return "sintoma:" + s; }));
    var lista = dicasDe(gatilhos);
    if (!lista.length) {
      return '<h2 class="pcard__title">💡 O que pode ajudar</h2>' +
        '<div class="empty-state">Ainda não tenho dicas cadastradas para este padrão. Me chame nas mensagens.</div>';
    }
    var cabecalho = pad.dominante === "regular"
      ? "Sua semana está regular 🎉"
      : pad.dominante === "constipado"
        ? "Sua semana veio mais presa"
        : "Sua semana veio mais solta";

    var itens = lista.map(function (d, i) {
      return '<details class="int-dica"' + (i === 0 ? " open" : "") + '>' +
        '<summary><span class="int-dica__e" aria-hidden="true">' + esc(d.emoji || "•") + '</span>' +
        '<span class="int-dica__t">' + esc(d.titulo) + '</span></summary>' +
        '<p class="int-dica__x">' + esc(d.texto) + '</p></details>';
    }).join("");

    return '<h2 class="pcard__title">💡 O que pode ajudar</h2>' +
      '<p class="int-dicas__sub">' + esc(cabecalho) + ' — com base nos seus últimos 7 dias.</p>' +
      '<div class="int-dicas">' + itens + '</div>' +
      '<p class="int-nota">Estas são orientações gerais. Quem ajusta ao seu caso é a sua nutricionista.</p>' +
      '<div class="int-alerta">' +
        '<strong>⚠️ Procure avaliação médica</strong> se aparecer sangue nas fezes, dor forte que não passa, ' +
        'febre, perda de peso sem explicação ou uma mudança de hábito que dure semanas.' +
      '</div>';
  }

  function rodapeHTML() {
    if (_readonly) {
      return '<div class="pcard int-card"><p class="pcard__hint">Pré-visualização: no acesso real, o paciente registra e fala com você por aqui.</p></div>';
    }
    return '<div class="pcard int-card int-falar">' +
      '<p>Quer me contar isso com as suas palavras?</p>' +
      '<button type="button" class="btn btn--primary" data-int-chat>💬 Falar com a nutri sobre meu intestino</button>' +
    '</div>';
  }

  /* ---------- Eventos (delegação no pane) ---------- */
  function onClick(e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;

    var dia = t.closest("[data-int-dia]");
    if (dia) { _dia = dia.getAttribute("data-int-dia"); pintar(); return; }

    if (t.closest("[data-int-hoje]")) { _dia = hojeISO(); pintar(); return; }
    if (_readonly) return;

    var cls = t.closest("[data-int-cls]");
    if (cls) {
      var atual = porData(_dia);
      var novo = cls.getAttribute("data-int-cls");
      // Clicar de novo na mesma carinha não apaga: apagar tem botão próprio.
      salvar({ classificacao: novo }, atual);
      return;
    }

    var br = t.closest("[data-int-bristol]");
    if (br) {
      var reg = porData(_dia); if (!reg) return;
      var n = +br.getAttribute("data-int-bristol");
      salvar({ bristol: reg.bristol === n ? null : n }, reg);
      return;
    }

    var vz = t.closest("[data-int-vezes]");
    if (vz) {
      var r2 = porData(_dia); if (!r2) return;
      var v = Math.max(0, Math.min(20, (r2.evacuacoes || 0) + (+vz.getAttribute("data-int-vezes"))));
      salvar({ evacuacoes: v }, r2);
      return;
    }

    var sn = t.closest("[data-int-sint]");
    if (sn) {
      var r3 = porData(_dia); if (!r3) return;
      var id = sn.getAttribute("data-int-sint");
      var lista = (Array.isArray(r3.sintomas) ? r3.sintomas : []).slice();
      var pos = lista.indexOf(id);
      if (pos >= 0) lista.splice(pos, 1); else lista.push(id);
      salvar({ sintomas: lista }, r3);
      return;
    }

    if (t.closest("[data-int-apagar]")) {
      var r4 = porData(_dia); if (!r4) return;
      if (!window.confirm("Apagar o registro de " + dataBR(_dia) + "?")) return;
      window.NutriPacientes.removerIntestino(_p.id, _dia).then(function () {
        _regs = _regs.filter(function (x) { return x.data !== _dia; });
        pintar();
      }).catch(function () { alert("Não foi possível apagar. Tente de novo."); });
      return;
    }

    if (t.closest("[data-int-chat]")) {
      if (window.PortalChat && window.PortalChat.abrirCom) window.PortalChat.abrirCom(textoParaChat());
      return;
    }
  }

  function onInput(e) {
    if (_readonly) return;
    var obs = e.target.closest && e.target.closest("[data-int-obs]");
    if (!obs) return;
    var reg = porData(_dia); if (!reg) return;
    clearTimeout(_obsTimer);
    var valor = obs.value;
    _obsTimer = setTimeout(function () { salvar({ observacao: valor }, porData(_dia), true); }, 600);
  }

  /* Salva o dia inteiro (upsert). `silencioso` mantém o foco no textarea:
     redesenhar a tela enquanto ela digita tiraria o cursor do lugar. */
  function salvar(patch, base, silencioso) {
    var reg = Object.assign({
      data: _dia, classificacao: null, bristol: null, evacuacoes: 0, sintomas: [], observacao: ""
    }, base || {}, patch);
    if (!reg.classificacao) return;

    return window.NutriPacientes.salvarIntestino(_p.id, reg).then(function (saved) {
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
    var m = el("int-mes"), d = el("int-dicas");
    if (m) m.innerHTML = calendarioHTML();
    if (d) d.innerHTML = dicasHTML();
  }
  var _salvoTimer = null;
  function marcarSalvo() {
    var s = el("int-salvo"); if (!s) return;
    s.hidden = false;
    clearTimeout(_salvoTimer);
    _salvoTimer = setTimeout(function () { s.hidden = true; }, 1600);
  }

  // Mensagem já pronta para o chat: o contexto que a nutri precisa,
  // sem a paciente ter de resumir a própria semana.
  function textoParaChat() {
    var pad = padraoRecente();
    if (!pad.total) return "Sobre o meu intestino: ";
    var lbl = CLS_MAP[pad.dominante] ? CLS_MAP[pad.dominante].label.toLowerCase() : "";
    var sint = pad.sintomas.map(function (s) { return SINT_MAP[s] ? SINT_MAP[s].label.toLowerCase() : s; });
    return "Sobre o meu intestino: nos últimos 7 dias registrei " + pad.total +
      (pad.total === 1 ? " dia" : " dias") + ", a maioria como " + lbl +
      (sint.length ? ", com " + sint.join(" e ") : "") + ". ";
  }

  /* ============================================================
     FICHA DA NUTRI — leitura
     ============================================================ */
  function render(p) {
    return '<section class="fsec" id="in-sec">' +
      '<div class="fsec__head"><h2 class="fsec__title">🌿 Meu intestino feliz</h2></div>' +
      '<p class="fmuted">Registro feito pelo próprio paciente no portal. Você acompanha; o relato é dele.</p>' +
      '<div id="in-nutri"><div class="empty-state">Carregando registros…</div></div>' +
    '</section>';
  }

  function wireNutri(p, ctx) {
    var host = el("in-nutri");
    if (!host) return;
    window.NutriPacientes.listIntestino(p.id, 90).then(function (regs) {
      host.innerHTML = nutriHTML(regs, p);
    }).catch(function () {
      host.innerHTML = '<div class="empty-state">Não foi possível carregar os registros.</div>';
      if (ctx && ctx.toast) ctx.toast("Falha ao carregar o diário intestinal.", true);
    });
  }

  function nutriHTML(regs, p) {
    if (!regs.length) {
      var liberado = (p.portalFeatures || []).indexOf("intestino") >= 0;
      return '<div class="empty-state">' +
        (liberado
          ? "Nenhum registro ainda. O espaço já está liberado no portal deste paciente."
          : "Este paciente ainda não tem o espaço liberado. Ligue em <strong>Perfil do Paciente › Portal do paciente</strong>.") +
      '</div>';
    }
    var cont = { constipado: 0, regular: 0, diarreia: 0 };
    var sint = {};
    regs.forEach(function (r) {
      if (cont[r.classificacao] != null) cont[r.classificacao]++;
      (Array.isArray(r.sintomas) ? r.sintomas : []).forEach(function (s) { sint[s] = (sint[s] || 0) + 1; });
    });
    var total = regs.length;
    var barras = CLASSES.map(function (c) {
      var pct = Math.round(cont[c.id] * 100 / total);
      return '<div class="in-barra"><span class="in-barra__lbl">' + c.emoji + " " + esc(c.label) + '</span>' +
        '<span class="in-barra__track"><i class="in-barra__fill in-barra__fill--' + c.id + '" style="width:' + pct + '%"></i></span>' +
        '<span class="in-barra__v">' + pct + '% <small>(' + cont[c.id] + ')</small></span></div>';
    }).join("");

    var freq = Object.keys(sint).sort(function (a, b) { return sint[b] - sint[a]; }).slice(0, 5)
      .map(function (s) {
        var m = SINT_MAP[s];
        return '<span class="chip">' + (m ? m.emoji + " " + esc(m.label) : esc(s)) + ' · ' + sint[s] + '</span>';
      }).join("");

    // Faixa dos últimos 30 dias, na ordem do tempo (antigo → recente).
    var hoje = doISO(hojeISO()), faixa = "";
    for (var i = 29; i >= 0; i--) {
      var d = new Date(hoje.getTime()); d.setDate(d.getDate() - i);
      var dia = iso(d);
      var r = regs.filter(function (x) { return x.data === dia; })[0];
      faixa += '<span class="in-tick' + (r ? " in-tick--" + r.classificacao : "") + '" title="' +
        esc(dataBR(dia) + (r ? " — " + CLS_MAP[r.classificacao].label : " — sem registro")) + '"></span>';
    }

    var linhas = regs.slice(0, 20).map(function (r) {
      var c = CLS_MAP[r.classificacao] || { emoji: "", label: r.classificacao };
      var s = (Array.isArray(r.sintomas) ? r.sintomas : [])
        .map(function (x) { return SINT_MAP[x] ? SINT_MAP[x].label : x; }).join(", ");
      return '<tr><td>' + esc(dataBR(r.data)) + '</td>' +
        '<td>' + c.emoji + " " + esc(c.label) + '</td>' +
        '<td>' + (r.bristol ? "Bristol " + r.bristol : "—") + '</td>' +
        '<td>' + (r.evacuacoes || 0) + '×</td>' +
        '<td>' + (s ? esc(s) : "—") + '</td>' +
        '<td>' + (r.observacao ? esc(r.observacao) : "—") + '</td></tr>';
    }).join("");

    return '<div class="in-resumo">' +
        '<div class="in-barras">' + barras + '</div>' +
        '<div class="in-faixa" aria-label="Últimos 30 dias">' + faixa + '</div>' +
        '<div class="in-faixa__lbl">últimos 30 dias · ' + total + ' registros em 90 dias</div>' +
        (freq ? '<div class="in-sint"><span class="fmuted">Sintomas mais frequentes:</span> ' + freq + '</div>' : '') +
      '</div>' +
      '<div class="in-tabela-wrap"><table class="in-tabela">' +
        '<thead><tr><th>Data</th><th>Padrão</th><th>Bristol</th><th>Vezes</th><th>Sintomas</th><th>Observação</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table></div>';
  }

  window.IntestinoView = { portalHTML: portalHTML, wire: wire };
  window.IntestinoNutri = { render: render, wire: wireNutri };
})();
