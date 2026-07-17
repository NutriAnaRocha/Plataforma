/* ============================================================
   QUESTIONÁRIOS & ANAMNESE DE RETORNO — modelos pré-prontos na ficha.
   Fase 1 (interna): a nutri escolhe um modelo, preenche na tela e salva
   no histórico; ou gera um PDF EM BRANCO (com a identidade dela) para
   mandar ao paciente responder antes da consulta (via WhatsApp).
   Fase 2 (futura): o paciente responde online no portal e cai aqui sozinho.

   Guarda tudo em pacientes.questionarios (jsonb, array de itens):
     { id, tipo:"questionario", modeloId, titulo, data, respostas:[{label,valor}], status }
   Exposto como window.Questionarios; usado pela ficha (pacientes.js).
   Reaproveita o motor de documento window.NutriDoc para os PDFs.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function uid() { return "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function hojeISO() { return new Date().toISOString().slice(0, 10); }
  function fmtData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || "—");
  }

  /* ============================================================
     MODELOS — perguntas pré-prontas por questionário.
     Tipos de campo: "texto" (curto), "textarea" (longo), "select".
     `sexo` (opcional) mostra o modelo só para aquele sexo.
     ============================================================ */
  var SIM_NAO = ["Sim", "Não", "Às vezes"];
  var BRISTOL = ["1 — cíbalos duros", "2 — grumoso", "3 — rachado", "4 — liso/macio", "5 — pastoso", "6 — fofo", "7 — líquido"];

  var MODELOS = [
    {
      id: "pre_consulta", ico: "📋", nome: "Pré-consulta",
      desc: "Conhecer o paciente antes da primeira consulta.",
      perguntas: [
        { id: "objetivo", tipo: "textarea", label: "Qual é o seu principal objetivo com o acompanhamento?" },
        { id: "rotina", tipo: "textarea", label: "Como é a sua rotina num dia comum (trabalho, horários)?" },
        { id: "refeicoes", tipo: "textarea", label: "O que você costuma comer em cada refeição do dia?" },
        { id: "liquidos", tipo: "texto", label: "Quanto de água/líquidos por dia?", ph: "ex.: 1,5 L" },
        { id: "restricoes", tipo: "textarea", label: "Alergias, intolerâncias ou alimentos que evita?" },
        { id: "atividade", tipo: "texto", label: "Pratica atividade física? Qual e com que frequência?" },
        { id: "sono", tipo: "texto", label: "Como está o seu sono (horas e qualidade)?" },
        { id: "intestino", tipo: "texto", label: "Como funciona o seu intestino?" },
        { id: "suplementos", tipo: "textarea", label: "Usa algum suplemento ou medicamento? Quais?" },
        { id: "dietas", tipo: "textarea", label: "Já fez dietas antes? Como foi a experiência?" },
        { id: "expectativa", tipo: "textarea", label: "O que você espera desse acompanhamento?" }
      ]
    },
    {
      id: "recordatorio24h", ico: "🍽️", nome: "Recordatório alimentar 24h",
      desc: "Tudo o que o paciente comeu nas últimas 24 horas.",
      perguntas: [
        { id: "desjejum", tipo: "textarea", label: "Café da manhã (o quê, quanto e a que horas)" },
        { id: "lanche_manha", tipo: "textarea", label: "Lanche da manhã" },
        { id: "almoco", tipo: "textarea", label: "Almoço" },
        { id: "lanche_tarde", tipo: "textarea", label: "Lanche da tarde" },
        { id: "jantar", tipo: "textarea", label: "Jantar" },
        { id: "ceia", tipo: "textarea", label: "Ceia / antes de dormir" },
        { id: "bebidas", tipo: "textarea", label: "Bebidas ao longo do dia (água, café, refri, álcool…)" }
      ]
    },
    {
      id: "habitos", ico: "🕒", nome: "Hábitos e estilo de vida",
      desc: "Sono, estresse, atividade e consumo.",
      perguntas: [
        { id: "sono", tipo: "texto", label: "Sono: horas por noite e qualidade" },
        { id: "trabalho", tipo: "texto", label: "Trabalho e nível de atividade no dia" },
        { id: "estresse", tipo: "texto", label: "Nível de estresse atual" },
        { id: "atividade", tipo: "texto", label: "Atividade física (tipo e frequência)" },
        { id: "alcool", tipo: "texto", label: "Consumo de álcool" },
        { id: "tabaco", tipo: "texto", label: "Fumo / tabaco" },
        { id: "agua", tipo: "texto", label: "Consumo de água por dia" }
      ]
    },
    {
      id: "intestinal", ico: "🌿", nome: "Saúde intestinal",
      desc: "Frequência, forma das fezes e sintomas digestivos.",
      perguntas: [
        { id: "frequencia", tipo: "texto", label: "Frequência de evacuação", ph: "ex.: 1x ao dia" },
        { id: "bristol", tipo: "select", label: "Aspecto das fezes (escala de Bristol)", opcoes: BRISTOL },
        { id: "distensao", tipo: "select", label: "Distensão / inchaço abdominal", opcoes: SIM_NAO },
        { id: "gases", tipo: "select", label: "Gases em excesso", opcoes: SIM_NAO },
        { id: "refluxo", tipo: "select", label: "Refluxo / azia", opcoes: SIM_NAO },
        { id: "dor", tipo: "textarea", label: "Dor ou desconforto abdominal (quando e onde)" }
      ]
    },
    {
      id: "saude_mulher", ico: "♀️", nome: "Saúde da mulher", sexo: "F",
      desc: "Ciclo menstrual, hormônios e saúde reprodutiva.",
      perguntas: [
        { id: "menarca", tipo: "texto", label: "Idade da primeira menstruação (menarca)" },
        { id: "ciclo_regular", tipo: "select", label: "Ciclo menstrual regular?", opcoes: SIM_NAO },
        { id: "tpm", tipo: "textarea", label: "Sintomas de TPM" },
        { id: "anticoncepcional", tipo: "texto", label: "Usa anticoncepcional? Qual?" },
        { id: "gestacoes", tipo: "texto", label: "Gestações / partos" },
        { id: "sop", tipo: "select", label: "Diagnóstico de SOP?", opcoes: ["Sim", "Não", "Em investigação"] },
        { id: "menopausa", tipo: "texto", label: "Menopausa / climatério (se aplicável)" }
      ]
    },
    {
      id: "retorno", ico: "🔁", nome: "Anamnese de retorno",
      desc: "Evolução desde a última consulta — para as consultas de retorno.",
      perguntas: [
        { id: "adesao", tipo: "textarea", label: "Como foi a adesão ao plano desde a última consulta?" },
        { id: "dificuldades", tipo: "textarea", label: "Quais foram as maiores dificuldades?" },
        { id: "peso", tipo: "texto", label: "Mudanças percebidas no peso / nas medidas" },
        { id: "sintomas", tipo: "textarea", label: "Novos sintomas ou queixas?" },
        { id: "fome", tipo: "texto", label: "Como estão a fome e a saciedade?" },
        { id: "funcionou", tipo: "textarea", label: "O que funcionou bem e você quer manter?" },
        { id: "exames_novos", tipo: "texto", label: "Trouxe exames novos? Quais?" },
        { id: "ajustes", tipo: "textarea", label: "Ajustes desejados / observações" }
      ]
    }
  ];
  var MODELO_BY_ID = {};
  MODELOS.forEach(function (m) { MODELO_BY_ID[m.id] = m; });

  function modelosPara(p) {
    return MODELOS.filter(function (m) { return !m.sexo || m.sexo === p.sexo; });
  }

  /* ============================================================
     RENDER — visão de lista (seletor de modelos + histórico)
     ============================================================ */
  function render(p) {
    return '<div id="quest-root">' + listaHTML(p) + '</div>';
  }

  function listaHTML(p) {
    var cards = modelosPara(p).map(function (m) {
      return '<div class="qmodelo">' +
        '<div class="qmodelo__top"><span class="qmodelo__ico">' + m.ico + '</span>' +
          '<span class="qmodelo__nome">' + esc(m.nome) + '</span></div>' +
        '<p class="qmodelo__desc">' + esc(m.desc) + '</p>' +
        '<div class="qmodelo__acoes">' +
          '<button class="btn btn--primary btn--sm" type="button" data-quest-preencher="' + m.id + '">Preencher</button>' +
          '<button class="btn btn--outline btn--sm" type="button" data-quest-branco="' + m.id + '">PDF em branco</button>' +
        '</div>' +
      '</div>';
    }).join("");

    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head"><h2 class="fsec__title">Questionários & anamnese de retorno</h2></div>' +
        '<p class="qhint">Escolha um modelo para preencher na consulta, ou gere um <strong>PDF em branco</strong> ' +
          'com a sua identidade para o paciente responder antes (é só mandar no WhatsApp).</p>' +
        '<div class="qgrid">' + cards + '</div>' +
      '</section>' +
      '<section class="fsec">' +
        '<h2 class="fsec__title">Histórico</h2>' + histHTML(p) +
      '</section>';
  }

  function histHTML(p) {
    var itens = (p.questionarios || []).slice().reverse();
    if (!itens.length) return '<div class="empty-state">Nenhum questionário respondido ainda.</div>';
    return '<div class="qhist">' + itens.map(function (x) {
      var m = MODELO_BY_ID[x.modeloId];
      var respondidas = (x.respostas || []).filter(function (r) { return r.valor && String(r.valor).trim(); }).length;
      return '<button class="qhist__item" type="button" data-quest-abrir="' + esc(x.id) + '">' +
        '<span class="qhist__ico">' + (m ? m.ico : "📝") + '</span>' +
        '<span class="qhist__info"><span class="qhist__tit">' + esc(x.titulo || "Questionário") + '</span>' +
        '<span class="qhist__date">' + esc(fmtData(x.data)) + '</span></span>' +
        '<span class="qhist__meta">' + respondidas + ' respostas</span>' +
      '</button>';
    }).join("") + '</div>';
  }

  /* ---------- Formulário de preenchimento ---------- */
  function campoHTML(q, valor) {
    var v = valor == null ? "" : valor;
    var lbl = '<span class="q-field__lbl">' + esc(q.label) + '</span>';
    if (q.tipo === "select") {
      var ops = ['<option value="">—</option>'].concat((q.opcoes || []).map(function (o) {
        return '<option' + (o === v ? " selected" : "") + '>' + esc(o) + '</option>';
      })).join("");
      return '<label class="q-field"><span class="q-field__lbl">' + esc(q.label) + '</span>' +
        '<select data-q="' + q.id + '">' + ops + '</select></label>';
    }
    if (q.tipo === "texto") {
      return '<label class="q-field">' + lbl +
        '<input type="text" data-q="' + q.id + '" value="' + esc(v) + '" placeholder="' + esc(q.ph || "") + '" /></label>';
    }
    return '<label class="q-field q-field--full">' + lbl +
      '<textarea data-q="' + q.id + '" rows="2" placeholder="' + esc(q.ph || "") + '">' + esc(v) + '</textarea></label>';
  }

  function formHTML(modelo, respostasPrev) {
    var prev = {};
    (respostasPrev || []).forEach(function (r) { prev[r.id] = r.valor; });
    var campos = modelo.perguntas.map(function (q) { return campoHTML(q, prev[q.id]); }).join("");
    return '' +
      '<section class="fsec">' +
        '<div class="fsec__head">' +
          '<h2 class="fsec__title">' + modelo.ico + ' ' + esc(modelo.nome) + '</h2>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-quest-voltar>← Voltar</button>' +
        '</div>' +
        '<p class="qhint">Preencha o que tiver — o restante pode ficar em branco.</p>' +
        '<div class="qform">' + campos + '</div>' +
        '<div class="qform__actions">' +
          '<button class="btn btn--outline btn--sm" type="button" data-quest-pdf="' + modelo.id + '">🖨️ Gerar PDF preenchido</button>' +
          '<button class="btn btn--primary btn--sm" type="button" data-quest-salvar="' + modelo.id + '">💾 Salvar no histórico</button>' +
        '</div>' +
      '</section>';
  }

  /* ============================================================
     PDFs — reaproveita window.NutriDoc (mesmo motor da prescrição)
     ============================================================ */
  function pdfBranco(modelo) {
    if (!window.NutriDoc) { toast("Motor de documento indisponível.", true); return; }
    var body = '<p>Responda com calma antes da sua consulta e traga preenchido (ou envie de volta). ' +
      'Não há resposta certa ou errada — quanto mais detalhes, melhor.</p>';
    body += modelo.perguntas.map(function (q) {
      return '<h3>' + esc(q.label) + '</h3>' +
        '<div class="doc-note" style="min-height:34px"></div>';
    }).join("");
    window.NutriDoc.imprimir(perfilAtual(), {
      tipo: modelo.nome, paciente: (_p && _p.nome) || "", data: fmtData(hojeISO()), bodyHTML: body
    });
  }

  function pdfPreenchido(modelo, respostas) {
    if (!window.NutriDoc) { toast("Motor de documento indisponível.", true); return; }
    var preenchidas = respostas.filter(function (r) { return r.valor && String(r.valor).trim(); });
    if (!preenchidas.length) { toast("Preencha ao menos uma resposta.", true); return; }
    var body = preenchidas.map(function (r) {
      return '<h3>' + esc(r.label) + '</h3><p>' + esc(r.valor).replace(/\n/g, "<br>") + '</p>';
    }).join("");
    window.NutriDoc.imprimir(perfilAtual(), {
      tipo: modelo.nome, paciente: (_p && _p.nome) || "", data: fmtData(hojeISO()), bodyHTML: body
    });
  }

  /* ---------- Detalhe (abrir item do histórico) ---------- */
  function abrirDetalhe(item) {
    var m = MODELO_BY_ID[item.modeloId];
    var linhas = (item.respostas || []).filter(function (r) { return r.valor && String(r.valor).trim(); })
      .map(function (r) {
        return '<div class="qdet__row"><div class="qdet__lbl">' + esc(r.label) + '</div>' +
          '<div class="qdet__val">' + esc(r.valor).replace(/\n/g, "<br>") + '</div></div>';
      }).join("");
    if (!linhas) linhas = '<p class="empty-state">Sem respostas preenchidas.</p>';
    var ov = document.createElement("div");
    ov.className = "qmodal";
    ov.innerHTML = '<div class="qmodal__box"><button class="qmodal__x" type="button" aria-label="Fechar">×</button>' +
      '<h3 class="qmodal__tit">' + (m ? m.ico + " " : "") + esc(item.titulo || "Questionário") + '</h3>' +
      '<p class="qmodal__date">' + esc(fmtData(item.data)) + '</p>' + linhas +
      '<div class="qform__actions"><button class="btn btn--outline btn--sm" type="button" data-quest-detpdf>🖨️ Gerar PDF</button></div>' +
      '</div>';
    document.body.appendChild(ov);
    function fecha() { ov.remove(); }
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest(".qmodal__x")) fecha();
      if (e.target.closest("[data-quest-detpdf]") && m) pdfPreenchido(m, item.respostas || []);
    });
  }

  /* ============================================================
     WIRE
     ctx: { toast, perfil, onSaved }
     ============================================================ */
  var _p = null, _ctx = null;
  function toast(msg, err) { if (_ctx && _ctx.toast) _ctx.toast(msg, err); }
  function perfilAtual() { return (_ctx && _ctx.perfil) || {}; }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    bindLista();
  }

  function root() { return document.getElementById("quest-root"); }

  function bindLista() {
    var r = root(); if (!r) return;
    r.querySelectorAll("[data-quest-preencher]").forEach(function (b) {
      b.addEventListener("click", function () { abrirForm(b.getAttribute("data-quest-preencher")); });
    });
    r.querySelectorAll("[data-quest-branco]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = MODELO_BY_ID[b.getAttribute("data-quest-branco")]; if (m) pdfBranco(m);
      });
    });
    r.querySelectorAll("[data-quest-abrir]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-quest-abrir");
        var item = (_p.questionarios || []).filter(function (x) { return x.id === id; })[0];
        if (item) abrirDetalhe(item);
      });
    });
  }

  function abrirForm(modeloId) {
    var m = MODELO_BY_ID[modeloId]; var r = root(); if (!m || !r) return;
    r.innerHTML = formHTML(m);
    r.querySelector("[data-quest-voltar]").addEventListener("click", function () {
      r.innerHTML = listaHTML(_p); bindLista();
    });
    r.querySelector("[data-quest-pdf]").addEventListener("click", function () {
      pdfPreenchido(m, coletar(m, r));
    });
    var salvar = r.querySelector("[data-quest-salvar]");
    salvar.addEventListener("click", function () {
      var respostas = coletar(m, r);
      var preenchidas = respostas.filter(function (x) { return x.valor && String(x.valor).trim(); });
      if (!preenchidas.length) { toast("Preencha ao menos uma resposta.", true); return; }
      var item = {
        id: uid(), tipo: "questionario", modeloId: m.id, titulo: m.nome,
        data: hojeISO(), respostas: respostas, status: "preenchido"
      };
      if (!window.NutriPacientes) { toast("Banco indisponível.", true); return; }
      salvar.disabled = true; salvar.textContent = "Salvando…";
      var lista = (_p.questionarios || []).slice(); lista.push(item);
      window.NutriPacientes.saveQuestionarios(_p.id, lista).then(function (saved) {
        toast("Questionário salvo");
        if (_ctx.onSaved) _ctx.onSaved(saved);
      }).catch(function (e) {
        salvar.disabled = false; salvar.textContent = "💾 Salvar no histórico";
        toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
      });
    });
  }

  function coletar(modelo, r) {
    return modelo.perguntas.map(function (q) {
      var inp = r.querySelector('[data-q="' + q.id + '"]');
      return { id: q.id, label: q.label, valor: inp ? inp.value : "" };
    });
  }

  window.Questionarios = { render: render, wire: wire, MODELOS: MODELOS };
})();
