/* ============================================================
   PRESCRIÇÕES DO PACIENTE — seção do prontuário.
   Anexa prescrições/formulações (do Banco de Formulações ou escritas do
   zero) ao paciente, gera PDF com a marca da nutri e guarda o histórico.

   Guardadas em pacientes.prescricoes (jsonb array) via NutriPacientes.
   A biblioteca vem de ic_formulacoes_minhas (base + as da nutri).
   ============================================================ */
(function () {
  "use strict";

  var _p = null, _ctx = null, _lib = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function hojeISO() { return new Date().toISOString().slice(0, 10); }
  function fmtData(iso) { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || ""); }
  function uid() { return "rx" + Date.now() + Math.floor(Math.random() * 1000); }
  function secWrap(t, inner) { return '<section class="fsec"><h2 class="fsec__title">' + esc(t) + "</h2>" + inner + "</section>"; }

  /* O texto da fórmula pode trazer a formatação que a nutri aplicou
     (negrito, cor, sublinhado). Passa pelo sanitizador do EditorFormulas
     em vez de esc(): o que sai daqui vai para o card, para o PDF e, mais
     tarde, para a tela do paciente. Sem o editor carregado, escapa tudo. */
  function fmt(v) {
    return window.EditorFormulas ? window.EditorFormulas.sanitizar(v) : esc(v);
  }

  var CAT_LABEL = { fitoterapia: "Fitoterapia", suplementacao: "Suplementação", magistral: "Magistral", ortomolecular: "Ortomolecular", custom: "Minha" };

  // "# Título" abre uma fórmula; "- Ativo | dose | obs" para componentes;
  // Posologia:/Duração:/Via: nas linhas próprias.
  function textoToFormulas(texto) {
    var formulas = [], atual = null;
    function garante() { if (!atual) { atual = { titulo: "", componentes: [] }; formulas.push(atual); } }
    (texto || "").split(/\r?\n/).forEach(function (linha) {
      var l = linha.trim(); if (!l) return;
      if (l.indexOf("# ") === 0) { atual = { titulo: l.slice(2).trim(), componentes: [] }; formulas.push(atual); return; }
      var mPos = l.match(/^posologia:\s*(.*)$/i), mDur = l.match(/^dura[cç][aã]o:\s*(.*)$/i), mVia = l.match(/^via:\s*(.*)$/i);
      if (mPos) { garante(); atual.posologia = mPos[1].trim(); return; }
      if (mDur) { garante(); atual.duracao = mDur[1].trim(); return; }
      if (mVia) { garante(); atual.via = mVia[1].trim(); return; }
      garante();
      var p = l.replace(/^[-•*]\s*/, "").split("|").map(function (x) { return x.trim(); });
      atual.componentes.push({ ativo: p[0] || "", dose: p[1] || "", obs: p[2] || "" });
    });
    return formulas;
  }

  // Volta a fórmula para o texto que a nutri digitou — é o que o modo editar
  // devolve no textarea. Espelho exato de textoToFormulas.
  function formulasToTexto(formulas) {
    return (formulas || []).map(function (f) {
      var linhas = [];
      if (f.titulo) linhas.push("# " + f.titulo);
      (f.componentes || []).forEach(function (c) {
        linhas.push("- " + [c.ativo, c.dose, c.obs].filter(Boolean).join(" | "));
      });
      if (f.posologia) linhas.push("Posologia: " + f.posologia);
      if (f.duracao) linhas.push("Duração: " + f.duracao);
      if (f.via) linhas.push("Via: " + f.via);
      return linhas.join("\n");
    }).join("\n\n");
  }
  // Prescrição sem o campo "ativa" é antiga: conta como ativa.
  function estaAtiva(o) { return o.ativa !== false; }

  function formulasHTML(o) {
    return (o.formulas || []).map(function (f) {
      var comp = (f.componentes || []).map(function (c) {
        return '<div class="rx-comp"><span class="rx-comp__a">' + fmt(c.ativo) + "</span>" +
          (c.dose ? '<span class="rx-comp__d">' + fmt(c.dose) + "</span>" : "") +
          (c.obs ? '<span class="rx-comp__o">' + fmt(c.obs) + "</span>" : "") + "</div>";
      }).join("");
      var rod = [];
      if (f.posologia) rod.push("<b>Posologia:</b> " + fmt(f.posologia));
      if (f.duracao) rod.push("<b>Duração:</b> " + fmt(f.duracao));
      if (f.via) rod.push("<b>Via:</b> " + fmt(f.via));
      return '<div class="op-bloco">' + (f.titulo ? '<div class="op-bloco__t">' + fmt(f.titulo) + "</div>" : "") +
        comp + (rod.length ? '<div class="rx-pos">' + rod.join(" · ") + "</div>" : "") + "</div>";
    }).join("");
  }

  function cardHTML(o) {
    var ativa = estaAtiva(o);
    return '<div class="op-card' + (ativa ? "" : " op-card--off") + '" data-id="' + esc(o.id) + '">' +
      '<div class="op-card__head"><div>' +
        '<div class="op-card__t">' + esc(o.titulo) +
          (ativa ? "" : ' <span class="rx-selo rx-selo--off">pausada</span>') + "</div>" +
        '<div class="op-card__meta">' + esc(CAT_LABEL[o.categoria] || "") +
          (o.categoria ? " · " : "") + "prescrita em " + fmtData(o.data) + "</div>" +
      "</div><div class=\"op-card__acts\">" +
        '<button class="btn btn--ghost" data-rx-toggle="' + esc(o.id) + '" type="button" ' +
          'aria-pressed="' + (ativa ? "true" : "false") + '" ' +
          'title="' + (ativa ? "Pausar: fica no histórico, mas marcada como não em uso" : "Reativar esta prescrição") + '">' +
          (ativa ? "⏸️ Pausar" : "▶️ Reativar") + "</button>" +
        '<button class="btn btn--ghost" data-rx-edit="' + esc(o.id) + '" type="button" title="Editar esta prescrição">✏️ Editar</button>' +
        '<button class="btn btn--ghost" data-rx-pdf="' + esc(o.id) + '" type="button">📄 PDF</button>' +
        '<button class="btn btn--ghost rx-del" data-rx-rm="' + esc(o.id) + '" type="button" title="Excluir esta prescrição">🗑️ Excluir</button>' +
      "</div></div>" +
      (o.indicacao ? '<p class="op-card__resumo">' + esc(o.indicacao) + "</p>" : "") +
      formulasHTML(o) +
      (o.interacoes ? '<div class="op-dica">⚠️ ' + esc(o.interacoes) + "</div>" : "") +
    "</div>";
  }

  function render(p) {
    _p = p;
    var lista = (p.prescricoes || []).slice().sort(function (a, b) { return (b.data || "").localeCompare(a.data || ""); });
    var toolbar = '<div class="op-bar">' +
      '<button class="btn btn--primary" id="rx-add" type="button">＋ Do banco de formulações</button>' +
      '<button class="btn btn--ghost" id="rx-custom" type="button">✍️ Sua formulação</button>' +
    "</div>";
    var atuais = lista.length ? lista.map(cardHTML).join("")
      : '<div class="empty-state">Nenhuma prescrição registrada. Puxe do seu banco de formulações ou escreva do zero — o PDF sai com a sua identidade.</div>';
    var hist = lista.length
      ? '<div class="ilist">' + lista.map(function (o) {
          return '<div class="iitem"><span class="iitem__ico">💊</span>' +
            '<div class="iitem__info"><div class="iitem__title">' + esc(o.titulo) +
            (estaAtiva(o) ? "" : ' <span class="rx-selo rx-selo--off">pausada</span>') + "</div>" +
            '<div class="iitem__date">' + fmtData(o.data) + "</div></div>" +
            '<button class="btn btn--ghost" data-rx-pdf="' + esc(o.id) + '" type="button">PDF</button>' +
            '<button class="btn btn--ghost rx-del" data-rx-rm="' + esc(o.id) + '" type="button" title="Excluir esta prescrição" aria-label="Excluir prescrição">🗑️</button></div>';
        }).join("") + "</div>"
      : '<div class="empty-state">Ainda não há histórico.</div>';
    return secWrap("Prescrições do paciente", toolbar + '<div class="op-list">' + atuais + "</div>") +
           secWrap("Histórico de prescrições", hist);
  }

  /* ---------- Persistência ---------- */
  function salvar(lista) { return window.NutriPacientes.savePrescricoes(_p.id, lista); }
  function attach(item) {
    var lista = (_p.prescricoes || []).concat([item]);
    if (_ctx.toast) _ctx.toast("Registrando…");
    salvar(lista).then(function (saved) {
      if (_ctx.onSaved) _ctx.onSaved(saved);
      if (_ctx.toast) _ctx.toast("Prescrição registrada");
    }).catch(function (e) { if (_ctx.toast) _ctx.toast("Não consegui registrar. " + (e && e.message || ""), true); });
  }
  // Grava por cima da prescrição que já existe (editar / pausar), preservando
  // a ordem da lista — a nutri espera o card no mesmo lugar depois de salvar.
  function atualizar(id, patch, msg) {
    var lista = (_p.prescricoes || []).map(function (o) {
      return o.id === id ? Object.assign({}, o, patch) : o;
    });
    if (_ctx.toast) _ctx.toast("Salvando…");
    return salvar(lista).then(function (saved) {
      if (_ctx.onSaved) _ctx.onSaved(saved);
      if (_ctx.toast) _ctx.toast(msg || "Salvo");
    }).catch(function (e) { if (_ctx.toast) _ctx.toast("Não consegui salvar. " + (e && e.message || ""), true); });
  }
  function alternarAtiva(id) {
    var o = (_p.prescricoes || []).find(function (x) { return x.id === id; });
    if (!o) return;
    var ligar = !estaAtiva(o);
    atualizar(id, { ativa: ligar }, ligar ? "Prescrição reativada" : "Prescrição pausada");
  }
  function remover(id) {
    var o = (_p.prescricoes || []).find(function (x) { return x.id === id; });
    var nome = o && o.titulo ? '"' + o.titulo + '"' : "esta prescrição";
    if (!confirm("Excluir " + nome + " do paciente? Esta ação não pode ser desfeita.")) return;
    var lista = (_p.prescricoes || []).filter(function (o) { return o.id !== id; });
    salvar(lista).then(function (saved) {
      if (_ctx.onSaved) _ctx.onSaved(saved);
      if (_ctx.toast) _ctx.toast("Removida");
    }).catch(function (e) { if (_ctx.toast) _ctx.toast("Não consegui remover. " + (e && e.message || ""), true); });
  }

  /* ---------- PDF com a marca ---------- */
  function gerarPDF(o) {
    if (!window.NutriDoc) { if (_ctx.toast) _ctx.toast("Motor de documento indisponível.", true); return; }
    var body = (o.indicacao ? "<p><b>Indicação:</b> " + esc(o.indicacao) + "</p>" : "") +
      (o.formulas || []).map(function (f) {
        var comp = (f.componentes || []).map(function (c) {
          return "<li>" + [c.ativo, c.dose, c.obs].filter(Boolean).map(fmt).join(" — ") + "</li>";
        }).join("");
        var rod = [];
        if (f.posologia) rod.push("Posologia: " + fmt(f.posologia));
        if (f.duracao) rod.push("Duração: " + fmt(f.duracao));
        if (f.via) rod.push("Via: " + fmt(f.via));
        return (f.titulo ? "<h2>" + fmt(f.titulo) + "</h2>" : "") + "<ul>" + comp + "</ul>" +
          (rod.length ? "<p>" + rod.join(" · ") + "</p>" : "");
      }).join("") +
      (o.interacoes ? '<div class="doc-note">⚠️ ' + esc(o.interacoes) + "</div>" : "");
    window.NutriDoc.imprimir(_ctx.perfil || {}, {
      tipo: "Prescrição", paciente: _p.nome, data: fmtData(o.data) || fmtData(hojeISO()), bodyHTML: body
    });
  }

  /* ---------- Picker do banco ---------- */
  function abrirPicker() {
    var host = document.getElementById("ficha-main"); if (!host) return;
    var ov = document.createElement("div"); ov.className = "op-modal"; ov.id = "rx-modal";
    ov.innerHTML =
      '<div class="op-modal__box"><div class="op-modal__head"><b>Do banco de formulações</b>' +
      '<button class="op-modal__x" id="rx-modal-x" type="button" aria-label="Fechar">✕</button></div>' +
      '<input class="op-modal__busca" id="rx-modal-busca" type="search" placeholder="Buscar por condição ou ativo…" autocomplete="off" />' +
      '<div class="op-modal__list" id="rx-modal-list"><div class="empty-state">Carregando…</div></div></div>';
    host.appendChild(ov);
    document.getElementById("rx-modal-busca").focus();

    function pintar() {
      var t = (document.getElementById("rx-modal-busca").value || "").toLowerCase();
      var arr = (_lib || []).filter(function (o) {
        if (!t) return true;
        return (o.nome + " " + (o.indicacao || "") + " " + (o.sinonimos || []).join(" ")).toLowerCase().indexOf(t) !== -1;
      });
      document.getElementById("rx-modal-list").innerHTML = arr.length ? arr.map(function (o) {
        return '<button class="op-pick" data-rx-pick="' + esc(o.slug) + '" type="button">' +
          '<span class="op-pick__t">' + esc(o.nome) + (o.editavel ? ' <span class="bc-selo">minha</span>' : "") + "</span>" +
          '<span class="op-pick__d">' + esc(o.indicacao || "") + "</span></button>";
      }).join("") : '<div class="empty-state">Nada encontrado.</div>';
    }
    function carregarLib() {
      if (_lib) { pintar(); return; }
      window.NutriDBReady.then(function (db) {
        return db.from("ic_formulacoes_minhas").select("*").order("categoria").order("nome");
      }).then(function (r) { _lib = (r && r.data) || []; pintar(); })
        .catch(function () { document.getElementById("rx-modal-list").innerHTML = '<div class="empty-state">Não consegui carregar o banco.</div>'; });
    }
    carregarLib();

    ov.addEventListener("input", function (e) { if (e.target.id === "rx-modal-busca") pintar(); });
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("#rx-modal-x")) { ov.remove(); return; }
      var pick = e.target.closest("[data-rx-pick]");
      if (pick) {
        var o = (_lib || []).find(function (x) { return x.slug === pick.getAttribute("data-rx-pick"); });
        if (o) attach({
          id: uid(), titulo: o.nome, origem_slug: o.slug, categoria: o.categoria,
          indicacao: o.indicacao || "", formulas: o.formulas || [], interacoes: o.interacoes || null, data: hojeISO()
        });
        ov.remove();
      }
    });
  }

  /* ---------- Escrever do zero / editar ----------
     O mesmo formulário serve para criar e para corrigir: sem ele, errar a dose
     obrigava a excluir e escrever tudo de novo. Vindo do banco de formulações,
     editar aqui muda só a cópia do paciente — o banco fica intacto. */
  var HINT_FORMULAS = "“# Título” abre uma fórmula; “- Ativo | dose | obs”; " +
    "Posologia:/Duração:/Via: nas linhas próprias. Selecione um trecho para " +
    "deixar em <b>negrito</b>, sublinhado ou colorido.";

  /* Campo de fórmulas com a barra de formatação. Se o editor não tiver
     carregado, cai no textarea de sempre — a prescrição não pode ficar
     impossível de escrever por causa de um script que faltou. */
  function campoFormulas(edit) {
    var formulas = (edit && edit.formulas) || [];
    if (!window.EditorFormulas) {
      return '<span class="op-hint">' + HINT_FORMULAS.replace(/<\/?b>/g, "") + "</span>" +
        '<textarea name="formulas" rows="9" placeholder="# Fitoterápico&#10;- Passiflora | 200-400 mg/dia&#10;Posologia: 1x à noite">' +
        esc(edit ? formulasToTexto(formulas) : "") + "</textarea>";
    }
    return window.EditorFormulas.campo({
      id: "rx-formulas", rotulo: "Fórmulas", altura: 190, hint: HINT_FORMULAS,
      valorHTML: edit ? window.EditorFormulas.paraEditor(formulas) : "",
      placeholder: "# Fitoterápico · - Passiflora | 200-400 mg/dia · Posologia: 1x à noite"
    });
  }

  function abrirCustom(edit) {
    var host = document.getElementById("ficha-main"); if (!host) return;
    var ov = document.createElement("div"); ov.className = "op-modal"; ov.id = "rx-modal";
    ov.innerHTML =
      '<div class="op-modal__box"><div class="op-modal__head"><b>' + (edit ? "Editar prescrição" : "Escrever prescrição") + "</b>" +
      '<button class="op-modal__x" id="rx-modal-x" type="button" aria-label="Fechar">✕</button></div>' +
      '<form id="rx-form" class="op-form">' +
        '<label>Título<input name="titulo" required placeholder="Ex.: Suporte para ansiedade" value="' + esc(edit && edit.titulo || "") + '" /></label>' +
        '<label>Indicação (opcional)<input name="indicacao" placeholder="Para quê" value="' + esc(edit && edit.indicacao || "") + '" /></label>' +
        /* Fora do <label> de propósito: o label do formulário é semibold e o
           Chrome herdava esse peso como estilo de digitação — tudo o que a
           nutri escrevia já nascia dentro de <b>, e o botão de negrito
           desligava em vez de ligar. */
        '<div class="op-campo"><span class="op-campo__lbl">Fórmulas</span>' +
          campoFormulas(edit) + "</div>" +
        '<label>Interações / cautelas (opcional)<input name="interacoes" placeholder="Ex.: potencializa sedativos" value="' + esc(edit && edit.interacoes || "") + '" /></label>' +
        '<div class="op-form__acts"><button class="btn btn--primary" type="submit">' + (edit ? "Salvar alterações" : "Registrar") + "</button>" +
          '<button class="btn btn--ghost" type="button" id="rx-modal-x2">Cancelar</button></div>' +
      "</form></div>";
    host.appendChild(ov);
    if (window.EditorFormulas) window.EditorFormulas.wire(ov);
    var nome = ov.querySelector('[name="titulo"]'); if (nome) nome.focus();

    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("#rx-modal-x") || e.target.closest("#rx-modal-x2")) ov.remove();
    });
    ov.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var titulo = (fd.get("titulo") || "").trim(); if (!titulo) return;
      var area = ov.querySelector(".ef__area");
      var formulas = area && window.EditorFormulas
        ? window.EditorFormulas.ler(area)
        : textoToFormulas(fd.get("formulas") || "");
      var dados = {
        titulo: titulo,
        indicacao: (fd.get("indicacao") || "").trim(), formulas: formulas,
        interacoes: (fd.get("interacoes") || "").trim() || null
      };
      if (edit) atualizar(edit.id, dados, "Prescrição atualizada");
      else attach(Object.assign({ id: uid(), origem_slug: null, categoria: "custom", data: hojeISO() }, dados));
      ov.remove();
    });
  }

  /* ---------- Fiação ---------- */
  function onClick(ev) {
    if (ev.target.closest("#rx-add")) { abrirPicker(); return; }
    if (ev.target.closest("#rx-custom")) { abrirCustom(); return; }
    var ed = ev.target.closest("[data-rx-edit]");
    if (ed) {
      var alvo = (_p.prescricoes || []).find(function (x) { return x.id === ed.getAttribute("data-rx-edit"); });
      if (alvo) abrirCustom(alvo);
      return;
    }
    var tg = ev.target.closest("[data-rx-toggle]");
    if (tg) { alternarAtiva(tg.getAttribute("data-rx-toggle")); return; }
    var pdf = ev.target.closest("[data-rx-pdf]");
    if (pdf) { var o = (_p.prescricoes || []).find(function (x) { return x.id === pdf.getAttribute("data-rx-pdf"); }); if (o) gerarPDF(o); return; }
    var rm = ev.target.closest("[data-rx-rm]");
    if (rm) { remover(rm.getAttribute("data-rx-rm")); return; }
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    var main = document.getElementById("ficha-main");
    if (main && !main._rxWired) { main.addEventListener("click", onClick); main._rxWired = true; }
  }

  window.PrescricoesPaciente = { render: render, wire: wire };
})();
