/* ============================================================
   RotuLens — tutorial do primeiro acesso (setas apontando a tela)

   Quem chega no RotuLens vem de um anúncio, nunca viu o app e cai
   numa tela que espera uma FOTO. Se a pessoa não entende em dois
   segundos o que fotografar, ela sai — e essa saída custa o clique
   que foi pago no anúncio.

   Então, no primeiro acesso, o app se explica: escurece a tela,
   acende UM elemento por vez e aponta uma seta para ele, com uma
   frase curta do que fazer ali.

   COMO LIGAR NA PÁGINA

   1. Marque nas telas o que a seta deve apontar:

        <button data-tour="foto">Fotografar rótulo</button>
        <div    data-tour="resultado">...</div>

   2. Inclua o arquivo no fim do <body>:

        <script src="tutorial-primeiro-acesso.js"></script>

   Passo sem elemento na página é PULADO em silêncio — dá para
   marcar os alvos aos poucos, e nada quebra se um deles mudar de
   nome. Se nenhum alvo existir, aparece um cartão de boas-vindas
   no meio da tela com a primeira frase, sem seta: melhor uma
   explicação sem seta do que nenhuma explicação.

   QUANDO APARECE

   Só no primeiro acesso do aparelho (guardado no localStorage).
   Para ver de novo — testar ou gravar vídeo:

        ...mercado/?tutorial=1        (link direto)
        RotuLensTutorial.iniciar()    (pelo console)

   Personalizar cor e passos:

        <script src="tutorial-primeiro-acesso.js" data-cor="#0E4C5C"></script>
        RotuLensTutorial.configurar([{ alvo:"[data-tour=foto]",
                                       titulo:"...", texto:"..." }]);
     (configurar() precisa vir ANTES do primeiro acesso da pessoa.)
   ============================================================ */
(function () {
  "use strict";

  var script = document.currentScript;
  var COR = (script && script.getAttribute("data-cor")) || "#0E4C5C";
  var CHAVE = "rotulens_tutorial_v1";

  /* ---------------- os passos ---------------- */

  var PASSOS = [
    {
      alvo: '[data-tour="foto"]',
      titulo: "Comece por aqui",
      texto: "Toque para fotografar a <strong>tabela nutricional</strong> do produto. " +
             "Pode ser a foto do celular mesmo, na frente da prateleira."
    },
    {
      alvo: '[data-tour="ingredientes"]',
      titulo: "Depois, os ingredientes",
      texto: "A segunda foto é da <strong>lista de ingredientes</strong>. " +
             "É nela que estão os nomes que ninguém entende."
    },
    {
      alvo: '[data-tour="resultado"]',
      titulo: "A leitura aparece aqui",
      texto: "Em alguns segundos: o que o produto é de verdade, o que pesa contra " +
             "e <strong>o que levar no lugar</strong>."
    },
    {
      alvo: '#rl-instalar-btn',
      titulo: "Deixe na tela inicial",
      texto: "Assim o RotuLens fica como um aplicativo no seu celular, " +
             "para a próxima ida ao mercado."
    }
  ];

  /* ---------------- utilidades ---------------- */

  function head() { return document.head || document.getElementsByTagName("head")[0]; }

  function jaViu() {
    try { return localStorage.getItem(CHAVE) === "1"; } catch (e) { return false; }
  }
  function marcarVisto() {
    try { localStorage.setItem(CHAVE, "1"); } catch (e) {}
  }

  function pedidoNaURL() {
    return /[?&]tutorial=1\b/.test(window.location.search);
  }

  function menosMovimento() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Um alvo só vale se existe E está visível: botão escondido atrás de
  // display:none tem rect zerado e a seta apontaria para o canto da tela.
  function alvoValido(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  }

  /* ---------------- estilos ---------------- */

  function injetarEstilos() {
    if (document.getElementById("rl-tour-style")) return;
    var css =
      '.rl-tour{position:fixed;inset:0;z-index:2147483100;font-family:inherit;' +
      '-webkit-tap-highlight-color:transparent}' +
      /* O "buraco" de luz: a sombra gigante escurece tudo em volta do alvo,
         sem precisar de máscara nem de quatro divs. */
      '.rl-tour__luz{position:absolute;border-radius:14px;' +
      'box-shadow:0 0 0 9999px rgba(9,26,31,.72), 0 0 0 3px ' + COR + ' inset;' +
      'outline:3px solid #fff;outline-offset:0;' +
      'transition:top .28s ease,left .28s ease,width .28s ease,height .28s ease;' +
      'pointer-events:none}' +
      '.rl-tour__seta{position:absolute;pointer-events:none;overflow:visible}' +
      '.rl-tour__card{position:absolute;left:50%;transform:translateX(-50%);' +
      'width:min(340px,calc(100vw - 32px));background:#fff;color:#1d2b30;' +
      'border-radius:16px;padding:1.05rem 1.1rem;box-shadow:0 14px 40px rgba(0,0,0,.35);' +
      'animation:rlTourEntra .26s ease both}' +
      '@keyframes rlTourEntra{from{opacity:0;transform:translate(-50%,10px)}' +
      'to{opacity:1;transform:translate(-50%,0)}}' +
      '.rl-tour__conta{font-size:.7rem;font-weight:700;letter-spacing:.12em;' +
      'text-transform:uppercase;color:' + COR + ';margin:0 0 .35rem}' +
      '.rl-tour__titulo{margin:0 0 .35rem;font-size:1.1rem;font-weight:800;line-height:1.2;color:#12242a}' +
      '.rl-tour__texto{margin:0 0 .9rem;font-size:.95rem;line-height:1.5;color:#41535a}' +
      '.rl-tour__texto strong{color:#12242a}' +
      '.rl-tour__acoes{display:flex;align-items:center;gap:.6rem}' +
      '.rl-tour__ok{flex:1;padding:.75rem 1rem;border:0;border-radius:11px;background:' + COR + ';' +
      'color:#fff;font-weight:700;font-size:.98rem;cursor:pointer;font-family:inherit}' +
      '.rl-tour__pular{padding:.75rem .4rem;border:0;background:none;color:#6b7c82;' +
      'font-size:.9rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline}' +
      '.rl-tour__ok:focus-visible,.rl-tour__pular:focus-visible{outline:3px solid ' + COR + ';outline-offset:2px}' +
      '@media (prefers-reduced-motion:reduce){.rl-tour__card{animation:none}' +
      '.rl-tour__luz{transition:none}}';
    var s = document.createElement("style");
    s.id = "rl-tour-style";
    s.textContent = css;
    head().appendChild(s);
  }

  /* ---------------- desenho ---------------- */

  var estado = { i: 0, passos: [], camada: null, luz: null, seta: null, card: null };

  function fechar() {
    if (estado.camada) estado.camada.remove();
    estado.camada = null;
    window.removeEventListener("resize", reposicionar);
    window.removeEventListener("scroll", reposicionar, true);
    document.removeEventListener("keydown", noTeclado);
    marcarVisto();
  }

  function noTeclado(e) {
    if (e.key === "Escape") { fechar(); return; }
    if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); avancar(); }
  }

  function avancar() {
    estado.i += 1;
    if (estado.i >= estado.passos.length) { fechar(); return; }
    desenhar();
  }

  // A seta sai do cartão e chega na borda do alvo. Curva simples de
  // Bézier: fica menos "diagrama" e mais gesto de mão apontando.
  function desenharSeta(deX, deY, paraX, paraY) {
    var dx = paraX - deX, dy = paraY - deY;
    // Ponto de controle deslocado na horizontal: dá a barriga da curva.
    var cx = deX + dx * 0.15 - (dy > 0 ? 34 : -34);
    var cy = deY + dy * 0.62;
    var ang = Math.atan2(paraY - cy, paraX - cx);
    var g = 11;
    var p1x = paraX - g * Math.cos(ang - 0.42), p1y = paraY - g * Math.sin(ang - 0.42);
    var p2x = paraX - g * Math.cos(ang + 0.42), p2y = paraY - g * Math.sin(ang + 0.42);
    return '<path d="M ' + deX + ' ' + deY + ' Q ' + cx + ' ' + cy + ' ' + paraX + ' ' + paraY + '" ' +
           'fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
           '<path d="M ' + paraX + ' ' + paraY + ' L ' + p1x + ' ' + p1y +
           ' M ' + paraX + ' ' + paraY + ' L ' + p2x + ' ' + p2y + '" ' +
           'fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
  }

  function reposicionar() {
    if (estado.camada) desenhar(true);
  }

  function desenhar(soPosicao) {
    var passo = estado.passos[estado.i];
    var el = passo.el;
    var r = el ? el.getBoundingClientRect() : null;

    // O alvo pode ter saído da tela (a pessoa rolou, ou o passo anterior
    // era mais acima). Traz de volta antes de apontar.
    if (r && (r.top < 8 || r.bottom > window.innerHeight - 8)) {
      try { el.scrollIntoView({ block: "center", behavior: menosMovimento() ? "auto" : "smooth" }); }
      catch (e) { el.scrollIntoView(); }
      // Redesenha depois que a rolagem assenta.
      setTimeout(function () { if (estado.camada) desenhar(true); }, menosMovimento() ? 0 : 320);
      r = el.getBoundingClientRect();
    }

    var pad = 8;
    var luz = null;
    if (r) {
      // O alvo pode ser mais alto que a tela — a área de resultado é uma
      // página inteira de leitura. Acender tudo apagaria o escuro em volta
      // (não sobra tela para escurecer) e a seta apontaria para um ponto
      // fora do visível. Então a luz fica no COMEÇO do alvo, que é onde a
      // pessoa vai olhar primeiro, e nunca passa da tela.
      var vh = window.innerHeight;
      var topo = Math.max(8, r.top - pad);
      var base = Math.min(vh - 8, r.bottom + pad);
      var tetoAltura = Math.round(vh * 0.45);
      if (base - topo > tetoAltura) base = topo + tetoAltura;
      luz = {
        top: topo,
        left: Math.max(8, r.left - pad),
        largura: Math.min(window.innerWidth - 16, r.width + pad * 2),
        altura: Math.max(24, base - topo)
      };
      estado.luz.style.display = "block";
      estado.luz.style.top = luz.top + "px";
      estado.luz.style.left = luz.left + "px";
      estado.luz.style.width = luz.largura + "px";
      estado.luz.style.height = luz.altura + "px";
    } else {
      // Sem alvo: escurece a tela inteira e mostra só o cartão.
      estado.luz.style.display = "none";
      estado.camada.style.background = "rgba(9,26,31,.72)";
    }

    // Cartão acima ou abaixo da luz, no lado que tiver mais espaço.
    var alturaCard = 190;
    var acima = luz ? (luz.top > window.innerHeight - (luz.top + luz.altura)) : false;
    var topoCard;
    if (!luz) {
      topoCard = Math.max(24, (window.innerHeight - alturaCard) / 2);
    } else if (acima) {
      topoCard = Math.max(16, luz.top - 60 - alturaCard);
    } else {
      topoCard = Math.min(window.innerHeight - alturaCard - 16, luz.top + luz.altura + 60);
    }
    estado.card.style.top = topoCard + "px";

    if (!soPosicao) {
      estado.card.innerHTML =
        '<p class="rl-tour__conta">Passo ' + (estado.i + 1) + ' de ' + estado.passos.length + '</p>' +
        '<h3 class="rl-tour__titulo">' + passo.titulo + '</h3>' +
        '<p class="rl-tour__texto">' + passo.texto + '</p>' +
        '<div class="rl-tour__acoes">' +
        '<button class="rl-tour__ok" type="button">' +
        (estado.i === estado.passos.length - 1 ? "Entendi, vamos lá" : "Próximo") + '</button>' +
        (estado.i === estado.passos.length - 1 ? '' :
          '<button class="rl-tour__pular" type="button">Pular</button>') +
        '</div>';
      var ok = estado.card.querySelector(".rl-tour__ok");
      var pular = estado.card.querySelector(".rl-tour__pular");
      ok.addEventListener("click", avancar);
      if (pular) pular.addEventListener("click", fechar);
      ok.focus();
    }

    // A seta liga o cartão à luz.
    if (luz) {
      var cardRect = estado.card.getBoundingClientRect();
      var deX = cardRect.left + cardRect.width / 2;
      var deY = acima ? cardRect.bottom + 6 : cardRect.top - 6;
      var paraY = acima ? luz.top - 8 : luz.top + luz.altura + 8;
      var paraX = Math.min(Math.max(luz.left + luz.largura / 2, 20), window.innerWidth - 20);
      estado.seta.setAttribute("width", window.innerWidth);
      estado.seta.setAttribute("height", window.innerHeight);
      estado.seta.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);
      estado.seta.style.top = "0";
      estado.seta.style.left = "0";
      estado.seta.innerHTML = desenharSeta(deX, deY, paraX, paraY);
      estado.seta.style.display = "block";
    } else {
      estado.seta.style.display = "none";
    }
  }

  /* ---------------- início ---------------- */

  function iniciar(forcado) {
    if (document.querySelector(".rl-tour")) return;
    if (!forcado && jaViu()) return;

    var passos = PASSOS.map(function (p) {
      var el = document.querySelector(p.alvo);
      return alvoValido(el) ? { el: el, titulo: p.titulo, texto: p.texto } : null;
    }).filter(Boolean);

    // Nenhum alvo marcado na página: em vez de desistir, dá as
    // boas-vindas com a primeira frase no meio da tela.
    if (!passos.length) {
      passos = [{ el: null, titulo: PASSOS[0].titulo, texto: PASSOS[0].texto }];
    }

    injetarEstilos();

    var camada = document.createElement("div");
    camada.className = "rl-tour";
    camada.setAttribute("role", "dialog");
    camada.setAttribute("aria-modal", "true");
    camada.setAttribute("aria-label", "Como usar o RotuLens");
    camada.innerHTML =
      '<div class="rl-tour__luz"></div>' +
      '<svg class="rl-tour__seta" aria-hidden="true"></svg>' +
      '<div class="rl-tour__card"></div>';
    document.body.appendChild(camada);

    estado = {
      i: 0,
      passos: passos,
      camada: camada,
      luz: camada.querySelector(".rl-tour__luz"),
      seta: camada.querySelector(".rl-tour__seta"),
      card: camada.querySelector(".rl-tour__card")
    };

    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    document.addEventListener("keydown", noTeclado);
    desenhar();
  }

  window.RotuLensTutorial = {
    iniciar: function () { iniciar(true); },
    configurar: function (lista) {
      if (Array.isArray(lista) && lista.length) PASSOS = lista;
    },
    jaViu: jaViu,
    esquecer: function () { try { localStorage.removeItem(CHAVE); } catch (e) {} }
  };

  function talvezIniciar() {
    if (pedidoNaURL()) { iniciar(true); return; }
    // Meio segundo para a página assentar: seta apontando para um botão
    // que ainda vai se mover é pior que seta nenhuma.
    setTimeout(function () { iniciar(false); }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", talvezIniciar);
  } else {
    talvezIniciar();
  }
})();
