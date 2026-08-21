/* ============================================================
   PORTAL — FÓRMULAS E EXAMES do paciente.
   Duas abas do app do paciente, montadas a partir da MESMA ficha que a
   nutri edita (pacientes.prescricoes e pacientes.exames, jsonb): a RLS
   já devolve só a ficha dele, então aqui não há consulta nova.

   O que ele vê:
     • Fórmulas  — as prescrições ATIVAS (pausada não é para tomar), com
                   a formatação que a nutri aplicou no editor.
     • Exames    — o que ela pediu e ainda não voltou ("a fazer"), e os
                   resultados já registrados, com o alerta de fora da
                   referência.

   O que ele NÃO vê: item marcado com ocultoPaciente, e a leitura da IA
   (tipo "ia") — aquilo é rascunho de trabalho da nutri, não laudo.

   A régua dos marcadores (nome, unidade, faixa) vem de window.Exames.MARC,
   para não existir uma segunda cópia da base de referência.
   Exposto como window.ClinicoView.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // Texto da fórmula com a formatação da nutri (negrito, cor, sublinhado).
  function fmt(v) {
    return window.EditorFormulas ? window.EditorFormulas.sanitizar(v) : esc(v);
  }
  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  function visivel(x) { return x && !x.ocultoPaciente; }

  /* ============================================================
     FÓRMULAS
     ============================================================ */
  function prescricoesVisiveis(p) {
    return ((p && p.prescricoes) || []).filter(function (o) {
      return visivel(o) && o.ativa !== false;   // sem o campo = antiga = ativa
    }).slice().sort(function (a, b) {
      return String(b.data || "").localeCompare(String(a.data || ""));
    });
  }
  function temFormulas(p) { return prescricoesVisiveis(p).length > 0; }

  function blocoFormula(f) {
    var comp = (f.componentes || []).map(function (c) {
      return '<li class="pfx__comp"><span class="pfx__ativo">' + fmt(c.ativo) + '</span>' +
        (c.dose ? '<span class="pfx__dose">' + fmt(c.dose) + '</span>' : "") +
        (c.obs ? '<span class="pfx__obs">' + fmt(c.obs) + '</span>' : "") + '</li>';
    }).join("");
    var rod = [];
    if (f.posologia) rod.push("<b>Como tomar:</b> " + fmt(f.posologia));
    if (f.duracao) rod.push("<b>Por quanto tempo:</b> " + fmt(f.duracao));
    if (f.via) rod.push("<b>Via:</b> " + fmt(f.via));
    return '<div class="pfx__bloco">' +
      (f.titulo ? '<div class="pfx__bloco-tit">' + fmt(f.titulo) + '</div>' : "") +
      (comp ? '<ul class="pfx__comps">' + comp + '</ul>' : "") +
      (rod.length ? '<div class="pfx__pos">' + rod.join(" · ") + '</div>' : "") +
    '</div>';
  }

  function formulasHTML(p) {
    var lista = prescricoesVisiveis(p);
    if (!lista.length) {
      return '<div class="pcard"><div class="empty-state">Você ainda não tem fórmulas prescritas. ' +
        'Quando a Ana prescrever, elas aparecem aqui.</div></div>';
    }
    var cards = lista.map(function (o) {
      return '<article class="pcard pfx">' +
        '<div class="pfx__head">' +
          '<h2 class="pcard__title">' + esc(o.titulo || "Prescrição") + '</h2>' +
          '<span class="pfx__data">prescrita em ' + esc(dataBR(o.data)) + '</span>' +
        '</div>' +
        (o.indicacao ? '<p class="pfx__ind">' + esc(o.indicacao) + '</p>' : "") +
        (o.formulas || []).map(blocoFormula).join("") +
        (o.interacoes ? '<div class="pfx__cautela">⚠️ ' + fmt(o.interacoes) + '</div>' : "") +
      '</article>';
    }).join("");
    return cards +
      '<p class="pclin__nota">Estas são as fórmulas que a Ana prescreveu para você. ' +
      'Não mude a dose nem pare por conta própria — se algo incomodar, fale com ela pelas mensagens.</p>';
  }

  /* ============================================================
     EXAMES
     ============================================================ */
  function itens(p) { return ((p && p.exames) || []).filter(visivel); }

  /* Uma solicitação fica "a fazer" até a nutri marcar como entregue na
     ficha. É decisão dela, não adivinhação por data: exame pedido em
     lote costuma voltar em partes, e sumir da lista antes da hora faria
     o paciente achar que já não precisa fazer. */
  function pendentes(p) {
    return itens(p).filter(function (x) {
      return x.tipo === "solicitacao" && !x.entregue;
    }).sort(function (a, b) { return String(b.data || "").localeCompare(String(a.data || "")); });
  }
  function resultados(p) {
    return itens(p).filter(function (x) { return x.tipo === "resultado"; })
      .sort(function (a, b) { return String(b.data || "").localeCompare(String(a.data || "")); });
  }
  function temExames(p) { return pendentes(p).length > 0 || resultados(p).length > 0; }

  function marcador(key) {
    var lista = (window.Exames && window.Exames.MARC) || [];
    for (var i = 0; i < lista.length; i++) if (lista[i].key === key) return lista[i];
    return null;
  }
  function refTexto(m, sexo) {
    if (window.Exames && window.Exames.refTexto) return window.Exames.refTexto(m, sexo);
    return "—";
  }
  var STAT_LBL = { baixo: "Abaixo", normal: "Normal", alto: "Acima" };

  function cardPendente(x) {
    var lis = (x.itens || []).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("");
    return '<article class="pcard pex pex--todo">' +
      '<div class="pex__head"><h3 class="pex__tit">🧪 Exames a fazer</h3>' +
        '<span class="pex__data">pedido em ' + esc(dataBR(x.data)) + '</span></div>' +
      (lis ? '<ul class="pex__lista">' + lis + '</ul>' : "") +
      (x.obs ? '<p class="pex__obs">📌 ' + esc(x.obs) + '</p>' : "") +
      '<p class="pex__acao">Quando tiver o resultado em mãos, envie para a Ana pelas mensagens — ' +
        'ela registra aqui e você vê tudo nesta aba.</p>' +
    '</article>';
  }

  function cardResultado(x, sexoFicha) {
    var avals = (x.avaliacoes || []).filter(function (a) { return marcador(a.key); });
    var fora = avals.filter(function (a) { return a.stat === "alto" || a.stat === "baixo"; });
    var linhas = avals.map(function (a) {
      var m = marcador(a.key);
      var st = a.stat || "normal";
      return '<tr class="is-' + esc(st) + '">' +
        '<td data-l="Exame">' + esc(m.lbl) + '</td>' +
        '<td data-l="Seu valor"><strong>' + esc(a.valor) + '</strong> ' + esc(m.un || "") + '</td>' +
        '<td data-l="Referência">' + esc(refTexto(m, x.sexo || sexoFicha)) + '</td>' +
        '<td data-l="Situação"><span class="pex__badge is-' + esc(st) + '">' +
          esc(STAT_LBL[st] || "—") + '</span></td>' +
      '</tr>';
    }).join("");
    var resumo = !avals.length ? ""
      : fora.length
        ? '<p class="pex__resumo pex__resumo--flag">' + fora.length +
          (fora.length === 1 ? ' resultado fora da faixa de referência.' : ' resultados fora da faixa de referência.') +
          ' A Ana já está vendo isso — se precisar de ajuste, ela te fala.</p>'
        : '<p class="pex__resumo pex__resumo--ok">Todos os resultados dentro da faixa de referência. 🌿</p>';

    return '<article class="pcard pex">' +
      '<div class="pex__head"><h3 class="pex__tit">🧾 ' + esc(x.titulo || "Resultados") + '</h3>' +
        '<span class="pex__data">' + esc(dataBR(x.data)) + '</span></div>' +
      resumo +
      (linhas ? '<div class="pex__tw"><table class="pex__tab"><thead><tr>' +
        '<th>Exame</th><th>Seu valor</th><th>Referência</th><th>Situação</th>' +
        '</tr></thead><tbody>' + linhas + '</tbody></table></div>' : "") +
    '</article>';
  }

  function examesHTML(p) {
    var todo = pendentes(p), res = resultados(p);
    if (!todo.length && !res.length) {
      return '<div class="pcard"><div class="empty-state">Nenhum exame por aqui ainda. ' +
        'Quando a Ana pedir ou registrar exames, eles aparecem nesta aba.</div></div>';
    }
    var html = "";
    if (todo.length) html += todo.map(cardPendente).join("");
    if (res.length) html += res.map(function (x) { return cardResultado(x, p.sexo); }).join("");
    html += '<p class="pclin__nota">As faixas de referência mudam de laboratório para laboratório. ' +
      'Este resumo é para você acompanhar — quem interpreta o seu exame é a Ana, junto com o seu médico.</p>';
    return html;
  }

  window.ClinicoView = {
    temFormulas: temFormulas,
    formulasHTML: formulasHTML,
    temExames: temExames,
    examesHTML: examesHTML
  };
})();
