/* ============================================================
   TREINO EM CASA — a nutri monta um treino para o paciente fazer em
   casa: blocos (ex.: Aquecimento, Inferiores, Core) com exercícios
   (séries × reps, descanso, vídeo do YouTube, dica). Publica com um
   botão Liberado/Oculto (igual ao plano). Salvo em pacientes.treino.
   O paciente vê no portal e marca cada exercício como feito (reaproveita
   plano_adesao.marcas com chave "treino:<b>:<e>").
   window.TreinoPaciente = { render, wire }.
   Também expõe helpers de render para o portal (window.TreinoView).
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

  // Extrai o id de um vídeo do YouTube de várias formas de URL.
  function ytId(url) {
    if (!url) return "";
    url = String(url).trim();
    if (/^[\w-]{11}$/.test(url)) return url;
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  function ytThumb(id) { return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg"; }
  function ytWatch(id) { return "https://www.youtube.com/watch?v=" + id; }
  function ytSearch(nome) { return "https://www.youtube.com/results?search_query=" + encodeURIComponent(nome + " como fazer em casa"); }

  /* ---------- Biblioteca de exercícios (peso do corpo, em casa) ---------- */
  var BIBLIOTECA = [
    { area: "Aquecimento", ico: "🔥", itens: [
      { nome: "Polichinelo (jumping jacks)", series: 3, reps: "30 seg", dica: "Ritmo constante, aterrisse leve." },
      { nome: "Corrida estacionária", series: 3, reps: "40 seg", dica: "Joelhos na altura do quadril." },
      { nome: "Rotação de tronco em pé", series: 2, reps: "20 seg", dica: "Solte os ombros, gire da cintura." }
    ] },
    { area: "Membros inferiores", ico: "🦵", itens: [
      { nome: "Agachamento livre", series: 4, reps: "12–15", dica: "Joelhos alinhados aos pés, desça até 90°." },
      { nome: "Afundo (avanço)", series: 3, reps: "10 cada perna", dica: "Tronco ereto, joelho não passa da ponta do pé." },
      { nome: "Elevação de panturrilha", series: 3, reps: "20", dica: "Suba na ponta dos pés e segure 1 seg." },
      { nome: "Ponte de glúteo", series: 3, reps: "15", dica: "Aperte o glúteo no topo, não force a lombar." },
      { nome: "Agachamento sumô", series: 3, reps: "15", dica: "Pés afastados, pontas para fora." }
    ] },
    { area: "Membros superiores", ico: "💪", itens: [
      { nome: "Flexão de braço", series: 3, reps: "8–12", dica: "Corpo em linha reta; joelhos apoiados se precisar." },
      { nome: "Flexão inclinada (na parede/sofá)", series: 3, reps: "12", dica: "Ótima para iniciantes." },
      { nome: "Tríceps no banco/cadeira", series: 3, reps: "12", dica: "Cotovelos para trás, desça devagar." },
      { nome: "Prancha com toque no ombro", series: 3, reps: "10 cada", dica: "Quadril firme, sem balançar." }
    ] },
    { area: "Core / abdômen", ico: "🎯", itens: [
      { nome: "Prancha isométrica", series: 3, reps: "30–45 seg", dica: "Umbigo para dentro, sem afundar o quadril." },
      { nome: "Abdominal remador", series: 3, reps: "15", dica: "Movimento controlado, expire ao subir." },
      { nome: "Elevação de pernas deitada", series: 3, reps: "12", dica: "Lombar colada no chão." },
      { nome: "Bicicleta no solo", series: 3, reps: "20 (10 cada)", dica: "Cotovelo em direção ao joelho oposto." }
    ] },
    { area: "Cardio / HIIT", ico: "⚡", itens: [
      { nome: "Burpee", series: 4, reps: "10", dica: "Adapte sem o salto se precisar." },
      { nome: "Mountain climber", series: 4, reps: "30 seg", dica: "Ritmo forte, core firme." },
      { nome: "Skipping (joelho alto)", series: 4, reps: "30 seg", dica: "Braços acompanham o movimento." }
    ] },
    { area: "Mobilidade / alongamento", ico: "🧘", itens: [
      { nome: "Alongamento de posterior de coxa", series: 2, reps: "30 seg cada", dica: "Sem dor, respire fundo." },
      { nome: "Gato-camelo (coluna)", series: 2, reps: "10", dica: "Mobiliza a coluna com suavidade." },
      { nome: "Alongamento de peitoral na porta", series: 2, reps: "30 seg", dica: "Abra o peito devagar." }
    ] }
  ];
  var BIB_ALL = [];
  BIBLIOTECA.forEach(function (g) { g.itens.forEach(function (x) { BIB_ALL.push(Object.assign({ area: g.area }, x)); }); });
  var BIB_BY_NOME = {};
  BIB_ALL.forEach(function (x) { BIB_BY_NOME[x.nome.toLowerCase()] = x; });

  /* ---------- Modelos de treino prontos ---------- */
  function exDeArea(area, n) {
    var g = BIBLIOTECA.filter(function (x) { return x.area === area; })[0];
    return (g ? g.itens : []).slice(0, n).map(function (x) {
      return { nome: x.nome, series: x.series, reps: x.reps, descanso: "45 seg", video: "", obs: x.dica };
    });
  }
  var MODELOS = [
    { id: "full", ico: "🏋️", nome: "Treino completo (3x/semana)", desc: "Corpo todo, sem equipamento.",
      blocos: [
        { nome: "Aquecimento", exercicios: exDeArea("Aquecimento", 3) },
        { nome: "Inferiores", exercicios: exDeArea("Membros inferiores", 4) },
        { nome: "Superiores", exercicios: exDeArea("Membros superiores", 3) },
        { nome: "Core", exercicios: exDeArea("Core / abdômen", 3) }
      ] },
    { id: "iniciante", ico: "🌱", nome: "Iniciante (baixo impacto)", desc: "Comece com segurança.",
      blocos: [
        { nome: "Aquecimento", exercicios: exDeArea("Aquecimento", 2) },
        { nome: "Força leve", exercicios: exDeArea("Membros inferiores", 3) },
        { nome: "Mobilidade", exercicios: exDeArea("Mobilidade / alongamento", 3) }
      ] },
    { id: "hiit", ico: "⚡", nome: "Queima (HIIT 20 min)", desc: "Cardio intenso e rápido.",
      blocos: [
        { nome: "Aquecimento", exercicios: exDeArea("Aquecimento", 2) },
        { nome: "HIIT", exercicios: exDeArea("Cardio / HIIT", 3) },
        { nome: "Core", exercicios: exDeArea("Core / abdômen", 2) }
      ] }
  ];

  function treinoVazio() {
    return { titulo: "Treino em casa", publicado: false, blocos: [
      { nome: "Bloco 1", exercicios: [{ nome: "", series: 3, reps: "12", descanso: "45 seg", video: "", obs: "" }] }
    ] };
  }
  function deModelo(m) {
    return { titulo: "Treino — " + m.nome, publicado: false,
      blocos: m.blocos.map(function (b) { return { nome: b.nome, exercicios: b.exercicios.map(function (e) { return Object.assign({}, e); }) }; }) };
  }

  /* ============================================================ */
  var _p = null, _ctx = null, _draft = null;
  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function root() { return document.getElementById("treino-root"); }
  function temTreino(p) { return !!(p && p.treino && p.treino.blocos && p.treino.blocos.length); }

  function render(p) {
    return '<div id="treino-root">' + (temTreino(p) ? resumoHTML(p.treino) : escolhaHTML()) + '</div>' + datalist();
  }
  function datalist() {
    return '<datalist id="tr-exercicios">' +
      BIB_ALL.map(function (x) { return '<option value="' + esc(x.nome) + '"></option>'; }).join("") + '</datalist>';
  }

  /* ---------- Escolha ---------- */
  function escolhaHTML() {
    var modelos = MODELOS.map(function (m) {
      return '<button class="tr-modelo" type="button" data-modelo="' + m.id + '">' +
        '<span class="tr-modelo__ico">' + m.ico + '</span>' +
        '<span class="tr-modelo__nome">' + esc(m.nome) + '</span>' +
        '<span class="tr-modelo__desc">' + esc(m.desc) + '</span></button>';
    }).join("");
    return '<section class="fsec">' +
      '<h2 class="fsec__title">Treino em casa</h2>' +
      '<p class="pl-hint">Monte um treino para o paciente fazer em casa, sem equipamento. Comece de um modelo ou do zero.</p>' +
      '<div class="tr-modelos">' + modelos +
        '<button class="tr-modelo tr-modelo--zero" type="button" data-do-zero>' +
          '<span class="tr-modelo__ico">✍️</span><span class="tr-modelo__nome">Começar do zero</span>' +
          '<span class="tr-modelo__desc">Monte bloco por bloco</span></button>' +
      '</div></section>';
  }

  /* ---------- Resumo (nutri) ---------- */
  function resumoHTML(tr) {
    var blocos = (tr.blocos || []).map(function (b) {
      var exs = (b.exercicios || []).filter(function (e) { return (e.nome || "").trim(); }).map(function (e) {
        var id = ytId(e.video);
        var vid = id ? ' <a class="tr-vlink" href="' + ytWatch(id) + '" target="_blank" rel="noopener">▶ vídeo</a>' : "";
        return '<div class="tr-ex"><span class="tr-ex__nome">' + esc(e.nome) + vid + '</span>' +
          '<span class="tr-ex__meta">' + esc(e.series) + '× ' + esc(e.reps) + (e.descanso ? ' · ' + esc(e.descanso) : '') + '</span></div>';
      }).join("");
      return '<div class="tr-bloco"><div class="tr-bloco__head">' + esc(b.nome || "Bloco") + '</div>' + exs + '</div>';
    }).join("");
    return '<section class="fsec">' +
      '<div class="fsec__head"><h2 class="fsec__title">' + esc(tr.titulo || "Treino em casa") +
        (tr.publicado ? ' <span class="pl-plano-card__badge">Liberado</span>' : '') + '</h2>' +
        '<div class="pl-res__acoes">' + toggleHTML(tr) +
          '<button class="btn btn--outline btn--sm" type="button" data-tr-editar>✏️ Editar</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-tr-excluir>🗑️ Excluir</button>' +
        '</div></div>' +
      (tr.atualizadoEm ? '<p class="pl-hint">Atualizado em ' + esc(tr.atualizadoEm) + '</p>' : '') +
      '<div class="tr-blocos">' + blocos + '</div></section>';
  }
  function toggleHTML(tr) {
    var on = !!tr.publicado;
    return '<button class="pl-switch' + (on ? " pl-switch--on" : "") + '" type="button" role="switch" ' +
      'aria-checked="' + on + '" data-tr-toggle title="' + (on ? "Liberado — clique para ocultar" : "Oculto — clique para liberar") + '">' +
      '<span class="pl-switch__knob"></span><span class="pl-switch__lbl">' + (on ? "Liberado" : "Oculto") + '</span></button>';
  }

  /* ---------- Editor ---------- */
  function editorHTML(tr) {
    return '<section class="fsec">' +
      '<div class="fsec__head"><h2 class="fsec__title">Montar treino</h2>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-tr-voltar>← Voltar</button></div>' +
      '<label class="pl-field pl-field--wide"><span>Título</span>' +
        '<input type="text" data-tr-titulo value="' + esc(tr.titulo || "") + '" placeholder="Treino em casa" /></label>' +
      '<div id="tr-blocos">' + (tr.blocos || []).map(blocoHTML).join("") + '</div>' +
      '<button class="btn btn--outline btn--sm" type="button" data-tr-addbloco>＋ Adicionar bloco</button>' +
      '<div class="pl-actions">' +
        '<button class="btn btn--primary" type="button" data-tr-salvar>💾 Salvar treino</button></div>' +
      '</section>';
  }
  function blocoHTML(b) {
    var exs = (b.exercicios || []).map(exHTML).join("");
    return '<div class="tr-bloco-ed" data-bloco>' +
      '<div class="tr-bloco-ed__head">' +
        '<input class="tr-bloco-ed__nome" type="text" data-bloco-nome value="' + esc(b.nome || "") + '" placeholder="Nome do bloco (ex.: Inferiores)" />' +
        '<button class="pl-x" type="button" data-rm-bloco aria-label="Remover bloco">🗑️</button></div>' +
      '<div class="tr-exs">' + exs + '</div>' +
      '<button class="pl-additem" type="button" data-add-ex>＋ exercício</button></div>';
  }
  function exHTML(e) {
    e = e || {};
    return '<div class="tr-ex-ed" data-ex>' +
      '<input class="tr-ex-ed__nome" type="text" list="tr-exercicios" data-ex-nome value="' + esc(e.nome || "") + '" placeholder="exercício" />' +
      '<input class="tr-ex-ed__s" type="text" data-ex-series value="' + esc(e.series != null ? e.series : "") + '" placeholder="séries" />' +
      '<input class="tr-ex-ed__r" type="text" data-ex-reps value="' + esc(e.reps || "") + '" placeholder="reps" />' +
      '<input class="tr-ex-ed__d" type="text" data-ex-desc value="' + esc(e.descanso || "") + '" placeholder="descanso" />' +
      '<input class="tr-ex-ed__v" type="text" data-ex-video value="' + esc(e.video || "") + '" placeholder="link do YouTube (opcional)" />' +
      '<input class="tr-ex-ed__o" type="text" data-ex-obs value="' + esc(e.obs || "") + '" placeholder="dica (opcional)" />' +
      '<button class="pl-x" type="button" data-rm-ex aria-label="Remover">✕</button></div>';
  }

  /* ---------- Wire ---------- */
  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    if (!root()) return;
    if (temTreino(p)) bindResumo(); else bindEscolha();
  }
  function bindEscolha() {
    var r = root(); if (!r) return;
    var z = r.querySelector("[data-do-zero]");
    if (z) z.addEventListener("click", function () { abrirEditor(treinoVazio()); });
    r.querySelectorAll("[data-modelo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = MODELOS.filter(function (x) { return x.id === b.getAttribute("data-modelo"); })[0];
        if (m) abrirEditor(deModelo(m));
      });
    });
  }
  function bindResumo() {
    var r = root(); if (!r) return;
    var ed = r.querySelector("[data-tr-editar]");
    if (ed) ed.addEventListener("click", function () { abrirEditor(JSON.parse(JSON.stringify(_p.treino))); });
    var tg = r.querySelector("[data-tr-toggle]");
    if (tg) tg.addEventListener("click", function () { alternarPublicado(); });
    var ex = r.querySelector("[data-tr-excluir]");
    if (ex) ex.addEventListener("click", excluir);
  }
  function abrirEditor(tr) {
    _draft = tr;
    var r = root(); if (!r) return;
    r.innerHTML = editorHTML(tr);
    bindEditor();
  }
  function bindEditor() {
    var r = root(); if (!r) return;
    r.querySelector("[data-tr-voltar]").addEventListener("click", function () {
      r.innerHTML = temTreino(_p) ? resumoHTML(_p.treino) : escolhaHTML();
      if (temTreino(_p)) bindResumo(); else bindEscolha();
    });
    r.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-add-ex]")) { addEx(t.closest("[data-bloco]")); }
      else if (t.closest("[data-rm-ex]")) { t.closest("[data-ex]").remove(); }
      else if (t.closest("[data-addbloco]") || t.closest("[data-tr-addbloco]")) { addBloco(); }
      else if (t.closest("[data-rm-bloco]")) { t.closest("[data-bloco]").remove(); }
      else if (t.closest("[data-tr-salvar]")) { salvar(); }
    });
  }
  function addEx(blocoEl) {
    var box = blocoEl.querySelector(".tr-exs");
    var tmp = document.createElement("div"); tmp.innerHTML = exHTML({ series: 3, reps: "12", descanso: "45 seg" });
    box.appendChild(tmp.firstChild);
  }
  function addBloco() {
    var box = document.getElementById("tr-blocos");
    var tmp = document.createElement("div");
    tmp.innerHTML = blocoHTML({ nome: "Novo bloco", exercicios: [{ series: 3, reps: "12", descanso: "45 seg" }] });
    box.appendChild(tmp.firstChild);
  }
  function coletar() {
    var r = root();
    var tr = { titulo: (r.querySelector("[data-tr-titulo]") || {}).value || "Treino em casa",
      publicado: !!(_draft && _draft.publicado), atualizadoEm: hojeBR(), blocos: [] };
    r.querySelectorAll("[data-bloco]").forEach(function (bEl) {
      var b = { nome: (bEl.querySelector("[data-bloco-nome]") || {}).value || "Bloco", exercicios: [] };
      bEl.querySelectorAll("[data-ex]").forEach(function (eEl) {
        var nome = (eEl.querySelector("[data-ex-nome]") || {}).value || "";
        if (!nome.trim()) return;
        b.exercicios.push({
          nome: nome,
          series: (eEl.querySelector("[data-ex-series]") || {}).value || "",
          reps: (eEl.querySelector("[data-ex-reps]") || {}).value || "",
          descanso: (eEl.querySelector("[data-ex-desc]") || {}).value || "",
          video: (eEl.querySelector("[data-ex-video]") || {}).value || "",
          obs: (eEl.querySelector("[data-ex-obs]") || {}).value || ""
        });
      });
      if (b.exercicios.length) tr.blocos.push(b);
    });
    return tr;
  }

  function persistir(tr, okMsg, btn) {
    if (!window.NutriPacientes) { toast("Banco indisponível.", true); return; }
    window.NutriPacientes.saveTreino(_p.id, tr).then(function (saved) {
      _p = saved;
      var r = root();
      if (r) { r.innerHTML = temTreino(_p) ? resumoHTML(_p.treino) : escolhaHTML(); if (temTreino(_p)) bindResumo(); else bindEscolha(); }
      if (okMsg) toast(okMsg);
      if (_ctx.onSaved) _ctx.onSaved(saved);
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = "💾 Salvar treino"; }
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }
  function salvar() {
    var tr = coletar();
    if (!tr.blocos.length) { toast("Adicione ao menos um exercício.", true); return; }
    var btn = root().querySelector("[data-tr-salvar]");
    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    persistir(tr, "Treino salvo", btn);
  }
  function alternarPublicado() {
    var tr = Object.assign({}, _p.treino, { publicado: !_p.treino.publicado, atualizadoEm: hojeBR() });
    persistir(tr, tr.publicado ? "Treino liberado para o paciente" : "Treino ocultado do paciente");
  }
  function excluir() {
    if (!window.confirm("Excluir o treino deste paciente? Esta ação não pode ser desfeita.")) return;
    persistir(null, "Treino excluído");
  }

  /* ============================================================
     VIEW DO PORTAL (paciente) — render + marcação de feito
     ============================================================ */
  function portalHTML(p, marcas, readonly) {
    var tr = p.treino;
    if (!tr || !tr.publicado || !(tr.blocos || []).length) {
      return '<div class="pcard"><div class="empty-state">Seu treino em casa ainda não foi liberado. ' +
        'Assim que sua nutricionista publicar, ele aparece aqui. 🏋️</div></div>';
    }
    var total = 0, feitos = 0;
    var blocos = tr.blocos.map(function (b, bi) {
      var exs = (b.exercicios || []).map(function (e, ei) {
        total++;
        var key = "treino:" + bi + ":" + ei;
        var done = marcas && marcas[key] === true; if (done) feitos++;
        var id = ytId(e.video);
        var media = id
          ? '<a class="tr-thumb" href="' + ytWatch(id) + '" target="_blank" rel="noopener" style="background-image:url(' + ytThumb(id) + ')"><span class="tr-thumb__play">▶</span></a>'
          : '<a class="tr-thumb tr-thumb--search" href="' + ytSearch(e.nome) + '" target="_blank" rel="noopener"><span>🔎 ver no YouTube</span></a>';
        return '<div class="tr-pex' + (done ? " is-done" : "") + '">' + media +
          '<div class="tr-pex__body"><label class="tr-pex__check"><input type="checkbox" data-check="' + key + '"' +
            (done ? " checked" : "") + (readonly ? " disabled" : "") + '>' +
            '<span class="tr-pex__nome">' + esc(e.nome) + '</span></label>' +
          '<div class="tr-pex__meta">' + esc(e.series || "") + (e.series ? "× " : "") + esc(e.reps || "") +
            (e.descanso ? ' · descanso ' + esc(e.descanso) : '') + '</div>' +
          (e.obs ? '<div class="tr-pex__obs">💡 ' + esc(e.obs) + '</div>' : '') + '</div></div>';
      }).join("");
      return '<div class="pcard tr-pbloco"><div class="tr-pbloco__head">' + esc(b.nome || "Bloco") + '</div>' + exs + '</div>';
    }).join("");
    var pct = total ? Math.round(feitos * 100 / total) : 0;
    var head = '<div class="pcard pcard--head"><h2>🏋️ ' + esc(tr.titulo || "Treino em casa") + '</h2>' +
      (tr.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(tr.atualizadoEm) + '</span>' : '') +
      '<div class="plano-adesao"><div class="plano-adesao__bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="plano-adesao__pct">' + pct + '% concluído</span></div>' +
      '<p class="pcard__hint">Marque cada exercício ao terminar. Toque no vídeo para ver a execução.</p></div>';
    return head + blocos;
  }

  window.TreinoPaciente = { render: render, wire: wire };
  window.TreinoView = { portalHTML: portalHTML };
})();
