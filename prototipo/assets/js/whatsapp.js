/* ============================================================
   WHATSAPP — central de automações (configuração real, persistida
   em profiles.whatsapp_config). Aqui a nutri edita as mensagens,
   liga/desliga automações, insere variáveis/emojis e vê a prévia.
   O ENVIO em si depende de conectar um motor de mensagens (servidor
   de WhatsApp) — a UI já reflete status e histórico quando existir.
   ============================================================ */
(function () {
  "use strict";

  var WA = window.WA_DATA || { automacoes: [], variaveis: [], emojis: [], exemplo: {} };

  /* ---------- Estado ---------- */
  var perfil = { nome: "", crn: "", whatsappConfig: {} };
  var config = null;             // config efetiva (defaults + salvo)
  var activeTA = null;           // textarea em foco (para inserir variável/emoji)

  /* ---------- Helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  var toastTimer;
  function toast(msg, erro) {
    var t = el("cfg-toast");
    t.textContent = (erro ? "⚠ " : "✓ ") + msg;
    t.classList.toggle("is-error", !!erro);
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2800);
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset._txt = btn.textContent; btn.textContent = label || "Salvando…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset._txt || btn.textContent; btn.disabled = false; }
  }
  function db() { return window.NutriPerfil; }
  function val(id) { var e = el(id); return e ? e.value : ""; }

  /* ---------- Monta a config efetiva (defaults + o que foi salvo) ---------- */
  function construirConfig(salvo) {
    salvo = salvo || {};
    var autos = {};
    (WA.automacoes || []).forEach(function (a) {
      var s = (salvo.automacoes && salvo.automacoes[a.id]) || {};
      autos[a.id] = {
        ativo: (typeof s.ativo === "boolean") ? s.ativo : a.ativoPadrao,
        texto: (typeof s.texto === "string") ? s.texto : a.texto
      };
    });
    return {
      conexao: salvo.conexao || { status: "desconectado", numero: "", atualizadoEm: "" },
      googleReviewLink: salvo.googleReviewLink || "",
      linkAgendamento: salvo.linkAgendamento || "",
      cupom: salvo.cupom || "RETORNO10",
      numeroEnvio: salvo.numeroEnvio || "",
      automacoes: autos,
      customs: Array.isArray(salvo.customs) ? salvo.customs : []
    };
  }

  /* ---------- Prévia: troca variáveis por valores de exemplo ---------- */
  function preencher(texto) {
    var ex = WA.exemplo || {};
    var mapa = {
      "{nome}": ex["{nome}"] || "Marina",
      "{data_consulta}": ex["{data_consulta}"] || "15/07/2026",
      "{hora_consulta}": ex["{hora_consulta}"] || "14:30",
      "{nutricionista}": (perfil.nome || "Nutricionista").split(/\s+/)[0],
      "{cupom}": config.cupom || ex["{cupom}"] || "RETORNO10",
      "{link_agendamento}": config.linkAgendamento || ex["{link_agendamento}"] || "",
      "{link_google_reviews}": config.googleReviewLink || ex["{link_google_reviews}"] || ""
    };
    var out = String(texto || "");
    Object.keys(mapa).forEach(function (k) {
      out = out.split(k).join(mapa[k]);
    });
    return out;
  }
  function bolhaHTML(texto) {
    var t = esc(preencher(texto)).replace(/\n/g, "<br>");
    return '<div class="wa-bubble"><div class="wa-bubble__txt">' + t + '</div>' +
      '<span class="wa-bubble__meta">agora ✓✓</span></div>';
  }

  /* ============================================================
     PAINEL — CONEXÃO
     ============================================================ */
  function statusInfo(st) {
    if (st === "conectado") return { cls: "on", dot: "🟢", label: "Conectado" };
    if (st === "conectando") return { cls: "wait", dot: "🟡", label: "Conectando…" };
    return { cls: "off", dot: "🔴", label: "Desconectado" };
  }

  function renderConexao() {
    var s = statusInfo(config.conexao.status);
    var statusCard =
      '<section class="card cfg-card">' +
        '<div class="card__body">' +
          '<div class="wa-status">' +
            '<div class="wa-status__pill wa-status__pill--' + s.cls + '">' + s.dot + ' ' + s.label + '</div>' +
            '<div class="wa-status__info">' +
              '<div class="wa-status__num">' + (config.numeroEnvio ? esc(config.numeroEnvio) : "Nenhum número conectado ainda") + '</div>' +
              '<p class="cfg-hint">A conexão real acontece por QR Code quando o motor de mensagens estiver ativo.</p>' +
            '</div>' +
            '<button class="btn btn--primary" type="button" id="wa-conectar">Conectar via QR Code</button>' +
          '</div>' +
          '<div class="wa-qr" id="wa-qr" hidden>' +
            '<div class="wa-qr__box">📷<br>QR Code</div>' +
            '<div class="wa-qr__txt"><strong>Aguardando o motor de mensagens.</strong>' +
              '<p class="cfg-hint">Quando conectarmos o servidor de WhatsApp, o QR Code aparece aqui e você escaneia pelo app do celular (Aparelhos conectados), igual ao WhatsApp Web.</p></div>' +
          '</div>' +
        '</div>' +
      '</section>';

    var dados =
      '<section class="card cfg-card">' +
        '<div class="card__head"><div><h2 class="card__title">Dados usados nas mensagens</h2>' +
          '<p class="card__sub">Preenchem as variáveis {link_google_reviews}, {link_agendamento} e {cupom}.</p></div></div>' +
        '<div class="card__body"><div class="cfg-form">' +
          field("Número do WhatsApp (envio)", "wa-numero", config.numeroEnvio, "Ex.: (21) 99409-4557") +
          field("Link do Google Meu Negócio (avaliações)", "wa-google", config.googleReviewLink, "https://g.page/.../review") +
          field("Link de agendamento", "wa-agendamento", config.linkAgendamento, "Link para o paciente marcar consulta") +
          field("Cupom de reativação", "wa-cupom", config.cupom, "Ex.: RETORNO10") +
        '</div></div>' +
      '</section>' +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" id="wa-save-conexao">Salvar dados</button></div>';

    el("panel-conexao").innerHTML = statusCard + dados;
  }

  function field(label, id, value, ph) {
    return '<label class="field field--light"><span class="field__label">' + esc(label) + '</span>' +
      '<input class="field__input" id="' + id + '" type="text" value="' + esc(value) + '"' +
      (ph ? ' placeholder="' + esc(ph) + '"' : "") + ' /></label>';
  }

  function salvarConexao(btn) {
    config.numeroEnvio = val("wa-numero");
    config.googleReviewLink = val("wa-google");
    config.linkAgendamento = val("wa-agendamento");
    config.cupom = val("wa-cupom");
    persistir(btn, "Dados salvos", function () { renderAutomacoes(); });
  }

  /* ============================================================
     PAINEL — AUTOMAÇÕES
     ============================================================ */
  function toolbar(tid) {
    var vars = (WA.variaveis || []).map(function (v) {
      return '<button class="wa-chip" type="button" data-var="' + esc(v.chave) + '" data-ta="' + tid + '" title="' + esc(v.desc) + '">' + esc(v.chave) + '</button>';
    }).join("");
    var emos = (WA.emojis || []).map(function (e) {
      return '<button class="wa-emoji" type="button" data-emoji="' + esc(e) + '" data-ta="' + tid + '">' + e + '</button>';
    }).join("");
    return '<div class="wa-tools">' +
      '<div class="wa-tools__row"><span class="wa-tools__lbl">Variáveis</span>' + vars + '</div>' +
      '<div class="wa-tools__row"><span class="wa-tools__lbl">Emojis</span>' + emos + '</div>' +
    '</div>';
  }

  function cardAutomacao(a, estado, custom) {
    var tid = "wa-ta-" + a.id;
    var pid = "wa-pv-" + a.id;
    var on = estado.ativo;
    var head =
      '<div class="wa-auto__head">' +
        '<span class="wa-auto__ico">' + (a.icone || "💬") + '</span>' +
        '<div class="wa-auto__meta">' +
          '<div class="wa-auto__tit">' + esc(a.titulo) + (custom ? ' <span class="wa-tag-custom">personalizada</span>' : '') + '</div>' +
          '<div class="wa-auto__quando">⏱️ ' + esc(a.quando) + '</div>' +
        '</div>' +
        '<button class="switch' + (on ? " is-on" : "") + '" type="button" role="switch" aria-checked="' + on + '" data-toggle="' + a.id + '"><span class="switch__knob"></span></button>' +
      '</div>';
    var gatilho = a.gatilho ? '<p class="wa-auto__gatilho">' + esc(a.gatilho) + '</p>' : '';
    var editor =
      '<div class="wa-auto__grid">' +
        '<div class="wa-auto__edit">' +
          toolbar(tid) +
          '<textarea class="wa-ta" id="' + tid + '" data-preview="' + pid + '" rows="8">' + esc(estado.texto) + '</textarea>' +
          (custom ? '<button class="btn btn--ghost wa-remove" type="button" data-remove="' + a.id + '">Excluir mensagem</button>' : '') +
        '</div>' +
        '<div class="wa-auto__pv">' +
          '<div class="wa-pv-head">Prévia</div>' +
          '<div class="wa-pv-screen" id="' + pid + '">' + bolhaHTML(estado.texto) + '</div>' +
        '</div>' +
      '</div>';
    return '<section class="card cfg-card wa-auto' + (on ? "" : " is-off") + '" data-auto="' + a.id + '">' +
      '<div class="card__body">' + head + gatilho + editor + '</div></section>';
  }

  function renderAutomacoes() {
    var cards = (WA.automacoes || []).map(function (a) {
      return cardAutomacao(a, config.automacoes[a.id] || { ativo: a.ativoPadrao, texto: a.texto }, false);
    }).join("");

    var customs = (config.customs || []).map(function (c) {
      return cardAutomacao(
        { id: c.id, titulo: c.titulo || "Mensagem personalizada", icone: "✨", quando: c.quando || "Envio manual", gatilho: c.gatilho || "" },
        { ativo: (typeof c.ativo === "boolean") ? c.ativo : true, texto: c.texto || "" },
        true
      );
    }).join("");

    el("panel-automacoes").innerHTML =
      '<div class="wa-actions-top">' +
        '<button class="btn btn--outline" type="button" id="wa-nova">＋ Nova mensagem personalizada</button>' +
        '<button class="btn btn--primary" type="button" id="wa-save-autos">Salvar automações</button>' +
      '</div>' +
      cards +
      (customs ? '<h2 class="wa-sec">Mensagens personalizadas</h2>' + customs : "");
  }

  // Lê os campos atuais da tela para dentro de config (sem salvar no banco).
  function coletarAutomacoes() {
    (WA.automacoes || []).forEach(function (a) {
      var ta = el("wa-ta-" + a.id);
      var sw = document.querySelector('[data-toggle="' + a.id + '"]');
      config.automacoes[a.id] = {
        ativo: sw ? sw.classList.contains("is-on") : a.ativoPadrao,
        texto: ta ? ta.value : a.texto
      };
    });
    (config.customs || []).forEach(function (c) {
      var ta = el("wa-ta-" + c.id);
      var sw = document.querySelector('[data-toggle="' + c.id + '"]');
      if (ta) c.texto = ta.value;
      if (sw) c.ativo = sw.classList.contains("is-on");
    });
  }

  function salvarAutomacoes(btn) {
    coletarAutomacoes();
    persistir(btn, "Automações salvas");
  }

  function novaMensagem() {
    coletarAutomacoes();
    var id = "custom_" + Date.now();
    config.customs.push({
      id: id, titulo: "Mensagem personalizada", quando: "Envio manual", ativo: true,
      texto: "Olá, {nome}! 💜\n\n"
    });
    renderAutomacoes();
    var node = el("wa-ta-" + id);
    if (node) node.focus();
    toast("Mensagem criada — edite e salve.");
  }

  function removerCustom(id) {
    coletarAutomacoes();
    config.customs = (config.customs || []).filter(function (c) { return c.id !== id; });
    renderAutomacoes();
    toast("Mensagem removida (lembre de salvar).");
  }

  /* ============================================================
     PAINEL — HISTÓRICO
     ============================================================ */
  function renderHistorico() {
    el("panel-historico").innerHTML =
      '<section class="card cfg-card"><div class="card__body">' +
        '<div class="wa-empty">' +
          '<div class="wa-empty__ico">🕓</div>' +
          '<h3>O histórico aparece aqui</h3>' +
          '<p class="cfg-hint">Cada mensagem enviada ficará registrada na ficha do paciente e nesta lista — com data, hora e status (enviada, entregue, lida) e as respostas dele.</p>' +
          '<p class="cfg-hint">Começa a preencher assim que o motor de mensagens for conectado.</p>' +
        '</div>' +
      '</div></section>';
  }

  /* ---------- Persistência ---------- */
  function persistir(btn, msgOk, depois) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    db().update({ whatsappConfig: config }).then(function (p) {
      perfil = mergePerfil(p);
      toast(msgOk || "Salvo");
      if (depois) depois();
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  /* ---------- Inserção de variável / emoji ---------- */
  function inserir(taId, texto) {
    var ta = el(taId) || activeTA;
    if (!ta) return;
    var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    var end = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
    ta.value = ta.value.slice(0, start) + texto + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + texto.length;
    ta.focus();
    atualizarPreview(ta);
  }
  function atualizarPreview(ta) {
    var pid = ta.getAttribute("data-preview");
    var pv = pid && el(pid);
    if (pv) pv.innerHTML = bolhaHTML(ta.value);
  }

  /* ---------- Topbar / sidebar ---------- */
  function renderTopbar() {
    var ini = iniciais(perfil.nome) || "AL";
    [el("user-avatar"), el("side-user-av")].forEach(function (av) {
      if (!av) return;
      if (perfil.avatarUrl) av.innerHTML = '<img src="' + esc(perfil.avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />';
      else av.textContent = ini;
    });
    var nm = el("side-user-name"); if (nm && perfil.nome) nm.textContent = perfil.nome;
    var cr = el("side-user-crn"); if (cr && perfil.crn) cr.textContent = perfil.crn;
  }
  function mergePerfil(p) {
    var out = {}; Object.keys(perfil).forEach(function (k) { out[k] = perfil[k]; });
    Object.keys(p || {}).forEach(function (k) { out[k] = p[k]; });
    return out;
  }

  /* ---------- Eventos ---------- */
  function wire() {
    el("wa-tabs").addEventListener("click", function (e) {
      var b = e.target.closest(".cfg-tab"); if (!b) return;
      var tab = b.getAttribute("data-tab");
      document.querySelectorAll(".cfg-tab").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      document.querySelectorAll(".cfg-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === tab);
      });
    });

    var panels = document.querySelector(".cfg-panels");

    // Foco em textarea → guarda como ativo
    panels.addEventListener("focusin", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("wa-ta")) activeTA = e.target;
    });
    // Digitação → atualiza prévia
    panels.addEventListener("input", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("wa-ta")) atualizarPreview(e.target);
    });

    panels.addEventListener("click", function (e) {
      // Toggle de automação
      var sw = e.target.closest(".switch");
      if (sw) {
        var on = sw.classList.toggle("is-on");
        sw.setAttribute("aria-checked", on);
        var card = sw.closest(".wa-auto"); if (card) card.classList.toggle("is-off", !on);
        return;
      }
      // Inserir variável
      var v = e.target.closest("[data-var]");
      if (v) { inserir(v.getAttribute("data-ta"), v.getAttribute("data-var")); return; }
      // Inserir emoji
      var em = e.target.closest("[data-emoji]");
      if (em) { inserir(em.getAttribute("data-ta"), em.getAttribute("data-emoji")); return; }
      // Remover custom
      var rm = e.target.closest("[data-remove]");
      if (rm) { removerCustom(rm.getAttribute("data-remove")); return; }
      // Botões nomeados
      if (e.target.closest("#wa-save-conexao")) { salvarConexao(e.target.closest("#wa-save-conexao")); return; }
      if (e.target.closest("#wa-save-autos")) { salvarAutomacoes(e.target.closest("#wa-save-autos")); return; }
      if (e.target.closest("#wa-nova")) { novaMensagem(); return; }
      if (e.target.closest("#wa-conectar")) {
        var qr = el("wa-qr"); if (qr) qr.hidden = false;
        toast("O motor de mensagens ainda será conectado (próximo passo técnico).");
        return;
      }
    });
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  function renderAll() { renderConexao(); renderAutomacoes(); renderHistorico(); }

  function init() {
    config = construirConfig({});   // casca com defaults
    renderAll();
    wire();
    initMobileNav();
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) {
        perfil = mergePerfil(p);
        config = construirConfig(perfil.whatsappConfig || {});
        renderAll(); renderTopbar();
      }).catch(function () { /* offline — mantém defaults */ });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
