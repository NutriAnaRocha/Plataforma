/* ============================================================
   vitrine.js — a busca de nutricionistas em formato de vitrine.

   Substitui o quiz de 4 passos (16/09/2026). O quiz pedia quatro
   respostas antes de mostrar UMA pessoa; aqui a lista abre cheia e
   os filtros refinam, como em qualquer marketplace. Quem não sabe o
   que quer vê gente de verdade no primeiro segundo; quem sabe, filtra.

   DECISÕES QUE ESTE ARQUIVO CARREGA
   - Todo filtro é aplicado no SERVIDOR (edge function `diretorio-buscar`),
     inclusive preço e ordenação. O navegador não recebe lista grande para
     peneirar: o `total` do rodapé precisa bater com o filtro, e paginar por
     cima de uma peneira local devolveria página curta sem motivo.
   - Nota e número de avaliações NÃO entram aqui (migração 0093: sinal
     interno, e base pequena demais para virar reputação pública). Quando
     entrarem, é um interruptor único na function — nada muda nesta tela.
   - Quem ainda não publicou o valor NUNCA some por causa do filtro de
     preço: vai para o fim da lista com "Valor sob consulta". Sumir por
     falta de um campo opcional puniria quem acabou de publicar.
   - O estado da busca mora na URL (?temas=&estado=…). Link de busca
     filtrada é compartilhável e o botão voltar do navegador funciona.
   ============================================================ */
(function () {
  "use strict";

  var D = window.Diretorio;
  var LIMITE = 12;

  var el = {
    form:       document.getElementById("form-busca"),
    busca:      document.getElementById("busca"),
    filtros:    document.getElementById("filtros"),
    abrir:      document.getElementById("abrir-filtros"),
    fechar:     document.getElementById("fechar-filtros"),
    temas:      document.getElementById("temas"),
    estado:     document.getElementById("estado"),
    precoMin:   document.getElementById("preco-min"),
    precoMax:   document.getElementById("preco-max"),
    atalhos:    document.getElementById("atalhos-preco"),
    novos:      document.getElementById("aceita-novos"),
    ordem:      document.getElementById("ordem"),
    limpar:     document.getElementById("limpar"),
    aplicados:  document.getElementById("aplicados"),
    contador:   document.getElementById("contador"),
    lista:      document.getElementById("lista"),
    mais:       document.getElementById("mais"),
    maisBox:    document.getElementById("mais-box")
  };

  /* Uma busca em andamento por vez: se a pessoa marca três especialidades
     rápido, a resposta da primeira não pode sobrescrever a da terceira. */
  var requisicao = 0;
  var pagina = 0;
  var acumulado = [];

  /* ---------- dinheiro ---------- */

  /** "150" · "150,50" · "R$ 1.200" -> centavos. Vazio/lixo -> null. */
  function centavos(txt) {
    var s = String(txt == null ? "" : txt).replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    if (!s) return null;
    var n = parseFloat(s);
    return isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }

  function reais(cents) {
    return cents == null ? "" : String(Math.round(cents / 100));
  }

  /* ---------- estado da tela <-> URL ---------- */

  function lerTela() {
    var temas = Array.prototype.slice.call(el.temas.querySelectorAll("input:checked"))
      .map(function (i) { return i.value; });
    var modalidade = (el.filtros.querySelector('input[name="modalidade"]:checked') || {}).value || "tanto_faz";
    return {
      busca: el.busca.value.trim(),
      temas: temas,
      modalidade: modalidade,
      estado: el.estado.value || "",
      preco_min: centavos(el.precoMin.value),
      preco_max: centavos(el.precoMax.value),
      aceita_novos: !!el.novos.checked,
      ordem: el.ordem.value || "relevancia"
    };
  }

  function paraUrl(f) {
    var p = new URLSearchParams();
    if (f.busca) p.set("q", f.busca);
    if (f.temas.length) p.set("temas", f.temas.join("|"));
    if (f.modalidade && f.modalidade !== "tanto_faz") p.set("modo", f.modalidade);
    if (f.estado) p.set("uf", f.estado);
    if (f.preco_min != null) p.set("min", reais(f.preco_min));
    if (f.preco_max != null) p.set("max", reais(f.preco_max));
    if (f.aceita_novos) p.set("novos", "1");
    if (f.ordem && f.ordem !== "relevancia") p.set("ordem", f.ordem);
    var s = p.toString();
    history.replaceState(null, "", s ? "?" + s : location.pathname);
  }

  /** Repõe na tela o que veio na URL. Roda depois das especialidades. */
  function daUrl() {
    var p = new URLSearchParams(location.search);
    el.busca.value = p.get("q") || "";
    var temas = (p.get("temas") || "").split("|").filter(Boolean);
    Array.prototype.slice.call(el.temas.querySelectorAll("input")).forEach(function (i) {
      i.checked = temas.indexOf(i.value) !== -1;
    });
    var modo = p.get("modo") || "tanto_faz";
    var radio = el.filtros.querySelector('input[name="modalidade"][value="' + modo + '"]');
    if (radio) radio.checked = true;
    if (p.get("uf")) el.estado.value = p.get("uf");
    el.precoMin.value = p.get("min") || "";
    el.precoMax.value = p.get("max") || "";
    el.novos.checked = p.get("novos") === "1";
    if (p.get("ordem")) el.ordem.value = p.get("ordem");
  }

  /* ---------- pílulas do que está filtrado ---------- */

  var ROTULO_MODO = { online: "Online", presencial: "Presencial" };

  function pilula(texto, tipo, valor) {
    return '<button type="button" class="pilula" data-tipo="' + tipo + '" data-valor="' +
      D.esc(valor) + '">' + D.esc(texto) +
      '<span aria-hidden="true">×</span><span class="sr">Remover filtro</span></button>';
  }

  function desenharAplicados(f) {
    var itens = [];
    if (f.busca) itens.push(pilula('"' + f.busca + '"', "busca", ""));
    f.temas.forEach(function (t) { itens.push(pilula(t, "tema", t)); });
    if (f.modalidade !== "tanto_faz") itens.push(pilula(ROTULO_MODO[f.modalidade] || f.modalidade, "modalidade", ""));
    if (f.estado) itens.push(pilula(f.estado, "estado", ""));
    if (f.preco_min != null || f.preco_max != null) {
      var r = f.preco_min != null && f.preco_max != null
        ? "R$ " + reais(f.preco_min) + " a R$ " + reais(f.preco_max)
        : f.preco_min != null ? "A partir de R$ " + reais(f.preco_min)
                              : "Até R$ " + reais(f.preco_max);
      itens.push(pilula(r, "preco", ""));
    }
    if (f.aceita_novos) itens.push(pilula("Aceitando novos pacientes", "novos", ""));

    el.aplicados.innerHTML = itens.join("");
    el.aplicados.hidden = !itens.length;
    el.limpar.hidden = !itens.length;
  }

  el.aplicados.addEventListener("click", function (ev) {
    var b = ev.target.closest(".pilula");
    if (!b) return;
    var tipo = b.getAttribute("data-tipo");
    if (tipo === "busca") el.busca.value = "";
    if (tipo === "estado") el.estado.value = "";
    if (tipo === "novos") el.novos.checked = false;
    if (tipo === "preco") { el.precoMin.value = ""; el.precoMax.value = ""; marcarAtalho(); }
    if (tipo === "modalidade") {
      var r = el.filtros.querySelector('input[name="modalidade"][value="tanto_faz"]');
      if (r) r.checked = true;
    }
    if (tipo === "tema") {
      var alvo = b.getAttribute("data-valor");
      Array.prototype.slice.call(el.temas.querySelectorAll("input")).forEach(function (i) {
        if (i.value === alvo) i.checked = false;
      });
    }
    buscar(true);
  });

  /* ---------- atalhos de preço ---------- */

  /** O atalho é só uma forma rápida de preencher os dois campos. */
  function marcarAtalho() {
    var min = el.precoMin.value.trim();
    var max = el.precoMax.value.trim();
    Array.prototype.slice.call(el.atalhos.querySelectorAll("button")).forEach(function (b) {
      b.classList.toggle("is-on", b.dataset.min === min && b.dataset.max === max && (min || max));
    });
  }

  el.atalhos.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b) return;
    var ligado = b.classList.contains("is-on");
    el.precoMin.value = ligado ? "" : (b.dataset.min || "");
    el.precoMax.value = ligado ? "" : (b.dataset.max || "");
    marcarAtalho();
    buscar(true);
  });

  /* ---------- a busca ---------- */

  function esqueleto() {
    return '<div class="cards"><div class="esqueleto"></div><div class="esqueleto"></div>' +
      '<div class="esqueleto"></div><div class="esqueleto"></div></div>';
  }

  function plural(n) {
    return n === 1 ? "1 nutricionista encontrada" : n.toLocaleString("pt-BR") + " nutricionistas encontradas";
  }

  function buscar(reset) {
    var f = lerTela();
    paraUrl(f);
    desenharAplicados(f);
    marcarAtalho();

    if (reset) { pagina = 0; acumulado = []; el.lista.innerHTML = esqueleto(); }
    el.maisBox.hidden = true;
    el.contador.textContent = reset ? "Buscando…" : el.contador.textContent;

    var meu = ++requisicao;
    D.lista({
      busca: f.busca,
      temas: f.temas,
      modalidade: f.modalidade,
      estado: f.estado,
      preco_min_cents: f.preco_min,
      preco_max_cents: f.preco_max,
      aceita_novos: f.aceita_novos || "",
      ordem: f.ordem,
      pagina: pagina,
      limite: LIMITE
    }).then(function (dados) {
      if (meu !== requisicao) return;          // resposta velha: descarta
      acumulado = acumulado.concat(dados.nutris || []);
      el.contador.textContent = plural(dados.total || 0);

      /* Agrupar "Perfis em destaque" só faz sentido na ordem por relevância.
         Ordenado por preço, uma faixa no topo desrespeitaria o que a pessoa
         pediu — e seria exatamente o ranking pago que o rodapé nega. */
      D.desenharLista(el.lista, { nutris: acumulado }, { agrupar: f.ordem === "relevancia" });

      el.maisBox.hidden = !dados.tem_mais;
      el.mais.disabled = false;
      el.mais.textContent = "Ver mais nutricionistas";
    }).catch(function () {
      if (meu !== requisicao) return;
      el.contador.textContent = "";
      el.lista.innerHTML = '<div class="aviso"><strong>Não consegui buscar agora</strong>' +
        "Verifique a conexão e tente de novo em instantes.</div>";
    });
  }

  /* Digitação espera; clique não. */
  var timer;
  function adiar() { clearTimeout(timer); timer = setTimeout(function () { buscar(true); }, 450); }

  el.busca.addEventListener("input", adiar);
  el.form.addEventListener("submit", function () { clearTimeout(timer); buscar(true); });
  document.getElementById("btn-buscar").addEventListener("click", function () { clearTimeout(timer); buscar(true); });
  el.precoMin.addEventListener("input", adiar);
  el.precoMax.addEventListener("input", adiar);
  el.filtros.addEventListener("change", function (ev) {
    if (ev.target.id === "preco-min" || ev.target.id === "preco-max") return;
    buscar(true);
  });
  el.ordem.addEventListener("change", function () { buscar(true); });

  el.mais.addEventListener("click", function () {
    pagina += 1;
    el.mais.disabled = true;
    el.mais.textContent = "Carregando…";
    buscar(false);
  });

  el.limpar.addEventListener("click", function () {
    el.busca.value = "";
    el.estado.value = "";
    el.precoMin.value = "";
    el.precoMax.value = "";
    el.novos.checked = false;
    el.ordem.value = "relevancia";
    Array.prototype.slice.call(el.temas.querySelectorAll("input")).forEach(function (i) { i.checked = false; });
    var r = el.filtros.querySelector('input[name="modalidade"][value="tanto_faz"]');
    if (r) r.checked = true;
    buscar(true);
  });

  /* ---------- painel de filtros no celular ---------- */

  function painel(aberto) {
    el.filtros.classList.toggle("is-aberto", aberto);
    document.body.classList.toggle("sem-rolagem", aberto);
    el.abrir.setAttribute("aria-expanded", aberto ? "true" : "false");
  }
  el.abrir.addEventListener("click", function () { painel(true); });
  el.fechar.addEventListener("click", function () { painel(false); });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && el.filtros.classList.contains("is-aberto")) painel(false);
  });

  /* ---------- partida ---------- */

  el.lista.innerHTML = esqueleto();
  D.filtros().then(function (r) {
    el.temas.innerHTML = (r.especialidades || []).map(function (e) {
      return '<label class="opcao opcao--fina"><input type="checkbox" name="tema" value="' +
        D.esc(e.nome) + '"><span>' + D.esc(e.nome) + "</span></label>";
    }).join("");
    el.estado.innerHTML = '<option value="">Qualquer estado</option>' +
      (r.estados || []).map(function (uf) {
        return '<option value="' + D.esc(uf) + '">' + D.esc(uf) + "</option>";
      }).join("");
  }).catch(function () {
    el.temas.innerHTML = '<p class="ajuda">Não consegui carregar as especialidades agora.</p>';
  }).then(function () {
    daUrl();
    buscar(true);
  });
})();
