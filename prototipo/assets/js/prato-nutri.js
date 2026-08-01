/* ============================================================
   DIÁRIO DO PRATO — visão da NUTRI dentro da ficha do paciente.
   Lê o que a paciente registrou no portal (foto + estimativa da IA)
   e mostra em ordem, com um resumo por dia.

   Expõe window.PratoNutri = { render, wire }.

   Só LEITURA. A nutri não fotografa nem edita a estimativa: o dado é
   o registro da paciente, e reescrevê-lo apagaria a diferença entre
   "o que ela comeu" e "o que eu queria que ela tivesse comido" — que
   é exatamente a informação clínica útil aqui. Ela pode apagar (a
   paciente também), e comenta pelo chat do portal.

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

    function carregar() {
      DB.listPratos(p.id, 60).then(function (rows) {
        box.innerHTML = listaHTML(rows);
        hidratar();
      }).catch(function () {
        box.innerHTML = '<div class="empty-state">Não foi possível carregar os registros.</div>';
      });
    }

    box.addEventListener("click", function (e) {
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
