/* ============================================================
   AGENDA (Tela 4) — visão Dia / Semana com consultas REAIS do banco
   (window.NutriConsultas, tabela public.consultas). Datalist de
   pacientes vem de window.NutriPacientes. Config de horário/tipos/
   durações continua no mock agenda-data.js. Sem banco (file://),
   cai num modo local só-em-memória para não quebrar o protótipo.
   ============================================================ */
(function () {
  "use strict";

  var A = window.AGENDA_DATA || {};
  var H0 = (A.horario && A.horario.inicio) || 7;
  var H1 = (A.horario && A.horario.fim) || 20;
  var HOUR_H = 56;
  var TOTAL_H = H1 - H0;
  var TRACK = TOTAL_H * HOUR_H;
  var WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  var DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var DOW_FULL = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
  var MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var MES_ABR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var ST_LABEL = { concluida: "Concluída", emandamento: "Em andamento", proxima: "Agendada", cancelada: "Cancelada" };

  /* ---------- helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toMin(t) { var p = String(t).split(":"); return (+p[0]) * 60 + (+p[1]); }
  function minToHHMM(m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function weekdayIndex(d) { var g = d.getDay(); return g === 0 ? 6 : g - 1; }   /* Seg=0 … Dom=6 */
  function startOfWeek(d) { var x = new Date(d); x.setDate(x.getDate() - weekdayIndex(x)); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function isoToDate(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iniciais(nome) { var p = String(nome || "").trim().split(/\s+/); return (((p[0] || "")[0] || "") + ((p[1] || "")[0] || "")).toUpperCase(); }

  var TODAY = new Date();
  var BASE_MONDAY = startOfWeek(TODAY);

  var state = {
    view: "semana",
    weekOffset: 0,
    selDay: weekdayIndex(TODAY),
    minical: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  };

  /* Consultas reais carregadas (dated). Preenchido por loadThenPaint(). */
  var EVENTS = [];
  var PAC_INDEX = {};   /* nome (lower) -> paciente_id, para vincular a ficha */

  function mondayOfState() { return addDays(BASE_MONDAY, state.weekOffset * 7); }
  function selectedDate() { return addDays(mondayOfState(), state.selDay); }

  function consultasDoDate(date) {
    var key = iso(date);
    return EVENTS.filter(function (c) { return c.data === key; })
      .sort(function (a, b) { return toMin(a.inicio) - toMin(b.inicio); });
  }
  function weekEvents() {
    var a = iso(mondayOfState()), b = iso(addDays(mondayOfState(), 6));
    return EVENTS.filter(function (c) { return c.data >= a && c.data <= b; });
  }
  function gotoDate(d) {
    state.weekOffset = Math.round((startOfWeek(d) - BASE_MONDAY) / WEEK_MS);
    state.selDay = weekdayIndex(d);
    state.minical = new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /* Range que precisa estar carregado: cobre a semana visível E o mês do minical. */
  function neededRange() {
    var ws = mondayOfState(), we = addDays(ws, 6);
    var ms = new Date(state.minical.getFullYear(), state.minical.getMonth(), 1);
    var me = new Date(state.minical.getFullYear(), state.minical.getMonth() + 1, 0);
    var from = ws < ms ? ws : ms;
    var to = we > me ? we : me;
    return [iso(from), iso(to)];
  }

  /* ============================================================
     RENDER
     ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    bindToolbar();
    initModal();
    initMobileNav();
    // Espera o auth-guard confirmar a sessão antes de buscar (RLS precisa do login).
    if (window.NutriConsultas) {
      window.addEventListener("nutri-auth-ready", function () { loadPacientes(); render(); });
      // fallback: se o evento já passou / não vier, tenta mesmo assim
      setTimeout(function () { if (!EVENTS.length) render(); }, 1500);
    } else {
      render(); // file:// — modo local
    }
  });

  function loadPacientes() {
    if (!window.NutriPacientes) return;
    window.NutriPacientes.list().then(function (list) {
      PAC_INDEX = {};
      var dl = el("ag-pac-list");
      var opts = "";
      (list || []).forEach(function (p) {
        PAC_INDEX[String(p.nome).toLowerCase()] = p.id;
        opts += '<option value="' + esc(p.nome) + '">';
      });
      if (dl) dl.innerHTML = opts;
    }).catch(function () {});
  }

  /* Busca o range necessário e repinta. Sem banco, só repinta com EVENTS atuais. */
  function render() {
    if (window.NutriConsultas) {
      var r = neededRange();
      window.NutriConsultas.listRange(r[0], r[1]).then(function (list) {
        EVENTS = list || [];
        paint();
      }).catch(function () { paint(); });
    } else {
      paint();
    }
  }

  function paint() {
    syncToolbar();
    if (state.view === "dia") renderDia(); else renderSemana();
    renderMinical();
    renderSummary();
  }

  /* ---------- Toolbar ---------- */
  function syncToolbar() {
    el("view-dia").classList.toggle("is-active", state.view === "dia");
    el("view-semana").classList.toggle("is-active", state.view === "semana");
    el("cal-label").textContent = state.view === "dia" ? dayLabel() : weekLabel();
  }
  function weekLabel() {
    var mon = mondayOfState(), sun = addDays(mon, 6);
    if (mon.getMonth() === sun.getMonth()) return mon.getDate() + " – " + sun.getDate() + " de " + MES[mon.getMonth()];
    return mon.getDate() + " " + MES_ABR[mon.getMonth()] + " – " + sun.getDate() + " " + MES_ABR[sun.getMonth()];
  }
  function dayLabel() {
    var d = selectedDate();
    return DOW_FULL[state.selDay] + ", " + d.getDate() + " de " + MES[d.getMonth()];
  }

  /* ---------- Coluna de horas ---------- */
  function hoursColumn(extra) {
    var s = '<div class="cal-times' + (extra ? " " + extra : "") + '" style="height:' + TRACK + 'px">';
    for (var h = H0; h <= H1; h++) s += '<span class="cal-hr" style="top:' + ((h - H0) * HOUR_H) + 'px">' + pad(h) + ':00</span>';
    return s + "</div>";
  }

  /* ---------- Bloco de evento ---------- */
  function eventBlock(c, week) {
    var top = (toMin(c.inicio) - H0 * 60) / 60 * HOUR_H;
    var alt = Math.max(24, (toMin(c.fim) - toMin(c.inicio)) / 60 * HOUR_H) - 3;
    var modoIco = c.modo === "Online" ? "💻" : "🏥";
    var meta = week ? "" : '<div class="ev__meta">' + esc(c.tipo) + " · " + modoIco + " " + esc(c.modo) + "</div>";
    var hora = week ? c.inicio : c.inicio + "–" + c.fim;
    return '<div class="ev ev--' + c.status + (week ? " ev--wk" : "") + '" data-id="' + esc(c.id) + '" ' +
      'style="top:' + top.toFixed(1) + "px;height:" + alt.toFixed(1) + 'px" ' +
      'title="' + esc(c.pacienteNome + " · " + c.inicio + "–" + c.fim + " · " + c.tipo + " · " + c.modo + " · " + (ST_LABEL[c.status] || "")) + '">' +
      '<div class="ev__time">' + hora + "</div>" +
      '<div class="ev__name">' + esc(c.pacienteNome) + "</div>" + meta +
      "</div>";
  }

  function nowLine(date) {
    if (!sameDay(date, new Date())) return "";
    var now = new Date(), m = now.getHours() * 60 + now.getMinutes();
    if (m < H0 * 60 || m > H1 * 60) return "";
    return '<div class="cal-now" style="top:' + ((m - H0 * 60) / 60 * HOUR_H).toFixed(1) + 'px"></div>';
  }

  /* ---------- Visão DIA ---------- */
  function renderDia() {
    var date = selectedDate(), cs = consultasDoDate(date);
    var canvas = '<div class="cal-canvas" data-day="' + state.selDay + '" style="height:' + TRACK + 'px">' +
      nowLine(date) + cs.map(function (c) { return eventBlock(c, false); }).join("") + "</div>";
    var empty = cs.length ? "" :
      '<div class="cal-empty">📅 Nenhuma consulta neste dia.<br><span>Clique em um horário ou em <strong>+ Novo agendamento</strong>.</span></div>';
    el("cal-main").innerHTML = '<div class="cal-scroll"><div class="cal-day">' + hoursColumn() + canvas + "</div>" + empty + "</div>";
    bindSlotClicks();
    bindEventClicks();
  }

  /* ---------- Visão SEMANA ---------- */
  function renderSemana() {
    var mon = mondayOfState();
    var head = '<div class="week__head"><div class="week__corner"></div>';
    for (var i = 0; i < 7; i++) {
      var d = addDays(mon, i), t = sameDay(d, new Date());
      head += '<button class="week__dh' + (t ? " is-today" : "") + '" data-day="' + i + '" type="button">' +
        '<span class="dow">' + DOW[i] + '</span><span class="dnum">' + d.getDate() + "</span></button>";
    }
    head += "</div>";

    var body = '<div class="week__body">' + hoursColumn("week__times");
    for (var j = 0; j < 7; j++) {
      var dd = addDays(mon, j), isT = sameDay(dd, new Date());
      var evs = consultasDoDate(dd).map(function (c) { return eventBlock(c, true); }).join("");
      body += '<div class="week__col' + (isT ? " is-today" : "") + '" data-day="' + j + '" style="height:' + TRACK + 'px">' +
        (isT ? nowLine(dd) : "") + evs + "</div>";
    }
    body += "</div>";

    el("cal-main").innerHTML = '<div class="cal-scroll"><div class="week">' + head + body + "</div></div>";

    el("cal-main").querySelectorAll(".week__dh").forEach(function (h) {
      h.addEventListener("click", function () { state.selDay = +h.dataset.day; state.view = "dia"; render(); });
    });
    bindSlotClicks();
    bindEventClicks();
  }

  /* ---------- Clique em horário vazio → novo agendamento ---------- */
  function bindSlotClicks() {
    el("cal-main").querySelectorAll(".cal-canvas, .week__col").forEach(function (slot) {
      slot.addEventListener("click", function (e) {
        if (e.target.closest(".ev")) return;
        var rect = slot.getBoundingClientRect();
        var min = H0 * 60 + Math.round((e.clientY - rect.top) / HOUR_H * 60 / 15) * 15;
        min = Math.max(H0 * 60, Math.min(H1 * 60 - 30, min));
        var dia = +slot.dataset.day;
        openModal({ date: addDays(mondayOfState(), dia), hora: minToHHMM(min) });
      });
    });
  }

  /* ---------- Clique num evento → editar ---------- */
  function bindEventClicks() {
    el("cal-main").querySelectorAll(".ev").forEach(function (ev) {
      ev.addEventListener("click", function (e) {
        e.stopPropagation();
        var c = EVENTS.filter(function (x) { return String(x.id) === ev.dataset.id; })[0];
        if (c) openModal({ edit: c });
      });
    });
  }

  /* ---------- Mini-calendário ---------- */
  function eventDates() {
    var s = {};
    EVENTS.forEach(function (c) { s[c.data] = 1; });
    return s;
  }
  function renderMinical() {
    var ref = state.minical, y = ref.getFullYear(), m = ref.getMonth();
    var startIdx = weekdayIndex(new Date(y, m, 1));
    var dim = new Date(y, m + 1, 0).getDate();
    var sel = selectedDate(), evd = eventDates();

    var html = '<div class="minical__top">' +
      '<button class="minical__nav" id="mc-prev" type="button" aria-label="Mês anterior">‹</button>' +
      '<span class="minical__title">' + MES[m].charAt(0).toUpperCase() + MES[m].slice(1) + " " + y + "</span>" +
      '<button class="minical__nav" id="mc-next" type="button" aria-label="Próximo mês">›</button></div>';
    html += '<div class="minical__grid">';
    ["S", "T", "Q", "Q", "S", "S", "D"].forEach(function (d) { html += '<span class="minical__dow">' + d + "</span>"; });
    for (var b = 0; b < startIdx; b++) html += '<span class="minical__day is-out"></span>';
    for (var dn = 1; dn <= dim; dn++) {
      var dt = new Date(y, m, dn), cls = "minical__day";
      if (sameDay(dt, new Date())) cls += " is-today";
      if (sameDay(dt, sel)) cls += " is-sel";
      if (evd[iso(dt)]) cls += " has-ev";
      html += '<button class="' + cls + '" type="button" data-d="' + dn + '">' + dn + "</button>";
    }
    html += "</div>";
    el("minical").innerHTML = html;

    // Trocar de mês precisa recarregar (has-ev depende dos eventos do mês).
    el("mc-prev").addEventListener("click", function () { state.minical = new Date(y, m - 1, 1); render(); });
    el("mc-next").addEventListener("click", function () { state.minical = new Date(y, m + 1, 1); render(); });
    el("minical").querySelectorAll(".minical__day[data-d]").forEach(function (cell) {
      cell.addEventListener("click", function () {
        gotoDate(new Date(y, m, +cell.dataset.d));
        state.view = "dia";
        render();
      });
    });
  }

  /* ---------- Resumo (dia ou semana) ---------- */
  function renderSummary() {
    var dia = state.view === "dia";
    var list = dia ? consultasDoDate(selectedDate()) : weekEvents();
    var ativas = list.filter(function (c) { return c.status !== "cancelada"; });
    var online = ativas.filter(function (c) { return c.modo === "Online"; }).length;
    var presc = ativas.filter(function (c) { return c.modo === "Presencial"; }).length;
    var encaixe = ativas.filter(function (c) { return c.tipo === "Encaixe"; }).length;
    var concl = list.filter(function (c) { return c.status === "concluida"; }).length;

    el("sum-title").textContent = dia ? "Resumo do dia" : "Resumo da semana";
    el("day-summary").innerHTML =
      row("📋", "Consultas", ativas.length) +
      row("🏥", "Presenciais", presc) +
      row("💻", "Online", online) +
      row("➕", "Encaixes", encaixe) +
      row("✅", "Concluídas", concl);

    function row(ico, k, v) {
      return '<div class="dsum__row"><span class="k">' + ico + " " + k + '</span><span class="v">' + v + "</span></div>";
    }
  }

  /* ============================================================
     MODAL — novo agendamento / edição
     ============================================================ */
  var modal, modoEscolhido = "Presencial", editId = null;
  function initModal() {
    modal = el("ag-modal");

    var tp = el("ag-tipo");
    if (tp) tp.innerHTML = (A.tipos || []).map(function (t) { return '<option>' + esc(t) + "</option>"; }).join("");
    var du = el("ag-dur");
    if (du) du.innerHTML = (A.duracoes || [45]).map(function (d) { return '<option value="' + d + '"' + (d === 45 ? " selected" : "") + ">" + d + " min</option>"; }).join("");

    el("ag-modo").querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () { setModo(c.dataset.modo); });
    });

    el("btn-novo").addEventListener("click", function () { openModal(); });
    el("ag-cancel").addEventListener("click", closeModal);
    el("ag-del").addEventListener("click", onDelete);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    el("ag-form").addEventListener("submit", onSubmit);
  }

  function openModal(prefill) {
    prefill = prefill || {};
    var edit = prefill.edit || null;
    editId = edit ? edit.id : null;

    el("ag-title").textContent = edit ? "Editar consulta" : "Novo agendamento";
    el("ag-sub").textContent = edit ? "Atualize os dados ou exclua a consulta." : "Preencha os dados da consulta.";
    el("ag-submit").textContent = edit ? "Salvar alterações" : "Agendar consulta";
    el("ag-del").hidden = !edit;
    el("ag-status-wrap").hidden = !edit;

    if (edit) {
      el("ag-pac").value = edit.pacienteNome || "";
      el("ag-data").value = edit.data;
      el("ag-hora").value = edit.inicio;
      el("ag-dur").value = String(Math.max(15, toMin(edit.fim) - toMin(edit.inicio)));
      setTipo(edit.tipo);
      setModo(edit.modo || "Presencial");
      el("ag-status").value = edit.status || "proxima";
    } else {
      var d = prefill.date || selectedDate();
      el("ag-pac").value = "";
      el("ag-data").value = iso(d);
      el("ag-hora").value = prefill.hora || "08:00";
      el("ag-dur").value = "45";
      el("ag-tipo").selectedIndex = Math.min(1, (el("ag-tipo").options.length - 1));
      setModo("Presencial");
    }
    modal.classList.add("is-open");
    setTimeout(function () { el("ag-pac").focus(); }, 120);
  }
  function closeModal() { modal.classList.remove("is-open"); editId = null; }
  function setModo(m) {
    modoEscolhido = m;
    el("ag-modo").querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.modo === m)); });
  }
  function setTipo(t) {
    var sel = el("ag-tipo");
    for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === t) { sel.selectedIndex = i; return; } }
  }

  function coletar() {
    var nome = el("ag-pac").value.trim();
    if (!nome) { el("ag-pac").focus(); return null; }
    var dataStr = el("ag-data").value;
    var hora = el("ag-hora").value || "08:00";
    var dur = +el("ag-dur").value || 45;
    return {
      pacienteNome: nome,
      pacienteId: PAC_INDEX[nome.toLowerCase()] || null,
      data: dataStr,
      inicio: hora,
      fim: minToHHMM(toMin(hora) + dur),
      tipo: el("ag-tipo").value,
      modo: modoEscolhido,
      status: el("ag-status-wrap").hidden ? "proxima" : el("ag-status").value
    };
  }

  function onSubmit(e) {
    e.preventDefault();
    var c = coletar();
    if (!c) return;
    var btn = el("ag-submit"); btn.disabled = true;

    if (!window.NutriConsultas) {                  // modo local (file://)
      c.id = "local-" + Date.now();
      if (editId) EVENTS = EVENTS.filter(function (x) { return x.id !== editId; });
      EVENTS.push(c);
      finish(c.data, btn); return;
    }

    var op = editId ? window.NutriConsultas.update(editId, c) : window.NutriConsultas.create(c);
    op.then(function (saved) { finish(saved.data, btn); })
      .catch(function (err) { btn.disabled = false; alert("Não foi possível salvar a consulta.\n" + (err && err.message ? err.message : "")); });
  }

  function onDelete() {
    if (!editId) return;
    if (!confirm("Excluir esta consulta? Esta ação não pode ser desfeita.")) return;
    var del = el("ag-del"); del.disabled = true;
    if (!window.NutriConsultas) { EVENTS = EVENTS.filter(function (x) { return x.id !== editId; }); finish(el("ag-data").value, del); return; }
    window.NutriConsultas.remove(editId).then(function () { finish(el("ag-data").value, del); })
      .catch(function (err) { del.disabled = false; alert("Não foi possível excluir.\n" + (err && err.message ? err.message : "")); });
  }

  function finish(dataStr, btn) {
    if (btn) btn.disabled = false;
    closeModal();
    if (dataStr) { gotoDate(isoToDate(dataStr)); state.view = "dia"; }
    render();
  }

  /* ---------- Navegação mobile (gaveta) ---------- */
  function initMobileNav() {
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  /* ---------- Botões da toolbar ---------- */
  function bindToolbar() {
    el("view-dia").addEventListener("click", function () { state.view = "dia"; paint(); });
    el("view-semana").addEventListener("click", function () { state.view = "semana"; paint(); });
    el("nav-hoje").addEventListener("click", function () { gotoDate(new Date()); render(); });
    el("nav-prev").addEventListener("click", function () { step(-1); });
    el("nav-next").addEventListener("click", function () { step(1); });
  }
  function step(dir) {
    if (state.view === "dia") gotoDate(addDays(selectedDate(), dir));
    else state.weekOffset += dir;
    render();
  }
})();
