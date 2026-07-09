/* ============================================================
   CONFIGURAÇÕES — abas (Perfil, Conta, Notificações, Integrações).
   REAL (Supabase via window.NutriPerfil): Perfil, especialidades,
   e-mail/senha de acesso e preferências de notificação.
   MOCK (configuracoes-data.js): catálogo de especialidades/notificações
   e a lista de Integrações (conectores externos ainda não implementados).
   ============================================================ */
(function () {
  "use strict";

  var data = window.CONFIG_DATA || {};
  // Perfil carregado do banco (preenchido no init). Enquanto não carrega,
  // usa um objeto vazio — nada de dado chumbado.
  var perfil = { nome: "", email: "", crn: "", cidade: "", telefone: "",
    instagram: "", site: "", bio: "", especialidades: [], notifPrefs: {} };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg, erro) {
    var t = el("cfg-toast");
    t.textContent = (erro ? "⚠ " : "✓ ") + msg;
    t.classList.toggle("is-error", !!erro);
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset._txt = btn.textContent; btn.textContent = label || "Salvando…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset._txt || btn.textContent; btn.disabled = false; }
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

  function iniciais(nome) {
    var parts = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  /* ---------- Painel: Perfil ---------- */
  function renderPerfil() {
    var ativas = perfil.especialidades || [];
    var chips = (data.especialidades || []).map(function (e) {
      var on = ativas.indexOf(e) > -1;
      return '<button class="chip" type="button" data-esp="' + esc(e) + '" aria-pressed="' + on + '">' + esc(e) + '</button>';
    }).join("");

    var av = perfil.avatarUrl
      ? '<img class="avatar avatar--rosa cfg-photo__av cfg-photo__img" alt="Foto de perfil" src="' + esc(perfil.avatarUrl) + '" />'
      : '<span class="avatar avatar--rosa cfg-photo__av">' + esc(iniciais(perfil.nome)) + '</span>';

    var identidade =
      '<div class="cfg-photo">' +
        av +
        '<div class="cfg-photo__info">' +
          '<input type="file" id="cfg-foto-input" accept="image/png,image/jpeg,image/webp" hidden />' +
          '<button class="btn btn--outline" type="button" id="btn-foto">Trocar foto</button>' +
          (perfil.avatarUrl ? '<button class="btn btn--ghost cfg-photo__rm" type="button" id="btn-foto-rm">Remover foto</button>' : '') +
          '<p class="cfg-hint">JPG ou PNG, até 2 MB.</p>' +
        '</div>' +
      '</div>' +
      '<div class="cfg-form">' +
        field("Nome completo", "cfg-nome", perfil.nome) +
        field("CRN", "cfg-crn", perfil.crn) +
        field("Cidade / UF", "cfg-cidade", perfil.cidade) +
        field("Telefone público", "cfg-tel", perfil.telefone, { type: "tel" }) +
        field("Instagram", "cfg-insta", perfil.instagram) +
        field("Site", "cfg-site", perfil.site) +
        field("Bio / apresentação", "cfg-bio", perfil.bio, { textarea: true, rows: 3, wide: true }) +
      '</div>';

    var especial =
      '<p class="cfg-hint" style="margin-bottom:var(--sp-3)">Usadas para personalizar seu feed científico e a Comunidade.</p>' +
      '<div class="cfg-chips" id="cfg-esp">' + chips + '</div>';

    el("panel-perfil").innerHTML =
      card("Dados do perfil", "Como você aparece para pacientes e na Comunidade.", identidade) +
      card("Áreas de atuação", "", especial) +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-action="save-perfil">Salvar alterações</button></div>';
  }

  /* ---------- Painel: Conta & Segurança ---------- */
  function renderConta() {
    var acesso =
      '<div class="cfg-form">' +
        field("E-mail de acesso", "cfg-email", perfil.email, { type: "email" }) +
        '<label class="field field--light"><span class="field__label">Idioma</span>' +
          '<select class="field__input" id="cfg-idioma"><option>Português (Brasil)</option><option>English</option><option>Español</option></select></label>' +
        '<label class="field field--light"><span class="field__label">Fuso horário</span>' +
          '<select class="field__input" id="cfg-fuso"><option>(GMT-03:00) Brasília</option><option>(GMT-04:00) Manaus</option><option>(GMT-02:00) Fernando de Noronha</option></select></label>' +
      '</div>' +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-action="save-email">Atualizar e-mail</button></div>';

    var senha =
      '<div class="cfg-form">' +
        field("Nova senha", "cfg-pass1", "", { type: "password", ph: "Mínimo 8 caracteres" }) +
        field("Confirmar nova senha", "cfg-pass2", "", { type: "password", ph: "Repita a nova senha" }) +
      '</div>' +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-action="save-senha">Alterar senha</button></div>';

    var duplo =
      '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>Autenticação em duas etapas</strong>' +
          '<span>Proteja o acesso com um código extra no login.</span></div>' +
        toggle("2fa", false) +
      '</div>';

    var perigo =
      '<div class="cfg-danger">' +
        '<div><strong>Excluir minha conta</strong><p class="cfg-hint">Remove permanentemente seus dados. Esta ação não pode ser desfeita.</p></div>' +
        '<button class="btn cfg-btn-danger" type="button" data-save="Em breve: exclusão de conta (LGPD)">Excluir conta</button>' +
      '</div>';

    el("panel-conta").innerHTML =
      card("Acesso", "E-mail de login da conta. Trocar o e-mail exige confirmação no novo endereço.", acesso) +
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
    var prefs = perfil.notifPrefs || {};
    var rows = (data.notificacoes || []).map(function (n) {
      var on = (n.id in prefs) ? !!prefs[n.id] : !!n.on;
      return '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>' + esc(n.titulo) + '</strong><span>' + esc(n.desc) + '</span></div>' +
        toggle(n.id, on) + '</div>';
    }).join("");
    el("panel-notif").innerHTML =
      card("Preferências de notificação", "Escolha o que você quer receber e por onde.", rows) +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-action="save-notif">Salvar preferências</button></div>';
  }

  /* ---------- Painel: Integrações (mock — conectores externos ainda não implementados) ---------- */
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

  /* ---------- Coleta de valores ---------- */
  function val(id) { var e = el(id); return e ? e.value : ""; }
  function especialidadesAtivas() {
    return Array.prototype.slice.call(document.querySelectorAll('#cfg-esp [data-esp]'))
      .filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })
      .map(function (c) { return c.getAttribute("data-esp"); });
  }
  function notifSelecionadas() {
    var out = {};
    (data.notificacoes || []).forEach(function (n) {
      var sw = document.querySelector('#panel-notif [data-toggle="' + n.id + '"]');
      out[n.id] = sw ? sw.classList.contains("is-on") : !!n.on;
    });
    return out;
  }

  /* ---------- Ações (salvar no banco) ---------- */
  function db() { return window.NutriPerfil; }

  function savePerfil(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    db().update({
      nome: val("cfg-nome"), crn: val("cfg-crn"), cidade: val("cfg-cidade"),
      telefone: val("cfg-tel"), instagram: val("cfg-insta"), site: val("cfg-site"),
      bio: val("cfg-bio"), especialidades: especialidadesAtivas()
    }).then(function (p) {
      perfil = p; renderPerfil();
      toast("Perfil atualizado");
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  function saveEmail(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var email = (val("cfg-email") || "").trim();
    if (!/.+@.+\..+/.test(email)) { toast("E-mail inválido.", true); return; }
    if (email === perfil.email) { toast("E-mail sem alteração."); return; }
    busy(btn, true, "Enviando…");
    db().updateEmail(email).then(function () {
      toast("Confirme no e-mail novo para concluir a troca.");
    }).catch(function (e) {
      toast("Não foi possível trocar o e-mail. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  function saveSenha(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var p1 = val("cfg-pass1"), p2 = val("cfg-pass2");
    if (p1.length < 8) { toast("A senha precisa de pelo menos 8 caracteres.", true); return; }
    if (p1 !== p2) { toast("As senhas não conferem.", true); return; }
    busy(btn, true);
    db().updatePassword(p1).then(function () {
      var a = el("cfg-pass1"), b = el("cfg-pass2"); if (a) a.value = ""; if (b) b.value = "";
      toast("Senha alterada");
    }).catch(function (e) {
      toast("Não foi possível alterar a senha. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  function saveNotif(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    var prefs = notifSelecionadas();
    db().update({ notifPrefs: prefs }).then(function (p) {
      perfil = p; toast("Preferências salvas");
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  var ACTIONS = { "save-perfil": savePerfil, "save-email": saveEmail, "save-senha": saveSenha, "save-notif": saveNotif };

  /* ---------- Foto de perfil ---------- */
  // Lê o arquivo, redimensiona para no máx. 320px e devolve um JPEG data URL leve.
  function processarFoto(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("não foi possível ler o arquivo")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("imagem inválida")); };
        img.onload = function () {
          var MAX = 320;
          var w = img.naturalWidth, h = img.naturalHeight;
          var escala = Math.min(1, MAX / Math.max(w, h));
          var cw = Math.round(w * escala), ch = Math.round(h * escala);
          var cv = document.createElement("canvas");
          cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function trocarFoto(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { toast("Use uma imagem JPG, PNG ou WEBP.", true); return; }
    if (file.size > 2 * 1024 * 1024) { toast("A imagem passa de 2 MB. Escolha uma menor.", true); return; }
    if (!db()) { toast("Banco indisponível.", true); return; }
    var btn = el("btn-foto");
    busy(btn, true, "Enviando…");
    processarFoto(file).then(function (dataUrl) {
      return db().update({ avatarUrl: dataUrl });
    }).then(function (p) {
      perfil = p; renderPerfil();
      toast("Foto atualizada");
    }).catch(function (e) {
      toast("Não foi possível trocar a foto. " + (e && e.message ? e.message : ""), true);
      busy(btn, false);
    });
  }

  function removerFoto() {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var btn = el("btn-foto-rm");
    busy(btn, true, "Removendo…");
    db().update({ avatarUrl: "" }).then(function (p) {
      perfil = p; renderPerfil();
      toast("Foto removida");
    }).catch(function (e) {
      toast("Não foi possível remover a foto. " + (e && e.message ? e.message : ""), true);
      busy(btn, false);
    });
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

    var panels = document.querySelector(".cfg-panels");

    // Troca de foto: o botão abre o seletor de arquivo; a escolha dispara o upload.
    panels.addEventListener("change", function (e) {
      if (e.target && e.target.id === "cfg-foto-input") {
        trocarFoto(e.target.files && e.target.files[0]);
        e.target.value = ""; // permite reescolher o mesmo arquivo depois
      }
    });

    // Delegação global do canvas: toggles, chips, ações, integrações
    panels.addEventListener("click", function (e) {
      if (e.target.closest("#btn-foto")) { var inp = el("cfg-foto-input"); if (inp) inp.click(); return; }
      if (e.target.closest("#btn-foto-rm")) { removerFoto(); return; }
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
      var act = e.target.closest("[data-action]");
      if (act) { var fn = ACTIONS[act.getAttribute("data-action")]; if (fn) fn(act); return; }
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

  function renderAll() {
    renderPerfil(); renderConta(); renderNotif(); renderIntegr();
  }

  function init() {
    renderAll();      // pinta a casca (campos vazios) enquanto carrega
    wire();
    initMobileNav();
    // Carrega o perfil real e repinta.
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) {
        perfil = p;
        renderPerfil(); renderNotif(); renderConta();
      }).catch(function () { /* offline/file:// — mantém a casca vazia */ });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
