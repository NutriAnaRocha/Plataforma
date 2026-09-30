/* ============================================================
   AVALIAÇÃO DO ATENDIMENTO — respondida pelo PACIENTE, no portal.

   Aparece como cartão acima das abas quando existe consulta concluída nos
   últimos 14 dias sem avaliação (RPC consulta_a_avaliar, migração 0093).
   Uma nota de 1 a 5 e, opcional, um comentário. Dois cliques e acabou —
   avaliação longa não é respondida.

   O que ela NÃO é: depoimento de vitrine. A nota é sinal interno (peso de
   desempate na ordem do diretório) e retorno para a nutri, que lê sem saber
   quem escreveu. Nada disto vai para página pública enquanto não houver
   moderação de comentário — o Art. 69 da Res. CFN 856/2026 veda expor
   RESULTADO (peso, exame, imagem), e é no texto livre que isso escaparia.

   Por isso o campo de comentário pede experiência do atendimento e o
   próprio texto do cartão avisa que a resposta não é publicada.

   window.AvaliacaoView = { montar }.
   Requer supabase-client.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var NOTAS = [
    { n: 5, rotulo: "Ótimo" },
    { n: 4, rotulo: "Bom" },
    { n: 3, rotulo: "Regular" },
    { n: 2, rotulo: "Ruim" },
    { n: 1, rotulo: "Péssimo" }
  ];
  var DISPENSA_KEY = "nutri:avaliacao:dispensada";   // "agora não", por consulta

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmtBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] : "";
  }
  function dispensadas() {
    try { return JSON.parse(localStorage.getItem(DISPENSA_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function dispensar(id) {
    try {
      var l = dispensadas();
      if (l.indexOf(id) < 0) l.push(id);
      localStorage.setItem(DISPENSA_KEY, JSON.stringify(l.slice(-20)));
    } catch (e) { /* modo privado: só não lembra */ }
  }

  function cartaoHTML(c) {
    var quem = c.nutri_nome ? ("com " + esc(c.nutri_nome)) : "";
    var dia = fmtBR(c.data);
    var botoes = NOTAS.map(function (o) {
      return '<button type="button" class="av-nota" data-n="' + o.n + '" ' +
             'aria-label="' + o.rotulo + '"><span class="av-nota__n">' + o.n +
             '</span><span class="av-nota__r">' + o.rotulo + "</span></button>";
    }).join("");

    return '' +
      '<section class="av-card" id="av-card">' +
        '<div class="av-card__head">' +
          "<strong>Como foi a sua consulta" + (dia ? " de " + dia : "") +
          (quem ? " " + quem : "") + "?</strong>" +
          '<button type="button" class="av-fechar" id="av-depois" ' +
            'aria-label="Responder depois">×</button>' +
        "</div>" +
        '<div class="av-notas" role="group" aria-label="Nota de 1 a 5">' + botoes + "</div>" +
        '<div class="av-passo2" id="av-passo2" hidden>' +
          '<label class="av-label" for="av-txt">Quer contar como foi o atendimento? ' +
            "(opcional)</label>" +
          '<textarea id="av-txt" class="av-txt" rows="3" maxlength="600" ' +
            'placeholder="Fui bem acolhida, entendi o que preciso fazer..."></textarea>' +
          '<p class="av-aviso">Sua resposta é confidencial e não é publicada. ' +
            "A nutricionista vê o retorno sem saber quem escreveu.</p>" +
          '<button type="button" class="btn btn--primary" id="av-enviar">Enviar</button>' +
        "</div>" +
        '<p class="av-erro" id="av-erro" hidden></p>' +
      "</section>";
  }

  // Cores vêm dos tokens da marca (tokens.css) — nada de hex avulso, senão o
  // cartão destoa do resto do portal quando a paleta mudar.
  var CSS = '' +
    ".av-card{background:var(--branco,#fff);border:1px solid var(--cinza-borda,#e7e7ea);" +
      "border-radius:14px;padding:16px 18px;margin:0 0 16px;box-shadow:0 1px 3px rgba(0,0,0,.05)}" +
    ".av-card__head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between}" +
    ".av-fechar{background:none;border:0;font-size:22px;line-height:1;cursor:pointer;" +
      "color:var(--texto-sutil,#8a8a8a);padding:0 2px}" +
    ".av-notas{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}" +
    ".av-nota{flex:1 1 84px;min-width:84px;background:var(--azul-suave,#eef6f8);" +
      "border:1px solid var(--cinza-borda,#e7e7ea);color:var(--texto,#3c3c3c);" +
      "border-radius:10px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;" +
      "align-items:center;gap:2px;transition:.15s}" +
    ".av-nota:hover{border-color:var(--petroleo,#1C5B57)}" +
    ".av-nota.is-on{border-color:var(--petroleo,#1C5B57);background:var(--petroleo,#1C5B57);" +
      "color:var(--branco,#fff)}" +
    ".av-nota__n{font-weight:700;font-size:17px}" +
    ".av-nota__r{font-size:11px;opacity:.85}" +
    ".av-passo2{margin-top:14px;display:flex;flex-direction:column;gap:8px}" +
    ".av-label{font-size:13px;color:var(--texto,#3c3c3c)}" +
    ".av-txt{width:100%;border:1px solid var(--cinza-borda,#e7e7ea);border-radius:10px;" +
      "padding:10px;font:inherit;resize:vertical}" +
    ".av-aviso{font-size:12px;color:var(--texto-sutil,#8a8a8a);margin:0}" +
    ".av-erro{color:#b3261e;font-size:13px;margin:10px 0 0}" +
    ".av-ok{font-size:14px;color:var(--petroleo,#1C5B57);margin:0}" +
    "@media (max-width:520px){.av-nota{flex:1 1 calc(33% - 8px);min-width:0}}";

  function injetarCSS() {
    if (document.getElementById("av-css")) return;
    var s = document.createElement("style");
    s.id = "av-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* Monta o cartão dentro de `host` se houver consulta pendente de avaliação.
     Silencioso em qualquer falha: isto é um extra, não pode quebrar o portal.
     opts.readonly = modo "ver como paciente" da nutri — não pergunta nada. */
  function montar(host, opts) {
    opts = opts || {};
    if (!host || opts.readonly) return Promise.resolve(false);
    var sb = window.NutriDB;
    if (!sb) return Promise.resolve(false);

    return sb.rpc("consulta_a_avaliar").then(function (res) {
      var c = res && res.data;
      if (!c || !c.consulta_id) return false;
      if (dispensadas().indexOf(c.consulta_id) >= 0) return false;

      injetarCSS();
      host.innerHTML = cartaoHTML(c);
      wire(host, c, sb);
      return true;
    }).catch(function () { return false; });
  }

  function wire(host, c, sb) {
    var card = host.querySelector("#av-card");
    var passo2 = host.querySelector("#av-passo2");
    var erro = host.querySelector("#av-erro");
    var nota = 0;

    host.querySelector("#av-depois").addEventListener("click", function () {
      dispensar(c.consulta_id);
      host.innerHTML = "";
    });

    host.querySelectorAll(".av-nota").forEach(function (b) {
      b.addEventListener("click", function () {
        nota = parseInt(b.getAttribute("data-n"), 10);
        host.querySelectorAll(".av-nota").forEach(function (o) {
          o.classList.toggle("is-on", o === b);
        });
        passo2.hidden = false;
        host.querySelector("#av-txt").focus();
      });
    });

    host.querySelector("#av-enviar").addEventListener("click", function () {
      if (!nota) return;
      var btn = this;
      btn.disabled = true;
      erro.hidden = true;

      var texto = (host.querySelector("#av-txt").value || "").trim().slice(0, 600);
      sb.from("avaliacoes_atendimento").insert({
        nutricionista_id: c.nutricionista_id,
        paciente_id: c.paciente_id,
        consulta_id: c.consulta_id,
        nota: nota,
        comentario: texto || null
      }).then(function (r) {
        if (r && r.error) throw r.error;
        card.innerHTML = '<p class="av-ok">Obrigada! Sua avaliação foi registrada.</p>';
        setTimeout(function () { host.innerHTML = ""; }, 4000);
      }).catch(function () {
        btn.disabled = false;
        erro.textContent = "Não consegui registrar agora. Tente de novo em instantes.";
        erro.hidden = false;
      });
    });
  }

  window.AvaliacaoView = { montar: montar };
})();
