/* ============================================================
   CONFIRMAR EXCLUSÃO — segunda linha de checagem antes de apagar.

   Um "OK" do window.confirm sai no reflexo: foi assim que uma
   avaliação se perdeu. Aqui a exclusão só libera depois que a pessoa
   DIGITA a palavra-chave (APAGAR). Enter não confirma enquanto a
   palavra não bate; Esc, o X e o fundo cancelam.

   Uso:
     confirmarExclusao({
       titulo: "Apagar a avaliação de 12/08/2026?",
       texto:  "O ponto sai do gráfico de evolução.",   // opcional
       botao:  "Apagar avaliação"                       // opcional
     }).then(function (ok) { if (!ok) return; ... });

   Devolve Promise<boolean>. Sem DOM (teste), cai no window.confirm.
   Exposto como window.confirmarExclusao. Estilo próprio, injetado
   uma vez: funciona em qualquer página, com ou sem style.css.
   ============================================================ */
(function () {
  "use strict";

  var PALAVRA = "APAGAR";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // "apagar", " Apagar " e "APAGÁR" contam; o que importa é a intenção.
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();
  }

  var CSS =
    ".cx-ov{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;" +
      "padding:16px;background:rgba(30,20,28,.55);animation:cx-in .15s ease-out}" +
    ".cx-box{background:#fff;color:#3C3C3C;width:100%;max-width:440px;border-radius:16px;" +
      "box-shadow:0 20px 50px rgba(0,0,0,.25);padding:24px;font-family:inherit;position:relative}" +
    ".cx-x{position:absolute;top:10px;right:12px;border:0;background:none;font-size:20px;line-height:1;" +
      "color:#888;cursor:pointer;padding:6px}" +
    ".cx-ico{width:44px;height:44px;border-radius:50%;background:#FDECEC;color:#B42318;display:flex;" +
      "align-items:center;justify-content:center;font-size:22px;margin-bottom:12px}" +
    ".cx-tit{font-size:18px;font-weight:700;margin:0 0 6px;line-height:1.3}" +
    ".cx-txt{font-size:14px;margin:0 0 8px;color:#555;line-height:1.5;white-space:pre-line}" +
    ".cx-aviso{font-size:13px;margin:0 0 16px;color:#B42318;font-weight:600}" +
    ".cx-lbl{display:block;font-size:13px;margin-bottom:6px;color:#3C3C3C}" +
    ".cx-lbl b{letter-spacing:1px;color:#B42318}" +
    ".cx-inp{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid #D0D0D0;" +
      "border-radius:10px;letter-spacing:1px;text-transform:uppercase}" +
    ".cx-inp:focus{outline:none;border-color:#B42318;box-shadow:0 0 0 3px rgba(180,35,24,.15)}" +
    ".cx-acts{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}" +
    ".cx-btn{font:inherit;font-size:14px;font-weight:600;padding:10px 16px;border-radius:10px;cursor:pointer;border:1.5px solid transparent}" +
    ".cx-cancel{background:#fff;border-color:#D0D0D0;color:#3C3C3C}" +
    ".cx-ok{background:#B42318;color:#fff}" +
    ".cx-ok:disabled{background:#E8B4B0;cursor:not-allowed}" +
    "@keyframes cx-in{from{opacity:0}to{opacity:1}}" +
    "@media (max-width:480px){.cx-acts{flex-direction:column-reverse}.cx-btn{width:100%}}";

  var cssPronto = false;
  function injetaCss() {
    if (cssPronto) return;
    cssPronto = true;
    var st = document.createElement("style");
    st.setAttribute("data-cx", "");
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function confirmarExclusao(opts) {
    opts = opts || {};
    var titulo = opts.titulo || "Apagar este item?";
    if (typeof document === "undefined" || !document.body) {
      return Promise.resolve(!!(window.confirm && window.confirm(titulo)));
    }
    injetaCss();
    return new Promise(function (resolve) {
      var antes = document.activeElement;
      var ov = document.createElement("div");
      ov.className = "cx-ov";
      ov.setAttribute("role", "alertdialog");
      ov.setAttribute("aria-modal", "true");
      ov.setAttribute("aria-labelledby", "cx-tit");
      ov.innerHTML =
        '<div class="cx-box">' +
          '<button type="button" class="cx-x" aria-label="Cancelar">✕</button>' +
          '<div class="cx-ico" aria-hidden="true">🗑️</div>' +
          '<h2 class="cx-tit" id="cx-tit">' + esc(titulo) + '</h2>' +
          (opts.texto ? '<p class="cx-txt">' + esc(opts.texto) + '</p>' : '') +
          '<p class="cx-aviso">Esta ação não pode ser desfeita.</p>' +
          '<label class="cx-lbl" for="cx-inp">Para confirmar, digite <b>' + PALAVRA + '</b>:</label>' +
          '<input class="cx-inp" id="cx-inp" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + PALAVRA + '" />' +
          '<div class="cx-acts">' +
            '<button type="button" class="cx-btn cx-cancel">Cancelar</button>' +
            '<button type="button" class="cx-btn cx-ok" disabled>' + esc(opts.botao || "Apagar") + '</button>' +
          '</div>' +
        '</div>';
      var inp = ov.querySelector(".cx-inp");
      var ok = ov.querySelector(".cx-ok");
      var feito = false;

      function fechar(res) {
        if (feito) return;
        feito = true;
        document.removeEventListener("keydown", onKey, true);
        ov.remove();
        try { if (antes && antes.focus) antes.focus(); } catch (e) {}
        resolve(res);
      }
      function confere() { ok.disabled = norm(inp.value) !== PALAVRA; }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); fechar(false); }
        else if (e.key === "Enter" && e.target === inp) { e.preventDefault(); if (!ok.disabled) fechar(true); }
      }

      inp.addEventListener("input", confere);
      ok.addEventListener("click", function () { if (!ok.disabled) fechar(true); });
      ov.querySelector(".cx-cancel").addEventListener("click", function () { fechar(false); });
      ov.querySelector(".cx-x").addEventListener("click", function () { fechar(false); });
      ov.addEventListener("click", function (e) { if (e.target === ov) fechar(false); });
      document.addEventListener("keydown", onKey, true);

      document.body.appendChild(ov);
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 30);
    });
  }

  window.confirmarExclusao = confirmarExclusao;
})();
