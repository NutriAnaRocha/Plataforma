/* ============================================================
   REAVALIAÇÃO DO PROGRAMA — preenchida PELA PACIENTE no portal.

   O que foi vendido no "Meu Plano com a Nutri Ana" é ACOMPANHAMENTO.
   A anamnese abre o caso; a reavaliação é o que mantém o caso vivo —
   sem ela, o produto viraria "plano entregue uma vez", que é a venda de
   plano pronto que o Art. 34 da Res. CFN 856/2026 não admite.

   Abre a cada 30 dias: quem decide é a coluna proxima_reavaliacao da
   assinatura (o intervalo vem de programa_ciclo_dias(), migração 0047),
   e a RPC salvar_reavaliacao_paciente só
   aceita o envio quando essa data já chegou. O portão está no banco,
   não aqui — isto é só a cara dele.

   Diferente da anamnese, cada envio EMPILHA no histórico da ficha
   (modeloId 'reavaliacao-programa', título "Reavaliação N"). Apagar a
   anterior destruiria a linha do tempo do acompanhamento.

   As medidas continuam AUTORREFERIDAS: vão para
   antropometria.autorreferida + .autorreferida_hist, nunca para
   peso_atual/imc da ficha (Art. 35 — quem responde pelo dado clínico é
   a nutricionista).

   window.ReavaliacaoView = { MODELO_ID, aberta, enviadaRecente, mostrar,
                              portalHTML, wire }.
   Requer supabase-client.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var MODELO_ID = "reavaliacao-programa";
  var RASCUNHO_KEY = "nutri:reavaliacao:rascunho";
  var DIAS_VITRINE = 5;   // por quantos dias a confirmação continua visível

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function hojeISO() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function fmtBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : String(iso || "");
  }
  function diasEntre(isoA, isoB) {
    var pa = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoA || ""));
    var pb = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoB || ""));
    if (!pa || !pb) return 0;
    var a = Date.UTC(+pa[1], +pa[2] - 1, +pa[3]);
    var b = Date.UTC(+pb[1], +pb[2] - 1, +pb[3]);
    return Math.round((b - a) / 86400000);
  }

  /* ---------- O questionário ----------
     Curto de propósito: quem já respondeu 10 etapas na entrada não vai
     responder outras 10 a cada 30 dias — e a reavaliação precisa ser
     respondida, não abandonada. Quatro perguntas grandes: o que rolou,
     como o corpo está, quanto mede hoje, o que mudar. */
  var PASSOS = [
    {
      id: "periodo",
      titulo: "Como foram estas semanas",
      dica: "Fale como foi de verdade — é isso que me diz o que ajustar.",
      campos: [
        { id: "seguiu", label: "Você conseguiu seguir o plano?", tipo: "radio", req: true,
          opcoes: ["Na maior parte dos dias", "Mais ou menos, uns dias sim e outros não",
                   "Tive bastante dificuldade", "Quase não consegui seguir"] },
        { id: "funcionou", label: "O que funcionou bem para você?", tipo: "area", req: true,
          dica: "Refeições que você gostou, horários que deram certo, coisas que ficaram fáceis." },
        { id: "dificuldade", label: "O que foi mais difícil?", tipo: "area", req: true,
          dica: "Ex.: o jantar, o fim de semana, comer fora, o preparo, a vontade de doce." },
        { id: "enjoou", label: "Tem alguma refeição ou alimento do plano que você não quer mais?", tipo: "texto" }
      ]
    },
    {
      id: "corpo",
      titulo: "Como você está se sentindo",
      campos: [
        { id: "energia", label: "Sua energia no dia a dia, comparando com o início:", tipo: "radio", req: true,
          opcoes: ["Melhor", "Igual", "Pior"] },
        { id: "fome", label: "Como está a sua fome entre as refeições?", tipo: "radio", req: true,
          opcoes: ["Fico bem satisfeita", "Sinto um pouco de fome", "Sinto muita fome", "Não sinto fome nem na hora da refeição"] },
        { id: "intestino", label: "Como está o seu intestino?", tipo: "radio", req: true,
          opcoes: ["Melhorou", "Continua igual", "Piorou"] },
        { id: "sono", label: "E o seu sono?", tipo: "radio",
          opcoes: ["Melhorou", "Continua igual", "Piorou"] },
        { id: "sintomas", label: "Você tem sentido algum destes sintomas?", tipo: "multi",
          opcoes: ["Nenhum", "Inchaço", "Gases", "Azia ou queimação", "Dor de cabeça",
                   "Cansaço fora do normal", "Vontade forte de doce", "Tontura ou fraqueza"] },
        { id: "ciclo", label: "Mudou alguma coisa no seu ciclo menstrual ou na TPM?", tipo: "area",
          dica: "Escreva 'não se aplica' se não for o seu caso." },
        { id: "saude_mudou", label: "Mudou alguma coisa na sua saúde desde a última vez?", tipo: "area", req: true,
          dica: "Medicamento novo ou suspenso, exame que você fez, diagnóstico, gravidez, cirurgia. Escreva 'nada mudou' se for o caso." }
      ]
    },
    {
      id: "medidas",
      titulo: "Suas medidas de hoje",
      dica: "Meça em jejum, de manhã, com roupa leve — do mesmo jeito da primeira vez. Se não tiver fita métrica, preencha só o peso.",
      medidas: true,
      campos: [
        { id: "peso", label: "Peso hoje", tipo: "numero", unidade: "kg", req: true },
        { id: "cintura", label: "Cintura", tipo: "numero", unidade: "cm",
          dica: "Na parte mais estreita do tronco, acima do umbigo, sem apertar." },
        { id: "quadril", label: "Quadril", tipo: "numero", unidade: "cm",
          dica: "Na parte mais larga, com os pés juntos." },
        { id: "braco", label: "Braço", tipo: "numero", unidade: "cm",
          dica: "No meio do braço relaxado, entre o ombro e o cotovelo." }
      ]
    },
    {
      id: "ajustes",
      titulo: "O que você quer para o próximo ciclo",
      campos: [
        { id: "ajustar", label: "O que você gostaria que eu mudasse no plano?", tipo: "area", req: true },
        { id: "rotina_mudou", label: "Mudou alguma coisa na sua rotina?", tipo: "area",
          dica: "Trabalho, horários, viagem, quem cozinha, treino — tudo que muda o que cabe no seu dia." },
        { id: "duvidas", label: "Alguma dúvida para eu responder nas orientações?", tipo: "area" }
      ]
    }
  ];

  /* ---------- Estado ---------- */
  var _resp = {};
  var _passo = 0;
  var _readonly = false;
  var _onSalvo = null;
  var _enviadaAgora = false;

  /* ---------- Leitura do estado ---------- */
  // Última reavaliação que a paciente já mandou (a de maior ciclo).
  function ultima(p) {
    var qs = (p && p.questionarios) || [];
    var achada = null;
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      if (!q || q.origem !== "portal" || q.modeloId !== MODELO_ID) continue;
      if (!achada || (q.ciclo || 0) >= (achada.ciclo || 0)) achada = q;
    }
    return achada;
  }

  /* Aberta = a assinatura está vigente e a data do ciclo já chegou.
     Espelha exatamente a condição da RPC; se divergirem, quem manda é a
     RPC (o portal só mostraria um formulário que o banco recusa). */
  function aberta(ass) {
    if (!ass || ass.status !== "ativa") return false;
    var hoje = hojeISO();
    if (!ass.fim || ass.fim < hoje) return false;
    if (!ass.proxima_reavaliacao) return false;
    return ass.proxima_reavaliacao <= hoje;
  }

  // Acabou de enviar: a confirmação fica alguns dias no ar para ela ter
  // certeza de que chegou, e depois a aba some sozinha.
  function enviadaRecente(p) {
    if (_enviadaAgora) return true;
    var u = ultima(p);
    if (!u) return false;
    return diasEntre(u.data, hojeISO()) <= DIAS_VITRINE;
  }

  function mostrar(p, ass) { return aberta(ass) || enviadaRecente(p); }

  /* ---------- Rascunho local ---------- */
  function salvarRascunho() {
    try { localStorage.setItem(RASCUNHO_KEY, JSON.stringify({ passo: _passo, resp: _resp })); } catch (e) {}
  }
  function lerRascunho() {
    try {
      var raw = localStorage.getItem(RASCUNHO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function limparRascunho() { try { localStorage.removeItem(RASCUNHO_KEY); } catch (e) {} }

  /* ---------- HTML ---------- */
  function campoHTML(c) {
    var val = _resp[c.id];
    var req = c.req ? ' <span class="anm-req" aria-hidden="true">*</span>' : "";
    var dica = c.dica ? '<span class="anm-dica">' + esc(c.dica) + '</span>' : "";
    var input = "";

    if (c.tipo === "area") {
      input = '<textarea class="anm-input" rows="3" data-rcampo="' + esc(c.id) + '">' + esc(val || "") + '</textarea>';
    } else if (c.tipo === "radio") {
      input = '<div class="anm-opts">' + (c.opcoes || []).map(function (o, i) {
        var id = "rev-" + c.id + "-" + i;
        return '<label class="anm-opt" for="' + id + '"><input type="radio" id="' + id + '" name="rev-' + esc(c.id) + '"' +
          ' data-rcampo="' + esc(c.id) + '" value="' + esc(o) + '"' + (val === o ? " checked" : "") + '>' +
          '<span>' + esc(o) + '</span></label>';
      }).join("") + '</div>';
    } else if (c.tipo === "multi") {
      var marcados = Array.isArray(val) ? val : [];
      input = '<div class="anm-opts">' + (c.opcoes || []).map(function (o, i) {
        var id = "rev-" + c.id + "-" + i;
        return '<label class="anm-opt" for="' + id + '"><input type="checkbox" id="' + id + '"' +
          ' data-rcampo="' + esc(c.id) + '" data-multi="1" value="' + esc(o) + '"' +
          (marcados.indexOf(o) >= 0 ? " checked" : "") + '><span>' + esc(o) + '</span></label>';
      }).join("") + '</div>';
    } else if (c.tipo === "numero") {
      input = '<div class="anm-num"><input class="anm-input" type="number" inputmode="decimal" step="0.1" min="0"' +
        ' data-rcampo="' + esc(c.id) + '" value="' + esc(val == null ? "" : val) + '">' +
        (c.unidade ? '<span class="anm-unid">' + esc(c.unidade) + '</span>' : "") + '</div>';
    } else {
      input = '<input class="anm-input" type="text" data-rcampo="' + esc(c.id) + '" value="' + esc(val || "") + '">';
    }

    return '<div class="anm-campo" data-rwrap="' + esc(c.id) + '">' +
      '<label class="anm-label">' + esc(c.label) + req + '</label>' + dica + input +
      '<span class="anm-erro" hidden>Este campo é necessário para eu ajustar o seu plano.</span></div>';
  }

  function passoHTML(ciclo) {
    var p = PASSOS[_passo];
    var pct = Math.round((_passo / PASSOS.length) * 100);
    var ultimo = _passo === PASSOS.length - 1;
    return '<div class="pcard anm">' +
      '<div class="anm-prog"><div class="anm-prog__bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="anm-prog__txt">Etapa ' + (_passo + 1) + ' de ' + PASSOS.length + '</span></div>' +
      '<p class="rev-selo">Reavaliação ' + ciclo + '</p>' +
      '<h2 class="pcard__title">' + esc(p.titulo) + '</h2>' +
      (p.dica ? '<p class="anm-passo-dica">' + esc(p.dica) + '</p>' : "") +
      '<div class="anm-campos">' + p.campos.map(campoHTML).join("") + '</div>' +
      '<div class="anm-nav">' +
        (_passo > 0 ? '<button type="button" class="btn btn--outline" data-rev-voltar>‹ Voltar</button>' : '<span></span>') +
        '<button type="button" class="btn btn--primary" data-rev-avancar>' +
          (ultimo ? "Enviar para a nutri" : "Continuar ›") + '</button>' +
      '</div>' +
      '<p class="anm-salvo">Suas respostas ficam salvas neste aparelho — dá para parar e voltar depois.</p>' +
    '</div>';
  }

  function aberturaHTML(ciclo) {
    return '<div class="pcard anm">' +
      '<p class="rev-selo">Reavaliação ' + ciclo + '</p>' +
      '<h2 class="pcard__title">Chegou a hora de reavaliar</h2>' +
      '<p class="anm-passo-dica">Passaram-se algumas semanas desde o último ajuste. ' +
        'São quatro etapas curtas: como foi este período, como você está se sentindo, ' +
        'suas medidas de hoje e o que você quer mudar. Com isso eu reviso o seu plano ' +
        'e escrevo as orientações do novo ciclo.</p>' +
      '<div class="anm-prazo">' +
        '<strong>Leva cerca de 5 minutos.</strong>' +
        '<span>Responda com calma — dá para parar no meio e voltar depois.</span>' +
      '</div>' +
      '<div class="anm-nav"><span></span>' +
        '<button type="button" class="btn btn--primary" data-rev-comecar>Começar</button></div>' +
    '</div>';
  }

  function enviadaHTML(inst) {
    var ciclo = (inst && inst.ciclo) || "";
    return '<div class="pcard anm">' +
      (ciclo ? '<p class="rev-selo">Reavaliação ' + esc(ciclo) + '</p>' : "") +
      '<h2 class="pcard__title">Reavaliação enviada ✓</h2>' +
      '<p class="anm-passo-dica">Recebi as suas respostas' +
        (inst && inst.data ? " em " + esc(fmtBR(inst.data)) : "") + '. ' +
        'Vou revisar o seu plano com base nelas.</p>' +
      '<div class="anm-prazo">' +
        '<strong>Prazo de entrega: até 2 dias úteis.</strong>' +
        '<span>Você recebe um aviso aqui no portal quando o plano revisado estiver liberado, ' +
          'junto com as minhas orientações escritas.</span>' +
      '</div>' +
      '<p class="anm-salvo">Lembrou de alguma coisa depois de enviar? Me escreva na aba Mensagens.</p>' +
    '</div>';
  }

  /* ---------- API pública ---------- */
  function portalHTML() {
    return '<div id="rev-root"><div class="pcard"><div class="empty-state">Carregando…</div></div></div>';
  }

  function wire(p, ass, opts) {
    opts = opts || {};
    _readonly = !!opts.readonly;
    _onSalvo = opts.onSalvo || null;

    var host = document.getElementById("rev-root");
    if (!host) return;

    if (!aberta(ass)) { host.innerHTML = enviadaHTML(ultima(p)); return; }

    if (_readonly) {
      host.innerHTML = '<div class="pcard"><div class="empty-state">' +
        'Pré-visualização: no acesso real, a paciente responde a reavaliação aqui.</div></div>';
      return;
    }

    var ciclo = (ass.reavaliacoes_feitas || 0) + 1;
    host.setAttribute("data-ciclo", ciclo);

    var rasc = lerRascunho();
    if (rasc && rasc.resp) {
      _resp = rasc.resp;
      _passo = Math.min(rasc.passo || 0, PASSOS.length - 1);
      render(host);                 // rascunho no meio: volta direto pro formulário
    } else {
      host.innerHTML = aberturaHTML(ciclo);
    }
  }

  function ciclo(host) { return parseInt(host.getAttribute("data-ciclo"), 10) || 1; }

  function render(host) {
    host.innerHTML = passoHTML(ciclo(host));
    host.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Coleta ---------- */
  function lerCampos() {
    var host = document.getElementById("rev-root");
    if (!host) return;
    host.querySelectorAll("[data-rcampo]").forEach(function (inp) {
      var id = inp.getAttribute("data-rcampo");
      if (inp.type === "radio") {
        if (inp.checked) _resp[id] = inp.value;
      } else if (inp.getAttribute("data-multi")) {
        var arr = Array.isArray(_resp[id]) ? _resp[id].slice() : [];
        var i = arr.indexOf(inp.value);
        if (inp.checked && i < 0) arr.push(inp.value);
        if (!inp.checked && i >= 0) arr.splice(i, 1);
        _resp[id] = arr;
      } else {
        _resp[id] = inp.value;
      }
    });
    salvarRascunho();
  }

  function validar() {
    var passo = PASSOS[_passo];
    var host = document.getElementById("rev-root");
    var primeiroErro = null;
    passo.campos.forEach(function (c) {
      var wrap = host.querySelector('[data-rwrap="' + c.id + '"]');
      if (!wrap) return;
      var v = _resp[c.id];
      var vazio = c.tipo === "multi" ? !(Array.isArray(v) && v.length) : !(v != null && String(v).trim());
      var ruim = !!c.req && vazio;
      wrap.classList.toggle("is-erro", ruim);
      var msg = wrap.querySelector(".anm-erro");
      if (msg) msg.hidden = !ruim;
      if (ruim && !primeiroErro) primeiroErro = wrap;
    });
    if (primeiroErro) { primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
    return true;
  }

  // Formato { id, label, valor, secao } — o mesmo da anamnese, porque é o
  // que questionarios.js já lê no histórico da ficha, no modal e no PDF.
  function montarRespostas() {
    var out = [];
    PASSOS.forEach(function (passo) {
      passo.campos.forEach(function (c) {
        var v = _resp[c.id];
        if (Array.isArray(v)) v = v.join(", ");
        v = (v == null ? "" : String(v)).trim();
        if (!v) return;
        out.push({ id: c.id, label: c.label, valor: v, secao: passo.titulo });
      });
    });
    return out;
  }

  function montarMedidas() {
    var passo = null;
    PASSOS.forEach(function (s) { if (s.medidas) passo = s; });
    if (!passo) return {};
    var m = {};
    passo.campos.forEach(function (c) {
      var v = _resp[c.id];
      if (v == null || String(v).trim() === "") return;
      var n = parseFloat(String(v).replace(",", "."));
      if (!isNaN(n)) m[c.id] = n;
    });
    return m;
  }

  function enviar(btn) {
    var respostas = montarRespostas();
    if (!respostas.length) return;
    btn.disabled = true;
    var txt = btn.textContent;
    btn.textContent = "Enviando…";

    window.NutriDBReady.then(function (c) {
      return c.rpc("salvar_reavaliacao_paciente", {
        p_respostas: respostas,
        p_medidas: montarMedidas(),
        p_modelo_id: MODELO_ID
      });
    }).then(function (res) {
      if (res && res.error) throw res.error;
      limparRascunho();
      _enviadaAgora = true;
      var host = document.getElementById("rev-root");
      var n = (res && res.data && res.data.ciclo) || null;
      if (host) host.innerHTML = enviadaHTML({ data: hojeISO(), ciclo: n });
      if (_onSalvo) _onSalvo(respostas);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = txt;
      alert("Não consegui enviar agora. Suas respostas estão salvas — confira a conexão e tente de novo.");
    });
  }

  /* ---------- Eventos (delegação) ---------- */
  document.addEventListener("change", function (e) {
    if (!e.target.closest || !e.target.closest("#rev-root")) return;
    if (e.target.matches("[data-rcampo]")) lerCampos();
  });
  document.addEventListener("input", function (e) {
    if (!e.target.closest || !e.target.closest("#rev-root")) return;
    if (e.target.matches("[data-rcampo]")) {
      var wrap = e.target.closest("[data-rwrap]");
      if (wrap && wrap.classList.contains("is-erro")) {
        wrap.classList.remove("is-erro");
        var msg = wrap.querySelector(".anm-erro");
        if (msg) msg.hidden = true;
      }
      lerCampos();
    }
  });

  document.addEventListener("click", function (e) {
    var host = document.getElementById("rev-root");
    if (!host) return;

    if (e.target.closest("[data-rev-comecar]")) { render(host); return; }

    if (e.target.closest("[data-rev-voltar]")) {
      lerCampos();
      _passo = Math.max(0, _passo - 1);
      salvarRascunho();
      render(host);
      return;
    }

    var avancar = e.target.closest("[data-rev-avancar]");
    if (avancar) {
      lerCampos();
      if (!validar()) return;
      if (_passo === PASSOS.length - 1) { enviar(avancar); return; }
      _passo++;
      salvarRascunho();
      render(host);
    }
  });

  window.ReavaliacaoView = {
    MODELO_ID: MODELO_ID,
    aberta: aberta,
    enviadaRecente: enviadaRecente,
    mostrar: mostrar,
    ultima: ultima,
    portalHTML: portalHTML,
    wire: wire
  };
})();
