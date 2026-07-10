/* ============================================================
   DOC TEMPLATE — motor de documentos com a identidade da nutri.
   Gera um documento A4 pronto para impressão (Salvar como PDF),
   puxando automaticamente logo, nome, CRN, contato, assinatura/
   carimbo e a paleta de cores do Perfil Profissional.

   Uso:
     var perfil = await window.NutriPerfil.get();     // ou objeto equivalente
     window.NutriDoc.imprimir(perfil, {
       tipo: "Prescrição Nutricional",
       paciente: "Marina Costa",
       data: "09/07/2026",
       bodyHTML: "<h2>...</h2>...",         // conteúdo específico do documento
       override: { logoUrl, assinaturaUrl } // opcional: sobrescreve só neste doc
     });

   API pública (window.NutriDoc):
     .documentoHTML(perfil, doc)  -> string HTML completa (standalone A4)
     .previewHTML(perfil, doc)    -> igual, para embutir em <iframe srcdoc>
     .imprimir(perfil, doc)       -> abre janela e chama print()
   ============================================================ */
(function () {
  "use strict";

  var CORES_PADRAO = { primaria: "#7B284C", secundaria: "#F4DCE5", destaque: "#9C3D63", fundo: "#FFFFFF" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "N";
    return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  /* ---------- Ornamentos do fundo (marca d'água delicada) ----------
     Silhueta feminina em linha ao centro + ramos florais nos cantos.
     Tudo em SVG inline (sem imagem externa), com opacidade bem baixa
     via CSS para não atrapalhar a leitura. */
  function florSVG(x, y, s) {
    var petals = "";
    for (var i = 0; i < 5; i++) {
      petals += '<ellipse cx="0" cy="-9" rx="3.4" ry="7.5" transform="rotate(' + (i * 72) + ')"/>';
    }
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" fill="currentColor">' +
      petals + '<circle r="2.6" fill="#fff"/><circle r="2.6" fill="currentColor" opacity=".35"/></g>';
  }

  // Ramo floral que sai de um canto (origem em 0,0).
  var RAMO =
    '<svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
        '<path d="M4 4 C 48 24 82 54 96 108"/>' +
        '<path d="M22 26 C 46 30 58 46 58 46"/>' +
        '<path d="M12 56 C 40 58 54 74 54 74"/>' +
      '</g>' +
      '<path d="M42 24 C 62 12 80 26 70 48 C 54 54 42 40 42 24 Z" fill="currentColor" opacity=".5"/>' +
      '<path d="M34 66 C 56 56 72 72 60 92 C 44 94 34 82 34 66 Z" fill="currentColor" opacity=".45"/>' +
      florSVG(98, 112, 1.05) +
      florSVG(60, 50, 0.72) +
    '</svg>';

  // Silhueta/linha feminina (rosto de perfil + cabelo fluido) — motivo elegante.
  var SILHUETA =
    '<svg viewBox="0 0 260 340" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M150 32 C 96 32 68 82 78 130 C 82 154 64 172 74 204 C 80 236 66 254 98 268"/>' +
      '<path d="M150 32 C 192 38 202 92 192 124 C 186 144 168 152 176 166 C 182 176 172 184 168 194 C 162 206 172 216 160 226 C 150 234 156 248 172 252"/>' +
      '<path d="M150 32 C 128 27 108 36 98 56"/>' +
    '</svg>';

  function decoracaoHTML() {
    return '<div class="doc-bg" aria-hidden="true">' +
      '<div class="doc-bg__silhueta">' + SILHUETA + '</div>' +
      '<div class="doc-bg__flor doc-bg__flor--tl">' + RAMO + '</div>' +
      '<div class="doc-bg__flor doc-bg__flor--tr">' + RAMO + '</div>' +
      '<div class="doc-bg__flor doc-bg__flor--bl">' + RAMO + '</div>' +
      '<div class="doc-bg__flor doc-bg__flor--br">' + RAMO + '</div>' +
    '</div>';
  }

  // Mescla perfil + override do documento específico.
  function resolver(perfil, doc) {
    perfil = perfil || {};
    var o = (doc && doc.override) || {};
    var cores = perfil.brandColors || CORES_PADRAO;
    return {
      nome: o.nome || perfil.nome || "Nutricionista",
      crn: o.crn || perfil.crn || "",
      contato: o.contato || perfil.contatoProfissional || perfil.telefone || "",
      instagram: perfil.instagram || "",
      site: perfil.site || "",
      logoUrl: ("logoUrl" in o) ? o.logoUrl : (perfil.logoUrl || ""),
      assinaturaUrl: ("assinaturaUrl" in o) ? o.assinaturaUrl : (perfil.assinaturaUrl || ""),
      carimboUrl: ("carimboUrl" in o) ? o.carimboUrl : (perfil.carimboUrl || ""),
      cores: {
        primaria: cores.primaria || CORES_PADRAO.primaria,
        secundaria: cores.secundaria || CORES_PADRAO.secundaria,
        destaque: cores.destaque || CORES_PADRAO.destaque,
        fundo: cores.fundo || CORES_PADRAO.fundo
      }
    };
  }

  /* ---------- Cabeçalho ----------
     Papel timbrado: logo pequena de um lado e, no canto oposto, um bloco
     de texto com nome, título, CRN e contato. Sem logo, o bloco vira o
     próprio cabeçalho à esquerda. */
  function blocoIdentidade(id) {
    var crnTxt = id.crn ? (/crn/i.test(id.crn) ? esc(id.crn) : "CRN " + esc(id.crn)) : "";
    var linhas = "";
    linhas += '<div class="doc-head__nome">' + esc(id.nome) + '</div>';
    linhas += '<div class="doc-head__role">Nutricionista</div>';
    if (crnTxt) linhas += '<div class="doc-head__crn">' + crnTxt + '</div>';
    if (id.contato) linhas += '<div class="doc-head__tel">' + esc(id.contato) + '</div>';
    if (id.instagram) linhas += '<div class="doc-head__tel">@' + esc(id.instagram.replace(/^@/, "")) + '</div>';
    return '<div class="doc-head__bloco">' + linhas + '</div>';
  }

  function headerHTML(id) {
    var head;
    if (id.logoUrl) {
      head = '<header class="doc-head doc-head--logo">' +
        '<img class="doc-logo doc-logo--solo" src="' + esc(id.logoUrl) + '" alt="Logo" />' +
        blocoIdentidade(id) +
      '</header>';
    } else {
      head = '<header class="doc-head doc-head--texto">' +
        '<div class="doc-logo doc-logo--fallback">' + esc(iniciais(id.nome)) + '</div>' +
        blocoIdentidade(id) +
      '</header>';
    }
    return head + '<div class="doc-rule"></div>';
  }

  /* ---------- Faixa do título ---------- */
  function tituloHTML(doc) {
    var linhas = [];
    if (doc.paciente) linhas.push('<span><b>Paciente:</b> ' + esc(doc.paciente) + '</span>');
    if (doc.data) linhas.push('<span><b>Data:</b> ' + esc(doc.data) + '</span>');
    return '' +
      '<div class="doc-title">' +
        '<h1 class="doc-title__h">' + esc(doc.tipo || "Documento") + '</h1>' +
        (linhas.length ? '<div class="doc-title__meta">' + linhas.join('') + '</div>' : '') +
      '</div>';
  }

  /* ---------- Rodapé (assinatura / carimbo) ---------- */
  function footerHTML(id) {
    var assin = "";
    if (id.assinaturaUrl) {
      assin = '<div class="doc-sign">' +
        '<img class="doc-sign__img" src="' + esc(id.assinaturaUrl) + '" alt="Assinatura" />' +
        '<div class="doc-sign__line"></div>' +
        '<div class="doc-sign__nome">' + esc(id.nome) + '</div>' +
        (id.crn ? '<div class="doc-sign__crn">' + esc(id.crn) + '</div>' : '') +
      '</div>';
    } else {
      assin = '<div class="doc-sign">' +
        '<div class="doc-sign__line"></div>' +
        '<div class="doc-sign__nome">' + esc(id.nome) + '</div>' +
        (id.crn ? '<div class="doc-sign__crn">' + esc(id.crn) + '</div>' : '') +
      '</div>';
    }
    var carimbo = id.carimboUrl
      ? '<img class="doc-carimbo" src="' + esc(id.carimboUrl) + '" alt="Carimbo profissional" />'
      : '';

    return '' +
      '<footer class="doc-foot">' +
        carimbo +
        assin +
      '</footer>';
  }

  /* ---------- CSS do documento (paleta injetada) ---------- */
  function styleHTML(cores) {
    return '' +
      ':root{' +
        '--doc-primaria:' + cores.primaria + ';' +
        '--doc-secundaria:' + cores.secundaria + ';' +
        '--doc-destaque:' + cores.destaque + ';' +
        '--doc-fundo:' + cores.fundo + ';' +
      '}' +
      '*{box-sizing:border-box;margin:0;padding:0;}' +
      'body{font-family:"Montserrat","Segoe UI",system-ui,sans-serif;color:#2b2b2b;background:#e9e9ee;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.doc-page{background:var(--doc-fundo);width:210mm;min-height:297mm;margin:16px auto;padding:12mm 14mm;box-shadow:0 6px 30px rgba(0,0,0,.15);position:relative;overflow:hidden;display:flex;flex-direction:column;}' +

      /* ornamentos de fundo (marca d\'água delicada) */
      '.doc-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;}' +
      '.doc-bg svg{display:block;width:100%;height:auto;}' +
      '.doc-bg__silhueta{position:absolute;left:50%;top:52%;width:80%;max-width:172mm;transform:translate(-50%,-50%);color:var(--doc-primaria);opacity:.11;}' +
      '.doc-bg__flor{position:absolute;width:42mm;color:var(--doc-destaque);opacity:.26;}' +
      '.doc-bg__flor--tl{top:0;left:0;}' +
      '.doc-bg__flor--tr{top:0;right:0;transform:scaleX(-1);}' +
      '.doc-bg__flor--bl{bottom:0;left:0;transform:scaleY(-1);}' +
      '.doc-bg__flor--br{bottom:0;right:0;transform:scale(-1,-1);}' +
      '.doc-head,.doc-rule,.doc-title,.doc-body,.doc-foot{position:relative;z-index:1;}' +

      /* header — logo pequena de um lado, bloco de texto no canto oposto */
      '.doc-head{display:flex;align-items:center;justify-content:space-between;gap:16px;}' +
      '.doc-logo{width:74px;height:74px;object-fit:contain;flex:none;}' +
      '.doc-logo--solo{width:auto;height:56px;max-width:46%;object-fit:contain;}' +
      '.doc-logo--fallback{border-radius:50%;background:var(--doc-primaria);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;width:52px;height:52px;}' +
      '.doc-head__bloco{text-align:right;line-height:1.32;}' +
      '.doc-head--texto .doc-head__bloco{text-align:left;}' +
      '.doc-head__nome{font-size:14px;font-weight:800;color:var(--doc-primaria);}' +
      '.doc-head__role{font-size:11px;font-weight:600;color:#555;}' +
      '.doc-head__crn{font-size:10.5px;color:#777;margin-top:1px;}' +
      '.doc-head__tel{font-size:10.5px;color:#777;}' +
      '.doc-rule{height:3px;background:linear-gradient(90deg,var(--doc-primaria),var(--doc-destaque));border-radius:3px;margin:12px 0 0;}' +

      /* título */
      '.doc-title{margin:22px 0 18px;}' +
      '.doc-title__h{font-size:22px;font-weight:800;color:var(--doc-primaria);letter-spacing:.2px;}' +
      '.doc-title__meta{display:flex;gap:22px;flex-wrap:wrap;margin-top:8px;font-size:12.5px;color:#555;}' +
      '.doc-title__meta b{color:#333;font-weight:700;}' +

      /* corpo genérico (o conteúdo específico traz suas próprias classes doc-*) */
      '.doc-body{flex:1;font-size:13px;line-height:1.6;}' +
      '.doc-body h2{font-size:14.5px;color:var(--doc-primaria);margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid var(--doc-secundaria);}' +
      '.doc-body h3{font-size:13px;color:var(--doc-destaque);margin:14px 0 6px;}' +
      '.doc-body p{margin:0 0 8px;}' +
      '.doc-body ul,.doc-body ol{margin:0 0 10px 20px;}' +
      '.doc-body li{margin-bottom:4px;}' +
      '.doc-chip{display:inline-block;background:var(--doc-secundaria);color:var(--doc-primaria);font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin:0 4px 4px 0;}' +

      /* refeições (usado pela prescrição) */
      '.doc-meal{border:1px solid #eee;border-radius:10px;padding:10px 12px;margin-bottom:9px;break-inside:avoid;background:rgba(255,255,255,.55);}' +
      '.doc-meal__head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px;}' +
      '.doc-meal__nome{font-weight:700;color:var(--doc-primaria);font-size:13px;}' +
      '.doc-meal__hora{font-size:11px;color:#888;font-weight:600;}' +
      '.doc-meal__kcal{font-size:11px;color:#666;font-weight:700;}' +
      '.doc-meal__item{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:2px 0;border-top:1px dashed #eee;}' +
      '.doc-meal__item:first-of-type{border-top:none;}' +
      '.doc-meal__qt{color:#888;}' +
      '.doc-macros{display:flex;gap:10px;margin:6px 0 14px;}' +
      '.doc-macro{flex:1;background:var(--doc-secundaria);border-radius:8px;padding:8px;text-align:center;}' +
      '.doc-macro__v{font-weight:800;color:var(--doc-primaria);font-size:15px;}' +
      '.doc-macro__l{font-size:10px;color:#777;text-transform:uppercase;letter-spacing:.4px;}' +
      '.doc-note{background:var(--doc-secundaria);border-radius:8px;padding:10px 12px;font-size:12px;color:#444;margin:10px 0;}' +

      /* rodapé */
      '.doc-foot{margin-top:26px;padding-top:16px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;break-inside:avoid;}' +
      '.doc-carimbo{max-height:96px;max-width:180px;object-fit:contain;opacity:.95;}' +
      '.doc-sign{margin-left:auto;text-align:center;min-width:220px;}' +
      '.doc-sign__img{max-height:56px;max-width:200px;object-fit:contain;display:block;margin:0 auto -6px;}' +
      '.doc-sign__line{border-top:1.5px solid #333;margin:0 auto 6px;width:220px;}' +
      '.doc-sign__nome{font-weight:700;font-size:12.5px;color:#333;}' +
      '.doc-sign__crn{font-size:11px;color:#777;}' +

      /* barra de ações (só na tela, some na impressão) */
      '.doc-actions{position:sticky;top:0;z-index:10;display:flex;gap:10px;justify-content:center;padding:12px;background:rgba(255,255,255,.9);backdrop-filter:blur(6px);border-bottom:1px solid #ddd;}' +
      '.doc-btn{font:inherit;font-weight:700;font-size:13px;border-radius:10px;padding:10px 18px;border:1px solid var(--doc-primaria);cursor:pointer;}' +
      '.doc-btn--primary{background:var(--doc-primaria);color:#fff;}' +
      '.doc-btn--ghost{background:#fff;color:var(--doc-primaria);}' +

      '@media print{' +
        'body{background:#fff;}' +
        '.doc-actions{display:none !important;}' +
        '.doc-page{margin:0;box-shadow:none;width:auto;min-height:auto;padding:10mm 12mm;}' +
        '@page{size:A4;margin:0;}' +
      '}';
  }

  /* ---------- Montagem ---------- */
  function corpoDocumento(perfil, doc) {
    var id = resolver(perfil, doc);
    return '' +
      '<div class="doc-page">' +
        decoracaoHTML() +
        headerHTML(id) +
        tituloHTML(doc) +
        '<div class="doc-body">' + (doc.bodyHTML || "") + '</div>' +
        footerHTML(id) +
      '</div>';
  }

  function paginaCompleta(perfil, doc, opts) {
    opts = opts || {};
    var id = resolver(perfil, doc);
    var acoes = opts.acoes
      ? '<div class="doc-actions">' +
          '<button class="doc-btn doc-btn--primary" onclick="window.print()">🖨️ Salvar como PDF / Imprimir</button>' +
          '<button class="doc-btn doc-btn--ghost" onclick="window.close()">Fechar</button>' +
        '</div>'
      : '';
    // Auto-abre a impressão (para "Gerar PDF"). Pequeno atraso para as fontes/imagens.
    var autoPrint = opts.autoPrint
      ? '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},350);});<\/script>'
      : '';
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
      '<title>' + esc((doc.tipo || "Documento") + (doc.paciente ? " — " + doc.paciente : "")) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />' +
      '<style>' + styleHTML(id.cores) + '</style></head><body>' +
      acoes + corpoDocumento(perfil, doc) + autoPrint +
      '</body></html>';
  }

  function abrirEmAba(perfil, doc, autoPrint) {
    var w = window.open("", "_blank");
    if (!w) { alert("Permita pop-ups para abrir o documento."); return; }
    w.document.open();
    w.document.write(paginaCompleta(perfil, doc, { acoes: true, autoPrint: autoPrint }));
    w.document.close();
  }

  window.NutriDoc = {
    CORES_PADRAO: CORES_PADRAO,

    // HTML standalone completo (com barra de ações imprimir/fechar).
    documentoHTML: function (perfil, doc) { return paginaCompleta(perfil, doc, { acoes: true }); },

    // HTML para preview embutido (srcdoc do iframe) — sem barra de ações.
    previewHTML: function (perfil, doc) { return paginaCompleta(perfil, doc, {}); },

    // Abre o documento numa nova aba (modo leitura), com botão de imprimir disponível.
    visualizar: function (perfil, doc) { abrirEmAba(perfil, doc, false); },

    // Abre o documento numa nova aba e já dispara a impressão / Salvar como PDF.
    imprimir: function (perfil, doc) { abrirEmAba(perfil, doc, true); }
  };
})();
