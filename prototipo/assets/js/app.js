/* ============================================================
   APP — nome da marca, login (Entrar / Criar conta), modal de
   personalização e navegação para o dashboard.
   ============================================================ */
(function () {
  "use strict";

  /* ▼▼▼ TROCAR O NOME DA PLATAFORMA AQUI (único lugar) ▼▼▼ */
  var BRAND = "NutriPlat";
  /* ▲▲▲ ----------------------------------------------- ▲▲▲ */

  document.addEventListener("DOMContentLoaded", function () {
    // Injeta o nome da marca em todo lugar marcado com [data-brand]
    document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = BRAND; });
    var titleEl = document.querySelector("[data-brand-title]");
    if (titleEl) titleEl.textContent = BRAND + " · Plataforma para Nutricionistas";

    /* ---------- Login: revelar formulário inline ---------- */
    var form = document.getElementById("auth-form");
    if (!form) return; // página sem login (ex.: dashboard) — só injeta a marca acima

    var btnEntrar = document.getElementById("btn-entrar");
    var btnCriar = document.getElementById("btn-criar");
    var btnVoltar = document.getElementById("auth-back");
    var fieldNome = document.getElementById("field-nome");
    var submit = document.getElementById("auth-submit");
    var buttonsWrap = document.querySelector(".auth__buttons");
    var recoveryMode = false;   // true enquanto o usuário está redefinindo a senha via link do e-mail
    var confirmField = null;    // campo "confirmar nova senha" injetado no modo recovery

    /* ---------- Mensagens (erro/aviso) do formulário ---------- */
    var msg = document.createElement("p");
    msg.className = "auth-form__msg";
    msg.hidden = true;
    form.insertBefore(msg, submit);
    function showMsg(text, kind) {
      msg.textContent = text;
      msg.dataset.kind = kind || "error";
      msg.hidden = false;
    }
    function clearMsg() { msg.hidden = true; }
    var submitLabel = submit.textContent;
    function setBusy(busy) {
      submit.disabled = busy;
      submit.textContent = busy ? "Aguarde…" : submitLabel;
    }
    function translateAuthError(err) {
      var m = (err && err.message) || "";
      if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
      if (/user already registered|already been registered/i.test(m)) return "Este e-mail já tem conta. Faça login.";
      if (/password should be at least/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
      if (/different from the old|should be different/i.test(m)) return "A nova senha precisa ser diferente da anterior.";
      if (/same_password/i.test(m)) return "A nova senha precisa ser diferente da anterior.";
      if (/email.*invalid|invalid.*email/i.test(m)) return "E-mail inválido.";
      if (/offline|carregar supabase/i.test(m)) return "Sem conexão com o servidor. Verifique sua internet.";
      return m || "Não foi possível autenticar. Tente novamente.";
    }
    function localFlag(k) { try { return localStorage.getItem(k) === "1"; } catch (e) { return false; } }
    function setLocalFlag(k) { try { localStorage.setItem(k, "1"); } catch (e) {} }

    function openForm(mode) {
      var criar = mode === "criar";
      if (fieldNome) fieldNome.hidden = !criar; // campo de nome só existe se o signup for reativado
      submitLabel = criar ? "Criar minha conta" : "Entrar na plataforma";
      submit.textContent = submitLabel;
      clearMsg();
      form.classList.add("is-open");
      buttonsWrap.style.display = "none";
      var focusar = (criar && fieldNome) ? document.getElementById("nome") : document.getElementById("email");
      if (focusar) focusar.focus();
    }
    function closeForm() {
      form.classList.remove("is-open");
      buttonsWrap.style.display = "";
      clearMsg();
    }

    btnEntrar.addEventListener("click", function () { openForm("entrar"); });
    btnCriar.addEventListener("click", function () { openForm("criar"); });
    btnVoltar.addEventListener("click", closeForm);

    /* ---------- Submit: login / criação de conta REAIS (Supabase) ---------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearMsg();
      if (recoveryMode) { handleRecoverySubmit(); return; }
      var criar = fieldNome ? !fieldNome.hidden : false;
      var email = document.getElementById("email").value.trim();
      var senha = document.getElementById("senha").value;
      var nomeEl = document.getElementById("nome");
      var nome = nomeEl ? nomeEl.value.trim() : "";

      if (!email || !senha) { showMsg("Preencha e-mail e senha."); return; }
      if (criar && !nome) { showMsg("Informe seu nome."); return; }

      setBusy(true);
      window.NutriDBReady.then(function (c) {
        if (criar) {
          return c.auth.signUp({
            email: email, password: senha, options: { data: { nome: nome } }
          }).then(function (res) {
            if (res.error) throw res.error;
            if (!res.data.session) {
              // Confirmação de e-mail exigida (não veio sessão).
              setBusy(false);
              showMsg("Conta criada! Confirme pelo link enviado ao seu e-mail e depois faça login.", "info");
              return null;
            }
            return afterAuth(c);
          });
        }
        return c.auth.signInWithPassword({ email: email, password: senha })
          .then(function (res) {
            if (res.error) throw res.error;
            return afterAuth(c);
          });
      }).catch(function (err) {
        setBusy(false);
        showMsg(translateAuthError(err));
      });
    });

    // Decide destino após autenticar. Paciente -> portal; nutri -> 1º acesso (personalização) ou dashboard.
    // Exceção: ?next=pagina.html (ex.: vindo do "acessar minha biblioteca") tem prioridade p/ qualquer tipo.
    function afterAuth(c) {
      var next = new URLSearchParams(location.search).get("next");
      if (next && /^[a-z0-9-]+\.html$/i.test(next)) { window.location.href = next; return Promise.resolve(); }
      return c.from("profiles").select("onboarded,tipo").maybeSingle().then(function (res) {
        var tipo = (res.data && res.data.tipo) || "nutri";
        if (tipo === "paciente") { window.location.href = "portal-paciente.html"; return; }
        // Considera "já respondeu" por QUALQUER sinal confiável: perfil no banco,
        // flag local deste device, ou áreas já salvas localmente. Assim o modal
        // não reaparece a cada login mesmo que a gravação no banco tenha falhado.
        var dbOnboarded = !!(res.data && res.data.onboarded);
        var onboarded = dbOnboarded || localFlag("nutri_onboarded") ||
                        (window.Personalize && window.Personalize.hasOnboarded());
        if (dbOnboarded) setLocalFlag("nutri_onboarded"); // memoriza p/ logins futuros
        if (!onboarded) { setBusy(false); openPersonalize(); }
        else { goToDashboard(); }
      });
    }

    /* ---------- Esqueci minha senha ---------- */
    var linkEsqueci = document.getElementById("link-esqueci");
    if (linkEsqueci) {
      linkEsqueci.addEventListener("click", function (e) {
        e.preventDefault();
        var email = document.getElementById("email").value.trim();
        if (!email) { showMsg("Digite seu e-mail acima para receber o link de redefinição."); return; }
        window.NutriDBReady.then(function (c) {
          // O link de recuperação volta para ESTA página; o hash é tratado em enterRecovery().
          return c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        }).then(function () {
          showMsg("Enviamos um link de redefinição para o seu e-mail.", "info");
        }).catch(function (err) { showMsg(translateAuthError(err)); });
      });
    }

    /* ---------- Redefinição de senha (retorno do link do e-mail) ----------
       O Supabase manda de volta com #access_token=…&type=recovery no hash.
       Como detectSessionInUrl=false, tratamos manualmente: abrimos a sessão
       do link e trocamos o formulário para o modo "nova senha". */
    function parseHash() {
      var out = {};
      (location.hash.replace(/^#/, "")).split("&").forEach(function (kv) {
        var i = kv.indexOf("=");
        if (i > 0) out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
      });
      return out;
    }

    function enterRecovery() {
      recoveryMode = true;
      openForm("entrar");                    // revela o formulário
      if (fieldNome) fieldNome.hidden = true;
      document.getElementById("email").closest(".field").hidden = true;
      var row = form.querySelector(".auth-form__row"); if (row) row.hidden = true;
      var backWrap = form.querySelector(".auth-form__back-wrap"); if (backWrap) backWrap.hidden = true;
      var lbl = form.querySelector('label[for="senha"]'); if (lbl) lbl.textContent = "Nova senha";
      var senhaInput = document.getElementById("senha");
      senhaInput.value = ""; senhaInput.placeholder = "Nova senha (mín. 6 caracteres)";
      if (!confirmField) {
        confirmField = document.createElement("div");
        confirmField.className = "field";
        confirmField.innerHTML = '<label class="field__label" for="senha2">Confirmar nova senha</label>' +
          '<input class="field__input" id="senha2" type="password" placeholder="Repita a nova senha" />';
        var senhaField = senhaInput.closest(".field");
        senhaField.parentNode.insertBefore(confirmField, senhaField.nextSibling);
      }
      submitLabel = "Salvar nova senha";
      submit.textContent = submitLabel;
      showMsg("Defina uma nova senha para a sua conta.", "info");
      senhaInput.focus();
    }

    function handleRecoverySubmit() {
      var s1 = document.getElementById("senha").value;
      var s2 = (document.getElementById("senha2") || {}).value || "";
      if (s1.length < 6) { showMsg("A nova senha precisa ter pelo menos 6 caracteres."); return; }
      if (s1 !== s2) { showMsg("As senhas não conferem."); return; }
      setBusy(true);
      window.NutriDBReady.then(function (c) {
        return c.auth.updateUser({ password: s1 }).then(function (res) {
          if (res.error) throw res.error;
          recoveryMode = false;
          history.replaceState(null, "", location.pathname + location.search); // limpa o token do hash
          return afterAuth(c);            // já está logado com a sessão do link → entra direto
        });
      }).catch(function (err) { setBusy(false); showMsg(translateAuthError(err)); });
    }

    var hashParams = parseHash();
    if (hashParams.type === "recovery" && hashParams.access_token) {
      window.NutriDBReady.then(function (c) {
        return c.auth.setSession({
          access_token: hashParams.access_token,
          refresh_token: hashParams.refresh_token
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        enterRecovery();
      }).catch(function () {
        showMsg("Link de redefinição inválido ou expirado. Solicite um novo em \"Esqueci minha senha\".");
      });
    } else if (hashParams.error) {
      showMsg("Link inválido ou expirado. Solicite um novo em \"Esqueci minha senha\".");
    }

    /* ---------- Modal de personalização ---------- */
    var overlay = document.getElementById("modal-overlay");
    var optGrid = document.getElementById("opt-grid");
    var save = document.getElementById("save-personalize");
    var skip = document.getElementById("skip-personalize");

    function openPersonalize() {
      window.Personalize.renderOptions(optGrid);
      overlay.classList.add("is-open");
    }
    function closePersonalize() { overlay.classList.remove("is-open"); }

    // Persiste onboarding no perfil (RLS garante que só o próprio usuário grava).
    function persistOnboarding(selected) {
      return window.NutriDBReady.then(function (c) {
        return c.auth.getUser().then(function (u) {
          if (!u.data.user) return;
          // upsert (não update) para gravar mesmo que a linha de perfil ainda
          // não exista — garante que onboarded=true persista no banco.
          return c.from("profiles")
            .upsert(
              { id: u.data.user.id, especialidades: selected, onboarded: true },
              { onConflict: "id" }
            );
        });
      }).catch(function () { /* offline: mantém só o localStorage */ });
    }

    // IMPORTANTE: aguardar o persistOnboarding ANTES de navegar — se redirecionar
    // antes, o PATCH assíncrono é cancelado e onboarded nunca vira true (modal
    // reaparecia a cada login). O localFlag garante que não repita neste device.
    save.addEventListener("click", function () {
      var selected = window.Personalize.readSelected(optGrid);
      window.Personalize.save(selected);
      if (window.Feed) window.Feed.rebuild(); // reordena o feed pela preferência
      setLocalFlag("nutri_onboarded");
      save.disabled = true;
      persistOnboarding(selected).then(function () { closePersonalize(); goToDashboard(); });
    });
    skip.addEventListener("click", function () {
      window.Personalize.save([]); // marca onboarding como feito (lista vazia)
      setLocalFlag("nutri_onboarded");
      skip.disabled = true;
      persistOnboarding([]).then(function () { closePersonalize(); goToDashboard(); });
    });
    // Fechar clicando fora conta como "Pular": registra o onboarding e segue
    // para o dashboard — nunca deixa a pessoa presa nem faz o modal reaparecer.
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        window.Personalize.save([]);
        setLocalFlag("nutri_onboarded");
        persistOnboarding([]).then(function () { closePersonalize(); goToDashboard(); });
      }
    });

    /* ---------- Navegação ---------- */
    function goToDashboard(delay) {
      setTimeout(function () { window.location.href = "dashboard.html"; }, delay || 0);
    }
  });
})();
