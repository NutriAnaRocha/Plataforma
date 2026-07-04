/* ============================================================
   PRONTUÁRIO (Tela 5) — render do cabeçalho do paciente, menu de
   módulos e dos 15 módulos clínicos. Depende de prontuario-data.js
   (window.PRONT_DATA) e reaproveita Nútri AI / shell das demais telas.
   ============================================================ */
(function () {
  "use strict";

  // D/P são reatribuídos quando abrimos um paciente REAL (?id=…); sem id, cai
  // no PRONT_DATA (paciente-demo "Marina") só para demonstração do layout.
  var D = window.PRONT_DATA || {};
  var P = D.paciente || {};
  var REAL = false; // true quando carregamos um paciente de verdade do Supabase

  function el(id) { return document.getElementById(id); }
  function cap(s) { s = String(s || ""); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function imcClasse(v) {
    if (v == null) return "—";
    return v < 18.5 ? "Abaixo do peso" : v < 25 ? "Peso normal" : v < 30 ? "Sobrepeso" : v < 35 ? "Obesidade I" : v < 40 ? "Obesidade II" : "Obesidade III";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- componentes utilitários ---------- */
  function card(title, sub, body, actions) {
    var head = (title || actions) ? '<div class="card__head"><div>' +
      (title ? '<h2 class="card__title">' + esc(title) + "</h2>" : "") +
      (sub ? '<p class="card__sub">' + esc(sub) + "</p>" : "") +
      "</div>" + (actions || "") + "</div>" : "";
    return '<section class="card">' + head + '<div class="card__body">' + body + "</div></section>";
  }
  function kv(obj) {
    return '<div class="kv">' + Object.keys(obj).map(function (k) {
      return '<div class="kv__row"><div class="kv__k">' + esc(k) + '</div><div class="kv__v">' + esc(obj[k]) + "</div></div>";
    }).join("") + "</div>";
  }
  function block(label, val) {
    var v = Array.isArray(val) ? (val.length ? '<div class="cliplist">' + val.map(function (x) { return '<span class="clitag">' + esc(x) + "</span>"; }).join("") + "</div>" : '<p class="info-block__text">—</p>')
      : '<p class="info-block__text">' + esc(val || "—") + "</p>";
    return '<div class="info-block"><p class="info-block__label">' + esc(label) + "</p>" + v + "</div>";
  }
  function aiInsight(txt, actions) {
    return '<div class="ai-insight"><div class="ai-insight__head"><span class="ai-insight__badge">🤖 Nútri AI · Análise</span></div>' +
      '<p class="ai-insight__txt">' + txt + "</p>" +
      (actions ? '<div class="ai-insight__actions">' + actions + "</div>" : "") + "</div>";
  }
  function btn(label, cls) { return '<button class="btn ' + (cls || "btn--outline") + '" type="button" style="padding:9px 16px;font-size:.82rem">' + esc(label) + "</button>"; }

  /* mini gráfico de linha (reaproveita .chart) */
  function lineChart(pts, labels, unit, resumo) {
    var W = 560, H = 180, padX = 14, padY = 22;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), span = (max - min) || 1;
    var stepX = (W - padX * 2) / (pts.length - 1);
    function x(i) { return padX + i * stepX; }
    function y(v) { return padY + (H - padY * 2) * (1 - (v - min) / span); }
    var line = pts.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var area = "M" + x(0).toFixed(1) + " " + (H - padY).toFixed(1) + " " + pts.map(function (v, i) { return "L" + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ") + " L" + x(pts.length - 1).toFixed(1) + " " + (H - padY).toFixed(1) + " Z";
    var dots = pts.map(function (v, i) { return '<circle class="chart__pt" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.2) + '"></circle>'; }).join("");
    var lbls = labels.map(function (l, i) { return '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(l) + "</text>"; }).join("");
    return '<div class="chart"><div class="chart__head"><span class="chart__big">' + esc(pts[pts.length - 1]) + (unit || "") + "</span>" +
      (resumo ? '<span class="delta delta--up">▲ ' + esc(resumo) + "</span>" : "") + "</div>" +
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7B284C" stop-opacity="0.22"/><stop offset="100%" stop-color="#7B284C" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="chart__area" d="' + area + '" style="fill:url(#gw)"></path><path class="chart__line" d="' + line + '"></path>' + dots + lbls + "</svg></div>";
  }
  function sparkline(pts) {
    var W = 90, H = 26, p = 3;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), span = (max - min) || 1;
    var step = (W - p * 2) / (pts.length - 1);
    var d = pts.map(function (v, i) { return (i ? "L" : "M") + (p + i * step).toFixed(1) + " " + (p + (H - p * 2) * (1 - (v - min) / span)).toFixed(1); }).join(" ");
    return '<div class="mk-spark"><svg viewBox="0 0 ' + W + " " + H + '"><path d="' + d + '"></path></svg></div>';
  }

  /* ============================================================
     MÓDULOS
     ============================================================ */
  var MODULES = [
    { id: "anamnese",  ico: "🩺", label: "Anamnese e Perfil",   render: mAnamnese },
    { id: "diario",    ico: "📔", label: "Diário Alimentar",    render: mDiario },
    { id: "quest",     ico: "📝", label: "Questionários",       render: mQuest },
    { id: "exames",    ico: "🧪", label: "Exames Laboratoriais",render: mExames },
    { id: "antro",     ico: "📏", label: "Antropometria",       render: mAntro },
    { id: "calc",      ico: "🧮", label: "Cálculos Nutricionais",render: mCalc },
    { id: "plano",     ico: "🥗", label: "Planejamento Alimentar",render: mPlano },
    { id: "metas",     ico: "🎯", label: "Metas e Objetivos",   render: mMetas },
    { id: "orient",    ico: "📚", label: "Orientações",          render: mOrient },
    { id: "manip",     ico: "💊", label: "Manipulados",          render: mManip },
    { id: "anexos",    ico: "📎", label: "Arquivos Anexos",      render: mAnexos },
    { id: "evolucao",  ico: "📋", label: "Evolução Clínica",     render: mEvolucao },
    { id: "chat",      ico: "💬", label: "Chat com Paciente",    render: mChat },
    { id: "docs",      ico: "📄", label: "Documentos",           render: mDocs },
    { id: "fin",       ico: "💰", label: "Financeiro",           render: mFin }
  ];

  /* ---------- 1 · Anamnese ---------- */
  function mAnamnese() {
    var a = D.anamnese || {}, c = a.clinico || {};
    var pessoais = {
      "Nome": P.nome, "Data de nascimento": fmtData(P.nascimento) + " (" + P.idade + " anos)",
      "CPF": P.cpf, "RG": P.rg, "E-mail": P.email, "Telefone": P.telefone,
      "Endereço": P.endereco, "Profissão": P.profissao, "Estado civil": P.estadoCivil
    };
    var intest = a.intestinal || {};
    var html = head("Anamnese e Perfil do Paciente", "Dados pessoais, histórico clínico, hábitos e saúde");
    html += card("Dados pessoais", null, kv(pessoais));
    html += card("Histórico clínico", null,
      block("Doenças atuais", c.doencasAtuais) + block("Diagnósticos prévios", c.diagnosticos) +
      block("Cirurgias", c.cirurgias) + block("Internações", c.internacoes) +
      block("Medicamentos em uso", c.medicamentos) + block("Suplementos em uso", c.suplementos) +
      block("Alergias", c.alergias) + block("Intolerâncias alimentares", c.intolerancias) +
      block("Histórico familiar", c.histFamiliar));
    html += '<div class="grid-2">' +
      card("Hábitos de vida", null, kv(a.habitos || {})) +
      card("Histórico alimentar", null, kv(a.alimentar || {})) + "</div>";
    html += card("Saúde intestinal", null,
      '<div class="grid-3">' +
        miniStat("Frequência evacuatória", intest.frequencia) +
        miniStat("Escala de Bristol", "Tipo " + intest.bristol + bristolHint(intest.bristol)) +
        miniStat("Distensão abdominal", intest.distensao) +
        miniStat("Refluxo", intest.refluxo) + miniStat("Gases", intest.gases) + miniStat("Dor abdominal", intest.dor) +
      "</div>");
    if (P.sexo === "F" && a.mulher) {
      html += card("Saúde da mulher", "Exibido para pacientes do sexo feminino", kv(a.mulher));
    }
    return html;
  }
  function miniStat(k, v) { return '<div class="info-block"><p class="info-block__label">' + esc(k) + '</p><p class="info-block__text">' + esc(v) + "</p></div>"; }
  function bristolHint(n) { var t = { 1: " · ressecado", 2: " · ressecado", 3: " · normal", 4: " · ideal", 5: " · amolecido", 6: " · pastoso", 7: " · diarreico" }; return t[n] || ""; }

  /* ---------- 2 · Diário ---------- */
  function mDiario() {
    var html = head("Diário Alimentar e Sintomas", "Registros enviados pela paciente",
      btn("📅 Ver calendário", "btn--outline"));
    var body = (D.diario || []).map(function (d) {
      var tags = '<div class="diary-tags">' +
        '<span class="diary-tag">' + esc(d.humor) + "</span>" +
        '<span class="diary-tag">⚡ Energia ' + d.energia + "/10</span>" +
        '<span class="diary-tag">😴 ' + d.sono + "h</span>" +
        '<span class="diary-tag">💧 ' + d.agua + "L</span>" + "</div>";
      var meals = (d.refeicoes || []).map(function (m) {
        return '<div class="meal-row"><span class="meal-hora">' + esc(m.hora) + "</span>" +
          '<span class="meal-thumb">' + (m.foto ? "🖼️" : "🍽️") + "</span>" +
          '<div class="meal-info"><div class="meal-nome">' + esc(m.nome) + "</div><div class=\"meal-desc\">" + esc(m.desc) + "</div></div></div>";
      }).join("");
      var sint = (d.sintomas && d.sintomas.length) ? '<p class="info-block__text" style="margin-top:8px">🩹 <strong>Sintomas:</strong> ' + esc(d.sintomas.join(", ")) + "</p>" : "";
      return '<div class="diary-day"><div class="diary-day__head"><span class="diary-day__date">' + fmtData(d.data) + "</span>" + tags + "</div>" + meals + sint + "</div>";
    }).join("");
    html += card("Registros recentes", null, body);
    return html;
  }

  /* ---------- 3 · Questionários ---------- */
  function mQuest() {
    var html = head("Questionários de Saúde", "Biblioteca com pontuação e relatórios automáticos",
      btn("+ Aplicar questionário", "btn--primary"));
    var grid = '<div class="qz-grid">' + (D.questionarios || []).map(function (q) {
      var pts = q.pontuacao == null ? "—" : q.pontuacao + "<small style='font-size:.7rem;color:var(--texto-sutil)'>/" + q.max + "</small>";
      return '<div class="qz"><span class="qz__ico">' + q.ico + "</span>" +
        '<div class="qz__info"><div class="qz__nome">' + esc(q.nome) + "</div>" +
        '<div class="qz__meta">' + esc(q.status) + " · " + esc(q.data) + "</div></div>" +
        '<div class="qz__score"><div class="qz__pts">' + pts + "</div>" +
        '<span class="qz__faixa fx-' + q.cor + '">' + esc(q.faixa) + "</span></div></div>";
    }).join("") + "</div>";
    html += card(null, null, grid);
    html += card(null, null, aiInsight(
      "Os escores sugerem <strong>ansiedade moderada</strong> e <strong>qualidade de sono ruim</strong>, fatores que " +
      "se relacionam à compulsão alimentar noturna relatada. Vale priorizar higiene do sono e manejo do estresse junto da conduta nutricional.",
      btn("Gerar relatório dos questionários", "btn--primary")));
    return html;
  }

  /* ---------- 4 · Exames ---------- */
  function mExames() {
    var ex = D.exames || {};
    var html = head("Exames Laboratoriais", "Última coleta: " + (ex.datas ? ex.datas[ex.datas.length - 1] : "—"),
      btn("⬆ Enviar exame", "btn--primary"));
    html += card(null, null,
      '<div class="dropzone"><span class="dropzone__ico">⬆️</span>Arraste um <strong>PDF, imagem ou foto</strong> do exame aqui, ou clique para selecionar.<br><span style="font-size:.74rem">A IA faz a leitura e o cadastro automático dos marcadores.</span></div>');
    html += card(null, null, aiInsight(ex.iaResumo,
      btn("Gerar resumo clínico completo", "btn--primary") + btn("Comparar com exame anterior", "btn--outline")));

    var tbl = (ex.grupos || []).map(function (g) {
      var rows = g.marcadores.map(function (m) {
        var flag = m.status === "alto" ? "flag-alto" : m.status === "baixo" ? "flag-baixo" : "flag-normal";
        var flabel = m.status === "alto" ? "Alto" : m.status === "baixo" ? "Baixo" : "Normal";
        return '<div class="mk-row"><span class="mk-name">' + esc(m.nome) + "</span>" +
          '<span class="mk-val ' + (m.status !== "normal" ? flag : "") + '">' + esc(m.valor) + " " + esc(m.un) + "</span>" +
          '<span class="mk-ref">Ref: ' + esc(m.ref) + "</span>" +
          '<span class="mk-flag ' + flag + '">' + flabel + "</span>" +
          sparkline(m.hist) + "</div>";
      }).join("");
      return card(g.grupo, null, '<div class="mk-table"><div class="mk-row is-head"><span>Marcador</span><span>Resultado</span><span>Referência</span><span>Status</span><span>Tendência</span></div>' + rows + "</div>");
    }).join("");
    return html + tbl;
  }

  /* ---------- 5 · Antropometria ---------- */
  function mAntro() {
    var an = D.antropometria || {}, med = an.medidas || [];
    var last = med[med.length - 1] || {}, first = med[0] || {};
    var pesos = med.map(function (m) { return m.peso; });
    var labels = med.map(function (m) { return m.data.slice(0, 5); });
    var html = head("Antropometria e Bioimpedância", "Medidas, dobras cutâneas e composição corporal",
      btn("+ Nova avaliação", "btn--primary"));

    html += card("Evolução do peso", first.data + " → " + last.data, lineChart(pesos, labels, " kg", (first.peso - last.peso).toFixed(1) + " kg"));

    var medGrid = '<div class="grid-3">' +
      miniStat("Peso atual", last.peso + " kg") + miniStat("Altura", last.altura + " cm") + miniStat("IMC", last.imc + " kg/m²") +
      miniStat("Circ. abdominal", last.abdomen + " cm") + miniStat("Cintura", last.cintura + " cm") + miniStat("Quadril", last.quadril + " cm") +
      miniStat("Braço", last.braco + " cm") + miniStat("Coxa", last.coxa + " cm") + miniStat("Panturrilha", last.panturrilha + " cm") + "</div>";
    html += card("Antropometria atual", null, medGrid);
    html += '<div class="grid-2">' + card("Dobras cutâneas", null, kv(an.dobras || {})) + card("Bioimpedância", null, kv(an.bioimpedancia || {})) + "</div>";
    html += card(null, null, aiInsight(
      "Redução consistente: <strong>peso −" + (first.peso - last.peso).toFixed(1) + " kg</strong> e <strong>circunferência abdominal −" + (first.abdomen - last.abdomen) + " cm</strong> desde a 1ª avaliação. " +
      "O perfil indica perda de gordura preservando massa magra — manter o estímulo de resistência."));
    return html;
  }

  /* ---------- 6 · Cálculos ---------- */
  function mCalc() {
    var c = D.calculos || {};
    var html = head("Cálculos Nutricionais", "Fórmula ativa: " + c.formula);
    var chips = (c.formulasDisponiveis || []).map(function (f) {
      return '<button class="chip"' + (f === c.formula ? ' aria-pressed="true"' : "") + ' type="button">' + esc(f) + "</button>";
    }).join("");
    html += card("Fórmulas disponíveis", null, '<div class="cliplist">' + chips + "</div>");
    html += card("Resultados", null,
      '<div class="grid-3">' +
        miniStat("TMB", c.tmb + " kcal") + miniStat("Fator atividade", "× " + c.fatorAtividade) +
        miniStat("Fator injúria", "× " + c.fatorInjuria) + miniStat("Fator térmico", "× " + c.fatorTermico) +
        miniStat("GET", c.get + " kcal") + miniStat("VET (com ajuste " + c.ajusteManual + ")", "<strong style='color:var(--vinho)'>" + c.vet + " kcal</strong>") +
      "</div>");
    html += card("Memória de cálculo", null, '<div class="kv">' + (c.memoria || []).map(function (m) { return '<div class="kv__row" style="grid-template-columns:1fr"><div class="kv__v">' + esc(m) + "</div></div>"; }).join("") + "</div>");
    return html;
  }

  /* ---------- 7 · Plano alimentar ---------- */
  function mPlano() {
    var pl = D.plano || {};
    var html = head("Planejamento Alimentar", pl.protocoloAtivo,
      btn("🤖 Gerar com Nútri AI", "btn--primary") + " " + btn("🛒 Lista de compras", "btn--outline"));

    var protochips = (pl.protocolos || []).map(function (p) {
      return '<button class="chip"' + (pl.protocoloAtivo && pl.protocoloAtivo.indexOf(p) > -1 ? ' aria-pressed="true"' : "") + ' type="button">' + esc(p) + "</button>";
    }).join("");
    html += card("Biblioteca de protocolos", null, '<div class="cliplist">' + protochips + "</div>");

    var meals = (pl.refeicoes || []).map(function (m) {
      var foods = m.itens.map(function (it) {
        return '<div class="food-row"><span class="food-name"><span class="food-check" data-check></span>' + esc(it.alimento) + "</span>" +
          '<span class="food-qtd">' + esc(it.qtd) + "</span><span class=\"food-kcal\">" + it.kcal + " kcal</span></div>";
      }).join("");
      var foot = (m.subs || m.obs) ? '<div class="meal-card__foot">' + (m.subs ? "🔄 <strong>Substituição:</strong> " + esc(m.subs) + "  " : "") + (m.obs ? "📝 " + esc(m.obs) : "") + "</div>" : "";
      return '<div class="meal-card"><div class="meal-card__head"><span class="meal-card__nome">' + esc(m.nome) + '</span><span class="meal-card__hora">⏰ ' + esc(m.hora) + '</span><span class="meal-card__kcal">' + m.kcal + " kcal</span></div>" + foods + foot + "</div>";
    }).join("");
    html += card("Refeições", "Marque os itens consumidos (visão do paciente)", meals);

    var t = pl.totais || {}, meta = pl.metasMacro || {};
    function macro(lbl, val, mt, unit) {
      var pct = mt ? Math.min(100, Math.round(val / mt * 100)) : 0;
      return '<div class="macro"><div class="macro__val">' + val + unit + '</div><div class="macro__lbl">' + lbl + " · meta " + mt + unit + '</div><div class="bar"><div class="bar__fill" style="width:' + pct + '%"></div></div></div>';
    }
    html += card("Totais nutricionais do dia", t.kcal + " kcal",
      '<div class="macro-grid">' +
        macro("Proteínas", t.ptn, meta.ptn, "g") + macro("Carboidratos", t.cho, meta.cho, "g") +
        macro("Gorduras", t.lip, meta.lip, "g") + macro("Fibras", t.fib, meta.fib, "g") +
        '<div class="macro"><div class="macro__val">' + t.kcal + '</div><div class="macro__lbl">Calorias · meta ' + (D.calculos ? D.calculos.vet : "") + '</div></div>' +
      "</div>");
    html += card("Vitaminas e minerais (cobertura estimada)", null, kv(pl.micros || {}));
    return html;
  }

  /* ---------- 8 · Metas ---------- */
  function mMetas() {
    var html = head("Metas e Objetivos", "Acompanhamento do progresso");
    var body = (D.metas || []).map(function (g) {
      var pct;
      if (g.invert) pct = Math.round((g.inicial - g.atual) / (g.inicial - g.meta) * 100);
      else pct = Math.round((g.atual - g.inicial) / (g.meta - g.inicial) * 100);
      pct = Math.max(0, Math.min(100, pct));
      return '<div class="goal"><span class="goal__ico">' + g.ico + "</span>" +
        '<div class="goal__main"><div class="goal__top"><span class="goal__nome">' + esc(g.nome) + "</span>" +
        '<span class="goal__nums">atual <b>' + g.atual + " " + g.un + "</b> · meta " + g.meta + " " + g.un + "</span></div>" +
        '<div class="bar"><div class="bar__fill" style="width:' + pct + '%"></div></div></div>' +
        '<span class="goal__pct">' + pct + "%</span></div>";
    }).join("");
    html += card(null, null, body);
    return html;
  }

  /* ---------- 9 · Orientações ---------- */
  function mOrient() {
    var html = head("Orientações Nutricionais", "Biblioteca de materiais para enviar à paciente",
      btn("+ Criar material", "btn--primary"));
    var grid = '<div class="tile-grid">' + (D.orientacoes || []).map(function (o) {
      return tile(o.ico, o.titulo, o.tipo + " · " + o.tam + " · " + o.data, "📤");
    }).join("") + "</div>";
    html += card(null, null, grid);
    return html;
  }

  /* ---------- 10 · Manipulados ---------- */
  function mManip() {
    var html = head("Prescrição de Manipulados", "Fórmulas e histórico",
      btn("+ Nova prescrição", "btn--primary"));
    var body = (D.manipulados || []).map(function (m) {
      var st = m.status === "Ativo" ? '<span class="status-pill status-Ativo">Ativo</span>' : '<span class="status-pill status-Inativo">Encerrado</span>';
      return '<div class="rx"><div class="rx__head"><span class="goal__ico">💊</span><span class="rx__nome">' + esc(m.nome) + '</span><span style="margin-left:auto">' + st + "</span></div>" +
        '<div class="rx__grid">' +
          rxk("Dosagem", m.dosagem) + rxk("Posologia", m.posologia) + rxk("Horário", m.horario) + rxk("Duração", m.duracao) +
        "</div>" + (m.obs ? '<p class="rx__obs">📝 ' + esc(m.obs) + "</p>" : "") + "</div>";
    }).join("");
    return html + card(null, null, body);
  }
  function rxk(k, v) { return '<div><div class="rx__k">' + esc(k) + '</div><div class="rx__v">' + esc(v) + "</div></div>"; }

  /* ---------- 11 · Anexos ---------- */
  function mAnexos() {
    var html = head("Arquivos Anexos", "Organização automática por categoria",
      btn("⬆ Enviar arquivo", "btn--primary"));
    html += card(null, null, '<div class="dropzone"><span class="dropzone__ico">📎</span>Solte aqui exames, relatórios, receitas, fotos ou documentos.</div>');
    var cats = {};
    (D.anexos || []).forEach(function (a) { (cats[a.categoria] = cats[a.categoria] || []).push(a); });
    var body = Object.keys(cats).map(function (cat) {
      return '<p class="cat-label">' + esc(cat) + "</p><div class=\"tile-grid\">" +
        cats[cat].map(function (a) { return tile(a.ico, a.nome, a.tam + " · " + a.data, "⬇"); }).join("") + "</div>";
    }).join("");
    return html + card(null, null, body);
  }

  function tile(ico, title, meta, action) {
    return '<div class="tile"><span class="tile__ico">' + ico + '</span><div class="tile__info"><div class="tile__title">' + esc(title) + '</div><div class="tile__meta">' + esc(meta) + "</div></div>" +
      (action ? '<button class="tile__btn" type="button">' + action + "</button>" : "") + "</div>";
  }

  /* ---------- 12 · Evolução clínica ---------- */
  function mEvolucao() {
    var html = head("Prontuário e Evolução Clínica", "Registro cronológico dos atendimentos",
      btn("+ Nova evolução", "btn--primary"));
    var tl = '<div class="timeline">' + (D.evolucao || []).map(function (e) {
      return '<div class="tl-item"><div class="tl-date">' + esc(e.data) + " · " + esc(e.tipo) + "</div>" +
        block("Queixa principal", e.queixa) + block("Evolução", e.evolucao) +
        block("Diagnóstico nutricional", e.diagnostico) + block("Conduta", e.conduta) +
        block("Metas definidas", e.metas) + (e.obs ? block("Observações", e.obs) : "") + "</div>";
    }).join("") + "</div>";
    return html + card(null, null, tl);
  }

  /* ---------- 13 · Chat ---------- */
  function mChat() {
    var html = head("Chat com Paciente", "Mensagens, fotos, áudios e arquivos");
    var msgs = (D.chat || []).map(function (m) {
      var inner;
      if (m.tipo === "foto") inner = '<span class="cmsg--media">🖼️ ' + esc(m.conteudo) + "</span>";
      else if (m.tipo === "audio") inner = '<span class="cmsg--media">🎤 ' + esc(m.conteudo) + "</span>";
      else if (m.tipo === "arquivo") inner = '<span class="cmsg--media">📎 ' + esc(m.conteudo) + "</span>";
      else inner = esc(m.conteudo);
      return '<div class="cmsg cmsg--' + m.de + '">' + inner + '<div class="cmsg__hora">' + esc(m.hora) + "</div></div>";
    }).join("");
    var box = '<div class="chatbox">' + msgs + "</div>" +
      '<div class="chat-input"><button class="chat-tool" type="button" aria-label="Anexar">📎</button>' +
      '<button class="chat-tool" type="button" aria-label="Áudio">🎤</button>' +
      '<input type="text" placeholder="Escreva uma mensagem…" aria-label="Mensagem" />' +
      '<button class="chat-tool chat-tool--send" type="button" aria-label="Enviar">➤</button></div>';
    return html + card(null, null, box);
  }

  /* ---------- 14 · Documentos ---------- */
  function mDocs() {
    var html = head("Documentos", "Geração automática com assinatura digital",
      btn("+ Gerar documento", "btn--primary"));
    var grid = '<div class="tile-grid">' + (D.documentos || []).map(function (d) {
      return tile(d.ico, d.titulo, d.tipo + " · " + d.data, "⬇");
    }).join("") + "</div>";
    html += card(null, null, grid);
    html += card(null, null, '<p class="info-block__text">✍️ <strong>Assinatura digital integrada</strong> — todos os documentos saem assinados eletronicamente (ICP-Brasil / e-CPF) e com QR de validação.</p>');
    return html;
  }

  /* ---------- 15 · Financeiro ---------- */
  function mFin() {
    var f = D.financeiro || {}, r = f.resumo || {};
    var html = head("Financeiro", "Controle financeiro individual da paciente");
    html += card(null, null,
      '<div class="fin-cards">' +
        '<div class="fin-card"><div class="fin-card__lbl">Recebido</div><div class="fin-card__val ok">R$ ' + r.recebido + "</div></div>" +
        '<div class="fin-card"><div class="fin-card__lbl">Pendente</div><div class="fin-card__val pend">R$ ' + r.pendente + "</div></div>" +
        '<div class="fin-card"><div class="fin-card__lbl">Consultas realizadas</div><div class="fin-card__val">' + r.consultasRealizadas + "</div></div>" +
        '<div class="fin-card"><div class="fin-card__lbl">Consultas futuras</div><div class="fin-card__val">' + r.consultasFuturas + "</div></div>" +
      "</div>");
    var rows = (f.lancamentos || []).map(function (l) {
      var stcls = l.status === "Pago" ? "flag-normal" : "flag-baixo";
      return '<div class="fin-row"><span class="fin-data">' + esc(l.data) + "</span><span>" + esc(l.desc) + "</span>" +
        '<span class="fin-metodo mk-ref">' + esc(l.metodo) + "</span>" +
        '<span class="mk-flag ' + stcls + '">' + esc(l.status) + "</span>" +
        '<span class="fin-val">R$ ' + l.valor + "</span></div>";
    }).join("");
    html += card("Lançamentos", null,
      '<div class="fin-row is-head"><span>Data</span><span>Descrição</span><span>Método</span><span>Status</span><span style="text-align:right">Valor</span></div>' + rows);
    html += card("Formas de pagamento integradas", null, '<div class="pay-list">' + (f.metodos || []).map(function (m) { return '<span class="pay-chip">' + esc(m) + "</span>"; }).join("") + "</div>");
    return html;
  }

  /* ---------- head de módulo ---------- */
  function head(title, sub, actions) {
    return '<div class="modpane__head"><div><h1 class="modpane__title">' + esc(title) + "</h1>" +
      (sub ? '<p class="modpane__sub">' + esc(sub) + "</p>" : "") + "</div>" +
      (actions ? "<div>" + actions + "</div>" : "") + "</div>";
  }

  /* ---------- util data ---------- */
  function fmtData(iso) {
    if (!iso || iso.indexOf("-") < 0) return iso || "—";
    var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0];
  }

  /* ============================================================
     CABEÇALHO + RAIL + INIT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    var id = new URLSearchParams(location.search).get("id");
    var boot = function () { renderHeader(); renderRail(); show(MODULES[0].id); initAI(); initMobileNav(); };
    if (!id || !(window.NutriPacientes && window.NutriPacientes.get)) { REAL = false; boot(); return; }
    // Enquanto carrega, mostra um placeholder mínimo no cabeçalho.
    el("pc-head").innerHTML = '<div class="empty-state">Carregando prontuário…</div>';
    window.NutriPacientes.get(id).then(function (pac) {
      if (!pac) throw new Error("nao_encontrado");
      REAL = true;
      buildFromPatient(pac);
      boot();
    }).catch(function () {
      // Sem acesso / não encontrado → não vaza dados de outro paciente: cai na demo.
      REAL = false; boot();
    });
  });

  // Mapeia o paciente real (tabela pacientes + jsonb prontuario) para o shape D/P.
  function buildFromPatient(pac) {
    var pr = pac.prontuario || {};
    var ident = pr.paciente || {};
    P = {
      nome: pac.nome, ini: pac.ini, sexo: pac.sexo, idade: pac.idade, status: cap(pac.status),
      nascimento: ident.nascimento || "",
      cpf: ident.cpf || "—", rg: ident.rg || "—",
      email: (pac.contato && pac.contato.email) || ident.email || "—",
      telefone: (pac.contato && pac.contato.tel) || ident.telefone || "—",
      endereco: ident.endereco || "—", profissao: ident.profissao || "—", estadoCivil: ident.estadoCivil || "—",
      primeiraConsulta: ident.primeiraConsulta || "—",
      ultimoAtendimento: pac.ultConsulta || ident.ultimoAtendimento || "—",
      proximaConsulta: pac.proxConsulta || ident.proximaConsulta || "—"
    };
    D = pr;
    D.resumo = {
      pesoAtual: pac.pesoAtual, pesoInicial: pac.pesoInicial, pesoMeta: pac.meta,
      imc: pac.imc, imcClasse: imcClasse(pac.imc),
      objetivo: pac.objetivo || "—", adesao: pac.adesao,
      ultimosExames: (pr.resumo && pr.resumo.ultimosExames) || "—"
    };
    D.aiSugestoes = D.aiSugestoes || [];
    D.aiRespostaDemo = D.aiRespostaDemo || "Posso ajudar com a análise deste paciente.";
  }

  // Um módulo está "vazio" quando o paciente real ainda não tem aquele registro.
  var EMPTY_TESTS = {
    anamnese: function () { return !D.anamnese; },
    diario:   function () { return !(D.diario && D.diario.length); },
    quest:    function () { return !(D.questionarios && D.questionarios.length); },
    exames:   function () { return !(D.exames && D.exames.grupos && D.exames.grupos.length); },
    antro:    function () { return !(D.antropometria && D.antropometria.medidas && D.antropometria.medidas.length); },
    calc:     function () { return !D.calculos; },
    plano:    function () { return !(D.plano && D.plano.refeicoes && D.plano.refeicoes.length); },
    metas:    function () { return !(D.metas && D.metas.length); },
    orient:   function () { return !(D.orientacoes && D.orientacoes.length); },
    manip:    function () { return !(D.manipulados && D.manipulados.length); },
    anexos:   function () { return !(D.anexos && D.anexos.length); },
    evolucao: function () { return !(D.evolucao && D.evolucao.length); },
    chat:     function () { return !(D.chat && D.chat.length); },
    docs:     function () { return !(D.documentos && D.documentos.length); },
    fin:      function () { return !(D.financeiro && D.financeiro.lancamentos && D.financeiro.lancamentos.length); }
  };
  function isEmpty(id) { var t = EMPTY_TESTS[id]; return t ? t() : false; }
  function emptyModule(mod) {
    return head(mod.label, "Ainda sem registros para este paciente.") +
      card(null, null, '<div class="empty-state">Nenhum registro em <strong>' + esc(mod.label) + '</strong> ainda.</div>');
  }

  function renderHeader() {
    var r = D.resumo || {};
    var hasPeso = r.pesoAtual != null && r.pesoInicial != null;
    var diff = hasPeso ? (r.pesoAtual - r.pesoInicial) : null;
    var faltam = (r.pesoAtual != null && r.pesoMeta != null) ? (r.pesoAtual - r.pesoMeta).toFixed(1) + " kg" : "—";
    function nn(v, u) { return v == null ? "—" : v + (u || ""); }
    el("pc-head").innerHTML =
      '<div class="pc-top">' +
        '<div class="pc-photo">' + esc(P.ini) + "</div>" +
        '<div class="pc-id">' +
          '<h1 class="pc-name">' + esc(P.nome) + ' <span class="status-pill status-' + esc(P.status) + '">' + esc(P.status) + "</span></h1>" +
          '<p class="pc-sub">' + P.idade + " anos · " + esc(P.profissao) + " · " + (P.sexo === "F" ? "Feminino" : "Masculino") + "</p>" +
          '<div class="idgrid">' +
            ig("Nascimento", fmtData(P.nascimento)) + ig("CPF", P.cpf) + ig("E-mail", P.email) + ig("Telefone", P.telefone) +
            ig("Profissão", P.profissao) + ig("1ª consulta", P.primeiraConsulta) + ig("Último atend.", P.ultimoAtendimento) + ig("Próxima consulta", P.proximaConsulta) +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="qsum">' +
        qs("Peso atual", nn(r.pesoAtual, "<small> kg</small>"), r.pesoInicial != null ? "Inicial " + r.pesoInicial + " kg" : "") +
        qs("Diferença", diff == null ? "—" : (diff > 0 ? "+" : "") + diff.toFixed(1) + "<small> kg</small>", (diff != null && diff < 0 ? "down" : "up"), diff == null ? "" : (diff < 0 ? "▼ emagreceu" : "▲ ganhou")) +
        qs("IMC atual", nn(r.imc, "<small> kg/m²</small>"), r.imcClasse || "") +
        qs("Adesão ao plano", nn(r.adesao, "<small> %</small>"), "últimas semanas") +
      "</div>" +
      '<div class="qsum" style="margin-top:var(--sp-3)">' +
        qs("Objetivo principal", "<span style='font-size:1rem'>" + esc(r.objetivo || "—") + "</span>", "") +
        qs("Peso meta", nn(r.pesoMeta, "<small> kg</small>"), "faltam " + faltam) +
        qs("Últimos exames", "<span style='font-size:.95rem'>" + esc(r.ultimosExames || "—") + "</span>", "") +
        qs("Status", "<span style='font-size:1rem'>" + esc(P.status) + "</span>", "paciente") +
      "</div>";

    function ig(k, v) { return '<div><div class="idgrid__k">' + esc(k) + '</div><div class="idgrid__v">' + esc(v) + "</div></div>"; }
    function qs(lbl, val, hintOrCls, hint2) {
      var hintCls = "", hint = hintOrCls;
      if (hintOrCls === "down" || hintOrCls === "up") { hintCls = " " + hintOrCls; hint = hint2; }
      return '<div class="qsum__item"><div class="qsum__lbl">' + esc(lbl) + '</div><div class="qsum__val">' + val + "</div>" +
        (hint ? '<div class="qsum__hint' + hintCls + '">' + esc(hint) + "</div>" : "") + "</div>";
    }
  }

  function renderRail() {
    var visible = MODULES; // todos
    el("modrail").innerHTML = visible.map(function (m, i) {
      return '<button class="modrail__item" data-mod="' + m.id + '" type="button">' +
        '<span class="ico">' + m.ico + '</span><span class="txt">' + esc(m.label) + "</span></button>";
    }).join("");
    el("modrail").querySelectorAll(".modrail__item").forEach(function (b) {
      b.addEventListener("click", function () { show(b.dataset.mod, true); });
    });
  }

  function show(id, userInitiated) {
    var mod = MODULES.filter(function (m) { return m.id === id; })[0] || MODULES[0];
    el("modulo").innerHTML = (REAL && isEmpty(mod.id)) ? emptyModule(mod) : mod.render();
    el("modrail").querySelectorAll(".modrail__item").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.mod === mod.id);
    });
    bindFoodChecks();
    /* rola até o topo do painel só quando o usuário troca de módulo (evita rolar no load) */
    if (userInitiated) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindFoodChecks() {
    el("modulo").querySelectorAll("[data-check]").forEach(function (c) {
      c.addEventListener("click", function () { c.classList.toggle("is-on"); });
    });
  }

  /* ---------- Nútri AI (reaproveitado do dashboard) ---------- */
  function initAI() {
    var fab = el("ai-fab"), panel = el("ai-panel"), close = el("ai-close"),
      thread = el("ai-thread"), input = el("ai-text"), send = el("ai-send"), suggest = el("ai-suggest");
    if (!fab || !panel) return;
    function open() { panel.classList.add("is-open"); fab.classList.add("is-hidden"); setTimeout(function () { input && input.focus(); }, 200); }
    function hide() { panel.classList.remove("is-open"); fab.classList.remove("is-hidden"); }
    fab.addEventListener("click", open); close.addEventListener("click", hide);
    if (suggest) {
      suggest.innerHTML = (D.aiSugestoes || []).map(function (s) { return '<button class="ai-suggest__chip" type="button">' + esc(s) + "</button>"; }).join("");
      suggest.querySelectorAll(".ai-suggest__chip").forEach(function (c) { c.addEventListener("click", function () { sendMsg(c.textContent); }); });
    }
    function addMsg(html, who) { var m = document.createElement("div"); m.className = "msg msg--" + who; m.innerHTML = html; thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m; }
    function sendMsg(text) {
      text = (text || "").trim(); if (!text) return;
      addMsg(esc(text), "me"); if (input) input.value = ""; if (suggest) suggest.style.display = "none";
      var typing = addMsg('<span class="msg--typing"><span></span><span></span><span></span></span>', "ai");
      setTimeout(function () { typing.innerHTML = D.aiRespostaDemo || "Posso ajudar com isso!"; thread.scrollTop = thread.scrollHeight; }, 1100);
    }
    send.addEventListener("click", function () { sendMsg(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") sendMsg(input.value); });
  }

  function initMobileNav() {
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }
})();
