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

    function openForm(mode) {
      var criar = mode === "criar";
      fieldNome.hidden = !criar;
      submit.textContent = criar ? "Criar minha conta" : "Entrar na plataforma";
      form.classList.add("is-open");
      buttonsWrap.style.display = "none";
      (criar ? document.getElementById("nome") : document.getElementById("email")).focus();
    }
    function closeForm() {
      form.classList.remove("is-open");
      buttonsWrap.style.display = "";
    }

    btnEntrar.addEventListener("click", function () { openForm("entrar"); });
    btnCriar.addEventListener("click", function () { openForm("criar"); });
    btnVoltar.addEventListener("click", closeForm);

    /* ---------- Submit: 1º acesso abre personalização ---------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (window.Personalize && !window.Personalize.hasOnboarded()) {
        openPersonalize();
      } else {
        goToDashboard();
      }
    });

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

    save.addEventListener("click", function () {
      var selected = window.Personalize.readSelected(optGrid);
      window.Personalize.save(selected);
      if (window.Feed) window.Feed.rebuild(); // reordena o feed pela preferência
      closePersonalize();
      goToDashboard(600); // pequeno delay para o usuário ver o feed reordenar
    });
    skip.addEventListener("click", function () {
      window.Personalize.save([]); // marca onboarding como feito (lista vazia)
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
