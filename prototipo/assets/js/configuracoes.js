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

    var dados =
      '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>Exportar meus dados</strong>' +
          '<span>Baixe um arquivo (JSON) com tudo o que você controla na plataforma — ' +
          'perfil, pacientes, consultas, financeiro e adesão. Direito de portabilidade (LGPD).</span></div>' +
        '<button class="btn btn--outline" type="button" data-action="exportar-dados">Exportar (JSON)</button>' +
      '</div>';

    var perigo =
      '<div class="cfg-danger">' +
        '<div><strong>Excluir minha conta</strong><p class="cfg-hint">Remove permanentemente sua conta e TODOS os dados: perfil, pacientes, prontuários, consultas, financeiro e os acessos de portal dos seus pacientes. Esta ação não pode ser desfeita.</p></div>' +
        '<button class="btn cfg-btn-danger" type="button" data-action="excluir-conta">Excluir conta</button>' +
      '</div>';

    el("panel-conta").innerHTML =
      card("Acesso", "E-mail de login da conta. Trocar o e-mail exige confirmação no novo endereço.", acesso) +
      card("Senha", "Recomendamos trocar a cada 6 meses.", senha) +
      card("Segurança", "", duplo) +
      card("Meus dados (LGPD)", "Portabilidade e controle sobre os seus dados.", dados) +
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

  /* ---------- Google Agenda + Meet (conexão OAuth real) ----------
     Os cards "google" e "meet" refletem a MESMA conexão. Ao conectar o
     Google, a agenda passa a criar eventos e as consultas Online ganham Meet. */
  function aplicaStatusGoogle(st) {
    var conectado = !!(st && st.conectado);
    var conta = (st && st.email) || "";
    (data.integracoes || []).forEach(function (i) {
      if (i.id === "google" || i.id === "meet") { i.conectado = conectado; i.conta = conta; }
    });
    renderIntegr();
  }

  function refreshGoogle() {
    if (!window.NutriGoogle) return;
    window.NutriGoogle.status().then(aplicaStatusGoogle).catch(function () {});
  }

  function toggleGoogle(item, btn) {
    if (!window.NutriGoogle) { toast("Conexão Google indisponível offline.", true); return; }
    var estaConectado = item && item.conectado;
    if (estaConectado) {
      if (!confirm("Desconectar o Google? A agenda para de sincronizar e novas consultas Online não terão link do Meet.")) return;
      busy(btn, true, "Desconectando…");
      window.NutriGoogle.disconnect().then(function () {
        aplicaStatusGoogle(null);
        toast("Google desconectado.");
      }).catch(function () { busy(btn, false); toast("Não foi possível desconectar.", true); });
    } else {
      busy(btn, true, "Abrindo o Google…");
      // returnTo volta pra esta aba de Integrações após o consentimento.
      var returnTo = location.origin + location.pathname + "?tab=integr";
      window.NutriGoogle.connect(returnTo).catch(function (err) {
        busy(btn, false);
        toast("Não foi possível iniciar a conexão." + (err && err.message ? " (" + err.message + ")" : ""), true);
      });
    }
  }

  /* Lê ?google=ok|erro que o callback devolve e mostra o resultado. */
  function tratarRetornoGoogle() {
    var qs = new URLSearchParams(location.search);
    var g = qs.get("google");
    if (!g) return;
    if (g === "ok") toast("Google conectado! Sua agenda já sincroniza.");
    else toast("Falha ao conectar o Google" + (qs.get("msg") ? ": " + qs.get("msg") : "") + ".", true);
    // Limpa os parâmetros da URL (mantém a aba).
    history.replaceState(null, "", location.pathname + "?tab=integr");
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

  /* ---------- Painel: Admin (só para a Ana) — convidar nutricionistas ----------
     Cadastro público é fechado; contas de nutri nascem por convite. Este
     painel chama a edge function create-nutri-access, que exige
     profiles.is_admin=true. A senha gerada volta aqui p/ a Ana repassar. */
  var convites = [];   // lista carregada de nutri_convites

  function renderAdmin() {
    var form =
      '<div class="cfg-form">' +
        field("Nome da nutricionista", "adm-nome", "", { ph: "Ex.: Marina Alves" }) +
        field("E-mail de acesso", "adm-email", "", { type: "email", ph: "email@dela.com" }) +
        field("Observação (opcional)", "adm-obs", "", { ph: "Ex.: amiga, fase de testes" }) +
      '</div>' +
      '<div class="cfg-actions">' +
        '<button class="btn btn--primary" type="button" data-action="invite-nutri">Criar acesso e gerar senha</button>' +
      '</div>' +
      '<div id="adm-result"></div>';

    var lista = convites.length
      ? '<div class="cfg-convites">' + convites.map(function (c) {
          return '<div class="cfg-toggle-row">' +
            '<div class="cfg-toggle-txt"><strong>' + esc(c.nome || "(sem nome)") + '</strong>' +
              '<span>' + esc(c.email) + ' · ' + esc((c.created_at || "").slice(0, 10)) + '</span></div>' +
            '<span class="cfg-badge cfg-badge--on">' + esc(c.status || "ativo") + '</span></div>';
        }).join("") + '</div>'
      : '<p class="cfg-hint">Nenhuma nutricionista convidada ainda.</p>';

    el("panel-admin").innerHTML =
      card("Convidar nutricionista",
        "Crie o acesso de outra nutri. Ela recebe e-mail + senha e entra pela tela de login. A carteira dela começa vazia, mas a Inteligência Clínica já vem completa.",
        form) +
      card("Nutricionistas convidadas", "", lista);
  }

  function copiar(texto, btn) {
    var done = function () {
      if (!btn) return;
      var t = btn.textContent; btn.textContent = "Copiado ✓";
      setTimeout(function () { btn.textContent = t; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(done).catch(function () { toast("Copie manualmente.", true); });
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = texto; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta); done();
      } catch (e) { toast("Copie manualmente.", true); }
    }
  }

  function inviteNutri(btn) {
    if (!window.NutriDBReady) { toast("Banco indisponível.", true); return; }
    var nome = (val("adm-nome") || "").trim();
    var email = (val("adm-email") || "").trim().toLowerCase();
    var obs = (val("adm-obs") || "").trim();
    if (!nome) { toast("Informe o nome.", true); return; }
    if (!/.+@.+\..+/.test(email)) { toast("E-mail inválido.", true); return; }
    busy(btn, true, "Criando…");
    window.NutriDBReady.then(function (c) {
      return c.functions.invoke("create-nutri-access", {
        body: { nome: nome, email: email, observacao: obs || undefined }
      });
    }).then(function (res) {
      if (res.error) {
        // functions.invoke embrulha erro HTTP; tenta extrair o código do corpo.
        if (res.error.context && res.error.context.json) {
          return res.error.context.json().then(function (b) { throw new Error(b && b.error || "falha"); });
        }
        throw new Error("falha");
      }
      var d = res.data || {};
      if (d.error) throw new Error(d.error);
      mostrarCredenciais(nome, d.email, d.senha);
      // limpa o formulário e recarrega a lista
      ["adm-nome", "adm-email", "adm-obs"].forEach(function (id) { var e = el(id); if (e) e.value = ""; });
      carregarConvites();
      toast("Acesso criado!");
    }).catch(function (e) {
      var m = (e && e.message) || "";
      var amigavel = m === "email_em_uso" ? "Esse e-mail já tem conta."
        : m === "nao_autorizado" ? "Só a administradora pode convidar."
        : m === "email_invalido" ? "E-mail inválido."
        : "Não foi possível criar o acesso. " + m;
      toast(amigavel, true);
    }).then(function () { busy(btn, false); });
  }

  function mostrarCredenciais(nome, email, senha) {
    var box = el("adm-result");
    if (!box) return;
    var login = location.origin + location.pathname.replace(/[^/]+$/, "index.html");
    var msg =
      "Oi, " + nome + "! Criei seu acesso à plataforma 💚\n\n" +
      "Entre em: " + login + "\n" +
      "E-mail: " + email + "\n" +
      "Senha: " + senha + "\n\n" +
      "É só entrar e, se quiser, trocar a senha em Configurações.";
    box.innerHTML =
      '<div class="cfg-cred">' +
        '<p class="cfg-cred__title">✅ Acesso criado. Envie estes dados para ela:</p>' +
        '<div class="cfg-cred__row"><span>E-mail</span><code>' + esc(email) + '</code></div>' +
        '<div class="cfg-cred__row"><span>Senha</span><code>' + esc(senha) + '</code></div>' +
        '<div class="cfg-actions" style="margin-top:var(--sp-3)">' +
          '<button class="btn btn--primary" type="button" data-copy="' + esc(msg) + '">Copiar mensagem pronta</button>' +
        '</div>' +
        '<p class="cfg-hint">A senha não fica salva em lugar nenhum depois que você sai desta tela — copie agora.</p>' +
      '</div>';
  }

  function carregarConvites() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      return c.from("nutri_convites").select("nome,email,status,created_at").order("created_at", { ascending: false });
    }).then(function (res) {
      convites = (res && res.data) || [];
      renderAdmin();
    }).catch(function () { /* silencioso */ });
  }

  // Se o usuário é admin, injeta a aba + painel Admin e carrega os convites.
  function checkAdmin() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      return c.from("profiles").select("is_admin").maybeSingle();
    }).then(function (res) {
      if (!res || !res.data || res.data.is_admin !== true) return;
      if (el("panel-admin")) return; // já montado
      var tabs = el("cfg-tabs");
      var panels = document.querySelector(".cfg-panels");
      if (!tabs || !panels) return;
      var tab = document.createElement("button");
      tab.className = "cfg-tab"; tab.type = "button"; tab.setAttribute("data-tab", "admin");
      tab.innerHTML = '<span class="cfg-tab__ico">🛡️</span> Admin';
      tabs.appendChild(tab);
      var panel = document.createElement("section");
      panel.className = "cfg-panel"; panel.setAttribute("data-panel", "admin"); panel.id = "panel-admin";
      panels.appendChild(panel);
      renderAdmin();
      carregarConvites();
    }).catch(function () { /* não é admin ou offline: nada muda */ });
  }

  /* ---------- LGPD: exportar dados / excluir conta ---------- */
  function exportarDados(btn) {
    if (!window.NutriLGPD) { toast("Exportação indisponível.", true); return; }
    busy(btn, true, "Preparando…");
    window.NutriLGPD.exportar().then(function (r) {
      var n = 0; Object.keys(r.totais || {}).forEach(function (k) { n += r.totais[k]; });
      toast("Arquivo gerado (" + n + " registros). Verifique seus downloads.");
    }).catch(function (e) {
      toast("Não foi possível exportar. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  function excluirConta(btn) {
    if (!window.NutriLGPD) { toast("Exclusão indisponível.", true); return; }
    var aviso = "ATENÇÃO: isto apaga DEFINITIVAMENTE sua conta e todos os dados " +
      "(pacientes, prontuários, consultas, financeiro e acessos de portal). " +
      "Não há como desfazer.\n\nRecomendamos exportar seus dados antes.\n\n" +
      "Para confirmar, digite EXCLUIR abaixo:";
    var resp = window.prompt(aviso, "");
    if (resp == null) return;               // cancelou
    if (resp.trim().toUpperCase() !== "EXCLUIR") { toast("Confirmação incorreta. Nada foi apagado."); return; }
    busy(btn, true, "Excluindo…");
    window.NutriLGPD.excluirConta().then(function () {
      alert("Sua conta e seus dados foram removidos. Você será desconectada.");
      return window.NutriDBReady.then(function (c) { return c.auth.signOut(); });
    }).then(function () {
      location.href = "index.html";
    }).catch(function (e) {
      busy(btn, false);
      var m = (e && e.message) || "";
      toast(m === "confirmacao_invalida" ? "Confirmação inválida." :
        "Não foi possível excluir a conta agora. " + m, true);
    });
  }

  var ACTIONS = { "save-perfil": savePerfil, "save-email": saveEmail, "save-senha": saveSenha,
    "save-notif": saveNotif, "invite-nutri": inviteNutri,
    "exportar-dados": exportarDados, "excluir-conta": excluirConta };

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
        // Google Agenda e Meet compartilham a MESMA conexão OAuth do Google.
        if (id === "google" || id === "meet") { toggleGoogle(item, integrBtn); return; }
        // Demais cards ainda são cosméticos (conectores externos pendentes).
        if (item) { item.conectado = !item.conectado; renderIntegr(); toast(item.conectado ? item.nome + " conectado" : item.nome + " desconectado"); }
        return;
      }
      var copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) { copiar(copyBtn.getAttribute("data-copy"), copyBtn); return; }
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

  /* Abre uma aba pelo nome (usado ao voltar do consentimento Google). */
  function abrirTab(tab) {
    var b = document.querySelector('.cfg-tab[data-tab="' + tab + '"]');
    if (!b) return;
    document.querySelectorAll(".cfg-tab").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    document.querySelectorAll(".cfg-panel").forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-panel") === tab);
    });
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
    // Reabre a aba certa se voltamos do Google, mostra o resultado e
    // sincroniza o status real da conexão Google.
    var qs = new URLSearchParams(location.search);
    if (qs.get("tab")) abrirTab(qs.get("tab"));
    tratarRetornoGoogle();
    refreshGoogle();
    checkAdmin();     // injeta a aba Admin se a pessoa for administradora
  }

  document.addEventListener("DOMContentLoaded", init);
})();
