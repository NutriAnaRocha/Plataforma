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

  // Formata telefone brasileiro com parênteses: 21994094557 -> (21) 99409-4557.
  // Se não parecer um telefone (ex.: e-mail), devolve como está.
  function formatTel(v) {
    var s = String(v == null ? "" : v).trim();
    var d = s.replace(/\D/g, "");
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return s;
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
     Sem logo e sem moldura: apenas um bloco de texto centralizado com
     nome, título, CRN e contato. A assinatura no rodapé faz o papel de
     carimbo. */
  function blocoIdentidade(id) {
    var crnTxt = id.crn ? (/crn/i.test(id.crn) ? esc(id.crn) : "CRN " + esc(id.crn)) : "";
    var linhas = "";
    linhas += '<div class="doc-head__nome">' + esc(id.nome) + '</div>';
    linhas += '<div class="doc-head__role">Nutricionista</div>';
    if (crnTxt) linhas += '<div class="doc-head__crn">' + crnTxt + '</div>';
    if (id.contato) linhas += '<div class="doc-head__tel">' + esc(formatTel(id.contato)) + '</div>';
    if (id.instagram) linhas += '<div class="doc-head__tel">@' + esc(id.instagram.replace(/^@/, "")) + '</div>';
    return '<div class="doc-head__bloco">' + linhas + '</div>';
  }

  function headerHTML(id) {
    return '<header class="doc-head">' + blocoIdentidade(id) + '</header>';
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
    var crnTxt = id.crn ? (/crn/i.test(id.crn) ? esc(id.crn) : "CRN " + esc(id.crn)) : "";
    var inner = "";
    if (id.carimboUrl) inner += '<img class="doc-carimbo" src="' + esc(id.carimboUrl) + '" alt="Carimbo profissional" />';
    if (id.assinaturaUrl) inner += '<img class="doc-sign__img" src="' + esc(id.assinaturaUrl) + '" alt="Assinatura" />';
    inner += '<div class="doc-sign__line"></div>';
    inner += '<div class="doc-sign__nome">' + esc(id.nome) + '</div>';
    if (crnTxt) inner += '<div class="doc-sign__crn">' + crnTxt + '</div>';
    return '<footer class="doc-foot"><div class="doc-sign">' + inner + '</div></footer>';
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

      /* cabeçalho — bloco de identidade à esquerda, sem logo nem moldura */
      '.doc-head{text-align:left;line-height:1.4;}' +
      '.doc-head__bloco{display:inline-block;}' +
      '.doc-head__nome{font-size:16px;font-weight:800;color:var(--doc-primaria);letter-spacing:.2px;}' +
      '.doc-head__role{font-size:11.5px;font-weight:600;color:#555;}' +
      '.doc-head__crn{font-size:11px;color:#777;margin-top:1px;}' +
      '.doc-head__tel{font-size:11px;color:#777;}' +

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

      /* rodapé — assinatura/carimbo alinhados à esquerda (a assinatura faz de carimbo) */
      '.doc-foot{margin-top:36px;padding-top:14px;display:flex;justify-content:flex-start;break-inside:avoid;}' +
      '.doc-sign{text-align:left;min-width:180px;}' +
      '.doc-carimbo{display:block;max-height:58px;max-width:160px;object-fit:contain;margin:0 0 2px;opacity:.97;}' +
      '.doc-sign__img{max-height:40px;max-width:160px;object-fit:contain;display:block;margin:0 0 -2px;}' +
      '.doc-sign__line{border-top:1.2px solid #333;margin:0 0 5px;width:180px;}' +
      '.doc-sign__nome{font-weight:700;font-size:11px;color:#333;}' +
      '.doc-sign__crn{font-size:10px;color:#777;}' +

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
