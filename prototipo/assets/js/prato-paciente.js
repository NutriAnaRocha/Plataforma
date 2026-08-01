/* ============================================================
   DIÁRIO DO PRATO — a paciente fotografa o prato e recebe uma
   estimativa de calorias e macros, o que dá para ajustar e o que
   está bom. A nutri vê tudo na ficha.

   Expõe window.PratoView = { portalHTML, wire }.

   Limites que a tela ASSUME e diz em voz alta:
   é ESTIMATIVA a partir de uma foto, não pesagem e não avaliação
   nutricional. Quem interpreta é a nutricionista (Res. CFN 856/2026).
   Por isso o número aparece com a palavra "aproximadamente", com o
   grau de confiança ao lado, e nunca sozinho.

   Tom: sem culpa. Os alertas dizem o que fazer da próxima vez, e
   sempre vêm depois do que já está bom — quem registra o que come
   está fazendo a parte dela, e a tela precisa tratar assim.

   Requer supabase-client.js + pacientes-db.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var REFEICOES = ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"];
  var MAX_LADO = 1024;   // px — o suficiente para a IA ver o prato
  var QUALIDADE = 0.82;

  var CONF_TXT = {
    alta:  { rotulo: "boa leitura", dica: "Deu para ver bem o prato." },
    media: { rotulo: "leitura média", dica: "A porção ficou um pouco incerta — o número é aproximado." },
    baixa: { rotulo: "leitura difícil", dica: "A foto ficou difícil de ler. Use este número com reserva." }
  };

  /* Sugere a refeição pelo horário. É palpite, e a paciente troca com um
     toque — mas acerta na maioria das vezes e economiza um passo dela. */
  function refeicaoPelaHora() {
    var h = new Date().getHours();
    if (h < 10) return "Café da manhã";
    if (h < 11) return "Lanche da manhã";
    if (h < 15) return "Almoço";
    if (h < 18) return "Lanche da tarde";
    if (h < 22) return "Jantar";
    return "Ceia";
  }

  function dataHoraBR(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " às " + p(d.getHours()) + "h" + p(d.getMinutes());
  }
  function ehHoje(iso) {
    var d = new Date(iso), h = new Date();
    return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate();
  }
  function num(v) { return v == null || v === "" ? null : Math.round(Number(v)); }

  /* ---------- HTML ---------- */

  function portalHTML() {
    return '' +
      '<div class="pcard prato-intro">' +
        '<h2 class="pcard__title">Diário do prato 📷</h2>' +
        '<p class="prato-intro__txt">Fotografe o prato antes de comer e eu faço uma estimativa das calorias ' +
          'e dos nutrientes, junto com o que dá para ajustar da próxima vez.</p>' +
        '<p class="prato-nota">É uma <strong>estimativa a partir da foto</strong>, não uma pesagem — ' +
          'serve para acompanhar a rotina, não para substituir a avaliação da sua nutricionista. ' +
          'Ela vê estes registros e comenta com você.</p>' +
        '<button class="btn btn--primary prato-cta" type="button" data-prato-tirar>📷 Fotografar o prato</button>' +
        '<input type="file" accept="image/*" capture="environment" id="prato-file" hidden />' +
      '</div>' +
      '<div id="prato-compositor"></div>' +
      '<div id="prato-hoje"></div>' +
      '<div id="prato-lista"><div class="pcard"><div class="empty-state">Carregando os seus registros…</div></div></div>';
  }

  // Passo 2: a foto escolhida, a refeição e o botão de analisar.
  function compositorHTML(dataUrl) {
    var sug = refeicaoPelaHora();
    var chips = REFEICOES.map(function (r) {
      return '<button class="prato-chip' + (r === sug ? " is-on" : "") + '" type="button" data-prato-ref="' + esc(r) + '">' +
        esc(r) + '</button>';
    }).join("");
    return '<div class="pcard prato-comp">' +
      '<div class="prato-comp__foto"><img src="' + esc(dataUrl) + '" alt="Foto do prato que você acabou de tirar" /></div>' +
      '<p class="prato-comp__lab">Qual refeição é esta?</p>' +
      '<div class="prato-chips">' + chips + '</div>' +
      '<label class="prato-comp__lab" for="prato-obs">Quer me contar algo? (opcional)</label>' +
      '<input class="input" id="prato-obs" type="text" maxlength="200" placeholder="Ex.: comi fora, estava sem tempo…" />' +
      '<div class="prato-comp__acoes">' +
        '<button class="btn btn--primary" type="button" data-prato-analisar>Analisar este prato</button>' +
        '<button class="btn btn--outline" type="button" data-prato-cancelar>Cancelar</button>' +
      '</div>' +
    '</div>';
  }

  function macrosHTML(p) {
    var linhas = [
      ["Proteína", num(p.ptn_g), "g"],
      ["Carboidrato", num(p.cho_g), "g"],
      ["Gordura", num(p.lip_g), "g"]
    ].filter(function (l) { return l[1] != null; });
    if (!linhas.length) return "";
    return '<div class="prato-macros">' + linhas.map(function (l) {
      return '<div class="prato-macro"><span class="prato-macro__v">' + l[1] + l[2] + '</span>' +
        '<span class="prato-macro__k">' + l[0] + '</span></div>';
    }).join("") + '</div>';
  }

  function resultadoHTML(p, extra) {
    extra = extra || {};
    var conf = CONF_TXT[p.confianca] || CONF_TXT.media;
    var kcal = num(p.kcal);

    var itens = (p.itens || []).map(function (i) {
      return '<li><span>' + esc(i.nome) + (i.porcao ? ' — ' + esc(i.porcao) : '') + '</span>' +
        (i.kcal != null ? '<em>' + num(i.kcal) + ' kcal</em>' : '') + '</li>';
    }).join("");

    var bons = (p.pontos_bons || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");
    var alertas = (p.alertas || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");

    return '<div class="pcard prato-result">' +
      '<div class="prato-result__head">' +
        '<h2 class="pcard__title">' + esc(p.refeicao || "Refeição") + '</h2>' +
        '<span class="prato-conf prato-conf--' + esc(p.confianca || "media") + '">' + esc(conf.rotulo) + '</span>' +
      '</div>' +
      (extra.descricao ? '<p class="prato-result__desc">' + esc(extra.descricao) + '</p>' : '') +
      (kcal != null
        ? '<div class="prato-kcal"><span class="prato-kcal__n">~' + kcal + '</span>' +
          '<span class="prato-kcal__u">kcal aproximadas</span></div>'
        : '') +
      macrosHTML(p) +
      (itens ? '<p class="prato-sec">O que eu identifiquei</p><ul class="prato-itens">' + itens + '</ul>' : '') +
      /* O que está bom vem ANTES do que ajustar, de propósito: a paciente
         está mostrando a comida dela: começar pela cobrança ensina a não
         registrar mais. */
      (bons ? '<p class="prato-sec prato-sec--bom">O que está bom</p><ul class="prato-bons">' + bons + '</ul>' : '') +
      (alertas ? '<p class="prato-sec prato-sec--ajuste">O que dá para ajustar</p><ul class="prato-alertas">' + alertas + '</ul>' : '') +
      (extra.comentario ? '<p class="prato-result__fim">' + esc(extra.comentario) + '</p>' : '') +
      '<p class="prato-nota">' + esc(conf.dica) + ' Estimativa por foto — quem avalia o seu caso é a sua nutricionista.</p>' +
    '</div>';
  }

  // Resumo do dia: só aparece com registro de hoje. É o que dá sentido a
  // registrar mais de um prato — ver o dia se somando.
  function hojeHTML(lista) {
    var hoje = lista.filter(function (p) { return ehHoje(p.criado_em); });
    if (!hoje.length) return "";
    var soma = function (k) {
      var t = 0, tem = false;
      hoje.forEach(function (p) { if (p[k] != null) { t += Number(p[k]); tem = true; } });
      return tem ? Math.round(t) : null;
    };
    var kcal = soma("kcal");
    return '<div class="pcard prato-hoje">' +
      '<h2 class="pcard__title">Hoje</h2>' +
      '<p class="prato-hoje__txt">' + hoje.length + (hoje.length === 1 ? ' prato registrado' : ' pratos registrados') +
        (kcal != null ? ', somando cerca de <strong>' + kcal + ' kcal</strong>' : '') + '.</p>' +
      macrosHTML({ ptn_g: soma("ptn_g"), cho_g: soma("cho_g"), lip_g: soma("lip_g") }) +
    '</div>';
  }

  function listaHTML(lista) {
    if (!lista.length) {
      return '<div class="pcard"><div class="empty-state">Você ainda não registrou nenhum prato. ' +
        'O primeiro é o mais difícil — depois vira hábito. 🌸</div></div>';
    }
    var cards = lista.map(function (p) {
      var kcal = num(p.kcal);
      return '<div class="prato-hist" data-prato-id="' + esc(p.id) + '">' +
        '<div class="prato-hist__foto" data-prato-foto="' + esc(p.foto_path) + '"><img alt="" loading="lazy" /></div>' +
        '<div class="prato-hist__txt">' +
          '<span class="prato-hist__ref">' + esc(p.refeicao || "Refeição") + '</span>' +
          '<span class="prato-hist__data">' + esc(dataHoraBR(p.criado_em)) + '</span>' +
          (kcal != null ? '<span class="prato-hist__kcal">~' + kcal + ' kcal</span>' : '') +
          ((p.alertas || []).length
            ? '<span class="prato-hist__flag">' + p.alertas.length + (p.alertas.length === 1 ? ' ajuste' : ' ajustes') + '</span>'
            : '<span class="prato-hist__ok">tudo certo</span>') +
        '</div>' +
        '<button class="prato-hist__del" type="button" data-prato-apagar="' + esc(p.id) + '" ' +
          'data-prato-path="' + esc(p.foto_path) + '" aria-label="Apagar este registro">×</button>' +
      '</div>';
    }).join("");
    return '<div class="pcard"><h2 class="pcard__title">Meus registros</h2>' +
      '<div class="prato-hist-lista">' + cards + '</div></div>';
  }

  /* ---------- comportamento ---------- */

  // Reduz a foto do celular antes de subir: 4 MB viram ~150 KB, a IA
  // enxerga igual, e a paciente no 4G não fica esperando.
  function processarFoto(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Não consegui ler essa foto.")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Esse arquivo não parece ser uma imagem.")); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var s = Math.min(1, MAX_LADO / Math.max(w, h));
          var cw = Math.round(w * s), ch = Math.round(h * s);
          var cv = document.createElement("canvas");
          cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          cv.toBlob(function (blob) {
            if (!blob) { reject(new Error("Não consegui preparar a foto.")); return; }
            resolve({ blob: blob, dataUrl: cv.toDataURL("image/jpeg", QUALIDADE) });
          }, "image/jpeg", QUALIDADE);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function wire(paciente, opts) {
    opts = opts || {};
    var readonly = !!opts.readonly;
    var DB = window.NutriPacientes;
    var pendente = null;      // { blob, dataUrl }
    var refSel = refeicaoPelaHora();
    var lista = [];

    var elComp = document.getElementById("prato-compositor");
    var elHoje = document.getElementById("prato-hoje");
    var elLista = document.getElementById("prato-lista");
    var elFile = document.getElementById("prato-file");
    var elCta = document.querySelector("[data-prato-tirar]");

    /* A nutri em preview vê a tela da paciente, mas não fotografa por ela:
       o registro é da paciente, e um prato inventado pela nutri viraria
       dado clínico falso na ficha. */
    if (readonly && elCta) {
      elCta.disabled = true;
      elCta.textContent = "📷 (a paciente fotografa por aqui)";
    }

    function erro(msg) {
      elComp.innerHTML = '<div class="pcard prato-erro"><p>' + esc(msg) + '</p>' +
        '<button class="btn btn--outline" type="button" data-prato-cancelar>Fechar</button></div>';
    }

    function carregar() {
      if (!DB || !DB.listPratos) return;
      DB.listPratos(paciente.id).then(function (rows) {
        lista = rows;
        elHoje.innerHTML = hojeHTML(lista);
        elLista.innerHTML = listaHTML(lista);
        hidratarFotos();
      }).catch(function () {
        elLista.innerHTML = '<div class="pcard"><div class="empty-state">' +
          'Não consegui carregar os seus registros. Verifique a conexão e recarregue.</div></div>';
      });
    }

    // Miniaturas: uma chamada só para todos os caminhos. Falhar em assinar
    // tira a foto e deixa o texto — o registro continua legível.
    function hidratarFotos() {
      if (!DB || !DB.assinarFotosPrato) return;
      var boxes = [].slice.call(document.querySelectorAll("[data-prato-foto]"));
      if (!boxes.length) return;
      var paths = boxes.map(function (b) { return b.getAttribute("data-prato-foto"); });
      DB.assinarFotosPrato(paths).then(function (mapa) {
        boxes.forEach(function (b) {
          var u = mapa[b.getAttribute("data-prato-foto")];
          var img = b.querySelector("img");
          if (u && img) img.src = u; else b.remove();
        });
      }).catch(function () { boxes.forEach(function (b) { b.remove(); }); });
    }

    function analisar(btn) {
      if (!pendente) return;
      btn.disabled = true;
      btn.textContent = "Analisando…";
      var obsEl = document.getElementById("prato-obs");
      var obs = obsEl ? obsEl.value.trim() : "";
      var path;

      DB.uploadPrato(paciente.id, uuid(), pendente.blob).then(function (p) {
        path = p;
        return DB.analisarPrato(path, refSel, obs);
      }).then(function (r) {
        if (r && r.nao_e_comida) { erro(r.error); return; }
        if (!r || !r.ok || !r.prato) throw new Error("Não consegui analisar essa foto.");
        elComp.innerHTML = resultadoHTML(r.prato, { descricao: r.descricao, comentario: r.comentario });
        pendente = null;
        carregar();
        elComp.scrollIntoView({ behavior: "smooth", block: "start" });
      }).catch(function (e) {
        var m = (e && e.message) || "";
        if (/limite/i.test(m)) {
          erro("Você já registrou bastante coisa hoje. Amanhã o diário abre de novo. 🌸");
        } else if (/muito_grande|too large/i.test(m)) {
          erro("Essa foto ficou grande demais. Tente tirar outra.");
        } else {
          erro("Não consegui analisar agora. Tente de novo daqui a pouco — sua foto não foi perdida.");
        }
        // A foto já subiu mas não virou registro: sem isto o bucket junta
        // órfãs que ninguém nunca vê.
        if (path && DB.removerPrato) {
          window.NutriDBReady.then(function (c) { c.storage.from("pratos").remove([path]); }).catch(function () {});
        }
      });
    }

    // Delegação: o conteúdo do painel é reescrito o tempo todo.
    document.getElementById("pane-prato").addEventListener("click", function (e) {
      var t = e.target;

      if (t.closest("[data-prato-tirar]") && !readonly) { elFile.click(); return; }

      if (t.closest("[data-prato-cancelar]")) {
        elComp.innerHTML = "";
        pendente = null;
        return;
      }

      var chip = t.closest("[data-prato-ref]");
      if (chip) {
        refSel = chip.getAttribute("data-prato-ref");
        elComp.querySelectorAll("[data-prato-ref]").forEach(function (c) {
          c.classList.toggle("is-on", c === chip);
        });
        return;
      }

      if (t.closest("[data-prato-analisar]")) { analisar(t.closest("[data-prato-analisar]")); return; }

      var del = t.closest("[data-prato-apagar]");
      if (del) {
        if (!window.confirm("Apagar este registro? A foto também sai.")) return;
        del.disabled = true;
        DB.removerPrato(del.getAttribute("data-prato-apagar"), del.getAttribute("data-prato-path"))
          .then(carregar)
          .catch(function () { del.disabled = false; });
      }
    });

    if (elFile) {
      elFile.addEventListener("change", function () {
        var f = elFile.files && elFile.files[0];
        elFile.value = "";       // permite escolher a MESMA foto de novo
        if (!f) return;
        elComp.innerHTML = '<div class="pcard"><div class="empty-state">Preparando a foto…</div></div>';
        processarFoto(f).then(function (r) {
          pendente = r;
          refSel = refeicaoPelaHora();
          elComp.innerHTML = compositorHTML(r.dataUrl);
        }).catch(function (e) { erro(e.message || "Não consegui usar essa foto."); });
      });
    }

    carregar();
  }

  window.PratoView = { portalHTML: portalHTML, wire: wire };
})();
