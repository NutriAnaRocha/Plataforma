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
      if (/email.*invalid|invalid.*email/i.test(m)) return "E-mail inválido.";
      if (/offline|carregar supabase/i.test(m)) return "Sem conexão com o servidor. Verifique sua internet.";
      return m || "Não foi possível autenticar. Tente novamente.";
    }

    function openForm(mode) {
      var criar = mode === "criar";
      fieldNome.hidden = !criar;
      submitLabel = criar ? "Criar minha conta" : "Entrar na plataforma";
      submit.textContent = submitLabel;
      clearMsg();
      form.classList.add("is-open");
      buttonsWrap.style.display = "none";
      (criar ? document.getElementById("nome") : document.getElementById("email")).focus();
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
      var criar = !fieldNome.hidden;
      var email = document.getElementById("email").value.trim();
      var senha = document.getElementById("senha").value;
      var nome = document.getElementById("nome").value.trim();

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

    // Decide destino após autenticar: 1º acesso -> personalização; senão -> dashboard.
    function afterAuth(c) {
      return c.from("profiles").select("onboarded").maybeSingle().then(function (res) {
        var onboarded = res.data && res.data.onboarded;
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
          return c.auth.resetPasswordForEmail(email);
        }).then(function () {
          showMsg("Enviamos um link de redefinição para o seu e-mail.", "info");
        }).catch(function (err) { showMsg(translateAuthError(err)); });
      });
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
          return c.from("profiles")
            .update({ especialidades: selected, onboarded: true })
            .eq("id", u.data.user.id);
        });
      }).catch(function () { /* offline: mantém só o localStorage */ });
    }

    save.addEventListener("click", function () {
      var selected = window.Personalize.readSelected(optGrid);
      window.Personalize.save(selected);
      if (window.Feed) window.Feed.rebuild(); // reordena o feed pela preferência
      persistOnboarding(selected);
      closePersonalize();
      goToDashboard(600); // pequeno delay para o usuário ver o feed reordenar
    });
    skip.addEventListener("click", function () {
      window.Personalize.save([]); // marca onboarding como feito (lista vazia)
      persistOnboarding([]);
      closePersonalize();
      goToDashboard();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePersonalize();
    });

    /* ---------- Navegação ---------- */
    function goToDashboard(delay) {
      setTimeout(function () { window.location.href = "dashboard.html"; }, delay || 0);
    }
  });
})();
