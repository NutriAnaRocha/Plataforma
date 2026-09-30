/* ============================================================
   diretorio.js — a vitrine pública, do lado do navegador.

   Conversa com UMA edge function (`diretorio-buscar`) e com mais
   nada. Não usa supabase-client.js de propósito: estas páginas
   abrem sem login, e o client do app instala sessão, refresh token
   e listeners que não têm o que fazer aqui.

   A lista de colunas que chega já vem filtrada no servidor — o
   que o navegador não recebe, ninguém lê no "ver código-fonte".
   ============================================================ */
(function (global) {
  "use strict";

  var URL_FN = "https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/diretorio-buscar";
  var ANON = "sb_publishable_WinaFUxjvv0ODjSs7sT2dQ_k7GlLLxh";

  /* WhatsApp da NutriPlat. Enquanto a solicitação dentro da plataforma não
     existe (Fase 3), o contato passa por aqui e a mensagem já nomeia a
     nutricionista escolhida — é a NutriPlat intermediando, não a Ana se
     apresentando como se fosse a profissional do perfil. */
  var WHATS = "5521994094557";

  function post(body) {
    return fetch(URL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw Object.assign(new Error(j.error || "falha"), { codigo: j.error, status: r.status });
        return j;
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/);
    return ((p[0] || "")[0] || "" ) + ((p[p.length - 1] || "")[0] || "");
  }

  function preco(cents) {
    if (!cents && cents !== 0) return "";
    return "R$ " + (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* A NOTA PÚBLICA ENTRA AQUI — e só aqui.
     Hoje a function não manda avaliacao_media/avaliacao_qtd (migração 0093:
     sinal interno, e base pequena demais para virar reputação). Quando o
     interruptor MOSTRAR_NOTA da function virar, os campos chegam e este selo
     aparece sozinho, no card e na página da nutri. Nada mais muda. */
  function selo(n) {
    if (n.avaliacao_media == null || !n.avaliacao_qtd) return "";
    var media = Number(n.avaliacao_media).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return '<span class="card__nota">★ ' + esc(media) + " <small>(" + esc(n.avaliacao_qtd) + ")</small></span>";
  }

  function modalidades(n) {
    var m = [];
    if (n.atende_online) m.push("Online");
    if (n.atende_presencial) m.push("Presencial");
    return m;
  }

  /** A foto quando existe; as iniciais quando não — nunca um quadrado vazio. */
  function foto(n, classe) {
    if (n.avatar_url) {
      return '<img class="' + classe + '" src="' + esc(n.avatar_url) +
             '" alt="Foto de ' + esc(n.nome) + '" loading="lazy">';
    }
    return '<div class="' + classe + '" aria-hidden="true">' + esc(iniciais(n.nome).toUpperCase()) + "</div>";
  }

  function linkWhats(nome) {
    var msg = "Olá! Vim pela NutriPlat e gostaria de falar com a nutricionista " + nome + " 🌿";
    return "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(msg);
  }

  /* Instagram e site no cartão. O cartão inteiro já é um <a>, e link dentro
     de link é HTML inválido: viram <span data-ext> abertos pelo clique abaixo. */
  var ICO_IG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  var ICO_SITE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';

  function usuarioIg(v) {
    return String(v || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "").replace(/[/?#].*$/, "");
  }

  /** "https://www.site.com.br/" → "site.com.br": o paciente vê para onde vai. */
  function siteRotulo(url) {
    return String(url || "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
  }

  function redes(n) {
    var itens = [], ig = usuarioIg(n.instagram);
    if (ig) itens.push('<span class="card__rede" role="link" tabindex="0" data-ext="https://instagram.com/' + esc(ig) + '">' + ICO_IG + "@" + esc(ig) + "</span>");
    if (n.site) {
      var href = /^https?:\/\//i.test(n.site) ? n.site : "https://" + n.site;
      itens.push('<span class="card__rede" role="link" tabindex="0" data-ext="' + esc(href) + '">' + ICO_SITE + esc(siteRotulo(n.site)) + "</span>");
    }
    return itens.length ? '<div class="card__redes">' + itens.join("") + "</div>" : "";
  }

  function abrirExterno(e) {
    var r = e.target.closest && e.target.closest("[data-ext]");
    if (!r || (e.type === "keydown" && e.key !== "Enter")) return;
    e.preventDefault(); e.stopPropagation();
    var url = r.getAttribute("data-ext");
    if (/^https:\/\//i.test(url)) window.open(url, "_blank", "noopener");
  }
  document.addEventListener("click", abrirExterno, true);
  document.addEventListener("keydown", abrirExterno, true);

  function cartao(n) {
    var areas = (Array.isArray(n.area_atuacao) ? n.area_atuacao : []).slice(0, 3);
    var chips = areas.map(function (a) { return '<span class="chip">' + esc(a) + "</span>"; })
      .concat(modalidades(n).map(function (m) { return '<span class="chip chip--modo">' + m + "</span>"; }));
    if (n.plano_tier === "completo") chips.unshift('<span class="chip chip--selo">Destaque</span>');

    var local = [n.cidade, n.estado].filter(Boolean).join(" · ");
    var p = preco(n.preco_consulta_cents);

    return '<a class="card' + (n.plano_tier === "completo" ? " card--destaque" : "") +
      '" href="/nutri/' + esc(n.slug) + '">' +
      '<div class="card__topo">' + foto(n, "card__foto") +
        "<div><div class=\"card__nome\">" + esc(n.nome) + "</div>" +
        '<div class="card__crn">' + esc([n.crn ? "CRN " + n.crn : "", local].filter(Boolean).join(" · ")) +
        "</div>" + selo(n) + "</div>" +
      "</div>" +
      '<div class="chips">' + chips.join("") + "</div>" +
      (n.apresentacao ? '<p class="card__bio">' + esc(n.apresentacao) + "</p>" : "") +
      redes(n) +
      '<div class="card__rodape">' +
        /* Sem valor publicado o rodapé dizia nada e o cartão parecia quebrado.
           "Valor sob consulta" é honesto e mantém o alinhamento da grade. */
        (p ? '<span class="card__preco">' + p + "</span>"
           : '<span class="card__preco card__preco--vazio">Valor sob consulta</span>') +
        (n.aceita_novos === false
          ? '<span class="chip chip--modo">Agenda fechada</span>'
          : '<span class="btn btn--contorno">Ver perfil</span>') +
      "</div></a>";
  }

  /**
   * Desenha a lista.
   * `opcoes.agrupar` (padrão true) separa a faixa de destaque — e diz que ela
   * é paga. Na vitrine, ordenar por VALOR desliga o agrupamento: uma faixa
   * fixa no topo desrespeitaria a ordem pedida e pareceria posição comprada,
   * que é justamente o que o rodapé da página nega.
   */
  function desenharLista(alvo, dados, opcoes) {
    var agrupar = !opcoes || opcoes.agrupar !== false;
    var nutris = dados.nutris || [];

    if (!nutris.length) {
      alvo.innerHTML = '<div class="aviso"><strong>Nenhuma nutricionista encontrada</strong>' +
        "Tente ampliar a busca: outra modalidade, outro estado, outra faixa de valor " +
        "ou menos especialidades marcadas.</div>";
      return;
    }

    if (!agrupar) {
      alvo.innerHTML = '<div class="cards">' + nutris.map(cartao).join("") + "</div>";
      return;
    }

    var destaque = nutris.filter(function (n) { return n.plano_tier === "completo"; });
    var resto = nutris.filter(function (n) { return n.plano_tier !== "completo"; });
    var html = "";
    if (destaque.length) {
      html += '<div class="faixa__titulo"><h3>Perfis em destaque</h3>' +
        "<small>Profissionais do plano Indicada, que assinam para aparecer aqui</small></div>" +
        '<div class="cards">' + destaque.map(cartao).join("") + "</div>";
    }
    if (resto.length) {
      html += (destaque.length ? '<div class="faixa__titulo" style="margin-top:var(--sp-6)"><h3>Todas as profissionais</h3></div>' : "") +
        '<div class="cards">' + resto.map(cartao).join("") + "</div>";
    }
    alvo.innerHTML = html;
  }

  global.Diretorio = {
    post: post,
    esc: esc,
    foto: foto,
    preco: preco,
    selo: selo,
    modalidades: modalidades,
    usuarioIg: usuarioIg,
    siteRotulo: siteRotulo,
    ICO_IG: ICO_IG,
    ICO_SITE: ICO_SITE,
    linkWhats: linkWhats,
    cartao: cartao,
    desenharLista: desenharLista,
    filtros: function () { return post({ acao: "filtros" }); },
    lista: function (params) {
      var b = { acao: "lista" };
      Object.keys(params || {}).forEach(function (k) {
        var v = params[k];
        if (v !== "" && v != null && !(Array.isArray(v) && !v.length)) b[k] = v;
      });
      return post(b);
    },
    perfil: function (slug) { return post({ acao: "perfil", slug: slug }); }
  };
})(window);
