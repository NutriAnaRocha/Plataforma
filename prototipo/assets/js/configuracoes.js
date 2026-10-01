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
      ? '<textarea class="field__input" id="' + id + '" rows="' + (opts.rows || 3) + '"' +
          (opts.max ? ' maxlength="' + opts.max + '"' : "") + '>' + esc(value) + '</textarea>'
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
          '<p class="cfg-hint">Qualquer foto do celular serve — eu ajusto o tamanho sozinha.</p>' +
        '</div>' +
      '</div>' +
      '<div class="cfg-form">' +
        field("Nome completo", "cfg-nome", perfil.nome) +
        field("CRN", "cfg-crn", perfil.crn) +
        field("Cidade / UF", "cfg-cidade", perfil.cidade) +
        field("Telefone público", "cfg-tel", perfil.telefone, { type: "tel" }) +
        field("Instagram", "cfg-insta", perfil.instagram) +
        field("Site", "cfg-site", perfil.site) +
        field("Bio / apresentação · até 300 caracteres", "cfg-bio", perfil.bio, { textarea: true, rows: 3, wide: true, max: 300 }) +
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

    // Sair usa [data-logout], tratado pelo auth-guard.js: ele chama signOut()
    // e manda para o index. Nada de ação própria aqui.
    var sair =
      '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>Sair desta conta</strong>' +
          '<span>Encerra a sessão neste dispositivo. Seus dados continuam salvos — ' +
          'é só entrar de novo com o mesmo e-mail e senha.</span></div>' +
        '<a class="btn btn--outline" href="index.html" data-logout>Sair</a>' +
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
      card("Sessão", "", sair) +
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

  /* ---------- Painel: Integrações ----------
     Google Agenda e Meet conectam de verdade (OAuth). O WhatsApp é envio
     assistido e só leva para a tela dele. O que ainda não existe aparece
     como "Em breve", desabilitado — nunca como um botão que finge conectar. */
  function renderIntegr() {
    var cards = (data.integracoes || []).map(function (i) {
      var acao;
      if (i.breve) {
        acao = '<button class="btn btn--outline cfg-integr__btn" type="button" disabled>Em breve</button>';
      } else if (i.link) {
        acao = '<a class="btn btn--outline cfg-integr__acao" href="' + esc(i.link) + '">' + esc(i.acao || "Abrir") + '</a>';
      } else {
        acao = '<button class="btn ' + (i.conectado ? "btn--outline" : "btn--primary") + ' cfg-integr__btn" type="button">' +
          (i.conectado ? "Desconectar" : "Conectar") + '</button>';
      }
      return '<article class="cfg-integr' + (i.breve ? " is-breve" : "") + '" data-integr="' + i.id + '">' +
        '<div class="cfg-integr__ico">' + i.ico + '</div>' +
        '<div class="cfg-integr__body">' +
          '<div class="cfg-integr__nome">' + esc(i.nome) +
            (i.conectado ? '<span class="cfg-badge cfg-badge--on">Conectado</span>' : '') + '</div>' +
          '<p class="cfg-integr__desc">' + esc(i.desc) + '</p>' +
          (i.conectado && i.conta ? '<p class="cfg-integr__conta">🔗 ' + esc(i.conta) + '</p>' : '') +
        '</div>' + acao +
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
    else if (qs.get("msg") === "sem_agenda") toast("Autorize o acesso à agenda e tente de novo: na tela do Google, deixe marcada a caixa do Google Agenda.", true);
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
  var nutris = {};     // email -> estado REAL da assinatura (vem da edge function)

  // O status do convite não é o status da assinatura: um convite "ativo" pode
  // ter a assinatura vencida ou pausada. Quem manda no acesso é o profiles.
  function assinaturaDe(email) {
    return nutris[(email || "").toLowerCase()] || null;
  }

  function selo(a) {
    if (!a) return { txt: "convidada", on: false };
    if (a.is_admin) return { txt: "administradora", on: true };
    var s = a.assinatura_status;
    if (s === "ativa") {
      var ate = a.assinatura_expira_em
        ? " até " + new Date(a.assinatura_expira_em).toLocaleDateString("pt-BR") : "";
      return { txt: "ativa" + ate, on: true };
    }
    if (s === "trial") return { txt: "avaliação", on: true };
    if (s === "cancelada") return { txt: "pausada", on: false };
    return { txt: "vencida", on: false };
  }

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
          var a = assinaturaDe(c.email);
          var s = selo(a);
          var liberada = a && !a.is_admin && a.assinatura_status !== "cancelada";
          var acao = a && !a.is_admin
            ? '<button class="btn btn--ghost btn--sm" type="button" ' +
                'data-action="' + (liberada ? "pausar-assinatura" : "reativar-assinatura") + '" ' +
                'data-email="' + esc(c.email) + '">' +
                (liberada ? "⏸️ Pausar" : "▶️ Reativar") + "</button>"
            : "";
          // Só faz sentido para quem já tem conta (a === null é convite órfão).
          var reset = a && !a.is_admin
            ? '<button class="btn btn--ghost btn--sm" type="button" data-action="nova-senha" ' +
                'data-email="' + esc(c.email) + '" data-nome="' + esc(c.nome || "") + '">' +
                "🔑 Nova senha</button>"
            : "";
          acao = reset + acao;
          return '<div class="cfg-convite">' +
            '<div class="cfg-toggle-txt"><strong>' + esc(c.nome || "(sem nome)") + '</strong>' +
              '<span>' + esc(c.email) + ' · ' + esc((c.created_at || "").slice(0, 10)) + '</span></div>' +
            '<span class="cfg-badge ' + (s.on ? "cfg-badge--on" : "cfg-badge--off") + '">' +
              esc(s.txt) + '</span>' + acao + '</div>';
        }).join("") + '</div>'
      : '<p class="cfg-hint">Nenhuma nutricionista convidada ainda.</p>';

    var ativar =
      '<div class="cfg-form">' +
        field("E-mail da nutricionista", "act-email", "", { type: "email", ph: "email@dela.com" }) +
        '<label class="field field--light"><span class="field__label">Meses a liberar</span>' +
          '<select class="field__input" id="act-meses">' +
            '<option value="1">1 mês</option><option value="3">3 meses</option>' +
            '<option value="6">6 meses</option><option value="12">12 meses</option></select></label>' +
      '</div>' +
      '<div class="cfg-actions">' +
        '<button class="btn btn--primary" type="button" data-action="ativar-assinatura">Ativar / renovar assinatura</button>' +
      '</div>' +
      '<div id="act-result"></div>' +
      '<p class="cfg-hint">Use quando alguém pagar pelo link do InfinitePay e a liberação automática ainda não estiver ligada. A conta precisa já existir (convide antes, se for o caso).</p>';

    el("panel-admin").innerHTML =
      card("Cadastros novos",
        "Quem se inscreveu sozinha em /seja-indicada. Confira o CRN no site do conselho antes de liberar — " +
        "aprovar aqui é dizer que o registro existe, não publicar o perfil.",
        renderFilaCadastros()) +
      card("Perfis aguardando aprovação",
        "Só entra na busca do site depois que você aprova. Abra o Instagram antes de decidir.",
        renderFilaPerfis()) +
      card("Comissões a pagar",
        "O que as indicadas pagaram até o fim do mês passado e já passou dos 7 dias de arrependimento. " +
        "Faça o Pix no 1º dia útil (" + proximoDiaUtil() + ") e clique em Paguei — cada valor só aparece uma vez.",
        renderComissoes()) +
      card("Avisos de renovação",
        "A InfinitePay não cobra sozinha: todo dia às 9h a plataforma avisa quem está para vencer, " +
        "com o botão de pagar. Aqui ficam os últimos 30 dias.",
        renderAvisos()) +
      card("Pagamentos dos últimos 7 dias",
        "Ainda dentro do prazo de arrependimento. Se você devolveu o dinheiro na InfinitePay, clique em Reembolsou: " +
        "a comissão é cancelada e o período pago sai da conta.",
        renderRecentes()) +
      card("Embaixadoras",
        "Cadastre a nutri pelo e-mail da conta dela. Ela ganha 6 meses de assinatura grátis e um cupom: " +
        "quem assinar com ele fica registrada como indicada dela, e ela recebe 30% de cada pagamento por 12 meses.",
        renderEmbaixadoras()) +
      card("Convidar nutricionista",
        "Crie o acesso de outra nutri. Ela recebe e-mail + senha e entra pela tela de login. A carteira dela começa vazia, mas a Inteligência Clínica já vem completa.",
        form) +
      card("Ativar assinatura manualmente",
        "Libera o acesso pago de uma nutri por um período, a partir do e-mail dela.",
        ativar) +
      card("Nutricionistas convidadas", "", lista);
  }

  /* ---------- Embaixadoras e comissões (0096) ----------
     Os valores vêm prontos do banco (admin_embaixadoras / minhas_indicacoes):
     aqui não se calcula dinheiro, só se mostra. "A pagar" é o que entrou
     antes deste mês; "acumulando" é o do mês corrente, pago no próximo. */
  var embaixadoras = [];

  function reais(c) {
    return "R$ " + ((c || 0) / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+,)/g, ".");
  }

  // 1º dia útil do mês que vem (fim de semana e 1º de janeiro pulados).
  function proximoDiaUtil() {
    var h = new Date();
    var d = new Date(h.getFullYear(), h.getMonth() + 1, 1);
    while (d.getDay() === 0 || d.getDay() === 6 || (d.getMonth() === 0 && d.getDate() === 1)) {
      d.setDate(d.getDate() + 1);
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  }

  /* ---------- Avisos de renovação (0099) ----------
     Só leitura: quem manda é o cron do banco + a function
     nutriplat-renovacao. Enquanto não houver provedor de e-mail
     configurado, o aviso fica registrado como "não enviado" — e é
     exatamente isso que este card precisa deixar claro. */
  var avisos = [];

  var AVISO_NOME = {
    trial_3d: "teste acabando (3 dias)",
    trial_fim: "último dia do teste",
    vence_5d: "vence em 5 dias",
    vence_1d: "vence amanhã",
    venceu: "venceu (carência)",
    bloqueio: "último dia de acesso"
  };

  function renderAvisos() {
    var semEmail = avisos.some(function (a) { return a.canal === "sem_provedor"; });
    var alerta = semEmail
      ? '<p class="cfg-hint"><strong>Os e-mails não estão saindo.</strong> Falta ligar o provedor ' +
        "(secrets RESEND_API_KEY e EMAIL_REMETENTE). O aviso dentro do app funciona de qualquer jeito.</p>"
      : "";
    if (!avisos.length) {
      return alerta + '<p class="cfg-hint">Nenhum aviso nos últimos 30 dias — ninguém chegou perto de vencer.</p>';
    }
    return alerta + '<div class="cfg-convites">' + avisos.slice(0, 20).map(function (a) {
      return '<div class="cfg-convite">' +
        '<div class="cfg-toggle-txt"><strong>' + esc(a.nome || a.email) + "</strong>" +
          "<span>" + esc(AVISO_NOME[a.tipo] || a.tipo) +
          " · " + new Date(a.em).toLocaleDateString("pt-BR") + "</span></div>" +
        '<span class="cfg-badge ' + (a.ok ? "cfg-badge--on" : "cfg-badge--off") + '">' +
          (a.ok ? "enviado" : a.canal === "sem_provedor" ? "sem e-mail" : "falhou") + "</span>" +
      "</div>";
    }).join("") + "</div>";
  }

  var recentes = [];

  function renderRecentes() {
    if (!recentes.length) return '<p class="cfg-hint">Nenhum pagamento nos últimos 7 dias.</p>';
    return '<div class="cfg-convites">' + recentes.map(function (g) {
      return '<div class="cfg-convite">' +
        '<div class="cfg-toggle-txt"><strong>' + esc(g.nome || g.email) + " · " + reais(g.valor) + "</strong>" +
          "<span>" + esc(g.ciclo) + " · " + new Date(g.em).toLocaleDateString("pt-BR") +
          (g.comissao ? " · comissão " + reais(g.comissao) : "") + "</span></div>" +
        '<button class="btn btn--ghost btn--sm" type="button" data-action="reembolsou" data-nsu="' + esc(g.nsu) +
          '" data-nome="' + esc(g.nome || g.email || "") + '">Reembolsou</button>' +
      "</div>";
    }).join("") + "</div>";
  }

  function reembolsou(btn) {
    if (!confirm("Confirma que devolveu o pagamento de " + btn.getAttribute("data-nome") + "?")) return;
    busy(btn, true, "Registrando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("admin_reembolsou", { p_nsu: btn.getAttribute("data-nsu") });
    }).then(function (r) {
      if (!r || !r.data || !r.data.ok) throw new Error("falha");
      toast("Reembolso registrado");
      carregarEmbaixadoras();
    }).catch(function () {
      toast("Não foi possível registrar. Tente de novo.", true);
      busy(btn, false);
    });
  }

  function renderComissoes() {
    var devidas = embaixadoras.filter(function (e) { return e.a_pagar > 0; });
    if (!devidas.length) {
      var acum = embaixadoras.reduce(function (s, e) { return s + (e.acumulando || 0); }, 0);
      return '<p class="cfg-hint">Nada a pagar agora.' +
        (acum ? " Acumulando para o próximo pagamento: <strong>" + reais(acum) + "</strong>." : "") + "</p>";
    }
    return '<div class="cfg-convites">' + devidas.map(function (e) {
      return '<div class="cfg-convite">' +
        '<div class="cfg-toggle-txt"><strong>' + esc(e.nome || e.email) + " · " + reais(e.a_pagar) + "</strong>" +
          "<span>Pix: " + (e.pix ? "<code>" + esc(e.pix) + "</code>" : "sem chave cadastrada") + "</span></div>" +
        (e.pix ? '<button class="btn btn--ghost btn--sm" type="button" data-copy="' + esc(e.pix) + '">Copiar Pix</button>' : "") +
        '<button class="btn btn--primary btn--sm" type="button" data-action="comissao-paga" data-id="' + esc(e.id) +
          '" data-nome="' + esc(e.nome || "") + '" data-valor="' + esc(reais(e.a_pagar)) + '">Paguei</button>' +
      "</div>";
    }).join("") + "</div>";
  }

  function renderEmbaixadoras() {
    var form =
      '<div class="cfg-form">' +
        field("E-mail da conta dela", "emb-email", "", { type: "email", ph: "email@dela.com" }) +
        field("Cupom", "emb-cupom", "", { ph: "Ex.: JULIANUTRI" }) +
        field("Chave Pix", "emb-pix", "", { ph: "CPF, e-mail ou telefone" }) +
      "</div>" +
      '<div class="cfg-actions">' +
        '<button class="btn btn--primary" type="button" data-action="salvar-embaixadora">Salvar embaixadora</button>' +
        '<p class="cfg-hint">Antes de liberar, mande para ela o <a href="embaixadoras.html" target="_blank" rel="noopener">termo de parceria</a>.</p>' +
      "</div>" +
      '<p class="cfg-hint">Salvar de novo a mesma pessoa troca o cupom ou o Pix e renova mais 6 meses grátis.</p>';

    var lista = embaixadoras.length
      ? '<div class="cfg-convites">' + embaixadoras.map(function (e) {
          var ate = e.gratis_ate ? " · grátis até " + new Date(e.gratis_ate).toLocaleDateString("pt-BR") : "";
          return '<div class="cfg-convite">' +
            '<div class="cfg-toggle-txt"><strong>' + esc(e.nome || e.email) + " · " + esc(e.cupom) + "</strong>" +
              "<span>" + e.indicadas + " indicada" + (e.indicadas === 1 ? "" : "s") + ", " +
                e.pagantes + " já pag" + (e.pagantes === 1 ? "ou" : "aram") +
                " · recebeu " + reais(e.pago) + " · acumulando " + reais(e.acumulando) + esc(ate) + "</span></div>" +
            '<span class="cfg-badge ' + (e.ativa ? "cfg-badge--on" : "cfg-badge--off") + '">' +
              (e.ativa ? "ativa" : "encerrada") + "</span>" +
            '<button class="btn btn--ghost btn--sm" type="button" data-action="embaixadora-ativa" data-id="' + esc(e.id) +
              '" data-ativa="' + (e.ativa ? "0" : "1") + '">' + (e.ativa ? "Encerrar parceria" : "Reativar") + "</button>" +
          "</div>";
        }).join("") + "</div>"
      : '<p class="cfg-hint">Nenhuma embaixadora ainda.</p>';
    return form + lista;
  }

  function carregarEmbaixadoras() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      return Promise.all([c.rpc("admin_embaixadoras"), c.rpc("admin_pagamentos_recentes"),
                          c.rpc("admin_avisos_renovacao")]);
    })
      .then(function (rs) {
        var r = rs[0];
        if (r && r.error) throw r.error;
        embaixadoras = (r && r.data) || [];
        recentes = (rs[1] && rs[1].data) || [];
        avisos = (rs[2] && rs[2].data) || [];
        renderAdmin();
      }).catch(function () { /* migração 0096 ausente: os cards ficam vazios */ });
  }

  var MOTIVO_EMB = {
    sem_conta: "Não achei conta de nutricionista com esse e-mail. Ela precisa se cadastrar antes.",
    cupom_invalido: "O cupom precisa ter de 4 a 20 letras ou números.",
    cupom_em_uso: "Esse cupom já é de outra embaixadora.",
    nao_autorizado: "Só a administradora pode fazer isso."
  };

  function salvarEmbaixadora(btn) {
    var email = (el("emb-email").value || "").trim();
    var cupom = (el("emb-cupom").value || "").trim();
    if (!email || !cupom) { toast("Preencha o e-mail e o cupom.", true); return; }
    busy(btn, true, "Salvando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("admin_embaixadora_salvar", { p_email: email, p_cupom: cupom, p_pix: el("emb-pix").value || "" });
    }).then(function (r) {
      var d = r && r.data;
      if (!d || !d.ok) throw new Error(MOTIVO_EMB[d && d.motivo] || (r && r.error && r.error.message) || "falha");
      toast("Embaixadora salva com o cupom " + d.cupom);
      carregarEmbaixadoras();
    }).catch(function (e) {
      toast(e.message, true);
      busy(btn, false);
    });
  }

  function comissaoPaga(btn) {
    var nome = btn.getAttribute("data-nome") || "a embaixadora";
    if (!confirm("Confirma que fez o Pix de " + btn.getAttribute("data-valor") + " para " + nome + "?")) return;
    busy(btn, true, "Registrando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("admin_comissao_paga", { p_embaixadora: btn.getAttribute("data-id") });
    }).then(function (r) {
      var d = r && r.data;
      if (!d || !d.ok) throw new Error("falha");
      toast("Pagamento de " + reais(d.total) + " registrado");
      carregarEmbaixadoras();
    }).catch(function () {
      toast("Não foi possível registrar. Tente de novo.", true);
      busy(btn, false);
    });
  }

  function embaixadoraAtiva(btn) {
    var ativa = btn.getAttribute("data-ativa") === "1";
    if (!ativa && !confirm("Encerrar a parceria? O cupom para de funcionar e novas comissões deixam de ser lançadas.")) return;
    busy(btn, true, "Salvando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("admin_embaixadora_ativa", { p_id: btn.getAttribute("data-id"), p_ativa: ativa });
    }).then(function () {
      toast(ativa ? "Parceria reativada" : "Parceria encerrada");
      carregarEmbaixadoras();
    }).catch(function () { toast("Não foi possível salvar.", true); busy(btn, false); });
  }

  /* Aba "Minhas indicações": só aparece para quem é embaixadora. */
  function checkEmbaixadora() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) { return c.rpc("minhas_indicacoes"); })
      .then(function (r) {
        var d = r && r.data;
        if (!d || el("panel-indicacoes")) return;
        var tabs = el("cfg-tabs");
        var panels = document.querySelector(".cfg-panels");
        if (!tabs || !panels) return;
        var tab = document.createElement("button");
        tab.className = "cfg-tab"; tab.type = "button"; tab.setAttribute("data-tab", "indicacoes");
        tab.innerHTML = '<span class="cfg-tab__ico">🤝</span> Minhas indicações';
        tabs.appendChild(tab);
        var panel = document.createElement("section");
        panel.className = "cfg-panel"; panel.setAttribute("data-panel", "indicacoes"); panel.id = "panel-indicacoes";
        panels.appendChild(panel);

        var link = "https://app.nutrianaluisarocha.com/seja-indicada?cupom=" + encodeURIComponent(d.cupom);
        var ativas = d.indicadas.filter(function (i) { return i.ativa; }).length;
        var resumo =
          '<div class="cfg-convites">' +
            '<div class="cfg-convite"><div class="cfg-toggle-txt"><strong>Seu cupom: ' + esc(d.cupom) + "</strong>" +
              "<span>Quem assina com ele fica registrada como sua indicada.</span></div>" +
              '<button class="btn btn--ghost btn--sm" type="button" data-copy="' + esc(d.cupom) + '">Copiar cupom</button>' +
              '<button class="btn btn--primary btn--sm" type="button" data-copy="' + esc(link) + '">Copiar link</button></div>' +
            '<div class="cfg-convite"><div class="cfg-toggle-txt"><strong>A receber em ' + proximoDiaUtil() + ": " +
              reais(d.a_receber + d.acumulando) + "</strong>" +
              "<span>" + reais(d.a_receber) + " de meses anteriores + " + reais(d.acumulando) + " deste mês · já recebido: " +
              reais(d.recebido) + "</span></div></div>" +
            '<div class="cfg-convite"><div class="cfg-toggle-txt"><strong>' + d.indicadas.length + " indicada" +
              (d.indicadas.length === 1 ? "" : "s") + ", " + ativas + " com assinatura ativa</strong>" +
              "<span>Pix cadastrado: " + esc(d.pix || "nenhum — fale com a Ana") + "</span></div></div>" +
          "</div>";

        var lista = d.indicadas.length
          ? '<div class="cfg-convites">' + d.indicadas.map(function (i) {
              return '<div class="cfg-convite"><div class="cfg-toggle-txt"><strong>' + esc(i.nome || "Nutri") + "</strong>" +
                "<span>desde " + new Date(i.desde).toLocaleDateString("pt-BR") + " · " + i.pagamentos +
                " pagamento" + (i.pagamentos === 1 ? "" : "s") + " com comissão</span></div>" +
                '<span class="cfg-badge ' + (i.ativa ? "cfg-badge--on" : "cfg-badge--off") + '">' +
                (i.ativa ? "ativa" : "inativa") + "</span></div>";
            }).join("") + "</div>"
          : '<p class="cfg-hint">Ninguém usou seu cupom ainda. Mande o link para as colegas.</p>';

        panel.innerHTML =
          card("Seu programa de embaixadora",
            "Você recebe " + String(d.percentual).replace(".00", "") + "% de cada pagamento das nutris que assinaram com o seu cupom, por " +
            d.meses + " meses cada uma. O Pix cai no 1º dia útil do mês, referente ao que foi pago no mês anterior.", resumo) +
          card("Suas indicadas", "", lista);
      }).catch(function () { /* não é embaixadora */ });
  }

  /* ---------- Curadoria do diretório (0086) ----------
     A ficha de análise: tudo que a Ana precisa para decidir numa tela só —
     quem é, o que vai ao ar, e os links para conferir por fora. */
  var filaPerfis = [];

  function instaUrl(v) {
    v = String(v || "").trim().replace(/^@/, "");
    if (!v) return "";
    return /^https?:/i.test(v) ? v : "https://instagram.com/" + v;
  }
  function siteUrl(v) {
    v = String(v || "").trim();
    if (!v) return "";
    return /^https?:/i.test(v) ? v : "https://" + v;
  }

  function fichaPerfil(p) {
    var areas = Array.isArray(p.area_atuacao) ? p.area_atuacao : [];
    var pos = Array.isArray(p.pos_graduacao) ? p.pos_graduacao : [];
    var modos = [p.atende_online ? "Online" : "", p.atende_presencial ? "Presencial" : ""]
      .filter(Boolean).join(" e ");
    var preco = p.preco_consulta_cents
      ? "R$ " + (p.preco_consulta_cents / 100).toFixed(2).replace(".", ",") : "não informado";
    var ig = instaUrl(p.instagram), st = siteUrl(p.site);

    var formacao = [
      p.formacao || "",
      p.ano_formatura ? "formada em " + p.ano_formatura : "",
      p.atuacao_desde ? "atuando desde " + p.atuacao_desde : ""
    ].filter(Boolean).join(" · ") || "não informada";

    // O card como o paciente veria — a decisão é sobre isto, não sobre a linha da lista.
    var cardHTML =
      '<div class="adm-card">' +
        '<div class="adm-card__foto">' +
          (p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="" />' : '<span>?</span>') +
        '</div>' +
        '<div>' +
          '<div class="adm-card__nome">' + esc(p.nome || "(sem nome)") + '</div>' +
          '<div class="adm-card__meta">' +
            esc([p.crn, [p.cidade, p.estado].filter(Boolean).join(", ")].filter(Boolean).join(" · ")) + '<br />' +
            esc(areas.slice(0, 3).join(" · ")) + '<br />' +
            esc([modos, preco !== "não informado" ? "a partir de " + preco : ""].filter(Boolean).join(" · ")) +
          '</div>' +
          '<p class="adm-card__desc">' + esc(p.apresentacao || "(sem apresentação)") + '</p>' +
        '</div>' +
      '</div>';

    return '<div class="adm-ficha" data-ficha="' + esc(p.id) + '">' +
      cardHTML +
      '<dl class="adm-dl">' +
        '<dt>Formação</dt><dd>' + esc(formacao) + '</dd>' +
        (pos.length ? '<dt>Pós e cursos</dt><dd>' + esc(pos.join(", ")) + '</dd>' : "") +
        '<dt>Contato</dt><dd>' + esc(p.email || "") + (p.telefone ? " · " + esc(p.telefone) : "") + '</dd>' +
        '<dt>Presença</dt><dd>' +
          (ig ? '<a href="' + esc(ig) + '" target="_blank" rel="noopener">Instagram ↗</a>' : "") +
          (ig && st ? " · " : "") +
          (st ? '<a href="' + esc(st) + '" target="_blank" rel="noopener">Site ↗</a>' : "") +
          (!ig && !st ? "—" : "") +
        '</dd>' +
        (p.motivo_entrada ? '<dt>Motivo</dt><dd>' + esc(p.motivo_entrada) + '</dd>' : "") +
        '<dt>Endereço</dt><dd>/nutri/' + esc(p.slug || "—") + '</dd>' +
      '</dl>' +
      '<textarea class="field__input adm-nota" id="adm-nota-' + esc(p.id) + '" rows="2" ' +
        'placeholder="Anotação sua (opcional) — a nutri não vê.">' + esc(p.analise_observacao || "") + '</textarea>' +
      '<div class="cfg-actions">' +
        '<button class="btn btn--ghost" type="button" data-action="recusar-perfil" data-id="' + esc(p.id) + '" ' +
          'data-nome="' + esc(p.nome || "") + '">Recusar</button>' +
        '<button class="btn btn--primary" type="button" data-action="aprovar-perfil" data-id="' + esc(p.id) + '">Aprovar</button>' +
      '</div>' +
    '</div>';
  }

  function renderFilaPerfis() {
    if (!filaPerfis.length) {
      return '<p class="cfg-hint">Nenhum perfil esperando. Quando alguém enviar, aparece aqui.</p>';
    }
    return filaPerfis.map(fichaPerfil).join("");
  }

  /* ---------- Cadastros públicos da nutri (0091) ----------
     Outra fila, outro ato. Aqui se confere o REGISTRO de quem acabou de se
     inscrever em /seja-indicada; publicar o perfil continua sendo a fila de
     cima, e só acontece depois que ela completa foto e apresentação. */
  var filaCadastros = [];

  var PLANO_NOME = {
    plataforma: "NutriPlat (R$ 39,95 → R$ 79,90)"
  };

  function fichaCadastro(c) {
    var modos = [c.atende_online ? "Online" : "", c.atende_presencial ? "Presencial" : ""]
      .filter(Boolean).join(" e ");
    var esp = Array.isArray(c.especialidades) ? c.especialidades : [];
    var local = [c.cidade, c.estado].filter(Boolean).join(", ");
    var crnBusca = "https://www.google.com/search?q=" +
      encodeURIComponent('"' + (c.crn || "") + '" ' + (c.nome || "") + " nutricionista");

    return '<div class="adm-ficha" data-cad="' + esc(c.id) + '">' +
      '<div class="adm-card__nome">' + esc(c.nome) + '</div>' +
      '<dl class="adm-dl">' +
        '<dt>CRN</dt><dd>' + esc(c.crn || "—") +
          ' · <a href="' + esc(crnBusca) + '" target="_blank" rel="noopener">conferir ↗</a></dd>' +
        '<dt>Contato</dt><dd>' + esc(c.email) + (c.telefone ? " · " + esc(c.telefone) : "") + '</dd>' +
        '<dt>Atende</dt><dd>' + esc([modos, local].filter(Boolean).join(" · ") || "—") + '</dd>' +
        (esp.length ? '<dt>Especialidades</dt><dd>' + esc(esp.join(", ")) + '</dd>' : "") +
        (c.atuacao_desde ? '<dt>Atua desde</dt><dd>' + esc(c.atuacao_desde) + '</dd>' : "") +
        '<dt>Plano escolhido</dt><dd>' + esc(PLANO_NOME[c.plano_tier] || c.plano_tier) +
          ' · ' + esc(c.plano_ciclo) + '</dd>' +
        '<dt>Inscrita em</dt><dd>' + esc((c.criado_em || "").slice(0, 10)) +
          (c.email_enviado ? "" : " · <em>e-mail de confirmação não enviado</em>") + '</dd>' +
      '</dl>' +
      '<textarea class="field__input adm-nota" id="cad-nota-' + esc(c.id) + '" rows="2" ' +
        'placeholder="Anotação sua (opcional) — ela não vê.">' + esc(c.analise_obs || "") + '</textarea>' +
      '<div class="cfg-actions">' +
        '<button class="btn btn--ghost" type="button" data-action="recusar-cadastro" data-id="' + esc(c.id) + '">Recusar</button>' +
        '<button class="btn btn--primary" type="button" data-action="aprovar-cadastro" data-id="' + esc(c.id) + '">Registro conferido</button>' +
      '</div>' +
    '</div>';
  }

  function renderFilaCadastros() {
    if (!filaCadastros.length) {
      return '<p class="cfg-hint">Nenhum cadastro novo esperando.</p>';
    }
    return filaCadastros.map(fichaCadastro).join("");
  }

  function carregarFilaCadastros() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      return c.from("nutri_cadastros")
        .select("id,nome,email,telefone,crn,cidade,estado,atende_online,atende_presencial," +
                "especialidades,atuacao_desde,plano_tier,plano_ciclo,analise_obs,email_enviado,criado_em")
        .eq("status", "pendente")
        .order("criado_em", { ascending: false });
    }).then(function (res) {
      if (res && res.error) throw res.error;
      filaCadastros = (res && res.data) || [];
      renderAdmin();
    }).catch(function () { /* migração ainda não aplicada: a fila só não aparece */ });
  }

  function decidirCadastro(btn, status, rotulo) {
    var id = btn.getAttribute("data-id"); if (!id) return;
    var nota = el("cad-nota-" + id);
    busy(btn, true, rotulo + "…");
    window.NutriDBReady.then(function (c) {
      return c.from("nutri_cadastros").update({
        status: status,
        analise_obs: (nota && nota.value.trim()) || null,
        analisado_em: new Date().toISOString()
      }).eq("id", id);
    }).then(function (res) {
      if (res && res.error) throw new Error(res.error.message || "falha");
      toast(status === "aprovado"
        ? "Registro conferido — ela já pode enviar o perfil para publicação"
        : "Cadastro recusado");
      carregarFilaCadastros();
    }).catch(function (e) {
      toast("Não foi possível salvar. " + ((e && e.message) || ""), true);
      busy(btn, false);
    });
  }

  function carregarFilaPerfis() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      return c.from("profiles")
        .select("id,nome,email,telefone,crn,cidade,estado,avatar_url,apresentacao,area_atuacao," +
                "atende_online,atende_presencial,preco_consulta_cents,slug,instagram,site," +
                "formacao,ano_formatura,pos_graduacao,atuacao_desde,motivo_entrada,analise_observacao")
        .eq("perfil_status", "em_analise")
        .order("nome");
    }).then(function (res) {
      if (res && res.error) throw res.error;
      filaPerfis = (res && res.data) || [];
      renderAdmin();
    }).catch(function () { /* migração ainda não aplicada: a fila só não aparece */ });
  }

  function aprovarPerfil(btn) {
    var id = btn.getAttribute("data-id"); if (!id) return;
    var nota = el("adm-nota-" + id);
    busy(btn, true, "Aprovando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("aprovar_perfil", { p_id: id, p_observacao: (nota && nota.value.trim()) || null });
    }).then(function (res) {
      if (res && res.error) throw new Error(res.error.message || "falha");
      toast("Perfil aprovado — já está na busca");
      carregarFilaPerfis();
    }).catch(function (e) {
      toast("Não foi possível aprovar. " + ((e && e.message) || ""), true);
      busy(btn, false);
    });
  }

  function recusarPerfil(btn) {
    var id = btn.getAttribute("data-id"); if (!id) return;
    var nome = btn.getAttribute("data-nome") || "esta nutricionista";
    // O motivo volta na tela dela, com o perfil reaberto para correção.
    var motivo = prompt("O que " + nome + " precisa ajustar?\n\nEla lê este texto na tela dela.");
    if (motivo === null) return;
    if (!motivo.trim()) { toast("Escreva o motivo — é o que ela vai corrigir.", true); return; }
    busy(btn, true, "Enviando…");
    window.NutriDBReady.then(function (c) {
      return c.rpc("recusar_perfil", { p_id: id, p_motivo: motivo.trim() });
    }).then(function (res) {
      if (res && res.error) throw new Error(res.error.message || "falha");
      toast("Recusado — ela recebe o motivo na tela dela");
      carregarFilaPerfis();
    }).catch(function (e) {
      toast("Não foi possível recusar. " + ((e && e.message) || ""), true);
      busy(btn, false);
    });
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

  function ativarAssinatura(btn) {
    if (!window.NutriDBReady) { toast("Banco indisponível.", true); return; }
    var email = (val("act-email") || "").trim().toLowerCase();
    var meses = parseInt(val("act-meses"), 10) || 1;
    if (!/.+@.+\..+/.test(email)) { toast("E-mail inválido.", true); return; }
    busy(btn, true, "Ativando…");
    window.NutriDBReady.then(function (c) {
      return c.functions.invoke("ativar-assinatura-admin", { body: { email: email, meses: meses } });
    }).then(function (res) {
      if (res.error) {
        if (res.error.context && res.error.context.json) {
          return res.error.context.json().then(function (b) { throw new Error(b && b.error || "falha"); });
        }
        throw new Error("falha");
      }
      var d = res.data || {};
      if (d.error) throw new Error(d.error);
      var box = el("act-result");
      var ate = d.expira_em ? new Date(d.expira_em).toLocaleDateString("pt-BR") : "";
      if (box) box.innerHTML = '<div class="cfg-cred"><p class="cfg-cred__title">✅ Assinatura ativa para ' +
        esc(email) + (ate ? ' até <strong>' + esc(ate) + '</strong>' : '') + '.</p></div>';
      var e = el("act-email"); if (e) e.value = "";
      toast("Assinatura liberada!");
    }).catch(function (e) {
      var m = (e && e.message) || "";
      var amig = m === "conta_nao_encontrada" ? "Não achei uma conta com esse e-mail. Convide a nutri primeiro."
        : m === "conta_e_paciente" ? "Esse e-mail é de um paciente, não de uma nutri."
        : m === "nao_autorizado" ? "Só a administradora pode fazer isso."
        : m === "email_invalido" ? "E-mail inválido."
        : "Não foi possível ativar. " + m;
      toast(amig, true);
    }).then(function () { busy(btn, false); });
  }

  /* Pausar/reativar o acesso de uma nutri direto na lista.
     "Pausar" grava assinatura_status='cancelada' (o domínio da coluna só
     admite trial/ativa/vencida/cancelada) — nada é apagado, os dados dela
     continuam lá e um "Reativar" devolve o acesso. */
  function mudarAcesso(btn, pausar) {
    if (!window.NutriDBReady) { toast("Banco indisponível.", true); return; }
    var email = (btn.getAttribute("data-email") || "").trim().toLowerCase();
    if (!email) return;
    if (pausar && !confirm("Pausar o acesso de " + email + "?\n\nEla não consegue mais entrar até você reativar. Nenhum dado é apagado.")) return;
    busy(btn, true, pausar ? "Pausando…" : "Reativando…");
    window.NutriDBReady.then(function (c) {
      return c.functions.invoke("ativar-assinatura-admin", {
        body: pausar ? { email: email, acao: "pausar" } : { email: email, meses: 1 }
      });
    }).then(function (res) {
      if (res.error) {
        if (res.error.context && res.error.context.json) {
          return res.error.context.json().then(function (b) { throw new Error(b && b.error || "falha"); });
        }
        throw new Error("falha");
      }
      var d = res.data || {};
      if (d.error) throw new Error(d.error);
      toast(pausar ? "Acesso pausado." : "Acesso reativado por 1 mês.");
      carregarConvites();
    }).catch(function (e) {
      var m = (e && e.message) || "";
      busy(btn, false);
      toast(m === "nao_pause_a_si" ? "Você não pode pausar o próprio acesso."
        : m === "conta_nao_encontrada" ? "Não achei uma conta com esse e-mail."
        : m === "nao_autorizado" ? "Só a administradora pode fazer isso."
        : "Não foi possível concluir. " + m, true);
    });
  }

  function pausarAssinatura(btn) { mudarAcesso(btn, true); }
  function reativarAssinatura(btn) { mudarAcesso(btn, false); }

  /* Gera uma senha nova para uma nutri que perdeu a dela. Existe porque o
     "Esqueci minha senha" ainda dispara o e-mail em inglês do supabase.io —
     enquanto isso, quem repassa a senha é a admin. A senha antiga para de
     valer na hora. */
  function novaSenha(btn) {
    if (!window.NutriDBReady) { toast("Banco indisponível.", true); return; }
    var email = (btn.getAttribute("data-email") || "").trim().toLowerCase();
    var nome = (btn.getAttribute("data-nome") || "").trim() || "tudo bem";
    if (!email) return;
    if (!confirm("Gerar uma senha nova para " + email + "?\n\nA senha atual dela para de funcionar na hora. Nenhum dado é apagado.")) return;
    busy(btn, true, "Gerando…");
    window.NutriDBReady.then(function (c) {
      return c.functions.invoke("create-nutri-access", { body: { email: email, reset: true } });
    }).then(function (res) {
      if (res.error) {
        if (res.error.context && res.error.context.json) {
          return res.error.context.json().then(function (b) { throw new Error(b && b.error || "falha"); });
        }
        throw new Error("falha");
      }
      var d = res.data || {};
      if (d.error) throw new Error(d.error);
      mostrarCredenciais(nome, d.email, d.senha, true);
      var box = el("adm-result");
      if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("Senha nova gerada!");
    }).catch(function (e) {
      var m = (e && e.message) || "";
      toast(m === "conta_nao_encontrada" ? "Não achei uma conta com esse e-mail."
        : m === "alvo_admin" ? "Não dá para trocar a senha de outra administradora por aqui."
        : m === "nao_autorizado" ? "Só a administradora pode fazer isso."
        : "Não foi possível gerar a senha. " + m, true);
    }).then(function () { busy(btn, false); });
  }

  function mostrarCredenciais(nome, email, senha, reset) {
    var box = el("adm-result");
    if (!box) return;
    // /entrar é o espelho do login com a prévia da PLATAFORMA. O "/" cru
    // mostraria no WhatsApp o card do portal do paciente — errado pra nutri.
    var login = location.origin + "/entrar";
    var msg = reset
      ? "Oi, " + nome + "! Gerei uma senha nova pra você 💚\n\n" +
        "Entre em: " + login + "\n" +
        "E-mail: " + email + "\n" +
        "Senha: " + senha + "\n\n" +
        "Assim que entrar, troque por uma senha sua em Configurações → Senha."
      : "Oi, " + nome + "! Criei seu acesso à plataforma 💚\n\n" +
        "Entre em: " + login + "\n" +
        "E-mail: " + email + "\n" +
        "Senha: " + senha + "\n\n" +
        "É só entrar e, se quiser, trocar a senha em Configurações.";
    box.innerHTML =
      '<div class="cfg-cred">' +
        '<p class="cfg-cred__title">' +
          (reset ? "🔑 Senha nova gerada. Envie estes dados para ela:"
                 : "✅ Acesso criado. Envie estes dados para ela:") + '</p>' +
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
      return Promise.all([
        c.from("nutri_convites").select("nome,email,status,created_at").order("created_at", { ascending: false }),
        // o estado real da assinatura não está visível por RLS: vem da function
        c.functions.invoke("ativar-assinatura-admin", { body: { acao: "listar" } })
          .catch(function () { return {}; })
      ]);
    }).then(function (r) {
      convites = (r[0] && r[0].data) || [];
      nutris = {};
      var lista = (r[1] && r[1].data && r[1].data.nutris) || [];
      lista.forEach(function (n) { if (n.email) nutris[String(n.email).toLowerCase()] = n; });
      renderAdmin();
    }).catch(function () { /* silencioso */ });
  }

  // Se o usuário é admin, injeta a aba + painel Admin e carrega os convites.
  function checkAdmin() {
    if (!window.NutriDBReady) return;
    window.NutriDBReady.then(function (c) {
      // O .eq(id) não é enfeite: quem é admin enxerga TODOS os perfis pela
      // policy de curadoria, e aí o maybeSingle() sem filtro devolve
      // "multiple rows returned" — a aba Admin sumia justamente para o admin.
      return c.auth.getUser().then(function (u) {
        var uid = u && u.data && u.data.user && u.data.user.id;
        if (!uid) return { data: null };
        return c.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
      });
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
      carregarFilaPerfis();
      carregarFilaCadastros();
      carregarEmbaixadoras();
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
    window.confirmarExclusao({
      titulo: "Apagar DEFINITIVAMENTE a sua conta?",
      texto: "Saem todos os dados: perfil, pacientes, prontuários, consultas, financeiro e os acessos de portal.\n" +
        "Antes, use Exportar meus dados para guardar uma cópia.",
      botao: "Apagar minha conta"
    }).then(function (ok) { if (ok) apagarConta(btn); });
  }
  function apagarConta(btn) {
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
    "exportar-dados": exportarDados, "excluir-conta": excluirConta,
    "ativar-assinatura": ativarAssinatura,
    "pausar-assinatura": pausarAssinatura, "reativar-assinatura": reativarAssinatura,
    "nova-senha": novaSenha,
    "salvar-embaixadora": salvarEmbaixadora, "comissao-paga": comissaoPaga, "reembolsou": reembolsou, "embaixadora-ativa": embaixadoraAtiva,
    "aprovar-perfil": aprovarPerfil, "recusar-perfil": recusarPerfil,
    "aprovar-cadastro": function (b) { decidirCadastro(b, "aprovado", "Salvando"); },
    "recusar-cadastro": function (b) { decidirCadastro(b, "recusado", "Salvando"); } };

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
    if (!db()) { toast("Banco indisponível.", true); return; }
    var btn = el("btn-foto");
    // Com o ajuste carregado, a pessoa enquadra o rosto antes de salvar.
    var pronto = window.FotoUpload ? window.FotoUpload.ler(file) : processarFoto(file);
    pronto.then(function (dataUrl) {
      busy(btn, true, "Enviando…");
      return db().update({ avatarUrl: dataUrl });
    }).then(function (p) {
      perfil = p; renderPerfil();
      toast("Foto atualizada");
    }).catch(function (e) {
      if (e && e.message === "cancelado") return;
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
        // Nenhum outro conector existe ainda. O card desses vem desabilitado
        // ("Em breve"); se um dia chegar aqui, não finge que conectou.
        if (item) toast(item.nome + " ainda não está disponível.");
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
    checkEmbaixadora(); // aba "Minhas indicações" só para embaixadora
    checkAdmin();     // injeta a aba Admin se a pessoa for administradora
  }

  document.addEventListener("DOMContentLoaded", init);
})();
