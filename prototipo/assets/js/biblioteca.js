/* ============================================================
   BIBLIOTECA DE E-BOOKS — estilo Kiwify.
   Lista o catálogo (público) e libera a LEITURA só do que o
   usuário adquiriu (ou do que é gratuito). O arquivo vem de um
   bucket PRIVADO do Supabase; quem não tem direito, o banco recusa.
   Requer supabase-client.js incluído ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var CATALOGO = document.getElementById("biblio-grid");
  var LOADING = document.getElementById("biblio-loading");
  var HI = document.getElementById("biblio-hi");
  var READER = document.getElementById("biblio-reader");
  var FRAME = document.getElementById("biblio-frame");
  var RTITLE = document.getElementById("biblio-reader-title");
  // URL da vitrine/checkout p/ quem ainda não tem o material (fallback).
  var COMPRAR_URL = "https://wa.me/5521999999999"; // TODO: trocar pela vitrine/checkout

  var blobEmUso = null; // object URL atual do leitor (revogado ao fechar)

  window.NutriDBReady.then(function (c) {
    return c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html?next=biblioteca.html"); return; }
      var user = r.data.session.user;
      if (HI) HI.textContent = "Olá, " + (nomeCurto(user) || "tudo bem?");
      return carregar(c, user);
    });
  }).catch(function (e) {
    if (LOADING) LOADING.textContent = "Não foi possível carregar sua biblioteca. Verifique sua conexão.";
    console.error(e);
  });

  function nomeCurto(user) {
    var n = (user.user_metadata && user.user_metadata.nome) || "";
    return n ? n.split(" ")[0] : "";
  }

  function carregar(c, user) {
    // Catálogo (público) + acessos do usuário, em paralelo.
    return Promise.all([
      c.from("ebooks").select("*").eq("ativo", true).order("ordem"),
      c.from("ebook_acessos").select("ebook_slug,expira_em").eq("user_id", user.id)
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      var ebooks = res[0].data || [];
      var acessos = (res[1].data || []).filter(function (a) {
        return !a.expira_em || new Date(a.expira_em) > new Date();
      });
      var temTudo = acessos.some(function (a) { return a.ebook_slug === "*"; });
      var slugs = {};
      acessos.forEach(function (a) { slugs[a.ebook_slug] = true; });

      renderizar(c, ebooks, function (eb) {
        return eb.gratuito || temTudo || !!slugs[eb.slug];
      });
    });
  }

  function renderizar(c, ebooks, temAcesso) {
    if (LOADING) LOADING.hidden = true;
    CATALOGO.innerHTML = "";
    if (!ebooks.length) {
      CATALOGO.innerHTML = '<p class="biblio-empty">Nenhum material disponível ainda.</p>';
      return;
    }
    ebooks.forEach(function (eb) {
      var liberado = temAcesso(eb);
      var card = document.createElement("article");
      card.className = "biblio-card" + (liberado ? "" : " is-locked");

      var capa = eb.capa_url
        ? '<img class="biblio-cover" src="' + eb.capa_url + '" alt="">'
        : '<div class="biblio-cover biblio-cover--ph">' + escapeHtml(eb.titulo) + "</div>";

      var selo = eb.gratuito
        ? '<span class="biblio-badge biblio-badge--free">Grátis</span>'
        : (liberado ? '<span class="biblio-badge biblio-badge--own">Adquirido</span>' : "");

      var acao = liberado
        ? '<button class="btn btn--primary btn--block biblio-ler" type="button">Ler agora</button>'
        : '<a class="btn btn--ghost btn--block" href="' + COMPRAR_URL + '" target="_blank" rel="noopener">🔒 Adquirir</a>';

      card.innerHTML =
        '<div class="biblio-cover-wrap">' + capa + selo + "</div>" +
        '<div class="biblio-body">' +
          "<h3>" + escapeHtml(eb.titulo) + "</h3>" +
          (eb.subtitulo ? "<p>" + escapeHtml(eb.subtitulo) + "</p>" : "") +
          '<div class="biblio-foot"></div>' +
        "</div>";
      card.querySelector(".biblio-foot").innerHTML = acao;

      if (liberado) {
        card.querySelector(".biblio-ler").addEventListener("click", function () {
          abrirLeitor(c, eb, this);
        });
      }
      CATALOGO.appendChild(card);
    });
  }

  function abrirLeitor(c, eb, btn) {
    var txt = btn.textContent;
    btn.disabled = true; btn.textContent = "Abrindo…";
    c.storage.from("ebooks").download(eb.arquivo).then(function (res) {
      btn.disabled = false; btn.textContent = txt;
      if (res.error || !res.data) {
        alert("Não foi possível abrir este material. Se você já adquiriu, fale com o suporte.");
        console.error(res.error);
        return;
      }
      if (blobEmUso) { URL.revokeObjectURL(blobEmUso); }
      blobEmUso = URL.createObjectURL(res.data.slice(0, res.data.size, "text/html"));
      FRAME.src = blobEmUso;
      RTITLE.textContent = eb.titulo;
      READER.hidden = false;
      document.body.style.overflow = "hidden";
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = txt;
      alert("Não foi possível abrir este material agora.");
      console.error(e);
    });
  }

  function fecharLeitor() {
    READER.hidden = true;
    FRAME.src = "about:blank";
    if (blobEmUso) { URL.revokeObjectURL(blobEmUso); blobEmUso = null; }
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-fechar-leitor]")) fecharLeitor();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !READER.hidden) fecharLeitor();
  });

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
})();
