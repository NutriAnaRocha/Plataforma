/* ============================================================
   foto-upload.js — foto de perfil (cadastros, Configurações e
   Perfil profissional).

   ler(file) abre um ajuste antes de salvar: a pessoa arrasta a foto
   para enquadrar o rosto no círculo e dá zoom. Sai um quadrado de
   400px em JPEG (~40 KB), que cabe como data URL em profiles.avatar_url.
   Cancelar rejeita a promise com Error("cancelado").
   Sem limite de tamanho de arquivo: a redução acontece aqui.
   ============================================================ */
(function () {
  "use strict";

  var LADO = 400;     // saída
  var JANELA = 280;   // área de ajuste na tela (px)

  var CSS =
    ".fa-fundo{position:fixed;inset:0;z-index:9999;background:rgba(10,30,28,.72);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".fa-caixa{background:#fff;border-radius:18px;padding:20px;width:100%;max-width:340px;box-shadow:0 20px 50px rgba(0,0,0,.3);font-family:inherit;color:#1f2d2b}" +
    ".fa-tit{margin:0 0 4px;font-size:1.1rem;font-weight:700}" +
    ".fa-sub{margin:0 0 14px;font-size:.85rem;color:#5f6f6d}" +
    ".fa-janela{position:relative;width:" + JANELA + "px;max-width:100%;aspect-ratio:1;margin:0 auto;overflow:hidden;border-radius:12px;background:#e9eeed;touch-action:none;cursor:grab}" +
    ".fa-janela:active{cursor:grabbing}" +
    ".fa-janela img{position:absolute;left:0;top:0;transform-origin:0 0;user-select:none;-webkit-user-drag:none;pointer-events:none;max-width:none}" +
    ".fa-mascara{position:absolute;inset:0;pointer-events:none;border-radius:50%;box-shadow:0 0 0 999px rgba(255,255,255,.55);outline:2px solid #fff}" +
    ".fa-zoom{display:flex;align-items:center;gap:10px;margin:16px 0 4px;font-size:.8rem;color:#5f6f6d}" +
    ".fa-zoom input{flex:1;accent-color:#1C5B57}" +
    ".fa-botoes{display:flex;gap:10px;margin-top:16px}" +
    ".fa-botoes button{flex:1;padding:12px;border-radius:12px;font:inherit;font-weight:600;cursor:pointer;border:1px solid #cfd8d6;background:#fff;color:#1C5B57}" +
    ".fa-botoes .fa-ok{background:#1C5B57;border-color:#1C5B57;color:#fff}";

  function estilo() {
    if (document.getElementById("fa-css")) return;
    var s = document.createElement("style");
    s.id = "fa-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function carregar(file) {
    return new Promise(function (ok, falha) {
      if (!file || !/^image\//.test(file.type)) { falha(new Error("tipo")); return; }
      var leitor = new FileReader();
      leitor.onerror = falha;
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { falha(new Error("imagem inválida")); };
        img.onload = function () { ok(img); };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(file);
    });
  }

  function ajustar(img) {
    estilo();
    return new Promise(function (ok, falha) {
      var fundo = document.createElement("div");
      fundo.className = "fa-fundo";
      fundo.innerHTML =
        '<div class="fa-caixa" role="dialog" aria-modal="true" aria-label="Ajustar foto">' +
          '<p class="fa-tit">Ajuste sua foto</p>' +
          '<p class="fa-sub">Arraste para centralizar o rosto e use o zoom.</p>' +
          '<div class="fa-janela"><div class="fa-mascara"></div></div>' +
          '<label class="fa-zoom"><span>−</span><input type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom" /><span>+</span></label>' +
          '<div class="fa-botoes"><button type="button" class="fa-cancelar">Cancelar</button>' +
          '<button type="button" class="fa-ok">Usar foto</button></div>' +
        "</div>";
      document.body.appendChild(fundo);

      var janela = fundo.querySelector(".fa-janela");
      var zoom = fundo.querySelector("input");
      janela.insertBefore(img, janela.firstChild);

      var W = img.naturalWidth, H = img.naturalHeight;
      var J = janela.clientWidth;                 // pode ser < JANELA no celular estreito
      var base = J / Math.min(W, H);              // zoom 1 = lado menor cobre a janela
      var esc = base, x = (J - W * base) / 2, y = (J - H * base) / 2;

      function limitar() {
        x = Math.min(0, Math.max(J - W * esc, x));
        y = Math.min(0, Math.max(J - H * esc, y));
      }
      function desenhar() {
        limitar();
        img.style.transform = "translate(" + x + "px," + y + "px) scale(" + esc + ")";
      }
      desenhar();

      // Zoom mantendo o centro da janela parado.
      zoom.addEventListener("input", function () {
        var novo = base * parseFloat(zoom.value);
        var cx = (J / 2 - x) / esc, cy = (J / 2 - y) / esc;
        esc = novo; x = J / 2 - cx * esc; y = J / 2 - cy * esc;
        desenhar();
      });

      var arrasto = null;
      janela.addEventListener("pointerdown", function (e) {
        arrasto = { px: e.clientX, py: e.clientY, x: x, y: y };
        janela.setPointerCapture(e.pointerId);
      });
      janela.addEventListener("pointermove", function (e) {
        if (!arrasto) return;
        x = arrasto.x + e.clientX - arrasto.px;
        y = arrasto.y + e.clientY - arrasto.py;
        desenhar();
      });
      function soltar() { arrasto = null; }
      janela.addEventListener("pointerup", soltar);
      janela.addEventListener("pointercancel", soltar);

      function fechar() { document.body.removeChild(fundo); }
      fundo.querySelector(".fa-cancelar").addEventListener("click", function () {
        fechar(); falha(new Error("cancelado"));
      });
      fundo.querySelector(".fa-ok").addEventListener("click", function () {
        var cv = document.createElement("canvas");
        cv.width = cv.height = LADO;
        var ctx = cv.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, LADO, LADO);   // PNG transparente não vira preto
        ctx.drawImage(img, -x / esc, -y / esc, J / esc, J / esc, 0, 0, LADO, LADO);
        fechar();
        ok(cv.toDataURL("image/jpeg", 0.86));
      });
    });
  }

  function ler(file) {
    return carregar(file).then(ajustar);
  }

  window.FotoUpload = { ler: ler, ajustar: ajustar };
})();
