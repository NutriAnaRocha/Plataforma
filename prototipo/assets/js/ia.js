/* ============================================================
   IA ASSISTENTE (tela cheia) — Nútri AI conversacional (REAL)
   Conversa via edge function "assistente-ia" (OpenAI gpt-4o-mini, chave
   só no secret do Supabase). Contexto = paciente selecionado (dados reais
   da plataforma, lidos com o JWT da nutri → RLS). A IA é copiloto: a nutri
   revisa antes de usar. Sem chave/rede, cai num aviso claro (não inventa).
   ============================================================ */
(function () {
  "use strict";

  var D = window.IA_DATA || {};

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---------- Markdown-lite → HTML (negrito, itálico, títulos, listas) ---------- */
  function mdInline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
  }
  function mdToHtml(txt) {
    var lines = String(txt || "").replace(/\r/g, "").split("\n");
    var html = "", listType = null;
    function closeList() { if (listType) { html += "</" + listType + ">"; listType = null; } }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      var t = ln.trim();
      if (!t) { closeList(); continue; }
      var h = t.match(/^(#{1,4})\s+(.*)$/);
      if (h) { closeList(); html += "<h4>" + mdInline(h[2]) + "</h4>"; continue; }
      if (/^[-*•]\s+/.test(t)) {
        if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; }
        html += "<li>" + mdInline(t.replace(/^[-*•]\s+/, "")) + "</li>"; continue;
      }
      if (/^\d+[.)]\s+/.test(t)) {
        if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; }
        html += "<li>" + mdInline(t.replace(/^\d+[.)]\s+/, "")) + "</li>"; continue;
      }
      closeList();
      html += "<p>" + mdInline(t) + "</p>";
    }
    closeList();
    return html;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var chat = el("ia-chat");
    var thread = el("ia-thread");
    var empty = el("ia-empty");
    var input = el("ia-text");
    var send = el("ia-send");
    var sel = el("ia-paciente");
    var iniciado = false;
    var enviando = false;

    /* histórico da conversa atual (o que vai para o modelo) */
    var messages = [];
    /* conversas desta sessão (lateral) */
    var conversas = [];

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

    /* ---------- Seletor de paciente: dados REAIS ---------- */
    if (sel) {
      sel.innerHTML = '<option value="">Sem paciente (geral)</option>';
      if (window.NutriPacientes && window.NutriPacientes.list) {
        window.NutriPacientes.list().then(function (lista) {
          (lista || []).forEach(function (p) {
            var o = document.createElement("option");
            o.value = p.id;
            o.textContent = p.nome;
            sel.appendChild(o);
          });
        }).catch(function () { /* segue com "geral" */ });
      }
    }

    /* ---------- Conversas recentes (sessão) ---------- */
    function renderRecentes() {
      var hist = el("ia-recent");
      if (!hist) return;
      if (!conversas.length) {
        hist.innerHTML = '<p class="ia-aside__vazio">Suas conversas desta sessão aparecem aqui.</p>';
        return;
      }
      hist.innerHTML = conversas.map(function (c, i) {
        return '<button class="rec" type="button"' + (i === 0 ? ' data-active="1"' : '') + '>' +
          '<span class="rec__t">' + esc(c.titulo) + '</span>' +
          '<span class="rec__p">' + esc(c.preview) + '</span>' +
        '</button>';
      }).join("");
    }
    renderRecentes();

    /* ---------- Mensagens ---------- */
    function addMsg(html, who) {
      var m = document.createElement("div");
      m.className = "msg msg--" + who;
      m.innerHTML = html;
      thread.appendChild(m);
      m.scrollIntoView({ block: "nearest" });
      return m;
    }

    async function sendMsg(texto) {
      texto = (texto || "").trim();
      if (!texto || enviando) return;
      if (!iniciado) {
        empty.hidden = true;
        chat.classList.add("is-chatting");
        iniciado = true;
        conversas.unshift({ titulo: texto.slice(0, 42), preview: "" });
        renderRecentes();
      }
      enviando = true;
      send.disabled = true;
      addMsg(esc(texto), "me");
      messages.push({ role: "user", content: texto });
      input.value = "";
      autoGrow();

      var typing = addMsg('<span class="msg--typing"><span></span><span></span><span></span></span>', "ai");

      try {
        var db = await window.NutriDBReady;
        var res = await db.functions.invoke("assistente-ia", {
          body: { messages: messages, paciente_id: (sel && sel.value) || "" }
        });
        if (res.error) throw res.error;
        var d = res.data || {};
        if (d.error) throw new Error(d.error);
        var resposta = String(d.resposta || "").trim();
        if (!resposta) throw new Error("Resposta vazia.");

        typing.innerHTML = mdToHtml(resposta) +
          '<p class="ia-fonte">' + (d.com_contexto ? "Baseado nos dados do paciente · " : "") +
          "revise antes de usar com o paciente.</p>";
        messages.push({ role: "assistant", content: resposta });
        if (conversas[0]) conversas[0].preview = resposta.replace(/[#*`]/g, "").slice(0, 60);
        renderRecentes();
      } catch (e) {
        var msg = (e && e.message) ? e.message : "IA indisponível.";
        typing.classList.add("msg--erro");
        typing.innerHTML = '<p><strong>Não consegui responder agora.</strong> ' + esc(msg) + '</p>' +
          '<p class="ia-fonte">Tente de novo em instantes. Se persistir, verifique a conexão.</p>';
        // remove a última pergunta do histórico p/ não poluir o próximo turno
        messages.pop();
      } finally {
        typing.scrollIntoView({ block: "nearest" });
        enviando = false;
        send.disabled = false;
        input.focus();
      }
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
      messages = [];
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
