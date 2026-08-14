/* ============================================================
   METAS — checklist OPCIONAL que a nutri cria para o paciente
   (ex.: "Beber 2L de água/dia", "Treinar 3x na semana"). Publica com
   botão Liberado/Oculto. Salvo em pacientes.metas. O paciente marca
   cada meta no portal (reaproveita plano_adesao.marcas, chave "meta:<i>").
   window.MetasPaciente = { render, wire };  window.MetasView = { portalHTML }.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function hojeBR() {
    var d = new Date();
    return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
  }

  var SUGESTOES = [
    "Beber 2 litros de água por dia", "Comer 3 porções de vegetais no dia",
    "Treinar 3x na semana", "Dormir 7–8 horas por noite",
    "Evitar refrigerante durante a semana", "Fazer as refeições sem telas",
    "Mastigar devagar em cada refeição", "Levar marmita para o trabalho",
    "Caminhar 30 min por dia", "Não pular o café da manhã"
  ];

  function metasVazio() {
    return { titulo: "Minhas metas", publicado: false, itens: [{ texto: "" }] };
  }

  var _p = null, _ctx = null, _draft = null;
  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function root() { return document.getElementById("metas-root"); }
  function temMetas(p) {
    return !!(p && p.metas && (p.metas.itens || []).some(function (i) { return (i.texto || "").trim(); }));
  }

  function render(p) {
    return '<div id="metas-root">' + (temMetas(p) ? resumoHTML(p.metas) : escolhaHTML(p)) + '</div>';
  }

  function escolhaHTML(p) {
    var objetivo = p && p.objetivo
      ? '<div class="fgoal"><span class="fgoal__ico">🎯</span><div><strong>' + esc(p.objetivo) + '</strong>' +
        (p.meta != null ? '<p class="ftxt">Meta de peso: ' + p.meta + ' kg</p>' : '') + '</div></div>' : '';
    return '<section class="fsec">' +
      '<h2 class="fsec__title">Metas do paciente</h2>' +
      objetivo +
      '<p class="pl-hint">Crie um checklist de hábitos e metas para o paciente acompanhar no portal — é opcional.</p>' +
      '<button class="btn btn--primary" type="button" data-mt-criar>✏️ Criar checklist de metas</button>' +
      '</section>';
  }

  function resumoHTML(mt) {
    var itens = (mt.itens || []).filter(function (i) { return (i.texto || "").trim(); }).map(function (i) {
      return '<li class="mt-ritem">🎯 ' + esc(i.texto) + '</li>';
    }).join("");
    return '<section class="fsec">' +
      '<div class="fsec__head"><h2 class="fsec__title">' + esc(mt.titulo || "Metas") +
        (mt.publicado ? ' <span class="pl-plano-card__badge">Liberado</span>' : '') + '</h2>' +
        '<div class="pl-res__acoes">' + toggleHTML(mt) +
          '<button class="btn btn--outline btn--sm" type="button" data-mt-editar>✏️ Editar</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-mt-excluir>🗑️ Excluir</button>' +
        '</div></div>' +
      (mt.atualizadoEm ? '<p class="pl-hint">Atualizado em ' + esc(mt.atualizadoEm) + '</p>' : '') +
      '<ul class="mt-rlist">' + itens + '</ul></section>';
  }
  function toggleHTML(mt) {
    var on = !!mt.publicado;
    return '<button class="pl-switch' + (on ? " pl-switch--on" : "") + '" type="button" role="switch" ' +
      'aria-checked="' + on + '" data-mt-toggle title="' + (on ? "Liberado — clique para ocultar" : "Oculto — clique para liberar") + '">' +
      '<span class="pl-switch__knob"></span><span class="pl-switch__lbl">' + (on ? "Liberado" : "Oculto") + '</span></button>';
  }

  function editorHTML(mt) {
    var itens = (mt.itens && mt.itens.length ? mt.itens : [{ texto: "" }]).map(itemHTML).join("");
    var sug = SUGESTOES.map(function (s) {
      return '<button class="mt-sug" type="button" data-sug="' + esc(s) + '">＋ ' + esc(s) + '</button>';
    }).join("");
    return '<section class="fsec">' +
      '<div class="fsec__head"><h2 class="fsec__title">Checklist de metas</h2>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-mt-voltar>← Voltar</button></div>' +
      '<label class="pl-field pl-field--wide"><span>Título</span>' +
        '<input type="text" data-mt-titulo value="' + esc(mt.titulo || "") + '" placeholder="Minhas metas" /></label>' +
      '<div id="mt-itens">' + itens + '</div>' +
      '<button class="pl-additem" type="button" data-mt-additem>＋ meta</button>' +
      '<div class="mt-sugs"><span class="mt-sugs__lbl">Sugestões:</span>' + sug + '</div>' +
      '<div class="pl-actions"><button class="btn btn--primary" type="button" data-mt-salvar>💾 Salvar metas</button></div>' +
      '</section>';
  }
  function itemHTML(i) {
    return '<div class="mt-item" data-item>' +
      '<span class="mt-item__ico">🎯</span>' +
      '<input class="mt-item__txt" type="text" data-mt-txt value="' + esc((i && i.texto) || "") + '" placeholder="ex.: Beber 2L de água por dia" />' +
      '<button class="pl-x" type="button" data-rm-item aria-label="Remover">✕</button></div>';
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    if (!root()) return;
    if (temMetas(p)) bindResumo(); else bindEscolha();
  }
  function bindEscolha() {
    var r = root(); if (!r) return;
    var b = r.querySelector("[data-mt-criar]");
    if (b) b.addEventListener("click", function () { abrirEditor(metasVazio()); });
  }
  function bindResumo() {
    var r = root(); if (!r) return;
    var ed = r.querySelector("[data-mt-editar]");
    if (ed) ed.addEventListener("click", function () { abrirEditor(JSON.parse(JSON.stringify(_p.metas))); });
    var tg = r.querySelector("[data-mt-toggle]");
    if (tg) tg.addEventListener("click", alternarPublicado);
    var ex = r.querySelector("[data-mt-excluir]");
    if (ex) ex.addEventListener("click", excluir);
  }
  function abrirEditor(mt) {
    _draft = mt;
    var r = root(); if (!r) return;
    r.innerHTML = editorHTML(mt);
    bindEditor();
  }
  function bindEditor() {
    var r = root(); if (!r) return;
    r.querySelector("[data-mt-voltar]").addEventListener("click", function () {
      r.innerHTML = temMetas(_p) ? resumoHTML(_p.metas) : escolhaHTML(_p);
      if (temMetas(_p)) bindResumo(); else bindEscolha();
    });
    r.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-mt-additem]")) { addItem(""); }
      else if (t.closest("[data-rm-item]")) { t.closest("[data-item]").remove(); }
      else if (t.closest("[data-sug]")) { addItem(t.closest("[data-sug]").getAttribute("data-sug")); }
      else if (t.closest("[data-mt-salvar]")) { salvar(); }
    });
  }
  function addItem(texto) {
    var box = document.getElementById("mt-itens");
    var tmp = document.createElement("div"); tmp.innerHTML = itemHTML({ texto: texto });
    box.appendChild(tmp.firstChild);
    if (texto) { var last = box.lastChild.querySelector("[data-mt-txt]"); if (last) last.focus(); }
  }
  function coletar() {
    var r = root();
    var mt = { titulo: (r.querySelector("[data-mt-titulo]") || {}).value || "Minhas metas",
      publicado: !!(_draft && _draft.publicado), atualizadoEm: hojeBR(), itens: [] };
    r.querySelectorAll("[data-item]").forEach(function (el) {
      var txt = (el.querySelector("[data-mt-txt]") || {}).value || "";
      if (txt.trim()) mt.itens.push({ texto: txt.trim() });
    });
    return mt;
  }
  function persistir(mt, okMsg, btn) {
    if (!window.NutriPacientes) { toast("Banco indisponível.", true); return; }
    window.NutriPacientes.saveMetas(_p.id, mt).then(function (saved) {
      _p = saved;
      var r = root();
      if (r) { r.innerHTML = temMetas(_p) ? resumoHTML(_p.metas) : escolhaHTML(_p); if (temMetas(_p)) bindResumo(); else bindEscolha(); }
      if (okMsg) toast(okMsg);
      if (_ctx.onSaved) _ctx.onSaved(saved);
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "💾 Salvar metas"; }
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }
  function salvar() {
    var mt = coletar();
    if (!mt.itens.length) { toast("Adicione ao menos uma meta.", true); return; }
    var btn = root().querySelector("[data-mt-salvar]");
    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    persistir(mt, "Metas salvas", btn);
  }
  function alternarPublicado() {
    var mt = Object.assign({}, _p.metas, { publicado: !_p.metas.publicado, atualizadoEm: hojeBR() });
    persistir(mt, mt.publicado ? "Metas liberadas para o paciente" : "Metas ocultadas do paciente");
  }
  function excluir() {
    if (!window.confirm("Excluir o checklist de metas deste paciente?")) return;
    persistir(null, "Metas excluídas");
  }

  /* ---------- Portal (paciente) ----------
     Aqui o objetivo não é informar, é dar vontade de cumprir. O que muda
     em relação a uma lista seca:
      • o progresso é um anel que enche — o vazio a preencher puxa mais
        que uma barra fininha perdida no topo;
      • a frase muda conforme o avanço e sempre diz o que falta em número
        ("falta 1"), que é o que faz levantar e ir fazer;
      • marcar responde na hora, sem esperar recarregar a página.
     Nada aqui promete resultado — quem fala de resultado é a nutri, na
     consulta (Código de Ética, CFN 856/2026). */

  var CIRC = 2 * Math.PI * 52;   // r=52 no SVG abaixo

  function faltamTxt(n) { return n === 1 ? "falta 1" : "faltam " + n; }

  function mensagem(feitos, total) {
    var falta = total - feitos;
    if (total && feitos === total) return "Você cumpriu todas as metas. Que orgulho! 💜";
    if (feitos === 0) return "Comece por uma. A primeira é a que puxa as outras.";
    if (feitos * 2 < total) return "Já saiu do lugar — " + faltamTxt(falta) + " para fechar o dia.";
    if (feitos * 2 === total) return "Metade do caminho feito. " + faltamTxt(falta).replace(/^f/, "F") + ".";
    return "Quase lá! " + faltamTxt(falta).replace(/^f/, "F") + " para completar tudo.";
  }

  function anelHTML(feitos, total) {
    var pct = total ? Math.round(feitos * 100 / total) : 0;
    var off = CIRC * (1 - pct / 100);
    return '<div class="mt-ring' + (total && feitos === total ? " is-full" : "") + '" id="mt-ring">' +
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle class="mt-ring__bg" cx="60" cy="60" r="52"></circle>' +
        '<circle class="mt-ring__fg" cx="60" cy="60" r="52" id="mt-ring-fg" ' +
          'stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
      '</svg>' +
      '<div class="mt-ring__mid">' +
        '<strong id="mt-ring-n">' + feitos + '<span>/' + total + '</span></strong>' +
        '<span>metas</span>' +
      '</div></div>';
  }

  function portalHTML(p, marcas, readonly) {
    var mt = p.metas;
    var itens = mt && mt.publicado ? (mt.itens || []).filter(function (i) { return (i.texto || "").trim(); }) : [];
    if (!itens.length) {
      return '<div class="pcard"><div class="empty-state">Sua nutricionista ainda não definiu metas para você. 🎯</div></div>';
    }
    var feitos = 0;
    var lis = itens.map(function (i, idx) {
      var key = "meta:" + idx;
      var done = marcas && marcas[key] === true; if (done) feitos++;
      // O <label> inteiro é o alvo de toque: no celular, mirar um
      // quadradinho de 16px é o que faz a paciente desistir de marcar.
      return '<li class="mt-pitem' + (done ? " is-done" : "") + '" data-mt-li="' + key + '"><label>' +
        '<input type="checkbox" data-check="' + key + '"' + (done ? " checked" : "") + (readonly ? " disabled" : "") + '>' +
        '<span class="mt-pitem__box" aria-hidden="true"></span>' +
        '<span class="mt-pitem__txt">' + esc(i.texto) + '</span></label></li>';
    }).join("");

    return '<div class="pcard mt-hero' + (feitos === itens.length ? " is-full" : "") + '">' +
        anelHTML(feitos, itens.length) +
        '<div class="mt-hero__txt">' +
          '<h2>🎯 ' + esc(mt.titulo || "Minhas metas") + '</h2>' +
          '<p class="mt-hero__msg" id="mt-msg">' + esc(mensagem(feitos, itens.length)) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="pcard"><ul class="mt-plist">' + lis + '</ul></div>';
  }

  /* Chamado pelo portal a cada marcação: recalcula anel e frase sem
     redesenhar a lista (redesenhar tira o foco e perde a animação). */
  function refreshPortal(marcas) {
    var lista = document.querySelector(".mt-plist");
    if (!lista) return;
    var itens = [].slice.call(lista.querySelectorAll("[data-mt-li]"));
    var total = itens.length, feitos = 0;
    itens.forEach(function (li) {
      var done = marcas && marcas[li.getAttribute("data-mt-li")] === true;
      if (done) feitos++;
      li.classList.toggle("is-done", !!done);
    });
    var fg = document.getElementById("mt-ring-fg");
    if (fg) fg.setAttribute("stroke-dashoffset", (CIRC * (1 - (total ? feitos / total : 0))).toFixed(1));
    var n = document.getElementById("mt-ring-n");
    if (n) n.innerHTML = feitos + "<span>/" + total + "</span>";
    var msg = document.getElementById("mt-msg");
    if (msg) msg.textContent = mensagem(feitos, total);
    var cheio = total > 0 && feitos === total;
    var ring = document.getElementById("mt-ring");
    if (ring) ring.classList.toggle("is-full", cheio);
    var hero = document.querySelector(".mt-hero");
    if (hero) hero.classList.toggle("is-full", cheio);
  }

  window.MetasPaciente = { render: render, wire: wire };
  window.MetasView = { portalHTML: portalHTML, refresh: refreshPortal };
})();
