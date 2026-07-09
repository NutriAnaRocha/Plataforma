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
    logoUrl: "", carimboUrl: "", assinaturaUrl: "",
    areaAtuacao: [], areaAtuacaoOutro: "",
    brandColors: (window.NutriPerfil && window.NutriPerfil.CORES_PADRAO) || { primaria: "#7B284C", secundaria: "#F4DCE5", destaque: "#9C3D63", fundo: "#FFFFFF" }
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

  function field(label, id, value, opts) {
    opts = opts || {};
    var input = opts.textarea
      ? '<textarea class="field__input" id="' + id + '" rows="' + (opts.rows || 3) + '"' +
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
        field("Bio profissional", "pp-bio", perfil.bio, { textarea: true, rows: 3, wide: true, ph: "Uma apresentação curta que aparece no seu perfil." }) +
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
      renderDados(); renderTopbar(); refreshPreview();
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

    var assinatura =
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
      card("Assinatura digital", "Imagem OU assinatura desenhada — vai no rodapé dos documentos.", assinatura) +
      card("Paleta de cores", "As cores da sua marca aplicadas nos detalhes gráficos dos documentos.", paleta);

    initSignPad();
  }

  /* ---------- Uploads (logo/carimbo/assinatura) ---------- */
  // Redimensiona preservando transparência (PNG). maxW/maxH em px.
  function processarImagem(file, maxDim) {
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
          resolve(cv.toDataURL("image/png"));   // PNG mantém transparência do logo/assinatura
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  var SLOT_FIELD = { logo: "logoUrl", carimbo: "carimboUrl", assinatura: "assinaturaUrl" };

  function enviarSlot(key, file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { toast("Use uma imagem PNG, JPG ou WEBP.", true); return; }
    if (file.size > 3 * 1024 * 1024) { toast("A imagem passa de 3 MB. Escolha uma menor.", true); return; }
    if (!db()) { toast("Banco indisponível.", true); return; }
    toast("Processando imagem…");
    processarImagem(file, key === "logo" ? 480 : 600).then(function (dataUrl) {
      var patch = {}; patch[SLOT_FIELD[key]] = dataUrl;
      return db().update(patch);
    }).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); renderTopbar(); refreshPreview();
      toast("Imagem salva");
    }).catch(function (e) {
      toast("Não foi possível enviar. " + (e && e.message ? e.message : ""), true);
    });
  }

  function removerSlot(key) {
    if (!db()) { toast("Banco indisponível.", true); return; }
    var patch = {}; patch[SLOT_FIELD[key]] = "";
    db().update(patch).then(function (p) {
      perfil = mergePerfil(p); renderIdentidade(); renderTopbar(); refreshPreview();
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
     EVENTOS
     ============================================================ */
  var ACTIONS = { "save-dados": saveDados, "save-paleta": savePaleta };

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
        t.value = "";
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

  function renderAll() { renderDados(); renderIdentidade(); renderPreview(); }

  function init() {
    renderAll();      // casca
    wire();
    initMobileNav();
    if (window.NutriPerfil) {
      window.NutriPerfil.get().then(function (p) {
        perfil = mergePerfil(p);
        renderAll(); renderTopbar();
      }).catch(function () { /* offline/file:// — mantém a casca */ });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
