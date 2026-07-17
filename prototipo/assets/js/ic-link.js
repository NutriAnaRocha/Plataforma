/* ============================================================
   INTELIGÊNCIA CLÍNICA — ponte entre o resultado do paciente e a
   Biblioteca Clínica.

   Observa a tela de Exames e, para cada marcador cujo nome existe na
   biblioteca, transforma o nome num link para a entrada correspondente.
   É a primeira ligação entre "o que o paciente tem" e "o que eu sei" —
   sem tocar na lógica de exames.js.

   Casamento por nome normalizado (nome + sinônimos), exato após
   descartar acento, pontuação e conectivos. Exato de propósito: um
   falso positivo aqui mostraria a interpretação do exame errado ao lado
   do resultado de um paciente, o que é pior do que não mostrar link.
   ============================================================ */
(function () {
  "use strict";

  var indice = null;   // { chaveNormalizada: slug }
  var carregando = null;

  // "Vitamina D (25-OH)" -> "vitamina d 25 oh"
  // "Glicemia de jejum"  -> "glicemia jejum"
  var STOP = { de: 1, da: 1, do: 1, e: 1, "a": 1, "o": 1 };
  var ACENTO = /[̀-ͯ]/g;   // marcas de combinação após normalize("NFD")
  function norm(s) {
    return String(s || "")
      .normalize("NFD").replace(ACENTO, "")   // tira acento
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")                        // pontuação vira espaço
      .trim()
      .split(/\s+/)
      .filter(function (t) { return t && !STOP[t]; })
      .join(" ");
  }

  async function carregarIndice() {
    if (indice) return indice;
    if (carregando) return carregando;
    carregando = (async function () {
      try {
        var db = await window.NutriDBReady;
        var r = await db.from("ic_exames_meus").select("slug,nome,sinonimos");
        if (r.error || !r.data) { indice = {}; return indice; }
        var m = {};
        r.data.forEach(function (e) {
          m[norm(e.nome)] = e.slug;
          (e.sinonimos || []).forEach(function (s) {
            var k = norm(s);
            if (k && !m[k]) m[k] = e.slug;   // nome tem prioridade sobre sinônimo
          });
        });
        indice = m;
      } catch (_) {
        indice = {};   // biblioteca indisponível: a tela segue funcionando sem links
      }
      return indice;
    })();
    return carregando;
  }

  function decorar(raiz) {
    if (!indice) return;
    (raiz || document).querySelectorAll(".mk-name:not([data-ic])").forEach(function (el) {
      el.setAttribute("data-ic", "1");           // não reprocessar
      var slug = indice[norm(el.textContent)];
      if (!slug) return;
      var nome = el.textContent;
      el.innerHTML = '<a class="ic-link" href="biblioteca-clinica.html?exame=' +
        encodeURIComponent(slug) + '" title="Ver interpretação de ' + nome +
        ' na Biblioteca Clínica">' + nome + "</a>";
    });
  }

  async function iniciar() {
    var alvo = document.getElementById("ex-detail");
    if (!alvo) return;                            // só atua na tela de Exames
    await carregarIndice();
    decorar(alvo);
    // exames.js redesenha o detalhe a cada exame selecionado.
    new MutationObserver(function () { decorar(alvo); })
      .observe(alvo, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
