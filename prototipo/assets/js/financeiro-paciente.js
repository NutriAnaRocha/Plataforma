/* ============================================================
   FINANCEIRO DO PACIENTE — a mesma tabela `lancamentos` da tela
   Financeiro (0040), recortada por paciente_id. Não existe segundo
   lugar de verdade: o que a nutri lança aqui aparece no faturamento
   do mês, e o que ela lançar lá vinculado a este paciente aparece aqui.

   window.FinanceiroPaciente = { render, wire }
   Depende de financeiro-db.js (window.NutriFinanceiro) e, para o
   recibo, de doc-template.js (window.NutriDoc).
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function brl(n) {
    return "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoHoje() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  function dataExtenso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || isoHoje()));
    return m ? (+m[3]) + " de " + MESES[+m[2] - 1] + " de " + m[1] : "";
  }

  var METODOS = ["Pix", "Dinheiro", "Cartão", "Transferência", "Boleto", "Outro"];
  var ST_LBL = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" };

  var _p = null, _ctx = null, _lista = [], _estado = "load", _editando = null;

  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function root() { return document.getElementById("fin-pac-root"); }

  function render(p) {
    return '<section class="fsec">' +
      '<div class="fsec__head">' +
        '<h2 class="fsec__title">Financeiro do paciente</h2>' +
        '<div class="pl-res__acoes">' +
          '<button class="btn btn--primary btn--sm" type="button" data-fp-novo>＋ Novo lançamento</button>' +
        '</div>' +
      '</div>' +
      '<p class="pl-hint">Consultas pagas, pendências e recibos deste paciente. ' +
        'O que entra aqui conta no <a href="financeiro.html">Financeiro</a> do mês.</p>' +
      '<div id="fin-pac-root"><div class="empty-state">Carregando lançamentos…</div></div>' +
      '</section>';
  }

  /* ---------- Resumo ---------- */
  function soma(arr) { return arr.reduce(function (a, l) { return a + (l.valor || 0); }, 0); }
  function vencido(l) { return l.status !== "pago" && String(l.data || "") < isoHoje(); }

  function resumoHTML() {
    var pago = soma(_lista.filter(function (l) { return l.status === "pago"; }));
    var pend = soma(_lista.filter(function (l) { return l.status === "pendente"; }));
    var atr = soma(_lista.filter(function (l) { return l.status === "atrasado" || (l.status === "pendente" && vencido(l)); }));
    var ultimo = _lista.filter(function (l) { return l.status === "pago"; })[0];
    return '<div class="fmetric-grid fp-resumo">' +
      metric("Já pago", brl(pago), ultimo ? "último em " + dataBR(ultimo.data) : "nenhum recebimento") +
      metric("A receber", brl(pend), pend ? "pendente" : "nada em aberto") +
      metric("Em atraso", brl(atr), atr ? "vale cobrar" : "nada vencido") +
      '</div>';
  }
  function metric(lbl, val, hint) {
    return '<div class="fmetric"><div class="fmetric__lbl">' + esc(lbl) + '</div>' +
      '<div class="fmetric__val">' + esc(val) + '</div>' +
      '<div class="fmetric__hint">' + esc(hint) + '</div></div>';
  }

  /* ---------- Lista ---------- */
  function linhaHTML(l) {
    var st = (l.status === "pendente" && vencido(l)) ? "atrasado" : l.status;
    return '<div class="fp-row" data-fp-id="' + esc(l.id) + '">' +
      '<div class="fp-row__data">' + dataBR(l.data) + '</div>' +
      '<div class="fp-row__desc"><strong>' + esc(l.descricao || "Consulta") + '</strong>' +
        (l.metodo ? '<small>' + esc(l.metodo) + '</small>' : '') + '</div>' +
      '<div class="fp-row__val">' + brl(l.valor) + '</div>' +
      '<div class="fp-row__st"><span class="st st--' + st + '">' + (ST_LBL[st] || st) + '</span></div>' +
      '<div class="fp-row__acoes">' +
        (l.status === "pago"
          ? '<button class="icon-btn" type="button" data-fp-recibo title="Gerar recibo">🧾</button>'
          : '<button class="icon-btn" type="button" data-fp-pagar title="Marcar como pago">✅</button>') +
        '<button class="icon-btn" type="button" data-fp-editar title="Editar">✏️</button>' +
        '<button class="icon-btn" type="button" data-fp-excluir title="Excluir">🗑️</button>' +
      '</div></div>';
  }

  function formHTML(l) {
    l = l || { data: isoHoje(), status: "pago", metodo: "Pix", descricao: "Consulta", valor: "" };
    var mets = METODOS.map(function (m) {
      return '<option value="' + m + '"' + (m === l.metodo ? " selected" : "") + '>' + m + '</option>';
    }).join("");
    var sts = ["pago", "pendente", "atrasado"].map(function (s) {
      return '<option value="' + s + '"' + (s === l.status ? " selected" : "") + '>' + ST_LBL[s] + '</option>';
    }).join("");
    return '<div class="fp-form" id="fp-form">' +
      '<label class="pl-field"><span>Data</span><input type="date" data-fp-data value="' + esc(l.data || isoHoje()) + '" /></label>' +
      '<label class="pl-field pl-field--wide"><span>Descrição</span>' +
        '<input type="text" data-fp-desc value="' + esc(l.descricao || "") + '" placeholder="Consulta de retorno" /></label>' +
      '<label class="pl-field"><span>Valor (R$)</span>' +
        '<input type="number" step="0.01" min="0" data-fp-valor value="' + (l.valor || "") + '" placeholder="0,00" /></label>' +
      '<label class="pl-field"><span>Forma</span><select data-fp-metodo>' + mets + '</select></label>' +
      '<label class="pl-field"><span>Situação</span><select data-fp-status>' + sts + '</select></label>' +
      '<div class="pl-actions">' +
        '<button class="btn btn--primary btn--sm" type="button" data-fp-salvar>💾 Salvar</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-fp-cancelar>Cancelar</button>' +
      '</div></div>';
  }

  function listaHTML() {
    if (_estado === "load") return '<div class="empty-state">Carregando lançamentos…</div>';
    if (_estado === "erro") {
      return '<div class="empty-state">Não foi possível carregar o financeiro deste paciente. ' +
        '<button class="link-btn" type="button" data-fp-retry>tente de novo</button>.</div>';
    }
    var form = _editando !== null ? formHTML(_editando.id ? _editando : null) : "";
    if (!_lista.length) {
      return form + '<div class="empty-state">Nenhum lançamento para este paciente ainda. ' +
        'Registre a primeira consulta em “＋ Novo lançamento”.</div>';
    }
    return resumoHTML() + form +
      '<div class="fp-lista">' + _lista.map(linhaHTML).join("") + '</div>';
  }

  function pintar() { var r = root(); if (r) r.innerHTML = listaHTML(); }

  function achar(id) {
    for (var i = 0; i < _lista.length; i++) if (_lista[i].id === id) return _lista[i];
    return null;
  }
  function ordenar() {
    _lista.sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
  }

  function carregar() {
    if (!window.NutriFinanceiro) { _estado = "erro"; pintar(); return; }
    _estado = "load"; pintar();
    window.NutriFinanceiro.listPorPaciente(_p.id).then(function (rows) {
      _lista = rows || []; _estado = "ok"; pintar();
    }).catch(function () { _estado = "erro"; pintar(); });
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {}; _lista = []; _editando = null;
    var r = root();
    var sec = r && r.closest(".fsec");
    if (!sec) return;

    sec.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-fp-novo]")) { _editando = {}; pintar(); focoForm(); return; }
      if (t.closest("[data-fp-cancelar]")) { _editando = null; pintar(); return; }
      if (t.closest("[data-fp-salvar]")) { salvar(); return; }
      if (t.closest("[data-fp-retry]")) { carregar(); return; }

      var row = t.closest("[data-fp-id]");
      if (!row) return;
      var l = achar(row.getAttribute("data-fp-id"));
      if (!l) return;
      if (t.closest("[data-fp-editar]")) { _editando = l; pintar(); focoForm(); }
      else if (t.closest("[data-fp-pagar]")) marcarPago(l);
      else if (t.closest("[data-fp-recibo]")) recibo(l);
      else if (t.closest("[data-fp-excluir]")) excluir(l);
    });

    carregar();
  }

  function focoForm() {
    var f = document.getElementById("fp-form");
    if (f) {
      var i = f.querySelector("[data-fp-desc]");
      if (i) i.focus();
      f.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function coletar() {
    var f = document.getElementById("fp-form");
    if (!f) return null;
    var valor = parseFloat((f.querySelector("[data-fp-valor]") || {}).value);
    if (!valor || valor <= 0) { toast("Informe um valor maior que zero.", true); return null; }
    return {
      pacienteId: _p.id,
      paciente: _p.nome,
      descricao: (f.querySelector("[data-fp-desc]") || {}).value || "Consulta",
      valor: valor,
      metodo: (f.querySelector("[data-fp-metodo]") || {}).value || "",
      status: (f.querySelector("[data-fp-status]") || {}).value || "pago",
      data: (f.querySelector("[data-fp-data]") || {}).value || isoHoje()
    };
  }

  function salvar() {
    var dados = coletar();
    if (!dados) return;
    if (!window.NutriFinanceiro) { toast("Banco indisponível.", true); return; }
    var editandoId = _editando && _editando.id;
    var promessa = editandoId
      ? window.NutriFinanceiro.update(editandoId, dados)
      : window.NutriFinanceiro.create(dados);
    promessa.then(function (l) {
      if (editandoId) {
        for (var i = 0; i < _lista.length; i++) if (_lista[i].id === editandoId) _lista[i] = l;
      } else {
        _lista.unshift(l);
      }
      ordenar();
      _editando = null;
      pintar();
      toast(editandoId ? "Lançamento atualizado" : "Lançamento registrado");
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  function marcarPago(l) {
    var dados = {
      pacienteId: _p.id, paciente: _p.nome, descricao: l.descricao,
      valor: l.valor, metodo: l.metodo, status: "pago", data: l.data
    };
    window.NutriFinanceiro.update(l.id, dados).then(function (novo) {
      for (var i = 0; i < _lista.length; i++) if (_lista[i].id === l.id) _lista[i] = novo;
      pintar();
      toast("Marcado como pago");
    }).catch(function (e) { toast("Não foi possível atualizar. " + (e && e.message ? e.message : ""), true); });
  }

  function excluir(l) {
    if (!window.confirm("Excluir este lançamento de " + brl(l.valor) + "?")) return;
    window.NutriFinanceiro.remove(l.id).then(function () {
      _lista = _lista.filter(function (x) { return x.id !== l.id; });
      pintar();
      toast("Lançamento excluído");
    }).catch(function (e) { toast("Não foi possível excluir. " + (e && e.message ? e.message : ""), true); });
  }

  /* ---------- Recibo ----------
     Recibo é documento: sai com a identidade da nutri (doc-template.js),
     valor por extenso e a assinatura dela — do mesmo jeito que prescrição
     e orientação. Só para lançamento pago: recibo de dinheiro que não
     entrou é declaração falsa. */
  var UNI = ["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","catorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
  var DEZ = ["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
  var CEM = ["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];

  function ate999(n) {
    if (n < 20) return UNI[n];
    if (n < 100) return DEZ[Math.floor(n / 10)] + (n % 10 ? " e " + UNI[n % 10] : "");
    if (n === 100) return "cem";
    return CEM[Math.floor(n / 100)] + (n % 100 ? " e " + ate999(n % 100) : "");
  }
  function inteiroExtenso(n) {
    if (n === 0) return "zero";
    var partes = [];
    var milhoes = Math.floor(n / 1000000), milhares = Math.floor((n % 1000000) / 1000), resto = n % 1000;
    if (milhoes) partes.push(ate999(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
    if (milhares) partes.push(milhares === 1 ? "mil" : ate999(milhares) + " mil");
    if (resto) partes.push(ate999(resto));
    if (partes.length === 1) return partes[0];
    // "e" antes da última parte só quando ela é menor que cem ou redonda —
    // é o mesmo critério do português escrito ("mil e vinte", "mil trezentos").
    var ultima = partes.pop();
    var lig = (resto && (resto < 100 || resto % 100 === 0)) ? " e " : " ";
    return partes.join(", ") + lig + ultima;
  }
  function valorExtenso(v) {
    var reais = Math.floor(v + 1e-9);
    var centavos = Math.round((v - reais) * 100);
    var txt = inteiroExtenso(reais) + (reais === 1 ? " real" : " reais");
    if (centavos) txt += " e " + inteiroExtenso(centavos) + (centavos === 1 ? " centavo" : " centavos");
    return txt;
  }

  function recibo(l) {
    if (!window.NutriDoc) { toast("Gerador de documentos indisponível.", true); return; }
    var perfil = (_ctx && _ctx.perfil) || {};
    var cidade = perfil.cidade || perfil.municipio || "";
    var body = '' +
      '<p>Recebi de <strong>' + esc(_p.nome) + '</strong> a importância de <strong>' + brl(l.valor) + '</strong> (' +
        esc(valorExtenso(l.valor)) + '), referente a <strong>' + esc(l.descricao || "atendimento nutricional") + '</strong>' +
        (l.metodo ? ', pago via ' + esc(l.metodo) : '') + '.</p>' +
      '<p>Para clareza, firmo o presente recibo.</p>' +
      '<p style="margin-top:18px">' + (cidade ? esc(cidade) + ", " : "") + esc(dataExtenso(l.data)) + '.</p>';
    window.NutriDoc.imprimir(perfil, {
      tipo: "Recibo",
      paciente: _p.nome,
      data: dataBR(l.data),
      bodyHTML: body
    });
  }

  window.FinanceiroPaciente = { render: render, wire: wire };
})();
