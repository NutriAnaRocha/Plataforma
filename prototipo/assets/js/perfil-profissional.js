/* ============================================================
   PERFIL PROFISSIONAL — centro de identidade da nutricionista.
   Abas: Dados profissionais · Identidade Visual · Preview de documentos.
   Salva em public.profiles (via window.NutriPerfil). Logo/carimbo/
   assinatura são data URLs comprimidas (sem storage/backend).
   O preview usa o mesmo motor (window.NutriDoc) que gera os PDFs reais.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Estado ---------- */
  var perfil = {
    nome: "", email: "", crn: "", cidade: "", telefone: "", instagram: "", site: "", bio: "",
    especialidades: [], contatoProfissional: "",
    logoUrl: "", carimboUrl: "", assinaturaUrl: "", usarAssinatura: true,
    areaAtuacao: [], areaAtuacaoOutro: "",
    // Perfil público (diretório) — a casca renderiza antes do get().
    slug: "", perfilStatus: "rascunho", perfilRecusaMotivo: "", apresentacao: "",
    atendeOnline: true, atendePresencial: false, estado: "", precoConsultaCents: null,
    aceitaNovos: true, publicadoEm: "", planoTier: "gratis",
    formacao: "", anoFormatura: null, posGraduacao: [], atuacaoDesde: null, motivoEntrada: "",
    brandColors: (window.NutriPerfil && window.NutriPerfil.CORES_PADRAO) || { primaria: "#840B55", secundaria: "#F1B2DC", destaque: "#A82670", fundo: "#FFFFFF" }
  };

  // Áreas de atuação (checkboxes) + "Outro" com campo aberto.
  var AREAS = ["Nutrição clínica", "Saúde da mulher", "Emagrecimento", "Esportiva", "Fitoterapia"];

  // Documentos de exemplo para o preview (mesmo formato do NutriDoc).
  var SAMPLES = {
    prescricao: {
      tipo: "Prescrição Nutricional", paciente: "Marina Costa (exemplo)", data: hoje(),
      bodyHTML:
        '<div class="doc-macros">' +
          '<div class="doc-macro"><div class="doc-macro__v">45%</div><div class="doc-macro__l">Carboidrato</div></div>' +
          '<div class="doc-macro"><div class="doc-macro__v">30%</div><div class="doc-macro__l">Proteína</div></div>' +
          '<div class="doc-macro"><div class="doc-macro__v">25%</div><div class="doc-macro__l">Gordura</div></div>' +
          '<div class="doc-macro"><div class="doc-macro__v">1.500</div><div class="doc-macro__l">kcal/dia</div></div>' +
        '</div>' +
        '<div class="doc-meal"><div class="doc-meal__head"><span class="doc-meal__nome">Café da manhã</span><span class="doc-meal__hora">07:00</span><span class="doc-meal__kcal">320 kcal</span></div>' +
          '<div class="doc-meal__item"><span>Ovos mexidos</span><span class="doc-meal__qt">2 un</span></div>' +
          '<div class="doc-meal__item"><span>Pão integral</span><span class="doc-meal__qt">1 fatia</span></div>' +
          '<div class="doc-meal__item"><span>Mamão</span><span class="doc-meal__qt">1 fatia média</span></div>' +
        '</div>' +
        '<div class="doc-meal"><div class="doc-meal__head"><span class="doc-meal__nome">Almoço</span><span class="doc-meal__hora">12:30</span><span class="doc-meal__kcal">520 kcal</span></div>' +
          '<div class="doc-meal__item"><span>Arroz integral</span><span class="doc-meal__qt">4 col. sopa</span></div>' +
          '<div class="doc-meal__item"><span>Frango grelhado</span><span class="doc-meal__qt">120 g</span></div>' +
          '<div class="doc-meal__item"><span>Salada verde à vontade</span><span class="doc-meal__qt">—</span></div>' +
        '</div>' +
        '<div class="doc-note">💡 Beba pelo menos 2 litros de água por dia. Evite líquidos durante as refeições.</div>'
    },
    plano: {
      tipo: "Plano Alimentar", paciente: "Marina Costa (exemplo)", data: hoje(),
      bodyHTML:
        '<h2>Objetivo</h2><p>Emagrecimento com preservação de massa magra — meta de 1.500 kcal/dia.</p>' +
        '<h2>Distribuição de refeições</h2>' +
        '<ul><li><b>Café da manhã (07h):</b> proteína + fruta + carboidrato integral</li>' +
        '<li><b>Lanche (10h):</b> iogurte natural + oleaginosas</li>' +
        '<li><b>Almoço (12h30):</b> prato colorido — ½ salada, ¼ proteína, ¼ carboidrato</li>' +
        '<li><b>Lanche (16h):</b> fruta + fonte proteica</li>' +
        '<li><b>Jantar (19h30):</b> versão reduzida do almoço</li></ul>' +
        '<h2>Substituições permitidas</h2>' +
        '<p><span class="doc-chip">Arroz ↔ Batata</span><span class="doc-chip">Frango ↔ Peixe</span><span class="doc-chip">Pão ↔ Tapioca</span></p>'
    },
    orientacoes: {
      tipo: "Orientações Nutricionais", paciente: "Marina Costa (exemplo)", data: hoje(),
      bodyHTML:
        '<h2>Recomendações gerais</h2>' +
        '<ul><li>Mastigue devagar e evite distrações durante as refeições.</li>' +
        '<li>Priorize alimentos in natura e minimamente processados.</li>' +
        '<li>Inclua vegetais em pelo menos duas refeições do dia.</li>' +
        '<li>Hidrate-se: 35 ml de água por kg de peso corporal.</li></ul>' +
        '<h2>Evitar</h2>' +
        '<ul><li>Ultraprocessados, refrigerantes e excesso de açúcar.</li>' +
        '<li>Beliscar entre as refeições sem planejamento.</li></ul>' +
        '<div class="doc-note">📌 Em caso de dúvidas, entre em contato pelo canal informado no cabeçalho.</div>'
    }
  };
  var previewAtual = "prescricao";

  /* ---------- Helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function hoje() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  var toastTimer;
  function toast(msg, erro) {
    var t = el("cfg-toast");
    t.textContent = (erro ? "⚠ " : "✓ ") + msg;
    t.classList.toggle("is-error", !!erro);
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2800);
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset._txt = btn.textContent; btn.textContent = label || "Salvando…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset._txt || btn.textContent; btn.disabled = false; }
  }
  function db() { return window.NutriPerfil; }
  function val(id) { var e = el(id); return e ? e.value : ""; }

  // A bio é uma apresentação breve: o limite é o mesmo em Configurações e no banco (perfil-db).
  var BIO_MAX = 300;
  // Mínimos do perfil público — espelham publicar_perfil() (0098). Sem eles a
  // página da nutri sai vazia e o paciente não tem o que avaliar.
  var TEXTO_MIN = { bio: 80, publico: 40, funciona: 80 };

  /** Textarea com contador "n/max" que fica laranja abaixo do mínimo. */
  function textoContado(label, id, value, min, max, rows, ph, dica) {
    var n = (value || "").length;
    return '<div class="pp-block">' +
      '<div class="pp-ap__head">' +
        '<span class="field__label">' + esc(label) + '</span>' +
        '<span class="pp-ap__count' + (n < min ? " is-curta" : "") + '" id="' + id + '-count">' + n + '/' + max + '</span>' +
      '</div>' +
      '<textarea class="field__input" id="' + id + '" rows="' + rows + '" maxlength="' + max + '" data-min="' + min + '"' +
        ' placeholder="' + esc(ph) + '">' + esc(value) + '</textarea>' +
      '<p class="cfg-hint">' + esc(dica) + '</p>' +
    '</div>';
  }

  function field(label, id, value, opts) {
    opts = opts || {};
    if (opts.max) label += " · até " + opts.max + " caracteres";
    var input = opts.textarea
      ? '<textarea class="field__input" id="' + id + '" rows="' + (opts.rows || 3) + '"' +
          (opts.max ? ' maxlength="' + opts.max + '"' : "") +
          (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") + '>' + esc(value) + '</textarea>'
      : '<input class="field__input" id="' + id + '" type="' + (opts.type || "text") + '" value="' + esc(value) + '"' +
          (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") + ' />';
    return '<label class="field field--light' + (opts.wide ? " field--wide" : "") + '">' +
      '<span class="field__label">' + esc(label) + '</span>' + input + '</label>';
  }
  function card(title, sub, bodyHTML) {
    return '<section class="card cfg-card">' +
      '<div class="card__head"><div><h2 class="card__title">' + esc(title) + '</h2>' +
        (sub ? '<p class="card__sub">' + esc(sub) + '</p>' : "") + '</div></div>' +
      '<div class="card__body">' + bodyHTML + '</div></section>';
  }

  /* ============================================================
     PAINEL 1 — DADOS PROFISSIONAIS
     ============================================================ */
  function renderDados() {
    var outroOn = perfil.areaAtuacao.indexOf("Outro") > -1;
    var checks = AREAS.concat(["Outro"]).map(function (a) {
      var on = perfil.areaAtuacao.indexOf(a) > -1;
      return '<label class="pp-check' + (on ? " is-on" : "") + '">' +
        '<input type="checkbox" value="' + esc(a) + '"' + (on ? " checked" : "") + ' />' +
        '<span class="pp-check__box"></span><span>' + esc(a) + '</span></label>';
    }).join("");

    var body =
      '<div class="cfg-form">' +
        field("Nome completo", "pp-nome", perfil.nome, { ph: "Ex.: Ana Luísa Rocha" }) +
        field("CRN", "pp-crn", perfil.crn, { ph: "Ex.: CRN-3 12345" }) +
        field("Contato profissional", "pp-contato", perfil.contatoProfissional, { ph: "WhatsApp, e-mail ou telefone (opcional)" }) +
      '</div>' +
      '<div class="pp-block">' +
        '<span class="field__label">Área de atuação</span>' +
        '<div class="pp-checks" id="pp-areas">' + checks + '</div>' +
        '<div class="pp-outro" id="pp-outro-wrap"' + (outroOn ? "" : " hidden") + '>' +
          '<input class="field__input" id="pp-outro" type="text" value="' + esc(perfil.areaAtuacaoOutro) + '" placeholder="Descreva sua outra área de atuação" />' +
        '</div>' +
      '</div>' +
      '<div class="pp-block">' +
        field("Bio profissional", "pp-bio", perfil.bio, { textarea: true, rows: 3, wide: true, max: BIO_MAX, ph: "Uma apresentação curta que aparece no seu perfil." }) +
      '</div>';

    el("panel-dados").innerHTML =
      card("Dados profissionais", "A base da sua identidade — usada no cabeçalho de todos os documentos.", body) +
      '<div class="cfg-actions"><button class="btn btn--primary" type="button" data-action="save-dados">Salvar dados</button></div>';
  }

  function areasAtivas() {
    return Array.prototype.slice.call(document.querySelectorAll('#pp-areas input:checked'))
      .map(function (i) { return i.value; });
  }

  function saveDados(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    var areas = areasAtivas();
    db().update({
      nome: val("pp-nome"), crn: val("pp-crn"),
      contatoProfissional: val("pp-contato"),
      areaAtuacao: areas,
      areaAtuacaoOutro: areas.indexOf("Outro") > -1 ? val("pp-outro") : "",
      bio: val("pp-bio")
    }).then(function (p) {
      perfil = mergePerfil(p);
      renderDados(); renderPublico(); renderTopbar(); refreshPreview();
      toast("Dados salvos");
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  /* ============================================================
     PAINEL 2 — IDENTIDADE VISUAL
     ============================================================ */
  function slotHTML(key, titulo, dica, url, formato) {
    var preview = url
      ? '<img class="pp-slot__img" src="' + esc(url) + '" alt="' + esc(titulo) + '" />'
      : '<div class="pp-slot__empty">' + esc(formato) + '</div>';
    return '<div class="pp-slot">' +
      '<div class="pp-slot__preview">' + preview + '</div>' +
      '<div class="pp-slot__info">' +
        '<div class="pp-slot__tit">' + esc(titulo) + '</div>' +
        '<p class="cfg-hint">' + esc(dica) + '</p>' +
        '<input type="file" id="pp-file-' + key + '" accept="image/png,image/jpeg,image/webp" hidden />' +
        '<div class="pp-slot__btns">' +
          '<button class="btn btn--outline" type="button" data-upload="' + key + '">' + (url ? "Trocar" : "Enviar") + '</button>' +
          (url ? '<button class="btn btn--ghost" type="button" data-remove="' + key + '">Remover</button>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function swatchHTML(key, label, hex) {
    return '<label class="pp-swatch">' +
      '<span class="pp-swatch__dot" style="background:' + esc(hex) + '">' +
        '<input type="color" data-color="' + key + '" value="' + esc(hex) + '" />' +
      '</span>' +
      '<span class="pp-swatch__meta"><span class="pp-swatch__label">' + esc(label) + '</span>' +
        '<input class="pp-swatch__hex" type="text" data-hex="' + key + '" value="' + esc(hex) + '" maxlength="7" /></span>' +
    '</label>';
  }

  function renderIdentidade() {
    var c = perfil.brandColors;
    var uploads =
      '<div class="pp-slots">' +
        slotHTML("logo", "Logo da marca", "PNG com fundo transparente fica melhor. Aparece no cabeçalho.", perfil.logoUrl, "PNG / JPG") +
        slotHTML("carimbo", "Carimbo profissional", "Imagem do seu carimbo. Aparece no rodapé dos documentos.", perfil.carimboUrl, "PNG / JPG") +
      '</div>';

    var usaSign = perfil.usarAssinatura !== false;
    var assinatura =
      '<div class="cfg-toggle-row">' +
        '<div class="cfg-toggle-txt"><strong>Usar minha assinatura nos documentos</strong>' +
          '<span>' + (usaSign
            ? "Ligado — a imagem abaixo é impressa no rodapé dos documentos."
            : "Desligado — os documentos saem com a linha em branco para você assinar à mão. A imagem fica guardada aqui.") +
          '</span></div>' +
        '<button class="switch' + (usaSign ? " is-on" : "") + '" type="button" role="switch" ' +
          'aria-checked="' + usaSign + '" data-toggle="usar-assinatura"><span class="switch__knob"></span></button>' +
      '</div>' +
      '<div class="pp-sign-area' + (usaSign ? "" : " is-off") + '">' +
      '<div class="pp-slots">' +
        slotHTML("assinatura", "Assinatura (imagem)", "Envie uma foto/scan da sua assinatura.", perfil.assinaturaUrl, "PNG / JPG") +
      '</div>' +
      '<div class="pp-sign">' +
        '<div class="pp-sign__tit">✍️ Ou desenhe sua assinatura aqui</div>' +
        '<canvas class="pp-sign__pad" id="pp-sign-pad" width="600" height="180"></canvas>' +
        '<div class="pp-sign__btns">' +
          '<button class="btn btn--ghost" type="button" id="pp-sign-clear">Limpar</button>' +
          '<button class="btn btn--primary" type="button" id="pp-sign-use">Usar esta assinatura</button>' +
        '</div>' +
      '</div>' +
      '</div>';

    var paleta =
      '<div class="pp-palette">' +
        swatchHTML("primaria", "Cor primária", c.primaria) +
        swatchHTML("secundaria", "Cor secundária", c.secundaria) +
        swatchHTML("destaque", "Cor de destaque", c.destaque) +
        swatchHTML("fundo", "Fundo padrão", c.fundo) +
      '</div>' +
      '<div class="cfg-actions" style="justify-content:space-between">' +
        '<button class="btn btn--ghost" type="button" id="pp-palette-reset">Restaurar padrão</button>' +
        '<button class="btn btn--primary" type="button" data-action="save-paleta">Salvar paleta</button>' +
      '</div>';

    el("panel-identidade").innerHTML =
      card("Marca & carimbo", "Enviados uma vez, aplicados automaticamente em tudo que você gerar.", uploads) +
      card("Assinatura digital (opcional)", "Imagem OU assinatura desenhada — vai no rodapé dos documentos. Se preferir assinar à mão, é só desligar.", assinatura) +
      card("Paleta de cores", "As cores da sua marca aplicadas nos detalhes gráficos dos documentos.", paleta);

    initSignPad();
  }

  /* ---------- Uploads (logo/carimbo/assinatura) ---------- */
  // Redimensiona preservando transparência (PNG). maxW/maxH em px.
  // jpeg=true para foto (sem transparência): fica ~10x mais leve que PNG.
  function processarImagem(file, maxDim, jpeg) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("não foi possível ler o arquivo")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("imagem inválida")); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var escala = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.round(w * escala), ch = Math.round(h * escala);
          var cv = document.createElement("canvas");
          cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(jpeg ? cv.toDataURL("image/jpeg", 0.85)
                       : cv.toDataURL("image/png"));   // PNG mantém transparência do logo/assinatura
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // "avatar" é a foto do perfil público — mesmo caminho de upload dos outros
  // slots (data URL comprimida, sem storage).
  var SLOT_FIELD = { logo: "logoUrl", carimbo: "carimboUrl", assinatura: "assinaturaUrl", avatar: "avatarUrl" };

  function enviarSlot(key, file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { toast("Use uma imagem PNG, JPG ou WEBP.", true); return; }
    // Sem teto de tamanho: a imagem é reduzida aqui antes de ir pro banco.
    if (!db()) { toast("Banco indisponível.", true); return; }
    // Foto de perfil passa pelo ajuste (enquadrar + zoom); logo/carimbo não.
    var pronto = key === "avatar" && window.FotoUpload
      ? window.FotoUpload.ler(file)
      : processarImagem(file, key === "logo" ? 480 : 600);
    pronto.then(function (dataUrl) {
      toast("Salvando imagem…");
      var patch = {}; patch[SLOT_FIELD[key]] = dataUrl;
      return db().update(patch);
    }).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); renderPublico(); renderTopbar(); refreshPreview();
      toast("Imagem salva");
    }).catch(function (e) {
      if (e && e.message === "cancelado") return;
      toast("Não foi possível enviar. " + (e && e.message ? e.message : ""), true);
    });
  }

  function removerSlot(key) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var patch = {}; patch[SLOT_FIELD[key]] = "";
    db().update(patch).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); renderPublico(); renderTopbar(); refreshPreview();
      toast("Imagem removida");
    }).catch(function (e) { toast("Não foi possível remover. " + (e && e.message ? e.message : ""), true); });
  }

  /* ---------- Assinatura desenhada (canvas) ---------- */
  var signState = { drawing: false, dirty: false, ctx: null, canvas: null };
  function initSignPad() {
    var cv = el("pp-sign-pad");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1a1a1a";
    signState.ctx = ctx; signState.canvas = cv; signState.dirty = false;

    function pos(e) {
      var r = cv.getBoundingClientRect();
      var t = (e.touches && e.touches[0]) || e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    }
    function start(e) { e.preventDefault(); signState.drawing = true; signState.dirty = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function move(e) { if (!signState.drawing) return; e.preventDefault(); var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    function end() { signState.drawing = false; }

    cv.addEventListener("mousedown", start); cv.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    cv.addEventListener("touchstart", start, { passive: false });
    cv.addEventListener("touchmove", move, { passive: false });
    cv.addEventListener("touchend", end);
  }
  function limparSign() {
    if (!signState.ctx) return;
    signState.ctx.clearRect(0, 0, signState.canvas.width, signState.canvas.height);
    signState.dirty = false;
  }
  function usarSign(btn) {
    if (!signState.dirty) { toast("Desenhe a assinatura primeiro.", true); return; }
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    var dataUrl = signState.canvas.toDataURL("image/png");
    db().update({ assinaturaUrl: dataUrl }).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); refreshPreview();
      toast("Assinatura salva");
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
      busy(btn, false);
    });
  }

  // Liga/desliga a assinatura nos documentos (a imagem continua guardada).
  function toggleUsarAssinatura(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var novo = !(perfil.usarAssinatura !== false);
    btn.disabled = true;
    db().update({ usarAssinatura: novo }).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); refreshPreview();
      toast(novo ? "Assinatura ligada nos documentos" : "Documentos sairão sem assinatura");
    }).catch(function (e) {
      btn.disabled = false;
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
    });
  }

  /* ---------- Paleta de cores ---------- */
  function isHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }
  function colorAtual() {
    var out = {};
    ["primaria", "secundaria", "destaque", "fundo"].forEach(function (k) {
      var inp = document.querySelector('[data-hex="' + k + '"]');
      out[k] = inp && isHex(inp.value) ? inp.value.toUpperCase() : perfil.brandColors[k];
    });
    return out;
  }
  function savePaleta(btn) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    busy(btn, true);
    db().update({ brandColors: colorAtual() }).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); refreshPreview();
      toast("Paleta salva");
    }).catch(function (e) {
      toast("Não foi possível salvar a paleta. " + (e && e.message ? e.message : ""), true);
    }).then(function () { busy(btn, false); });
  }

  /* ============================================================
     PAINEL 3 — PREVIEW DE DOCUMENTOS
     ============================================================ */
  function renderPreview() {
    var tipos = [
      ["prescricao", "Prescrição"],
      ["plano", "Plano alimentar"],
      ["orientacoes", "Orientações"]
    ];
    var chips = tipos.map(function (t) {
      return '<button class="pp-doc-chip' + (t[0] === previewAtual ? " is-on" : "") + '" type="button" data-doc="' + t[0] + '">' + esc(t[1]) + '</button>';
    }).join("");

    el("panel-preview").innerHTML =
      '<div class="pp-preview-head">' +
        '<div class="pp-doc-chips">' + chips + '</div>' +
        '<button class="btn btn--primary" type="button" id="pp-print">🖨️ Gerar PDF deste modelo</button>' +
      '</div>' +
      '<p class="cfg-hint" style="margin-bottom:var(--sp-3)">É exatamente assim que o documento sai com a sua marca. Os dados abaixo são um exemplo.</p>' +
      '<div class="pp-preview-frame"><iframe id="pp-iframe" title="Preview do documento"></iframe></div>';
    refreshPreview();
  }

  function refreshPreview() {
    var frame = el("pp-iframe");
    if (!frame || !window.NutriDoc) return;
    frame.srcdoc = window.NutriDoc.previewHTML(perfil, SAMPLES[previewAtual]);
  }

  function imprimirPreview() {
    if (!window.NutriDoc) { toast("Motor de documento indisponível.", true); return; }
    window.NutriDoc.imprimir(perfil, SAMPLES[previewAtual]);
  }

  /* ============================================================
     TOPBAR / SIDEBAR
     ============================================================ */
  function renderTopbar() {
    var ini = iniciais(perfil.nome) || "AL";
    var avT = el("user-avatar"), avS = el("side-user-av");
    [avT, avS].forEach(function (av) {
      if (!av) return;
      if (perfil.avatarUrl) { av.innerHTML = '<img src="' + esc(perfil.avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />'; }
      else { av.textContent = ini; }
    });
    var nm = el("side-user-name"); if (nm && perfil.nome) nm.textContent = perfil.nome;
    var cr = el("side-user-crn"); if (cr && perfil.crn) cr.textContent = perfil.crn;
  }

  // Mantém campos que o get() pode não trazer (avatarUrl vem do get inicial).
  function mergePerfil(p) {
    var out = {};
    Object.keys(perfil).forEach(function (k) { out[k] = perfil[k]; });
    Object.keys(p || {}).forEach(function (k) { out[k] = p[k]; });
    return out;
  }

  /* ============================================================
     PAINEL 4 — PERFIL PÚBLICO (o card que o paciente vê no diretório)

     O que faz alguém clicar não é a lista de especialidades: é o rosto e
     uma frase que soa como gente. Por isso foto e apresentação são
     requisito para enviar à análise — e a validação de verdade está no
     banco (publicar_perfil), não aqui.
     ============================================================ */
  var UFS = ("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO").split(" ");

  var STATUS_LABEL = {
    rascunho:   { t: "Rascunho",          d: "Ainda não enviado — só você vê." },
    em_analise: { t: "Em análise",        d: "Enviado. A Ana avisa assim que olhar." },
    aprovado:   { t: "No ar",             d: "Seu perfil aparece na busca do site." },
    recusado:   { t: "Precisa de ajuste", d: "Veja o motivo abaixo, corrija e envie de novo." }
  };

  // 'gratis' virou a vitrine sem cobrança (0092), não mais "trial".
  var TIER_LABEL = { gratis: "Vitrine grátis", vitrine: "Vitrine", plataforma: "Plataforma", completo: "Completo" };

  function precoBR(cents) {
    if (cents == null) return "";
    return (cents / 100).toFixed(2).replace(".", ",");
  }

  /** O que ainda falta para poder enviar. Espelha publicar_perfil() (0086). */
  function pendencias() {
    var f = [];
    if (!perfil.avatarUrl) f.push("sua foto");
    if (!perfil.apresentacao || perfil.apresentacao.trim().length < 40) f.push("a apresentação (mín. 40 caracteres)");
    if ((perfil.bio || "").trim().length < TEXTO_MIN.bio) f.push("o Sobre você (mín. " + TEXTO_MIN.bio + " caracteres)");
    if ((perfil.publicoAtendido || "").trim().length < TEXTO_MIN.publico) f.push("o Quem você atende (mín. " + TEXTO_MIN.publico + ")");
    if ((perfil.comoFunciona || "").trim().length < TEXTO_MIN.funciona) f.push("o Como funciona a consulta (mín. " + TEXTO_MIN.funciona + ")");
    if (!perfil.crn) f.push("o CRN");
    if (!perfil.areaAtuacao.length) f.push("pelo menos uma especialidade");
    if (!perfil.cidade || !perfil.estado) f.push("cidade e estado");
    if (!perfil.atendeOnline && !perfil.atendePresencial) f.push("como você atende");
    if (!perfil.instagram && !perfil.site) f.push("Instagram ou site");
    return f;
  }

  /** O card exatamente como ele sai na busca — sem promessa, é o mesmo desenho. */
  function cardPreview() {
    var foto = perfil.avatarUrl
      ? '<img src="' + esc(perfil.avatarUrl) + '" alt="" />'
      : '<span>' + esc(iniciais(perfil.nome)) + '</span>';
    var modos = [];
    if (perfil.atendeOnline) modos.push("Online");
    if (perfil.atendePresencial) modos.push("Presencial");
    var linha2 = [perfil.cidade, perfil.estado].filter(Boolean).join(", ");
    var preco = perfil.precoConsultaCents ? "a partir de R$ " + precoBR(perfil.precoConsultaCents) : "";

    return '<div class="pp-card' + (perfil.planoTier === "completo" ? " is-destaque" : "") + '">' +
      '<div class="pp-card__foto">' + foto + '</div>' +
      '<div class="pp-card__info">' +
        '<div class="pp-card__nome">' + esc(perfil.nome || "Seu nome") + '</div>' +
        '<div class="pp-card__meta">' +
          esc([perfil.crn, linha2].filter(Boolean).join(" · ") || "CRN · cidade") + '<br />' +
          esc(perfil.areaAtuacao.slice(0, 3).join(" · ") || "suas especialidades") + '<br />' +
          esc([modos.join(" e "), preco].filter(Boolean).join(" · ")) +
        '</div>' +
        '<p class="pp-card__desc">' +
          esc(perfil.apresentacao || "Sua apresentação aparece aqui — é o que faz o paciente clicar.") +
        '</p>' +
        (perfil.planoTier === "completo" ? '<span class="pp-card__selo">Destaque</span>' : "") +
      '</div>' +
    '</div>';
  }

  function renderPublico() {
    var pane = el("panel-publico"); if (!pane) return;
    var st = STATUS_LABEL[perfil.perfilStatus] || STATUS_LABEL.rascunho;
    var falta = pendencias();
    var apLen = (perfil.apresentacao || "").length;

    var checks = AREAS.map(function (a) {
      var on = perfil.areaAtuacao.indexOf(a) > -1;
      return '<label class="pp-check' + (on ? " is-on" : "") + '">' +
        '<input type="checkbox" value="' + esc(a) + '"' + (on ? " checked" : "") + ' />' +
        '<span class="pp-check__box"></span><span>' + esc(a) + '</span></label>';
    }).join("");

    var ufs = '<select class="field__input" id="pub-estado">' +
      '<option value="">UF</option>' +
      UFS.map(function (u) {
        return '<option value="' + u + '"' + (perfil.estado === u ? " selected" : "") + '>' + u + '</option>';
      }).join("") + '</select>';

    /* Estado do perfil + o que falta */
    var statusHTML =
      '<div class="pp-status pp-status--' + esc(perfil.perfilStatus) + '">' +
        '<div><b>' + esc(st.t) + '</b><p class="cfg-hint">' + esc(st.d) + '</p>' +
          (perfil.perfilStatus === "recusado" && perfil.perfilRecusaMotivo
            ? '<p class="pp-status__motivo">' + esc(perfil.perfilRecusaMotivo) + '</p>' : "") +
          (perfil.perfilStatus === "aprovado" && perfil.slug
            ? '<p class="cfg-hint">nutrianaluisarocha.com/nutri/' + esc(perfil.slug) + '</p>' : "") +
        '</div>' +
        '<span class="pp-tier">' + esc(TIER_LABEL[perfil.planoTier] || "Grátis") + '</span>' +
      '</div>' +
      (falta.length
        ? '<div class="pp-falta"><b>Para enviar, falta:</b> ' + esc(falta.join(", ")) + '.</div>'
        : '');

    /* Foto */
    var fotoHTML =
      '<div class="pp-slot">' +
        '<div class="pp-slot__preview pp-slot__preview--round">' +
          (perfil.avatarUrl
            ? '<img class="pp-slot__img" src="' + esc(perfil.avatarUrl) + '" alt="Sua foto" />'
            : '<div class="pp-slot__empty">Sem foto</div>') +
        '</div>' +
        '<div class="pp-slot__info">' +
          '<div class="pp-slot__tit">Sua foto</div>' +
          '<p class="cfg-hint">Rosto visível, luz boa, fundo simples. É o primeiro contato que o paciente tem com você.</p>' +
          '<input type="file" id="pp-file-avatar" accept="image/png,image/jpeg,image/webp" hidden />' +
          '<div class="pp-slot__btns">' +
            '<button class="btn btn--outline" type="button" data-upload="avatar">' + (perfil.avatarUrl ? "Trocar" : "Enviar") + '</button>' +
            (perfil.avatarUrl ? '<button class="btn btn--ghost" type="button" data-remove="avatar">Remover</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    /* Apresentação */
    var apresentacaoHTML =
      '<div class="pp-block">' +
        '<div class="pp-ap__head">' +
          '<span class="field__label">Sua apresentação</span>' +
          '<span class="pp-ap__count" id="pub-ap-count">' + apLen + '/220</span>' +
        '</div>' +
        '<textarea class="field__input" id="pub-apresentacao" rows="3" maxlength="220" ' +
          'placeholder="Ex.: Eu cuido de mulheres que querem engravidar e se perdem no meio de tanta informação. Aqui a gente vai no seu ritmo.">' +
          esc(perfil.apresentacao) + '</textarea>' +
        '<div class="pp-ap__foot">' +
          '<p class="cfg-hint">Entre 40 e 220 caracteres, na primeira pessoa. Fale com quem você atende, não sobre você.</p>' +
          '<button class="btn btn--ghost" type="button" data-action="ia-apresentacao">✨ Escrever com ajuda da IA</button>' +
        '</div>' +
        '<div class="pp-ia" id="pub-ia" hidden></div>' +
      '</div>';

    var body =
      statusHTML +
      fotoHTML +
      apresentacaoHTML +
      textoContado("Quem você atende", "pub-publico", perfil.publicoAtendido, TEXTO_MIN.publico, 400, 3,
        "Ex.: Mulheres tentando engravidar, com SOP ou endometriose, e gestantes.",
        "Mínimo de " + TEXTO_MIN.publico + " caracteres. Ajuda o paciente a saber se é com você.") +
      textoContado("Como funciona a consulta", "pub-funciona", perfil.comoFunciona, TEXTO_MIN.funciona, 800, 5,
        "Ex.: Consulta de 60 min por vídeo, plano alimentar em até 3 dias, retorno em 30 dias e suporte pelo app.",
        "Mínimo de " + TEXTO_MIN.funciona + " caracteres. Conte o passo a passo: como marca, duração, o que recebe, retornos.") +
      textoContado("Sobre você", "pub-bio", perfil.bio, TEXTO_MIN.bio, BIO_MAX, 4,
        "Ex.: Nutricionista há 8 anos, especialista em fertilidade. Atendimento acolhedor e sem dieta da moda.",
        "Mínimo de " + TEXTO_MIN.bio + " caracteres, na primeira pessoa. Sua trajetória e o seu jeito de atender.") +
      '<div class="pp-block">' +
        '<span class="field__label">Especialidades</span>' +
        '<div class="pp-checks" id="pub-areas">' + checks + '</div>' +
      '</div>' +
      '<div class="cfg-form">' +
        field("Cidade", "pub-cidade", perfil.cidade, { ph: "Ex.: Rio de Janeiro" }) +
        field("Bairro do consultório", "pub-bairro", perfil.bairro, { ph: "Só se atende presencial — ex.: Tijuca" }) +
        '<label class="field field--light"><span class="field__label">Estado</span>' + ufs + '</label>' +
        field("Valor da consulta (R$)", "pub-preco", precoBR(perfil.precoConsultaCents), { ph: "Opcional — ex.: 180,00" }) +
      '</div>' +
      '<div class="pp-block">' +
        '<span class="field__label">Como você atende</span>' +
        '<div class="pp-checks" id="pub-modos">' +
          '<label class="pp-check' + (perfil.atendeOnline ? " is-on" : "") + '">' +
            '<input type="checkbox" id="pub-online"' + (perfil.atendeOnline ? " checked" : "") + ' />' +
            '<span class="pp-check__box"></span><span>Online</span></label>' +
          '<label class="pp-check' + (perfil.atendePresencial ? " is-on" : "") + '">' +
            '<input type="checkbox" id="pub-presencial"' + (perfil.atendePresencial ? " checked" : "") + ' />' +
            '<span class="pp-check__box"></span><span>Presencial</span></label>' +
          '<label class="pp-check' + (perfil.aceitaNovos ? " is-on" : "") + '">' +
            '<input type="checkbox" id="pub-aceita"' + (perfil.aceitaNovos ? " checked" : "") + ' />' +
            '<span class="pp-check__box"></span><span>Aceitando novos pacientes</span></label>' +
        '</div>' +
        '<p class="cfg-hint">Com a agenda cheia, desmarque a última: você continua na busca, mas não recebe novas solicitações.</p>' +
      '</div>' +
      '<div class="cfg-form">' +
        field("Instagram", "pub-instagram", perfil.instagram, { ph: "@seuperfil" }) +
        field("Site", "pub-site", perfil.site, { ph: "https://…" }) +
        field("Seu endereço no diretório", "pub-slug", perfil.slug, { ph: "ana-luisa-rocha" }) +
      '</div>' +
      '<p class="cfg-hint">O endereço vira nutrianaluisarocha.com/nutri/<b>' +
        esc(perfil.slug || "seu-nome") + '</b>. Deixe em branco e eu gero a partir do seu nome.</p>' +
      '<div class="cfg-form">' +
        field("Formação", "pub-formacao", perfil.formacao, { ph: "Ex.: UFRJ" }) +
        field("Ano de formatura", "pub-ano", perfil.anoFormatura || "", { ph: "Ex.: 2016" }) +
        field("Atuando desde", "pub-desde", perfil.atuacaoDesde || "", { ph: "Ex.: 2017" }) +
      '</div>' +
      '<div class="pp-block">' +
        field("Pós-graduação e cursos", "pub-pos", perfil.posGraduacao.join(", "),
          { wide: true, ph: "Separe por vírgula" }) +
      '</div>' +
      '<div class="pp-block">' +
        field("Por que você quer estar no diretório?", "pub-motivo", perfil.motivoEntrada,
          { textarea: true, rows: 2, wide: true, ph: "Só a Ana lê — não aparece para o paciente." }) +
      '</div>';

    var podeEnviar = !falta.length && perfil.perfilStatus !== "em_analise";

    pane.innerHTML =
      card("Perfil público", "É assim que você aparece para quem procura uma nutricionista no site.", body) +
      card("Como o paciente vê", "O mesmo card da busca — nada além disto sai daqui.",
        '<div class="pp-card-wrap">' + cardPreview() + '</div>') +
      '<div class="cfg-actions">' +
        '<button class="btn btn--outline" type="button" data-action="save-publico">Salvar</button>' +
        '<button class="btn btn--primary" type="button" data-action="enviar-analise"' +
          (podeEnviar ? "" : " disabled") + '>' +
          (perfil.perfilStatus === "em_analise" ? "Em análise" : "Salvar e enviar para análise") +
        '</button>' +
      '</div>';
  }

  function coletaPublico() {
    // area_atuacao é o mesmo campo das duas abas. "Outro" só existe em Dados
    // profissionais — preservamos aqui para salvar o público não apagá-lo.
    var areas = Array.prototype.slice.call(document.querySelectorAll("#pub-areas input:checked"))
      .map(function (i) { return i.value; });
    if (perfil.areaAtuacao.indexOf("Outro") > -1 && areas.indexOf("Outro") === -1) areas.push("Outro");

    return {
      apresentacao: val("pub-apresentacao"),
      bio: val("pub-bio"),
      publicoAtendido: val("pub-publico"),
      comoFunciona: val("pub-funciona"),
      bairro: val("pub-bairro"),
      areaAtuacao: areas,
      cidade: val("pub-cidade"),
      estado: val("pub-estado"),
      precoConsulta: val("pub-preco"),
      atendeOnline: !!(el("pub-online") && el("pub-online").checked),
      atendePresencial: !!(el("pub-presencial") && el("pub-presencial").checked),
      aceitaNovos: !!(el("pub-aceita") && el("pub-aceita").checked),
      instagram: val("pub-instagram"),
      site: val("pub-site"),
      slug: val("pub-slug"),
      formacao: val("pub-formacao"),
      anoFormatura: val("pub-ano"),
      atuacaoDesde: val("pub-desde"),
      posGraduacao: val("pub-pos").split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      motivoEntrada: val("pub-motivo")
    };
  }

  function savePublico(btn, silencioso) {
    if (!db()) { toast("Banco indisponível.", true); return Promise.reject(new Error("sem banco")); }
    busy(btn, true);
    return db().update(coletaPublico()).then(function (p) {
      perfil = mergePerfil(p);
      renderDados(); renderPublico(); renderTopbar();   // bio é editada nas duas abas
      if (!silencioso) toast("Perfil salvo");
      return p;
    }).catch(function (e) {
      toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true);
      throw e;
    }).then(function (p) { busy(btn, false); return p; }, function (e) { busy(btn, false); throw e; });
  }

  function enviarAnalise(btn) {
    // Salva antes: quem clica em "enviar" espera que o que está na tela vá junto.
    savePublico(btn, true).then(function () {
      busy(btn, true, "Enviando…");
      return db().publicar();
    }).then(function () {
      return db().get();
    }).then(function (p) {
      perfil = mergePerfil(p);
      renderPublico();
      toast("Perfil enviado para análise");
    }).catch(function (e) {
      if (e && e.message && e.message !== "sem banco") toast(e.message, true);
    }).then(function () { busy(btn, false); });
  }

  // Rascunho da apresentação: a IA parte do que já está no perfil, e quem
  // escolhe é a nutri. Nada é salvo sem ela clicar em usar.
  function iaApresentacao(btn) {
    if (!el("pub-ia")) return;
    var box;
    // Mostra o estado, salva (o que redesenha o painel) e só então volta a
    // pegar a caixa — a referência de antes do render já saiu do DOM.
    function caixa(html) {
      box = el("pub-ia");
      if (!box) return;
      box.hidden = false;
      box.innerHTML = html;
    }
    caixa('<p class="cfg-hint">Escrevendo três opções…</p>');

    // Salva antes para a IA ler o perfil atualizado (especialidades, cidade).
    savePublico(null, true).then(function () {
      caixa('<p class="cfg-hint">Escrevendo três opções…</p>');
      return window.NutriDBReady;
    }).then(function (c) {
      return c.functions.invoke("gerar-apresentacao", { body: {} });
    }).then(function (res) {
      var err = res && res.error;
      var opcoes = res && res.data && res.data.opcoes;
      if (err || !opcoes || !opcoes.length) {
        throw new Error((res && res.data && res.data.error) || "não consegui escrever agora");
      }
      caixa(
        '<p class="cfg-hint">Escolha uma para editar — ela só é salva quando você salvar o perfil.</p>' +
        opcoes.map(function (o) {
          return '<button class="pp-ia__op" type="button" data-ia-opcao="' + esc(o) + '">' + esc(o) + '</button>';
        }).join("")
      );
    }).catch(function (e) {
      caixa('<p class="cfg-hint">' + esc(e && e.message ? e.message : "não consegui escrever agora") + '</p>');
    });
  }

  function usarOpcaoIA(texto) {
    var ta = el("pub-apresentacao"); if (!ta) return;
    ta.value = texto;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
    var box = el("pub-ia"); if (box) box.hidden = true;
    toast("Texto aplicado — ajuste e salve");
  }

  /* ============================================================
     EVENTOS
     ============================================================ */
  var ACTIONS = {
    "save-dados": saveDados,
    "save-paleta": savePaleta,
    "save-publico": savePublico,
    "enviar-analise": enviarAnalise,
    "ia-apresentacao": iaApresentacao
  };

  function wire() {
    // Abas
    el("pp-tabs").addEventListener("click", function (e) {
      var b = e.target.closest(".cfg-tab"); if (!b) return;
      var tab = b.getAttribute("data-tab");
      document.querySelectorAll(".cfg-tab").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      document.querySelectorAll(".cfg-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === tab);
      });
      if (tab === "preview") refreshPreview();
    });

    var panels = document.querySelector(".cfg-panels");

    // Uploads: change nos inputs de arquivo
    panels.addEventListener("change", function (e) {
      var t = e.target;
      if (t.id && t.id.indexOf("pp-file-") === 0) {
        var key = t.id.replace("pp-file-", "");
        enviarSlot(key, t.files && t.files[0]);
        t.value = "";   // permite escolher a mesma foto de novo depois de cancelar
        t.value = "";
        return;
      }
      // Checkboxes do perfil público (especialidades e modalidade).
      if (t.closest && (t.closest("#pub-areas") || t.closest("#pub-modos"))) {
        var l = t.closest(".pp-check"); if (l) l.classList.toggle("is-on", t.checked);
        return;
      }
      // Área "Outro": mostra/esconde o campo aberto
      if (t.closest && t.closest("#pp-areas")) {
        var outroWrap = el("pp-outro-wrap");
        if (outroWrap) outroWrap.hidden = areasAtivas().indexOf("Outro") === -1;
        var lbl = t.closest(".pp-check"); if (lbl) lbl.classList.toggle("is-on", t.checked);
        return;
      }
      // Color picker nativo → sincroniza o campo hex + swatch
      if (t.hasAttribute && t.hasAttribute("data-color")) {
        var k = t.getAttribute("data-color");
        var hexInp = document.querySelector('[data-hex="' + k + '"]');
        if (hexInp) hexInp.value = t.value.toUpperCase();
        var dot = t.closest(".pp-swatch__dot"); if (dot) dot.style.background = t.value;
      }
    });

    // Campo hex digitado → atualiza o dot e o color picker
    panels.addEventListener("input", function (e) {
      var t = e.target;
      // Contador da apresentação: 40 é o mínimo que o banco aceita.
      if (t.id === "pub-apresentacao") {
        var c = el("pub-ap-count");
        if (c) {
          var n = t.value.length;
          c.textContent = n + "/220";
          c.classList.toggle("is-curta", n > 0 && n < 40);
        }
        return;
      }
      if (t.hasAttribute && t.hasAttribute("data-min")) {
        var cc = el(t.id + "-count");
        if (cc) {
          cc.textContent = t.value.length + "/" + t.getAttribute("maxlength");
          cc.classList.toggle("is-curta", t.value.trim().length < +t.getAttribute("data-min"));
        }
        return;
      }
      if (t.hasAttribute && t.hasAttribute("data-hex")) {
        var v = t.value.trim();
        if (isHex(v)) {
          var k = t.getAttribute("data-hex");
          var picker = document.querySelector('[data-color="' + k + '"]');
          if (picker) picker.value = v;
          var sw = t.closest(".pp-swatch"); var dot = sw && sw.querySelector(".pp-swatch__dot");
          if (dot) dot.style.background = v;
        }
      }
    });

    // Cliques (upload/remover/assinatura/paleta/preview/ações)
    panels.addEventListener("click", function (e) {
      var up = e.target.closest("[data-upload]");
      if (up) { var inp = el("pp-file-" + up.getAttribute("data-upload")); if (inp) inp.click(); return; }
      var rm = e.target.closest("[data-remove]");
      if (rm) { removerSlot(rm.getAttribute("data-remove")); return; }
      var op = e.target.closest("[data-ia-opcao]");
      if (op) { usarOpcaoIA(op.getAttribute("data-ia-opcao")); return; }
      var sw = e.target.closest('[data-toggle="usar-assinatura"]');
      if (sw) { toggleUsarAssinatura(sw); return; }
      if (e.target.closest("#pp-sign-clear")) { limparSign(); return; }
      if (e.target.closest("#pp-sign-use")) { usarSign(e.target.closest("#pp-sign-use")); return; }
      if (e.target.closest("#pp-palette-reset")) {
        perfil.brandColors = Object.assign({}, window.NutriDoc.CORES_PADRAO);
        renderIdentidade(); refreshPreview(); toast("Cores restauradas (lembre de salvar).");
        return;
      }
      var dc = e.target.closest("[data-doc]");
      if (dc) {
        previewAtual = dc.getAttribute("data-doc");
        document.querySelectorAll(".pp-doc-chip").forEach(function (x) { x.classList.toggle("is-on", x === dc); });
        refreshPreview();
        return;
      }
      if (e.target.closest("#pp-print")) { imprimirPreview(); return; }
      var act = e.target.closest("[data-action]");
      if (act) { var fn = ACTIONS[act.getAttribute("data-action")]; if (fn) fn(act); }
    });
  }

  function initMobileNav() {
    var app = el("app"), t = el("menu-toggle"), s = el("scrim");
    if (t) t.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (s) s.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  function renderAll() { renderDados(); renderIdentidade(); renderPublico(); renderPreview(); }

  function init() {
    renderAll();      // casca
    wire();
    initMobileNav();
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) {
        perfil = mergePerfil(p);
        renderAll(); renderTopbar();
      }).catch(function () { /* offline/file:// — mantém a casca */ });

      // Vocabulário curado (0086). Se a tabela ainda não existir, AREAS
      // continua com as cinco de sempre e nada quebra.
      window.NutriPerfil.especialidades().then(function (lista) {
        if (!lista || !lista.length) return;
        AREAS = lista.map(function (e) { return e.nome; });
        renderDados(); renderPublico();
      }).catch(function () {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
