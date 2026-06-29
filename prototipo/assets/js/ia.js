/* ============================================================
   IA ASSISTENTE (tela cheia) — Nútri AI conversacional (mock)
   ============================================================ */
(function () {
  "use strict";

  var D = window.IA_DATA || {};

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* Detecta a intenção do texto e devolve a resposta (demo) */
  var INTENCOES = [
    [/exame|laborat|hemograma|vitamina|homa|colesterol|triglic/i, "exame"],
    [/card[áa]pio|dieta|plano alimentar|refei[çc][ãa]o|substitui/i, "cardapio"],
    [/evolu|resum|progress|prontu[áa]rio/i, "evolucao"],
    [/tmb|get|vet|calcul|energ|cal[óo]ric|kcal|gasto/i, "calculo"],
    [/orienta|conduta|d[úu]vida|insulina|sop/i, "orientacao"],
    [/ades[ãa]o|baixa ades|abandon|sumi/i, "adesao"]
  ];
  function responder(texto) {
    for (var i = 0; i < INTENCOES.length; i++) {
      if (INTENCOES[i][0].test(texto)) return D.respostas[INTENCOES[i][1]];
    }
    return D.respostas.padrao;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var chat = el("ia-chat");
    var thread = el("ia-thread");
    var empty = el("ia-empty");
    var input = el("ia-text");
    var send = el("ia-send");
    var iniciado = false;

    /* ---------- Estado inicial (saudação + capacidades) ---------- */
    el("ia-greeting").innerHTML = D.saudacao || "Nútri AI";
    el("ia-sub").textContent = D.sub || "";

    el("cap-grid").innerHTML = (D.capacidades || []).map(function (c) {
      return '<button class="cap-card" type="button" data-prompt="' + esc(c.prompt) + '">' +
        '<span class="cap-card__ico">' + c.ico + '</span>' +
        '<span class="cap-card__t">' + esc(c.titulo) + '</span>' +
        '<span class="cap-card__d">' + esc(c.desc) + '</span>' +
      '</button>';
    }).join("");

    el("ia-examples").innerHTML = (D.exemplos || []).map(function (s) {
      return '<button class="ia-chip" type="button">' + esc(s) + '</button>';
    }).join("");

    /* histórico (lateral) */
    var hist = el("ia-recent");
    if (hist) {
      hist.innerHTML = (D.conversas || []).map(function (c, i) {
        return '<button class="rec" type="button' + (i === 0 ? '" data-active="1' : '') + '">' +
          '<span class="rec__t">' + esc(c.titulo) + '</span>' +
          '<span class="rec__p">' + esc(c.preview) + '</span>' +
          '<span class="rec__w">' + esc(c.quando) + '</span>' +
        '</button>';
      }).join("");
    }

    /* seletor de paciente (contexto) */
    var sel = el("ia-paciente");
    if (sel) {
      sel.innerHTML = (D.pacientes || []).map(function (p) {
        return '<option' + (p === D.pacienteAtivo ? " selected" : "") + ">" + esc(p) + "</option>";
      }).join("");
    }

    /* ---------- Mensagens ---------- */
    function addMsg(html, who) {
      var m = document.createElement("div");
      m.className = "msg msg--" + who;
      m.innerHTML = html;
      thread.appendChild(m);
      m.scrollIntoView({ block: "nearest" });
      return m;
    }

    function sendMsg(texto) {
      texto = (texto || "").trim();
      if (!texto) return;
      if (!iniciado) { empty.hidden = true; chat.classList.add("is-chatting"); iniciado = true; }
      addMsg(esc(texto), "me");
      input.value = "";
      autoGrow();
      var typing = addMsg('<span class="msg--typing"><span></span><span></span><span></span></span>', "ai");
      setTimeout(function () {
        typing.innerHTML = responder(texto);
        typing.scrollIntoView({ block: "nearest" });
      }, 1100);
    }

    /* ---------- Eventos ---------- */
    el("cap-grid").addEventListener("click", function (e) {
      var b = e.target.closest(".cap-card");
      if (b) sendMsg(b.dataset.prompt);
    });
    el("ia-examples").addEventListener("click", function (e) {
      var b = e.target.closest(".ia-chip");
      if (b) sendMsg(b.textContent);
    });
    send.addEventListener("click", function () { sendMsg(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(input.value); }
    });

    /* textarea cresce conforme digita */
    function autoGrow() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 160) + "px";
    }
    input.addEventListener("input", autoGrow);

    /* nova conversa */
    var nova = el("ia-nova");
    if (nova) nova.addEventListener("click", function () {
      thread.innerHTML = "";
      empty.hidden = false;
      chat.classList.remove("is-chatting");
      iniciado = false;
      input.focus();
    });

    /* ---------- Navegação mobile (sidebar gaveta) ---------- */
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (app && toggle) {
      toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
      if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
    }

    input.focus();
  });
})();
