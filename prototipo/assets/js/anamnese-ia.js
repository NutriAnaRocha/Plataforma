/* ============================================================
   ANAMNESE IA — dois gestos na seção Anamnese da ficha:

   1. "✨ Revisar texto" dentro do editor inline: manda o texto para a
      edge function anamnese-ia (modo "texto"), mostra ORIGINAL × REVISADO
      lado a lado com as trocas destacadas e só escreve no textarea se a
      nutri clicar em Aplicar. O salvamento continua sendo o dela.

   2. "Conduta sugerida": lê a ficha inteira no servidor (anamnese +
      questionários do portal + prontuário), casa com os protocolos da
      Biblioteca Clínica e devolve um rascunho de diagnóstico + conduta.
      Nada é gravado sem o clique em "Salvar na evolução clínica".

   Nenhum dos dois toca o banco por conta própria. A IA é copiloto: a
   decisão clínica e a assinatura são da nutricionista (CFN 856/2026).

   Requer supabase-client.js e pacientes-db.js antes deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  // Campos de texto da ficha que aceitam revisão. Os outros (nome, e-mail,
  // telefone) não são prosa — mandar para a IA só criaria risco.
  var CAMPOS = { anamnese: 1, restricoes: 1, observacoes: 1 };

  var AVISO = "Rascunho gerado por IA — revise antes de usar. A responsabilidade clínica é sua.";

  var atual = null;   // { p, ctx } do paciente aberto, definido em wire()
  var ultimaConduta = null;
  var ligado = false; // o listener de documento é instalado uma vez só

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }

  function toast(msg, erro) {
    if (atual && atual.ctx && atual.ctx.toast) atual.ctx.toast(msg, erro);
    else if (erro) alert(msg);
  }

  // functions.invoke embrulha o erro HTTP; a mensagem real vem no context.
  async function chamar(body) {
    var db = await window.NutriDBReady;
    var res = await db.functions.invoke("anamnese-ia", { body: body });
    if (res.error) {
      var msg = res.error.message || "IA indisponível.";
      try {
        var det = await res.error.context.json();
        if (det && det.error) msg = det.error;
      } catch (_) { /* sem corpo JSON: fica a mensagem genérica */ }
      throw new Error(msg);
    }
    var d = res.data || {};
    if (d.error) throw new Error(d.error);
    return d;
  }

  /* ============================================================
     1) REVISÃO DE TEXTO
     ============================================================ */

  function botaoRevisar(campo) {
    if (!CAMPOS[campo]) return "";
    return '<button class="btn btn--ghost btn--sm ia-btn" type="button" data-ia-revisar="' +
      campo + '" title="Corrigir português e organizar o texto">✨ Revisar texto</button>';
  }

  /* ---------- diff palavra a palavra ----------
     Tokeniza mantendo os espaços (para reconstruir o texto na tela) e roda
     um LCS clássico. É O(n·m), mas n e m aqui são as palavras de uma
     anamnese — algumas centenas. */
  function tokens(s) {
    return String(s || "").split(/(\s+)/).filter(function (t) { return t !== ""; });
  }
  function chave(t) {
    return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function diff(a, b) {
    var A = tokens(a), B = tokens(b);
    var n = A.length, m = B.length;
    var i, j;
    // Matriz LCS em Int32Array (linha a linha, para não alocar n·m objetos).
    var L = new Int32Array((n + 1) * (m + 1));
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        L[i * (m + 1) + j] = (chave(A[i]) === chave(B[j]) && chave(A[i]) !== "")
          || A[i] === B[j]
          ? L[(i + 1) * (m + 1) + (j + 1)] + 1
          : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + (j + 1)]);
      }
    }
    var esq = [], dir = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      var igual = (chave(A[i]) === chave(B[j]) && chave(A[i]) !== "") || A[i] === B[j];
      if (igual) {
        esq.push({ t: A[i], m: A[i] !== B[j] });   // acento/caixa mudou: marca leve
        dir.push({ t: B[j], m: A[i] !== B[j] });
        i++; j++;
      } else if (L[(i + 1) * (m + 1) + j] >= L[i * (m + 1) + (j + 1)]) {
        esq.push({ t: A[i], m: true }); i++;
      } else {
        dir.push({ t: B[j], m: true }); j++;
      }
    }
    while (i < n) { esq.push({ t: A[i], m: true }); i++; }
    while (j < m) { dir.push({ t: B[j], m: true }); j++; }
    return { esq: esq, dir: dir };
  }
  function pintar(lista, cls) {
    return lista.map(function (x) {
      if (/^\s+$/.test(x.t)) return x.t.indexOf("\n") >= 0 ? "<br>" : " ";
      return x.m ? '<mark class="' + cls + '">' + esc(x.t) + "</mark>" : esc(x.t);
    }).join("");
  }

  function previewTexto(campo, d) {
    var box = document.querySelector('[data-campo-box="' + campo + '"]');
    if (!box) return;
    var velho = box.querySelector(".ia-rev"); if (velho) velho.remove();

    var dd = diff(d.texto_original, d.texto_corrigido);
    var duvidas = (d.duvidas || []).length
      ? '<div class="ia-rev__duvidas"><b>Não entendi e deixei como estava:</b> ' +
        d.duvidas.map(esc).join(" · ") + "</div>"
      : "";
    var nMud = (d.mudancas || []).length;
    var resumo = nMud
      ? nMud + (nMud === 1 ? " correção" : " correções")
      : "Nenhuma correção necessária";

    var el = document.createElement("div");
    el.className = "ia-rev";
    el.innerHTML =
      '<div class="ia-rev__head"><span class="ia-rev__t">✨ Revisão da IA</span>' +
        '<span class="ia-rev__tag">' + esc(resumo) + "</span></div>" +
      '<div class="ia-diff">' +
        '<div class="ia-diff__col"><h4>Como você escreveu</h4>' +
          '<div class="ia-diff__txt">' + pintar(dd.esq, "ia-del") + "</div></div>" +
        '<div class="ia-diff__col ia-diff__col--novo"><h4>Revisado</h4>' +
          '<div class="ia-diff__txt">' + pintar(dd.dir, "ia-add") + "</div></div>" +
      "</div>" +
      duvidas +
      '<p class="ia-aviso">' + esc(AVISO) + "</p>" +
      '<div class="ia-rev__acts">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-ia-descartar>Descartar</button>' +
        '<button class="btn btn--primary btn--sm" type="button" data-ia-aplicar="' + campo +
          '">Aplicar no texto</button>' +
      "</div>";
    // guarda o texto revisado fora do HTML, para não depender do parsing
    el.__texto = d.texto_corrigido;
    box.appendChild(el);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function revisar(campo, btn) {
    var ta = document.getElementById("fedit-" + campo);
    if (!ta) return;
    var texto = ta.value.trim();
    if (!texto) { toast("Escreva alguma coisa antes de pedir a revisão.", true); ta.focus(); return; }

    var rot = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "✨ Revisando…"; }
    try {
      var d = await chamar({ modo: "texto", texto: texto, campo: campo });
      previewTexto(campo, d);
    } catch (e) {
      toast("Não consegui revisar agora. " + (e && e.message ? e.message : ""), true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = rot || "✨ Revisar texto"; }
    }
  }

  /* ============================================================
     2) CONDUTA SUGERIDA
     ============================================================ */

  function render(p) {
    var temTexto = String((p && p.anamnese) || "").trim().length > 30 ||
      (Array.isArray(p && p.questionarios) && p.questionarios.length > 0);
    return '<section class="fsec ia-card">' +
      '<div class="fsec__head">' +
        '<h2 class="fsec__title">✨ Conduta sugerida</h2>' +
        '<button class="fsec__add" type="button" data-ia-conduta' + (temTexto ? "" : " disabled") +
          '>Gerar rascunho</button>' +
      "</div>" +
      '<p class="ia-card__sub">' +
        (temTexto
          ? "A IA lê a anamnese, os questionários do portal e o prontuário, cruza com os seus protocolos da Biblioteca Clínica e propõe diagnóstico nutricional, conduta e metas."
          : "Escreva a anamnese inicial (ou peça a anamnese do portal à paciente) para liberar a sugestão de conduta.") +
      "</p>" +
      '<div class="ia-cond__box" id="ia-cond-box"></div>' +
      "</section>";
  }

  function bloco(titulo, itens) {
    if (!itens || !itens.length) return "";
    return '<div class="ia-cond__bloco"><h4>' + esc(titulo) + "</h4><ul>" +
      itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
  }

  function renderConduta(d) {
    var box = document.getElementById("ia-cond-box");
    if (!box) return;
    // "Usados" é o que a IA declarou ter aproveitado; quando ela não declara,
    // mostramos o que foi para o contexto — sem afirmar que embasou a conduta.
    function links(l) {
      return l.map(function (x) {
        return '<a href="protocolos.html?p=' + encodeURIComponent(x.slug) + '">' + esc(x.nome) + "</a>";
      }).join(" · ");
    }
    var usados = d.protocolos_usados || [];
    var consultados = d.protocolos_consultados || [];
    var prot;
    if (usados.length) {
      prot = '<div class="ia-cond__prot"><b>Protocolos usados:</b> ' + links(usados) + "</div>";
    } else if (consultados.length) {
      prot = '<div class="ia-cond__prot"><b>Protocolos consultados:</b> ' + links(consultados) +
        ' <span class="ia-cond__prot--vazio">— a IA não disse qual pesou na conduta; confira.</span></div>';
    } else {
      prot = '<div class="ia-cond__prot ia-cond__prot--vazio">Nenhum protocolo da sua biblioteca casou com este quadro — a sugestão veio só dos dados da paciente.</div>';
    }

    box.innerHTML =
      '<div class="ia-cond">' +
        (d.diagnostico_nutricional
          ? '<div class="ia-cond__bloco"><h4>Diagnóstico nutricional</h4><p>' +
            nl2br(d.diagnostico_nutricional) + "</p></div>"
          : "") +
        bloco("Conduta", d.conduta) +
        bloco("Metas até o retorno", d.metas) +
        bloco("Exames a considerar", d.exames_sugeridos) +
        bloco("Falta na ficha", d.dados_faltantes) +
        (d.sinais_alerta
          ? '<div class="ia-cond__bloco ia-cond__bloco--alerta"><h4>Sinais de alerta / encaminhamento</h4><p>' +
            nl2br(d.sinais_alerta) + "</p></div>"
          : "") +
        prot +
        '<p class="ia-aviso">' + esc(AVISO) + "</p>" +
        '<div class="ia-cond__acts">' +
          '<button class="btn btn--ghost btn--sm" type="button" data-ia-cond-descartar>Descartar</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-ia-cond-copiar>Copiar</button>' +
          '<button class="btn btn--primary btn--sm" type="button" data-ia-cond-salvar>Salvar na evolução clínica</button>' +
        "</div>" +
      "</div>";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function gerarConduta(btn) {
    if (!atual || !atual.p) return;
    var box = document.getElementById("ia-cond-box");
    if (btn) { btn.disabled = true; btn.textContent = "Pensando…"; }
    if (box) box.innerHTML = '<div class="ia-cond__load">Lendo a ficha e cruzando com os seus protocolos…</div>';
    try {
      var d = await chamar({ modo: "conduta", paciente_id: atual.p.id });
      ultimaConduta = d;
      renderConduta(d);
    } catch (e) {
      ultimaConduta = null;
      var msg = (e && e.message) ? e.message : "IA indisponível.";
      if (box) box.innerHTML = '<div class="ia-cond__erro">' + esc(msg) + "</div>";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Gerar rascunho"; }
    }
  }

  function condutaTexto(d) {
    var L = [];
    if (d.diagnostico_nutricional) L.push("DIAGNÓSTICO NUTRICIONAL\n" + d.diagnostico_nutricional);
    if ((d.conduta || []).length) L.push("CONDUTA\n- " + d.conduta.join("\n- "));
    if ((d.metas || []).length) L.push("METAS\n- " + d.metas.join("\n- "));
    if ((d.exames_sugeridos || []).length) L.push("EXAMES A CONSIDERAR\n- " + d.exames_sugeridos.join("\n- "));
    if (d.sinais_alerta) L.push("SINAIS DE ALERTA\n" + d.sinais_alerta);
    return L.join("\n\n");
  }

  function hojeISO() {
    var d = new Date(), p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  }

  // Grava dentro de pacientes.prontuario -> evolucao[], que é exatamente
  // de onde a tela prontuario.html lê a timeline de evoluções clínicas.
  async function salvarNaEvolucao(btn) {
    if (!ultimaConduta || !atual || !atual.p) return;
    var p = atual.p, d = ultimaConduta;
    var D = (p.prontuario && typeof p.prontuario === "object") ? p.prontuario : {};
    if (!Array.isArray(D.evolucao)) D.evolucao = [];

    var prots = (d.protocolos_usados || []).map(function (x) { return x.nome; }).join(", ");
    D.evolucao.unshift({
      data: hojeISO(),
      tipo: "Consulta",
      queixa: "",
      evolucao: "",
      diagnostico: d.diagnostico_nutricional || "",
      conduta: (d.conduta || []).map(function (i) { return "• " + i; }).join("\n"),
      metas: (d.metas || []).map(function (i) { return "• " + i; }).join("\n"),
      obs: "Rascunho gerado com IA (" + (d.modelo || "IA") + ") e revisado pela nutricionista." +
        (prots ? " Protocolos: " + prots + "." : "") +
        ((d.exames_sugeridos || []).length ? " Exames a considerar: " + d.exames_sugeridos.join(", ") + "." : "") +
        (d.sinais_alerta ? " Alerta: " + d.sinais_alerta : "")
    });

    if (btn) { btn.disabled = true; btn.textContent = "Salvando…"; }
    try {
      await window.NutriPacientes.saveProntuario(p.id, D);
      p.prontuario = D;
      toast("Salvo na evolução clínica.");
      var box = document.getElementById("ia-cond-box");
      if (box) {
        box.innerHTML = '<div class="ia-cond__ok">✓ Salvo na evolução clínica. ' +
          '<a href="prontuario.html?id=' + encodeURIComponent(p.id) + '#evolucao">Ver no prontuário</a></div>';
      }
      ultimaConduta = null;
    } catch (e) {
      D.evolucao.shift();   // desfaz o unshift local: não ficou salvo
      toast("Não consegui salvar. " + (e && e.message ? e.message : ""), true);
      if (btn) { btn.disabled = false; btn.textContent = "Salvar na evolução clínica"; }
    }
  }

  /* ============================================================
     Fiação
     ============================================================ */

  function instalar() {
    if (ligado) return;
    ligado = true;
    document.addEventListener("click", function (ev) {
      var b;

      b = ev.target.closest("[data-ia-revisar]");
      if (b) { revisar(b.getAttribute("data-ia-revisar"), b); return; }

      b = ev.target.closest("[data-ia-descartar]");
      if (b) { var r = b.closest(".ia-rev"); if (r) r.remove(); return; }

      b = ev.target.closest("[data-ia-aplicar]");
      if (b) {
        var caixa = b.closest(".ia-rev");
        var ta = document.getElementById("fedit-" + b.getAttribute("data-ia-aplicar"));
        if (ta && caixa && caixa.__texto != null) {
          ta.value = caixa.__texto;
          ta.focus();
          toast("Texto aplicado. Confira e clique em Salvar.");
        }
        if (caixa) caixa.remove();
        return;
      }

      b = ev.target.closest("[data-ia-conduta]");
      if (b) { gerarConduta(b); return; }

      b = ev.target.closest("[data-ia-cond-descartar]");
      if (b) {
        ultimaConduta = null;
        var bx = document.getElementById("ia-cond-box"); if (bx) bx.innerHTML = "";
        return;
      }

      b = ev.target.closest("[data-ia-cond-copiar]");
      if (b && ultimaConduta) {
        var alvo = b;
        navigator.clipboard.writeText(condutaTexto(ultimaConduta)).then(function () {
          var t0 = alvo.textContent;
          alvo.textContent = "✓ Copiado";
          setTimeout(function () { alvo.textContent = t0; }, 1500);
        }).catch(function () { toast("Não consegui copiar automaticamente.", true); });
        return;
      }

      b = ev.target.closest("[data-ia-cond-salvar]");
      if (b) { salvarNaEvolucao(b); return; }
    });
  }

  function wire(p, ctx) {
    atual = { p: p, ctx: ctx || {} };
    ultimaConduta = null;
    instalar();
  }

  window.AnamneseIA = {
    CAMPOS: CAMPOS,
    botaoRevisar: botaoRevisar,
    render: render,
    wire: wire
  };
})();
