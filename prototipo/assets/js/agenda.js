/* ============================================================
   AGENDA (Tela 4) — visão Dia / Semana, mini-calendário, resumo
   e modal de novo agendamento. Reaproveita o shell, tokens e
   componentes (card/avatar/botão/chip/modal) das demais telas.
   Depende de agenda-data.js (window.AGENDA_DATA).
   ============================================================ */
(function () {
  "use strict";

  var A = window.AGENDA_DATA || {};
  var H0 = (A.horario && A.horario.inicio) || 7;
  var H1 = (A.horario && A.horario.fim) || 20;
  var HOUR_H = 56;                 /* px por hora (igual ao --hour-h do CSS) */
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toMin(t) { var p = String(t).split(":"); return (+p[0]) * 60 + (+p[1]); }
  function minToHHMM(m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function weekdayIndex(d) { var g = d.getDay(); return g === 0 ? 6 : g - 1; }   /* Seg=0 … Dom=6 */
  function startOfWeek(d) { var x = new Date(d); x.setDate(x.getDate() - weekdayIndex(x)); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function iniciais(nome) { var p = String(nome).trim().split(/\s+/); return (((p[0] || "")[0] || "") + ((p[1] || "")[0] || "")).toUpperCase(); }

  var TODAY = new Date();
  var BASE_MONDAY = startOfWeek(TODAY);

  var state = {
    view: "semana",
    weekOffset: 0,
    selDay: weekdayIndex(TODAY),
    minical: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  };

  function mondayOfState() { return addDays(BASE_MONDAY, state.weekOffset * 7); }
  function selectedDate() { return addDays(mondayOfState(), state.selDay); }
  function consultasDoDia(dia) {
    return (A.consultas || []).filter(function (c) { return c.dia === dia; })
      .sort(function (a, b) { return toMin(a.inicio) - toMin(b.inicio); });
  }
  function gotoDate(d) {
    state.weekOffset = Math.round((startOfWeek(d) - BASE_MONDAY) / WEEK_MS);
    state.selDay = weekdayIndex(d);
    state.minical = new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /* ============================================================
     RENDER
     ============================================================ */
  document.addEventListener("DOMContentLoaded", function () {
    bindToolbar();
    initModal();
    initMobileNav();
    render();
  });

  function render() {
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
    return '<div class="ev ev--' + c.status + (week ? " ev--wk" : "") + '" ' +
      'style="top:' + top.toFixed(1) + "px;height:" + alt.toFixed(1) + 'px" ' +
      'title="' + esc(c.paciente + " · " + c.inicio + "–" + c.fim + " · " + c.tipo + " · " + c.modo + " · " + (ST_LABEL[c.status] || "")) + '">' +
      '<div class="ev__time">' + hora + "</div>" +
      '<div class="ev__name">' + esc(c.paciente) + "</div>" + meta +
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
    var cs = consultasDoDia(state.selDay), date = selectedDate();
    var canvas = '<div class="cal-canvas" data-day="' + state.selDay + '" style="height:' + TRACK + 'px">' +
      nowLine(date) + cs.map(function (c) { return eventBlock(c, false); }).join("") + "</div>";
    var empty = cs.length ? "" :
      '<div class="cal-empty">📅 Nenhuma consulta neste dia.<br><span>Clique em um horário ou em <strong>+ Novo agendamento</strong>.</span></div>';
    el("cal-main").innerHTML = '<div class="cal-scroll"><div class="cal-day">' + hoursColumn() + canvas + "</div>" + empty + "</div>";
    bindSlotClicks();
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
      var evs = consultasDoDia(j).map(function (c) { return eventBlock(c, true); }).join("");
      body += '<div class="week__col' + (isT ? " is-today" : "") + '" data-day="' + j + '" style="height:' + TRACK + 'px">' +
        (isT ? nowLine(dd) : "") + evs + "</div>";
    }
    body += "</div>";

    el("cal-main").innerHTML = '<div class="cal-scroll"><div class="week">' + head + body + "</div></div>";

    el("cal-main").querySelectorAll(".week__dh").forEach(function (h) {
      h.addEventListener("click", function () { state.selDay = +h.dataset.day; state.view = "dia"; render(); });
    });
    bindSlotClicks();
  }

  /* ---------- Clique em horário vazio → novo agendamento ---------- */
  function bindSlotClicks() {
    el("cal-main").querySelectorAll(".cal-canvas, .week__col").forEach(function (slot) {
      slot.addEventListener("click", function (e) {
        if (e.target.closest(".ev")) return;          /* clicou num evento, ignora */
        var rect = slot.getBoundingClientRect();
        var min = H0 * 60 + Math.round((e.clientY - rect.top) / HOUR_H * 60 / 15) * 15;  /* arredonda p/ 15min */
        min = Math.max(H0 * 60, Math.min(H1 * 60 - 30, min));
        var dia = +slot.dataset.day;
        openModal({ date: addDays(mondayOfState(), dia), hora: minToHHMM(min) });
      });
    });
  }

  /* ---------- Mini-calendário ---------- */
  function eventWeekdays() {
    var s = {};
    (A.consultas || []).forEach(function (c) { s[c.dia] = 1; });
    return s;
  }
  function renderMinical() {
    var ref = state.minical, y = ref.getFullYear(), m = ref.getMonth();
    var startIdx = weekdayIndex(new Date(y, m, 1));
    var dim = new Date(y, m + 1, 0).getDate();
    var sel = selectedDate(), evd = eventWeekdays();

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
      if (evd[weekdayIndex(dt)]) cls += " has-ev";
      html += '<button class="' + cls + '" type="button" data-d="' + dn + '">' + dn + "</button>";
    }
    html += "</div>";
    el("minical").innerHTML = html;

    el("mc-prev").addEventListener("click", function () { state.minical = new Date(y, m - 1, 1); renderMinical(); });
    el("mc-next").addEventListener("click", function () { state.minical = new Date(y, m + 1, 1); renderMinical(); });
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
    var list = dia ? consultasDoDia(state.selDay) : (A.consultas || []);
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
     MODAL — novo agendamento
     ============================================================ */
  var modal, modoEscolhido = "Presencial";
  function initModal() {
    modal = el("ag-modal");

    /* popular selects e datalist a partir do mock */
    var dl = el("ag-pac-list");
    if (dl) dl.innerHTML = (A.pacientes || []).map(function (n) { return '<option value="' + esc(n) + '">'; }).join("");
    var tp = el("ag-tipo");
    if (tp) tp.innerHTML = (A.tipos || []).map(function (t) { return '<option>' + esc(t) + "</option>"; }).join("");
    var du = el("ag-dur");
    if (du) du.innerHTML = (A.duracoes || [45]).map(function (d) { return '<option value="' + d + '"' + (d === 45 ? " selected" : "") + ">" + d + " min</option>"; }).join("");

    /* chips de modalidade */
    el("ag-modo").querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        el("ag-modo").querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true");
        modoEscolhido = c.dataset.modo;
      });
    });

    el("btn-novo").addEventListener("click", function () { openModal(); });
    el("ag-cancel").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    el("ag-form").addEventListener("submit", onSubmit);
  }

  function openModal(prefill) {
    prefill = prefill || {};
    var d = prefill.date || selectedDate();
    el("ag-pac").value = "";
    el("ag-data").value = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    el("ag-hora").value = prefill.hora || "08:00";
    el("ag-dur").value = "45";
    el("ag-tipo").selectedIndex = 1;
    setModo("Presencial");
    modal.classList.add("is-open");
    setTimeout(function () { el("ag-pac").focus(); }, 120);
  }
  function closeModal() { modal.classList.remove("is-open"); }
  function setModo(m) {
    modoEscolhido = m;
    el("ag-modo").querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.modo === m)); });
  }

  function onSubmit(e) {
    e.preventDefault();
    var nome = el("ag-pac").value.trim();
    if (!nome) { el("ag-pac").focus(); return; }
    var dataStr = el("ag-data").value;
    var hora = el("ag-hora").value || "08:00";
    var dur = +el("ag-dur").value || 45;
    var tipo = el("ag-tipo").value;
    var parts = dataStr.split("-");
    var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);

    /* nova consulta (recorrente na semana, como o restante do mock) */
    A.consultas.push({
      dia: weekdayIndex(dt),
      inicio: hora,
      fim: minToHHMM(toMin(hora) + dur),
      paciente: nome,
      ini: iniciais(nome),
      tipo: tipo,
      modo: modoEscolhido,
      status: "proxima"
    });

    closeModal();
    gotoDate(dt);
    state.view = "dia";
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
    el("view-dia").addEventListener("click", function () { state.view = "dia"; render(); });
    el("view-semana").addEventListener("click", function () { state.view = "semana"; render(); });
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
