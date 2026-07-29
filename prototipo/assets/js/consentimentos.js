/* ============================================================
   CONSENTIMENTOS — a trilha de aceites vista pelo lado da nutri.

   A tabela public.consentimentos (migration 0044) guardava os aceites
   desde sempre, e a policy consentimentos_select_nutri já autorizava a
   leitura — mas nenhuma tela lia a tabela. A prova ficava gravada e
   invisível para quem precisa dela.

   E é ela que precisa: o que afasta o direito de arrependimento do
   art. 49 do CDC não é a cláusula do contrato, é o registro de que a
   paciente pediu o plano com data e hora (cláusula 8 dos termos do
   "Meu Plano"). Numa reclamação de Procon ou num chargeback, quem
   mostra o registro é a Ana — então o registro tem de estar onde ela
   olha, não só no banco.

   Só leitura, de propósito: aceite não se edita nem se apaga (a 0044
   não criou policy de update/delete para ninguém).

   window.ConsentimentosView = { render, wire }.
   Requer supabase-client.js antes; entra na seção Anamnese da ficha.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* Os tipos que o portal grava hoje. Um tipo desconhecido (versão nova do
     portal, aceite futuro) continua aparecendo — só sem rótulo bonito. */
  var TIPOS = {
    "telenutricao": {
      ico: "🖥️",
      nome: "Atendimento a distância (TCLE)",
      nota: "Res. CFN 760/2023 — possibilidades, limites e fragilidades do atendimento a distância."
    },
    "plano-personalizado": {
      ico: "✍️",
      nome: "Pedido expresso de elaboração do plano",
      nota: "Cláusula 8 dos termos — é este registro que sustenta o caráter personalíssimo do plano."
    }
  };

  /* O que se espera de quem comprou o programa. Para paciente de consultório
     nenhum dos dois é pedido, então a ausência não é falha — ver wire(). */
  var ESPERADOS = ["telenutricao", "plano-personalizado"];

  function meta(tipo) {
    return TIPOS[tipo] || { ico: "📄", nome: tipo, nota: "" };
  }

  /* Data E hora, no fuso de São Paulo: é isso que a cláusula 8 promete
     registrar, e o horário só prova algo se estiver no fuso de quem aceitou. */
  function fmtDataHora(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d)) return "—";
      var data = d.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric"
      });
      var hora = d.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit"
      });
      return data + " às " + hora;
    } catch (e) { return "—"; }
  }

  /* ---------- HTML ---------- */
  function itemHTML(c) {
    var m = meta(c.tipo);
    return '<div class="cst-item">' +
      '<span class="cst-item__ico">' + m.ico + '</span>' +
      '<span class="cst-item__body">' +
        '<span class="cst-item__tit">' + esc(m.nome) + '</span>' +
        (m.nota ? '<span class="cst-item__nota">' + esc(m.nota) + '</span>' : '') +
      '</span>' +
      '<span class="cst-item__meta">' +
        '<span class="cst-item__data">' + esc(fmtDataHora(c.aceito_em)) + '</span>' +
        '<span class="cst-item__ver">versão ' + esc(c.versao) + '</span>' +
      '</span>' +
    '</div>';
  }

  function faltaHTML(tipo) {
    var m = meta(tipo);
    return '<div class="cst-item is-falta">' +
      '<span class="cst-item__ico">⚠️</span>' +
      '<span class="cst-item__body">' +
        '<span class="cst-item__tit">' + esc(m.nome) + '</span>' +
        '<span class="cst-item__nota">Ainda não registrado — a paciente não chegou nessa etapa do portal.</span>' +
      '</span>' +
      '<span class="cst-item__meta"><span class="cst-item__data">—</span></span>' +
    '</div>';
  }

  function listaHTML(itens, doPrograma) {
    var html = itens.map(itemHTML).join("");
    if (doPrograma) {
      var tem = {};
      itens.forEach(function (c) { tem[c.tipo] = true; });
      html += ESPERADOS.filter(function (t) { return !tem[t]; }).map(faltaHTML).join("");
    }
    return '<div class="cst-list">' + html + '</div>';
  }

  /* A seção nasce escondida: sem aceite nenhum e fora do programa, o assunto
     não existe para aquele paciente e uma seção vazia só ocuparia a tela. */
  function render(p) {
    if (!p || !p.userId) return "";
    return '<section class="fsec" id="cst-sec" hidden>' +
      '<h2 class="fsec__title">Consentimentos registrados</h2>' +
      '<p class="qhint">Aceites que a paciente deu no portal, com data e hora. ' +
        'É a prova documental do atendimento a distância e do pedido do plano — ' +
        'somente leitura, não se edita nem se apaga.</p>' +
      '<div id="cst-body"></div>' +
    '</section>';
  }

  function wire(p) {
    var sec = document.getElementById("cst-sec");
    var body = document.getElementById("cst-body");
    if (!sec || !body || !p || !p.userId || !window.NutriDBReady) return;

    window.NutriDBReady.then(function (c) {
      return c.from("consentimentos")
        .select("id,tipo,versao,aceito_em")
        .eq("user_id", p.userId)
        .order("aceito_em", { ascending: false });
    }).then(function (res) {
      if (res && res.error) throw res.error;
      var itens = (res && res.data) || [];
      var doPrograma = (p.tags || []).indexOf("programa") >= 0;
      if (!itens.length && !doPrograma) return;   // paciente de consultório
      body.innerHTML = listaHTML(itens, doPrograma);
      sec.hidden = false;
    }).catch(function () {
      // Falhar calado seria pior que não mostrar nada: a ausência da lista
      // pareceria "não aceitou", e não "não consegui ler".
      body.innerHTML = '<div class="empty-state">Não consegui carregar os consentimentos agora. ' +
        'Confira a conexão e recarregue a ficha.</div>';
      sec.hidden = false;
    });
  }

  window.ConsentimentosView = { render: render, wire: wire };
})();
