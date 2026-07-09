/* ============================================================
   FEED — render dos cards, chips de categoria, carrossel (auto 10s),
   filtro por categoria e priorização pelas áreas do nutricionista.
   Depende de feed-data.js (window.FEED_DATA) e personalize.js.
   ============================================================ */
(function () {
  "use strict";

  var INTERVAL_MS = 10000; // auto-avanço a cada 10s (briefing)

  var data = window.FEED_DATA || { cards: [], categorias: ["Todos"], semana: null };

  var els = {
    chips: document.getElementById("chips"),
    viewport: document.getElementById("carousel-viewport"),
    dots: document.getElementById("carousel-dots"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    week: document.getElementById("highlight-week")
  };

  var state = {
    categoria: "Todos",
    cards: [],
    index: 0,
    timer: null
  };

  /* ---------- Helpers ---------- */
  function stars(n) {
    var on = "", off = "";
    for (var i = 0; i < 5; i++) { (i < n ? (on += "★") : (off += "★")); }
    return '<span class="stars"><span class="stars__on">' + on +
           '</span><span class="stars__off">' + off + '</span></span>';
  }

  // Ordena: cards que casam com as áreas do nutri vêm primeiro
  function prioritize(cards) {
    var areas = (window.Personalize && window.Personalize.get()) || [];
    if (!areas.length) return cards.slice();
    return cards.slice().sort(function (a, b) {
      var am = (a.areas || []).some(function (x) { return areas.indexOf(x) > -1; });
      var bm = (b.areas || []).some(function (x) { return areas.indexOf(x) > -1; });
      return (bm === am) ? 0 : (bm ? 1 : -1);
    });
  }

  function filterByCategoria(cards) {
    if (state.categoria === "Todos") return cards;
    return cards.filter(function (c) { return c.categoria === state.categoria; });
  }

  // Rodapé do card: SEMPRE direciona para a página interna do artigo
  // (artigo.html?id=…), que mostra o resumo científico completo e, quando
  // existir, o link para o estudo original. Nada de link morto ("#") que
  // apenas recarrega a página.
  function articleLinkHTML(c) {
    return '<a class="news-card__link" href="artigo.html?id=' +
           encodeURIComponent(c.id) + '">📚 Ler artigo completo →</a>';
  }

  /* ---------- Render ---------- */
  function cardHTML(c) {
    return '' +
      '<article class="news-card">' +
        '<div class="news-card__top">' +
          '<span class="tag">' + c.categoria + '</span>' +
          '<span class="news-card__date">' + c.data + '</span>' +
        '</div>' +
        '<h3 class="news-card__title">' + c.title + '</h3>' +
        '<div class="news-card__scroll">' +
          '<p class="news-card__resumo"><strong>Resumo em 30s:</strong> ' + c.resumo + '</p>' +
          '<div class="note"><span class="note__ico">🧠</span>' +
            '<span class="note__txt"><strong>O que mudou na prática clínica?</strong>' + c.mudou + '</span></div>' +
          '<div class="note"><span class="note__ico">💡</span>' +
            '<span class="note__txt"><strong>Como aplicar com seus pacientes?</strong>' + c.aplicar + '</span></div>' +
        '</div>' +
        '<div class="news-card__foot">' +
          '<span class="evid">Nível de evidência ' + stars(c.evidencia) + '</span>' +
          articleLinkHTML(c) +
        '</div>' +
      '</article>';
  }

  function renderChips() {
    els.chips.innerHTML = "";
    data.categorias.forEach(function (cat) {
      var b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = cat;
      b.setAttribute("aria-pressed", cat === state.categoria ? "true" : "false");
      b.addEventListener("click", function () {
        state.categoria = cat;
        renderChips();
        rebuild();
      });
      els.chips.appendChild(b);
    });
  }

  function renderSlides() {
    els.viewport.innerHTML = "";
    if (!state.cards.length) {
      els.viewport.innerHTML = '<div class="carousel__empty">Nenhuma atualização nesta categoria por enquanto.</div>';
      els.dots.innerHTML = "";
      return;
    }
    state.cards.forEach(function (c, i) {
      var slide = document.createElement("div");
      slide.className = "carousel__slide" + (i === state.index ? " is-active" : "");
      slide.innerHTML = cardHTML(c);
      els.viewport.appendChild(slide);
    });
    renderDots();
  }

  function renderDots() {
    els.dots.innerHTML = "";
    state.cards.forEach(function (_, i) {
      var d = document.createElement("button");
      d.className = "dot";
      d.type = "button";
      d.setAttribute("aria-label", "Ir para o item " + (i + 1));
      d.setAttribute("aria-current", i === state.index ? "true" : "false");
      d.innerHTML = '<span class="dot__fill"></span>';
      d.addEventListener("click", function () { goTo(i, true); });
      els.dots.appendChild(d);
    });
  }

  function renderWeek() {
    if (!data.semana || !els.week) { if (els.week) els.week.style.display = "none"; return; }
    var s = data.semana;
    els.week.innerHTML =
      '<div class="highlight-week__ico">✨</div>' +
      '<div><p class="highlight-week__eyebrow">' + s.eyebrow + '</p>' +
      '<p class="highlight-week__title">' + s.title + '</p>' +
      '<p class="highlight-week__txt">' + s.texto + '</p></div>';
  }

  /* ---------- Carrossel ---------- */
  function showActive() {
    var slides = els.viewport.querySelectorAll(".carousel__slide");
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === state.index); });
    var dots = els.dots.querySelectorAll(".dot");
    dots.forEach(function (d, i) {
      d.setAttribute("aria-current", i === state.index ? "true" : "false");
      // reinicia a animação da barra de progresso do dot ativo
      var fill = d.querySelector(".dot__fill");
      if (fill) { fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = ""; }
    });
  }

  function goTo(i, fromUser) {
    if (!state.cards.length) return;
    state.index = (i + state.cards.length) % state.cards.length;
    showActive();
    if (fromUser) restartTimer();
  }

  function nextSlide() { goTo(state.index + 1); }
  function prevSlide() { goTo(state.index - 1); }

  function restartTimer() {
    clearInterval(state.timer);
    if (state.cards.length > 1) {
      state.timer = setInterval(nextSlide, INTERVAL_MS);
    }
    showActive();
  }

  /* ---------- Build / rebuild ---------- */
  function rebuild() {
    state.cards = prioritize(filterByCategoria(data.cards));
    state.index = 0;
    renderSlides();
    restartTimer();
  }

  function init() {
    // expõe a duração para a animação CSS da barrinha
    document.documentElement.style.setProperty("--carousel-fill", (INTERVAL_MS / 1000) + "s");
    renderChips();
    renderWeek();
    rebuild();
    els.next.addEventListener("click", function () { goTo(state.index + 1, true); });
    els.prev.addEventListener("click", function () { goTo(state.index - 1, true); });

    // Pausa ao passar o mouse sobre o viewport
    els.viewport.addEventListener("mouseenter", function () { clearInterval(state.timer); });
    els.viewport.addEventListener("mouseleave", function () { restartTimer(); });
  }

  // API pública para o app reordenar após salvar a personalização
  window.Feed = { rebuild: rebuild };

  document.addEventListener("DOMContentLoaded", init);
})();
