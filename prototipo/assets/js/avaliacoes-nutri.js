/* ============================================================
   AVALIAÇÕES DOS PACIENTES — o que a NUTRI vê no dashboard.

   Lê por minhas_avaliacoes_resumo() e minhas_avaliacoes() (migração 0093):
   as RPCs devolvem nota, comentário e data, NUNCA quem escreveu. Isso é
   deliberado — avaliação identificada vira constrangimento e o paciente
   responde o que a profissional quer ouvir.

   O cartão só aparece quando existe pelo menos uma avaliação; sem isso
   ele seria uma cobrança permanente de algo que não depende da nutri.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmtBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }

  var CSS = '' +
    "#avaliacoes-nutri .avn-topo{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}" +
    "#avaliacoes-nutri .avn-media{font-size:30px;font-weight:700;line-height:1}" +
    "#avaliacoes-nutri .avn-qtd{font-size:13px;color:var(--texto-sutil,#8a8a8a)}" +
    "#avaliacoes-nutri .avn-barra{display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px}" +
    "#avaliacoes-nutri .avn-barra i{flex:1;height:6px;border-radius:3px;" +
      "background:var(--azul-suave,#eef6f8);overflow:hidden;font-style:normal}" +
    "#avaliacoes-nutri .avn-barra i b{display:block;height:100%;background:var(--petroleo,#1C5B57)}" +
    "#avaliacoes-nutri .avn-com{border-top:1px solid var(--cinza-borda,#e7e7ea);" +
      "padding-top:8px;margin-top:10px}" +
    "#avaliacoes-nutri .avn-com p{margin:0 0 8px;font-size:13px;color:var(--texto,#3c3c3c)}" +
    "#avaliacoes-nutri .avn-com span{color:var(--texto-sutil,#8a8a8a);font-size:11px}";

  function injetarCSS() {
    if (document.getElementById("avn-css")) return;
    var s = document.createElement("style");
    s.id = "avn-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function render(resumo, itens) {
    var qtd = Number(resumo.qtd) || 0;
    var dist = resumo.dist || {};
    var barras = [5, 4, 3, 2, 1].map(function (n) {
      var v = Number(dist[String(n)]) || 0;
      var pct = qtd ? Math.round((v / qtd) * 100) : 0;
      return '<div class="avn-barra">' + n + '★ <i><b style="width:' + pct + '%"></b></i> ' +
             v + "</div>";
    }).join("");

    var comentarios = (itens || [])
      .filter(function (a) { return a.comentario; })
      .slice(0, 4)
      .map(function (a) {
        return "<p>“" + esc(a.comentario) + "” <span>" + a.nota + "★ · " +
               fmtBR(a.data) + "</span></p>";
      }).join("");

    return '<div class="avn-topo"><span class="avn-media">' +
           (resumo.media == null ? "—" : String(resumo.media).replace(".", ",")) +
           '</span><span class="avn-qtd">' + qtd +
           (qtd === 1 ? " avaliação" : " avaliações") + "</span></div>" +
           barras +
           (comentarios ? '<div class="avn-com">' + comentarios + "</div>" : "");
  }

  function montar() {
    var host = document.getElementById("avaliacoes-nutri");
    var card = document.getElementById("card-avaliacoes");
    if (!host || !window.NutriDBReady) return;

    window.NutriDBReady.then(function (sb) {
      return Promise.all([
        sb.rpc("minhas_avaliacoes_resumo"),
        sb.rpc("minhas_avaliacoes", { p_limite: 20 })
      ]);
    }).then(function (res) {
      var resumo = (res[0] && res[0].data) || {};
      if (!Number(resumo.qtd)) return;          // sem avaliação, sem cartão
      injetarCSS();
      host.innerHTML = render(resumo, (res[1] && res[1].data) || []);
      if (card) card.hidden = false;
    }).catch(function () { /* extra do dashboard: falha calado */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
