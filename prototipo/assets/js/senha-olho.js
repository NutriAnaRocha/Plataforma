/* ==========================================================================
   senha-olho.js — botão de "olhinho" em todo campo de senha
   Vale pro login (nutri e paciente), "nova senha" do link de recuperação e
   os cadastros públicos. Observa o DOM porque vários campos são desenhados
   por JS depois do carregamento (senha2, cp-senha, cn-senha).
   ========================================================================== */
(function () {
  "use strict";

  var OLHO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var OLHO_FECHADO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M2 2l20 20"/></svg>';

  var css =
    ".senha-olho{position:relative;display:block}" +
    ".senha-olho>input{width:100%;padding-right:44px !important;box-sizing:border-box}" +
    ".senha-olho__btn{position:absolute;top:50%;right:6px;transform:translateY(-50%);" +
    "width:34px;height:34px;display:flex;align-items:center;justify-content:center;" +
    "border:0;background:transparent;color:inherit;opacity:.6;cursor:pointer;border-radius:8px;padding:0}" +
    ".senha-olho__btn:hover,.senha-olho__btn:focus-visible{opacity:1}" +
    ".senha-olho__btn:focus-visible{outline:2px solid currentColor;outline-offset:1px}" +
    "input::-ms-reveal,input::-ms-clear{display:none}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function aplicar(input) {
    if (input.dataset.olho) return;
    input.dataset.olho = "1";

    var wrap = document.createElement("span");
    wrap.className = "senha-olho";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "senha-olho__btn";
    btn.setAttribute("aria-label", "Mostrar senha");
    btn.innerHTML = OLHO;
    btn.addEventListener("click", function () {
      var mostrar = input.type === "password";
      input.type = mostrar ? "text" : "password";
      btn.innerHTML = mostrar ? OLHO_FECHADO : OLHO;
      btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      input.focus();
    });
    wrap.appendChild(btn);
  }

  function varrer(raiz) {
    if (!raiz.querySelectorAll) return;
    if (raiz.matches && raiz.matches('input[type="password"]')) aplicar(raiz);
    raiz.querySelectorAll('input[type="password"]').forEach(aplicar);
  }

  function iniciar() {
    varrer(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { m.addedNodes.forEach(varrer); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
