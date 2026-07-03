/* ============================================================
   COMUNIDADE — render do feed, filtros por categoria, curtir,
   comentar (mock), compositor de post e widgets laterais.
   Depende de comunidade-data.js (window.COMUNIDADE_DATA).
   ============================================================ */
(function () {
  "use strict";

  var data = window.COMUNIDADE_DATA || { posts: [], categorias: ["Todos"], destaque: null };

  var state = {
    categoria: "Todos",
    posts: data.posts.map(function (p) { return Object.assign({ aberto: false }, p); })
  };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function avatar(iniciais, cor, sm) {
    return '<span class="avatar avatar--' + cor + (sm ? " avatar--sm" : "") + '">' + esc(iniciais) + "</span>";
  }

  /* ---------- Filtro ---------- */
  function visiblePosts() {
    // fixados sempre primeiro; depois respeita o filtro
    var list = state.posts.filter(function (p) {
      return state.categoria === "Todos" || p.categoria === state.categoria;
    });
    return list.slice().sort(function (a, b) { return (b.fixado ? 1 : 0) - (a.fixado ? 1 : 0); });
  }

  /* ---------- Render de um post ---------- */
  function tagsHTML(tags) {
    if (!tags || !tags.length) return "";
    return '<div class="post__tags">' + tags.map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("") + "</div>";
  }

  function comentariosHTML(p) {
    if (!p.aberto) return "";
    var lista = (p.comentariosLista || []).map(function (c) {
      return '' +
        '<div class="cmt">' +
          avatar(c.iniciais, c.cor, true) +
          '<div class="cmt__body">' +
            '<div class="cmt__head"><strong>' + esc(c.autor) + '</strong>' +
              '<span class="cmt__time">· ' + esc(c.tempo) + '</span></div>' +
            '<p class="cmt__text">' + esc(c.texto) + '</p>' +
          '</div>' +
        '</div>';
    }).join("");
    if (!lista) lista = '<p class="cmt__empty">Seja a primeira a comentar. 💬</p>';
    return '' +
      '<div class="post__comments">' +
        lista +
        '<form class="cmt-form" data-id="' + p.id + '">' +
          avatar("AL", "rosa", true) +
          '<input class="cmt-form__input" type="text" placeholder="Escreva um comentário…" aria-label="Comentário" />' +
          '<button class="cmt-form__send" type="submit" aria-label="Enviar">➤</button>' +
        '</form>' +
      '</div>';
  }

  function postHTML(p) {
    return '' +
      '<article class="card post' + (p.fixado ? " post--fix" : "") + '" data-id="' + p.id + '">' +
        (p.fixado ? '<div class="post__pin">📌 Fixado pela moderação</div>' : '') +
        '<header class="post__head">' +
          avatar(p.iniciais, p.cor) +
          '<div class="post__ident">' +
            '<div class="post__autor">' + esc(p.autor) +
              '<span class="post__crn">' + esc(p.crn) + '</span></div>' +
            '<div class="post__meta">' + esc(p.especialidade) +
              ' · ' + esc(p.tempo) + ' · <span class="post__cat">' + esc(p.categoria) + '</span></div>' +
          '</div>' +
          '<button class="post__more" type="button" aria-label="Mais opções">⋯</button>' +
        '</header>' +
        '<div class="post__body">' +
          '<p class="post__text">' + esc(p.texto) + '</p>' +
          (p.imagem ? '<div class="post__media">' + p.imagem + '</div>' : '') +
          tagsHTML(p.tags) +
        '</div>' +
        '<div class="post__stats">' +
          '<span>💚 ' + p.curtidas + '</span>' +
          '<span>' + p.comentarios + ' comentários</span>' +
        '</div>' +
        '<div class="post__actions">' +
          '<button class="post__act' + (p.curtido ? " is-on" : "") + '" data-act="like">' +
            (p.curtido ? "💚" : "🤍") + ' Curtir</button>' +
          '<button class="post__act" data-act="comment">💬 Comentar</button>' +
          '<button class="post__act" data-act="share">↗ Compartilhar</button>' +
        '</div>' +
        comentariosHTML(p) +
      '</article>';
  }

  function renderPosts() {
    var host = el("posts");
    var list = visiblePosts();
    if (!list.length) {
      host.innerHTML = '<div class="posts__empty">Nenhuma publicação em “' + esc(state.categoria) + '” ainda. Que tal começar uma? ✨</div>';
      return;
    }
    host.innerHTML = list.map(postHTML).join("");
  }

  /* ---------- Chips ---------- */
  function renderChips() {
    var host = el("com-chips");
    host.innerHTML = "";
    data.categorias.forEach(function (cat) {
      var b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = cat;
      b.setAttribute("aria-pressed", cat === state.categoria ? "true" : "false");
      b.addEventListener("click", function () {
        state.categoria = cat;
        renderChips();
        renderPosts();
      });
      host.appendChild(b);
    });
  }

  /* ---------- Interações nos posts (delegação) ---------- */
  function findPost(id) {
    return state.posts.filter(function (p) { return p.id === id; })[0];
  }

  function onPostsClick(e) {
    var actBtn = e.target.closest(".post__act");
    var card = e.target.closest(".post");
    if (!card) return;
    var p = findPost(card.getAttribute("data-id"));
    if (!p || !actBtn) return;
    var act = actBtn.getAttribute("data-act");

    if (act === "like") {
      p.curtido = !p.curtido;
      p.curtidas += p.curtido ? 1 : -1;
      renderPosts();
    } else if (act === "comment") {
      p.aberto = !p.aberto;
      renderPosts();
      if (p.aberto) {
        var inp = document.querySelector('.post[data-id="' + p.id + '"] .cmt-form__input');
        if (inp) inp.focus();
      }
    } else if (act === "share") {
      actBtn.textContent = "✓ Link copiado";
      setTimeout(function () { renderPosts(); }, 1400);
    }
  }

  function onPostsSubmit(e) {
    var form = e.target.closest(".cmt-form");
    if (!form) return;
    e.preventDefault();
    var p = findPost(form.getAttribute("data-id"));
    var inp = form.querySelector(".cmt-form__input");
    var txt = (inp.value || "").trim();
    if (!p || !txt) return;
    p.comentariosLista = p.comentariosLista || [];
    p.comentariosLista.push({ autor: "Ana Luísa Rocha", iniciais: "AL", cor: "rosa", tempo: "agora", texto: txt });
    p.comentarios += 1;
    renderPosts();
    var reinp = document.querySelector('.post[data-id="' + p.id + '"] .cmt-form__input');
    if (reinp) reinp.focus();
  }

  /* ---------- Compositor ---------- */
  function initComposer() {
    var box = el("composer-box");
    var open = el("composer-open");
    var cancel = el("composer-cancel");
    var topBtn = el("btn-novo-post");
    var sel = el("composer-cat");

    data.categorias.filter(function (c) { return c !== "Todos"; }).forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });

    function show() {
      el("composer-open").hidden = true;
      box.hidden = false;
      el("composer-text").focus();
    }
    function hide() {
      box.hidden = true;
      el("composer-open").hidden = false;
      el("composer-text").value = "";
    }

    open.addEventListener("click", show);
    if (topBtn) topBtn.addEventListener("click", show);
    cancel.addEventListener("click", hide);

    box.addEventListener("submit", function (e) {
      e.preventDefault();
      var txt = (el("composer-text").value || "").trim();
      if (!txt) return;
      var cat = sel.value;
      state.posts.unshift({
        id: "novo-" + Date.now(),
        autor: "Ana Luísa Rocha", crn: "CRN-3 12345", iniciais: "AL", cor: "rosa",
        especialidade: "Você", tempo: "agora", categoria: cat,
        texto: txt, tags: [], curtidas: 0, comentarios: 0, curtido: false,
        comentariosLista: [], aberto: false
      });
      hide();
      state.categoria = "Todos";
      renderChips();
      renderPosts();
      var host = el("posts");
      if (host.firstElementChild) host.firstElementChild.classList.add("post--new");
    });
  }

  /* ---------- Widgets laterais ---------- */
  function renderHero() {
    var d = data.destaque, host = el("side-hero");
    if (!d) { host.style.display = "none"; return; }
    host.innerHTML = '' +
      '<div class="hero__eyebrow">' + esc(d.eyebrow) + '</div>' +
      '<h2 class="hero__title">' + esc(d.title) + '</h2>' +
      '<p class="hero__txt">' + esc(d.texto) + '</p>' +
      '<div class="hero__meta"><span>👥 ' + esc(d.membros) + '</span>' +
        '<span class="hero__online">🟢 ' + esc(d.online) + '</span></div>';
  }

  function renderTags() {
    var count = {};
    state.posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { count[t] = (count[t] || 0) + 1 + (p.curtidas / 100); });
    });
    var top = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 8);
    el("side-tags").innerHTML = top.map(function (t, i) {
      return '<button class="side-tag" type="button">' +
        '<span class="side-tag__rank">' + (i + 1) + '</span> #' + esc(t) + '</button>';
    }).join("");
  }

  function renderPeople() {
    var people = [
      { nome: "Dra. Renata Lopes", esp: "Endocrinologia nutricional", iniciais: "RL", cor: "vinho" },
      { nome: "Bruno Teixeira", esp: "Nutrição esportiva", iniciais: "BT", cor: "ok" },
      { nome: "Marina Alves", esp: "Materno-infantil", iniciais: "MA", cor: "rosa" }
    ];
    el("side-people").innerHTML = people.map(function (pp) {
      return '' +
        '<div class="person">' +
          avatar(pp.iniciais, pp.cor, true) +
          '<div class="person__info"><div class="person__nome">' + esc(pp.nome) + '</div>' +
            '<div class="person__esp">' + esc(pp.esp) + '</div></div>' +
          '<button class="btn btn--outline person__btn" type="button">Seguir</button>' +
        '</div>';
    }).join("");
  }

  /* ---------- Nav mobile (padrão das outras telas) ---------- */
  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  function init() {
    renderChips();
    renderPosts();
    renderHero();
    renderTags();
    renderPeople();
    initComposer();
    initMobileNav();

    var posts = el("posts");
    posts.addEventListener("click", onPostsClick);
    posts.addEventListener("submit", onPostsSubmit);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
