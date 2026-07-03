/* ============================================================
   CONFIGURAÇÕES — abas (Perfil, Conta, Notificações, Integrações),
   toggles, multi-seleção de especialidades e toast de salvamento.
   Depende de configuracoes-data.js (window.CONFIG_DATA).
   ============================================================ */
(function () {
  "use strict";

  var data = window.CONFIG_DATA || {};
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = el("cfg-toast");
    t.textContent = "✓ " + msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2400);
  }

  /* ---------- Componentes reutilizáveis ---------- */
  function field(label, id, value, opts) {
    opts = opts || {};
    var input = opts.textarea
      ? '<textarea class="field__input" id="' + id + '" rows="' + (opts.rows || 3) + '">' + esc(value) + '</textarea>'
      : '<input class="field__input" id="' + id + '" type="' + (opts.type || "text") + '" value="' + esc(value) + '"' +
          (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") + ' />';
    return '<label class="field field--light' + (opts.wide ? " field--wide" : "") + '">' +
      '<span class="field__label">' + esc(label) + '</span>' + input + '</label>';
  }

  function card(title, sub, bodyHTML) {
    return '<section class="card cfg-card">' +
      '<div class="card__head"><div><h2 class="card__title">' + esc(title) + '</h2>' +
        (sub ? '<p class="card__sub">' + esc(sub) + '</p>' : "") + '</div></div>' +
      '<div class="card__body">' + bodyHTML + '</div></section>';
  }

  /* ---------- Painel: Perfil ---------- */
  function renderPerfil() {
    var p = data.perfil || {};
    var chips = (data.especialidades || []).map(function (e) {
      var on = (data.especialidadesAtivas || []).indexOf(e) > -1;
      return '<button class="chip" type="button" data-esp="' + esc(e) + '" aria-pressed="' + on + '">' + esc(e) + '</button>';
    }).join("");

    var identidade =
      '<div class="cfg-photo">' +
        '<span class="avatar avatar--rosa cfg-photo__av">AL</span>' +
        '<div class="cfg-photo__info">' +
          '<button class="btn btn--outline" type="button" id="btn-foto">Trocar foto</button>' +
          '<p class="cfg-hint">JPG ou PNG, até 2 MB.</p>' +
        '</div>' +
      '</div>' +
      '<div class="cfg-form">' +
        field("Nome completo", "cfg-nome", p.nome) +
        field("CRN", "cfg-crn", p.crn) +
        field("Cidade / UF", "cfg-cidade", p.cidade) +
        field("Telefone público", "cfg-tel", p.telefone, { type: "tel" }) +
        field("Instagram", "cfg-insta", p.instagram) +
        field("Site", "cfg-site", p.site) +
        field("Bio / apresentação", "cfg-bio", p.bio, { textarea: true, rows: 3, wide: true }) +
      '</div>';

    var especial =
      '<p class="cfg-hint" style="margin-bottom:var(--sp-3)">Usadas para personalizar seu feed científico e a Comunidade.</p>' +
      '<div class="cfg-chips" id="cfg-esp">' + chips + '</div>';

    el("panel-perfil").innerHTML =
      card("Dados do perfil", "Como você aparece para pacientes e na Comunidade.", identidade) +
      card("Áreas de atuação", "", especial) +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-save="Perfil atualizado">Salvar alterações</button></div>';
  }

  /* ---------- Painel: Conta & Segurança ---------- */
  function renderConta() {
    var p = data.perfil || {};
    var acesso =
      '<div class="cfg-form">' +
        field("E-mail de acesso", "cfg-email", p.email, { type: "email" }) +
        '<label class="field field--light"><span class="field__label">Idioma</span>' +
          '<select class="field__input" id="cfg-idioma"><option>Português (Brasil)</option><option>English</option><option>Español</option></select></label>' +
        '<label class="field field--light"><span class="field__label">Fuso horário</span>' +
          '<select class="field__input" id="cfg-fuso"><option>(GMT-03:00) Brasília</option><option>(GMT-04:00) Manaus</option><option>(GMT-02:00) Fernando de Noronha</option></select></label>' +
      '</div>';

    var senha =
      '<div class="cfg-form">' +
        field("Senha atual", "cfg-pass0", "", { type: "password", ph: "••••••••" }) +
        field("Nova senha", "cfg-pass1", "", { type: "password", ph: "Mínimo 8 caracteres" }) +
        field("Confirmar nova senha", "cfg-pass2", "", { type: "password", ph: "Repita a nova senha" }) +
      '</div>' +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-save="Senha alterada">Alterar senha</button></div>';

    var duplo =
      '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>Autenticação em duas etapas</strong>' +
          '<span>Proteja o acesso com um código extra no login.</span></div>' +
        toggle("2fa", false) +
      '</div>';

    var perigo =
      '<div class="cfg-danger">' +
        '<div><strong>Excluir minha conta</strong><p class="cfg-hint">Remove permanentemente seus dados. Esta ação não pode ser desfeita.</p></div>' +
        '<button class="btn cfg-btn-danger" type="button" data-save="Solicitação de exclusão registrada">Excluir conta</button>' +
      '</div>';

    el("panel-conta").innerHTML =
      card("Acesso", "E-mail, idioma e fuso horário da conta.", acesso) +
      card("Senha", "Recomendamos trocar a cada 6 meses.", senha) +
      card("Segurança", "", duplo) +
      card("Zona de perigo", "", perigo);
  }

  /* ---------- Painel: Notificações ---------- */
  function toggle(id, on) {
    return '<button class="switch' + (on ? " is-on" : "") + '" type="button" role="switch" ' +
      'aria-checked="' + (!!on) + '" data-toggle="' + id + '"><span class="switch__knob"></span></button>';
  }

  function renderNotif() {
    var rows = (data.notificacoes || []).map(function (n) {
      return '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>' + esc(n.titulo) + '</strong><span>' + esc(n.desc) + '</span></div>' +
        toggle(n.id, n.on) + '</div>';
    }).join("");
    el("panel-notif").innerHTML =
      card("Preferências de notificação", "Escolha o que você quer receber e por onde.", rows) +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-save="Preferências salvas">Salvar preferências</button></div>';
  }

  /* ---------- Painel: Integrações ---------- */
  function renderIntegr() {
    var cards = (data.integracoes || []).map(function (i) {
      return '<article class="cfg-integr" data-integr="' + i.id + '">' +
        '<div class="cfg-integr__ico">' + i.ico + '</div>' +
        '<div class="cfg-integr__body">' +
          '<div class="cfg-integr__nome">' + esc(i.nome) +
            (i.conectado ? '<span class="cfg-badge cfg-badge--on">Conectado</span>' : '') + '</div>' +
          '<p class="cfg-integr__desc">' + esc(i.desc) + '</p>' +
          (i.conectado && i.conta ? '<p class="cfg-integr__conta">🔗 ' + esc(i.conta) + '</p>' : '') +
        '</div>' +
        '<button class="btn ' + (i.conectado ? "btn--outline" : "btn--primary") + ' cfg-integr__btn" type="button">' +
          (i.conectado ? "Desconectar" : "Conectar") + '</button>' +
      '</article>';
    }).join("");
    el("panel-integr").innerHTML =
      '<div class="card__head" style="padding-left:0"><div><h2 class="card__title">Integrações</h2>' +
        '<p class="card__sub">Conecte a plataforma às ferramentas que você já usa.</p></div></div>' +
      '<div class="cfg-integr-list">' + cards + '</div>';
  }

  /* ---------- Interações ---------- */
  function wire() {
    // Abas
    el("cfg-tabs").addEventListener("click", function (e) {
      var b = e.target.closest(".cfg-tab");
      if (!b) return;
      var tab = b.getAttribute("data-tab");
      document.querySelectorAll(".cfg-tab").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      document.querySelectorAll(".cfg-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === tab);
      });
    });

    // Delegação global do canvas: toggles, chips, botões salvar, integrações
    document.querySelector(".cfg-panels").addEventListener("click", function (e) {
      var sw = e.target.closest(".switch");
      if (sw) {
        var on = sw.classList.toggle("is-on");
        sw.setAttribute("aria-checked", on);
        return;
      }
      var chip = e.target.closest("[data-esp]");
      if (chip) {
        var pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", !pressed);
        return;
      }
      var integrBtn = e.target.closest(".cfg-integr__btn");
      if (integrBtn) {
        var artc = integrBtn.closest(".cfg-integr");
        var id = artc.getAttribute("data-integr");
        var item = (data.integracoes || []).filter(function (x) { return x.id === id; })[0];
        if (item) { item.conectado = !item.conectado; renderIntegr(); toast(item.conectado ? item.nome + " conectado" : item.nome + " desconectado"); }
        return;
      }
      var save = e.target.closest("[data-save]");
      if (save) { toast(save.getAttribute("data-save")); }
    });
  }

  /* ---------- Nav mobile (padrão das outras telas) ---------- */
  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  function init() {
    renderPerfil();
    renderConta();
    renderNotif();
    renderIntegr();
    wire();
    initMobileNav();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
