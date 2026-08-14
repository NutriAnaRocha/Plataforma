/* ============================================================
   DIÁRIO DO PRATO — visão da NUTRI dentro da ficha do paciente.
   Lê o que a paciente registrou no portal (foto + estimativa da IA)
   e mostra em ordem, com um resumo por dia.

   Expõe window.PratoNutri = { render, wire }.

   A nutri não fotografa nem edita a estimativa: o dado é o registro da
   paciente, e reescrevê-lo apagaria a diferença entre "o que ela comeu"
   e "o que eu queria que ela tivesse comido" — que é exatamente a
   informação clínica útil aqui. Ela pode apagar (a paciente também) e
   escrever um COMENTÁRIO em cada foto, que a paciente lê no portal —
   ao lado da estimativa, nunca por cima dela (migração 0057).

   Requer pacientes-db.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) { return v == null || v === "" ? null : Math.round(Number(v)); }

  var CONF = { alta: "boa leitura", media: "leitura média", baixa: "leitura difícil" };

  function diaBR(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function horaBR(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getHours()) + "h" + p(d.getMinutes());
  }

  function render() {
    return '<section class="fsec"><h2 class="fsec__title">Diário do prato</h2>' +
      '<p class="ftxt fmuted">Fotos que a paciente registrou no portal, com a estimativa da IA. ' +
      'São <strong>estimativas por imagem</strong>, não pesagem — servem para ler a rotina dela ' +
      'entre as consultas, não como dado de avaliação nutricional.</p>' +
      '<div id="pn-lista"><div class="empty-state">Carregando…</div></div>' +
    '</section>';
  }

  /* Agrupa por dia. Um prato solto diz pouco; o dia inteiro é o que
     mostra padrão — e é assim que a nutri lê um recordatório. */
  function porDia(lista) {
    var dias = [], mapa = {};
    lista.forEach(function (p) {
      var d = diaBR(p.criado_em);
      if (!mapa[d]) { mapa[d] = { dia: d, pratos: [] }; dias.push(mapa[d]); }
      mapa[d].pratos.push(p);
    });
    return dias;
  }

  function somaDia(pratos, k) {
    var t = 0, tem = false;
    pratos.forEach(function (p) { if (p[k] != null) { t += Number(p[k]); tem = true; } });
    return tem ? Math.round(t) : null;
  }

  /* Reações: um toque em vez de escrever. A lista é curta de propósito —
     com muitas opções a escolha vira trabalho e ninguém usa. Nenhuma é
     de reprovação: o que precisa de ressalva merece o comentário, não um
     emoji seco no prato que a paciente teve o trabalho de registrar. */
  var REACOES = [
    { e: "😍", t: "Amei" },
    { e: "👏", t: "Mandou bem" },
    { e: "👍", t: "Tá bom" },
    { e: "🥗", t: "Caprichou nos vegetais" },
    { e: "🤔", t: "Dá pra melhorar" }
  ];

  function reacaoHTML(p) {
    var atual = (p.reacao_nutri || "").trim();
    return '<div class="pn-reac" data-pn-reacbox="' + esc(p.id) + '">' +
      REACOES.map(function (r) {
        var on = r.e === atual;
        return '<button class="pn-reac__btn' + (on ? " is-on" : "") + '" type="button" ' +
          'data-pn-reagir="' + esc(p.id) + '" data-pn-emoji="' + esc(r.e) + '" ' +
          'title="' + esc(r.t) + '" aria-label="' + esc(r.t) + '" ' +
          'aria-pressed="' + (on ? "true" : "false") + '">' + r.e + '</button>';
      }).join("") +
    '</div>';
  }

  /* Bloco do comentário: ou o que já foi escrito (com editar/apagar),
     ou o convite para escrever. Trocado no lugar, sem recarregar a lista. */
  function comentarioHTML(p) {
    var txt = (p.comentario_nutri || "").trim();
    return '<div class="pn-com" data-pn-combox="' + esc(p.id) + '">' +
      (txt
        ? '<p class="pn-com__txt">' + esc(txt) + '</p>' +
          '<button class="pn-com__btn" type="button" data-pn-comentar="' + esc(p.id) + '">editar</button>'
        : '<button class="pn-com__btn" type="button" data-pn-comentar="' + esc(p.id) + '">💬 Comentar com a paciente</button>') +
    '</div>';
  }

  function editorHTML(p) {
    return '<textarea class="input pn-com__ta" rows="2" maxlength="500" ' +
        'placeholder="O que você quer dizer sobre este prato?">' + esc(p.comentario_nutri || "") + '</textarea>' +
      '<div class="pn-com__acoes">' +
        '<button class="btn btn--primary btn--sm" type="button" data-pn-com-salvar="' + esc(p.id) + '">Salvar</button>' +
        '<button class="btn btn--outline btn--sm" type="button" data-pn-com-cancelar="' + esc(p.id) + '">Cancelar</button>' +
      '</div>';
  }

  function pratoHTML(p) {
    var kcal = num(p.kcal);
    var macros = [
      num(p.ptn_g) != null ? "P " + num(p.ptn_g) + "g" : "",
      num(p.cho_g) != null ? "C " + num(p.cho_g) + "g" : "",
      num(p.lip_g) != null ? "G " + num(p.lip_g) + "g" : ""
    ].filter(Boolean).join(" · ");

    var itens = (p.itens || []).map(function (i) {
      return esc(i.nome) + (i.porcao ? " (" + esc(i.porcao) + ")" : "");
    }).join(", ");

    var alertas = (p.alertas || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");

    return '<div class="pn-card">' +
      '<div class="pn-card__foto" data-pn-foto="' + esc(p.foto_path) + '"><img alt="" loading="lazy" /></div>' +
      '<div class="pn-card__corpo">' +
        '<div class="pn-card__head">' +
          '<strong>' + esc(p.refeicao || "Refeição") + '</strong>' +
          '<span class="pn-hora">' + esc(horaBR(p.criado_em)) + '</span>' +
          '<span class="pn-conf">' + esc(CONF[p.confianca] || CONF.media) + '</span>' +
        '</div>' +
        (kcal != null || macros
          ? '<p class="pn-nums">' + (kcal != null ? '<b>~' + kcal + ' kcal</b>' : '') +
            (macros ? '<span>' + esc(macros) + '</span>' : '') + '</p>'
          : '') +
        (itens ? '<p class="pn-itens">' + itens + '</p>' : '') +
        (p.observacao ? '<p class="pn-obs">Ela escreveu: “' + esc(p.observacao) + '”</p>' : '') +
        (alertas ? '<ul class="pn-alertas">' + alertas + '</ul>' : '') +
        reacaoHTML(p) +
        comentarioHTML(p) +
      '</div>' +
      '<button class="pn-del" type="button" data-pn-apagar="' + esc(p.id) + '" ' +
        'data-pn-path="' + esc(p.foto_path) + '" aria-label="Apagar este registro">×</button>' +
    '</div>';
  }

  function listaHTML(lista) {
    if (!lista.length) {
      return '<div class="empty-state">A paciente ainda não registrou nenhum prato. ' +
        'A seção “Meu prato” aparece no portal dela junto com o plano alimentar.</div>';
    }
    return porDia(lista).map(function (d) {
      var kcal = somaDia(d.pratos, "kcal");
      return '<div class="pn-dia">' +
        '<div class="pn-dia__head"><span>' + esc(d.dia) + '</span>' +
          '<span class="pn-dia__resumo">' + d.pratos.length +
            (d.pratos.length === 1 ? " prato" : " pratos") +
            (kcal != null ? " · ~" + kcal + " kcal" : "") + '</span></div>' +
        d.pratos.map(pratoHTML).join("") +
      '</div>';
    }).join("");
  }

  function wire(p, opts) {
    opts = opts || {};
    var DB = window.NutriPacientes;
    var box = document.getElementById("pn-lista");
    if (!box || !DB || !DB.listPratos) return;

    function hidratar() {
      if (!DB.assinarFotosPrato) return;
      var boxes = [].slice.call(document.querySelectorAll("[data-pn-foto]"));
      if (!boxes.length) return;
      DB.assinarFotosPrato(boxes.map(function (b) { return b.getAttribute("data-pn-foto"); }))
        .then(function (mapa) {
          boxes.forEach(function (b) {
            var u = mapa[b.getAttribute("data-pn-foto")];
            var img = b.querySelector("img");
            if (u && img) img.src = u; else b.remove();
          });
        }).catch(function () { boxes.forEach(function (b) { b.remove(); }); });
    }

    var porId = {};

    function carregar() {
      DB.listPratos(p.id, 60).then(function (rows) {
        porId = {};
        rows.forEach(function (r) { porId[r.id] = r; });
        box.innerHTML = listaHTML(rows);
        hidratar();
      }).catch(function () {
        box.innerHTML = '<div class="empty-state">Não foi possível carregar os registros.</div>';
      });
    }

    function caixa(id) { return box.querySelector('[data-pn-combox="' + id + '"]'); }

    box.addEventListener("click", function (e) {
      var reagir = e.target.closest("[data-pn-reagir]");
      if (reagir) {
        var idR = reagir.getAttribute("data-pn-reagir");
        var emoji = reagir.getAttribute("data-pn-emoji");
        var alvo = porId[idR] || { id: idR };
        var anterior = (alvo.reacao_nutri || "").trim();
        var novo = anterior === emoji ? "" : emoji;   // clicar no mesmo desmarca
        // Pinta antes de confirmar: o toque tem que responder na hora.
        alvo.reacao_nutri = novo;
        var cxR = box.querySelector('[data-pn-reacbox="' + idR + '"]');
        if (cxR) cxR.outerHTML = reacaoHTML(alvo);
        DB.reagirPrato(idR, novo).then(function () {
          if (opts.toast) opts.toast(novo ? "Reação enviada. A paciente vê no portal." : "Reação removida.");
        }).catch(function () {
          alvo.reacao_nutri = anterior;
          var volta = box.querySelector('[data-pn-reacbox="' + idR + '"]');
          if (volta) volta.outerHTML = reacaoHTML(alvo);
          if (opts.toast) opts.toast("Não foi possível salvar a reação.", true);
        });
        return;
      }

      var abrir = e.target.closest("[data-pn-comentar]");
      if (abrir) {
        var idA = abrir.getAttribute("data-pn-comentar");
        var cxA = caixa(idA);
        if (cxA) {
          cxA.innerHTML = editorHTML(porId[idA] || { id: idA });
          var ta = cxA.querySelector("textarea");
          if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        }
        return;
      }

      var cancelar = e.target.closest("[data-pn-com-cancelar]");
      if (cancelar) {
        var idC = cancelar.getAttribute("data-pn-com-cancelar");
        var cxC = caixa(idC);
        if (cxC) cxC.outerHTML = comentarioHTML(porId[idC] || { id: idC });
        return;
      }

      var salvar = e.target.closest("[data-pn-com-salvar]");
      if (salvar) {
        var idS = salvar.getAttribute("data-pn-com-salvar");
        var cxS = caixa(idS);
        var txt = cxS ? (cxS.querySelector("textarea").value || "").trim() : "";
        salvar.disabled = true;
        DB.comentarPrato(idS, txt).then(function () {
          if (porId[idS]) porId[idS].comentario_nutri = txt;
          if (cxS) cxS.outerHTML = comentarioHTML(porId[idS] || { id: idS, comentario_nutri: txt });
          if (opts.toast) opts.toast(txt ? "Comentário salvo. A paciente vê no portal." : "Comentário removido.");
        }).catch(function () {
          salvar.disabled = false;
          if (opts.toast) opts.toast("Não foi possível salvar o comentário.", true);
        });
        return;
      }

      var del = e.target.closest("[data-pn-apagar]");
      if (!del) return;
      if (!window.confirm("Apagar este registro da paciente? A foto também sai.")) return;
      del.disabled = true;
      DB.removerPrato(del.getAttribute("data-pn-apagar"), del.getAttribute("data-pn-path"))
        .then(function () {
          if (opts.toast) opts.toast("Registro apagado.");
          carregar();
        })
        .catch(function () {
          del.disabled = false;
          if (opts.toast) opts.toast("Não foi possível apagar.", true);
        });
    });

    carregar();
  }

  window.PratoNutri = { render: render, wire: wire };
})();
