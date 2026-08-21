/* ============================================================
   EDITOR DE FÓRMULAS — campo de texto com formatação (negrito,
   itálico, sublinhado e cor), no lugar do textarea cru.
   Expõe window.EditorFormulas.

   O formato dos dados NÃO muda: a fórmula continua sendo
   { titulo, componentes: [{ ativo, dose, obs }], posologia, duracao, via },
   que é o que o card, o banco de formulações e o PDF sabem ler. O que
   passa a existir é formatação DENTRO de cada pedaço de texto — e só
   as marcas inline (<b>, <i>, <u>, <s>, <mark>, <span style="color">).
   Nada de <div>, <img>, <a> ou atributo solto: o mesmo HTML vai para o
   PDF e para a tela do paciente, então ele tem de ser previsível.

   A leitura das linhas é feita no DOM, não por regex sobre a string:
   os marcadores da sintaxe ("# ", "- ", "|", "Posologia:") são achados
   por deslocamento de TEXTO e o pedaço é recortado com um Range. Assim
   uma negrito que atravessa o "|" sai com as tags fechadas dos dois
   lados, em vez de vazar "<b>" para dentro da dose.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- Paleta da barra ----------
     Poucas cores, todas legíveis no papel: o PDF sai com
     print-color-adjust:exact, então o que se vê na tela é o que imprime. */
  var COR_PADRAO = "#3C3C3C";
  var CORES = [
    { lbl: "Padrão",   cor: COR_PADRAO },
    { lbl: "Petróleo", cor: "#0E4C5C" },
    { lbl: "Magenta",  cor: "#840B55" },
    { lbl: "Verde",    cor: "#1E7A46" },
    { lbl: "Âmbar",    cor: "#9A6100" },
    { lbl: "Vermelho", cor: "#B3261E" }
  ];

  /* ---------- Sanitização ---------- */
  var TAGS_OK = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, SPAN: 1, MARK: 1 };

  function corValida(v) {
    v = String(v || "").trim().toLowerCase();
    return /^#[0-9a-f]{3,8}$/.test(v) ||
           /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/.test(v) ||
           /^[a-z]{3,20}$/.test(v);
  }

  function desembrulhar(pai, el) {
    while (el.firstChild) pai.insertBefore(el.firstChild, el);
    pai.removeChild(el);
  }

  function limpar(no) {
    Array.prototype.slice.call(no.childNodes).forEach(function (f) {
      if (f.nodeType === 3) return;                       // texto fica como está
      if (f.nodeType !== 1) { no.removeChild(f); return; } // comentário, CDATA…
      var tag = f.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") { no.removeChild(f); return; }
      // <br> não sobrevive dentro de um pedaço: quebra de linha é estrutura.
      if (tag === "BR") { no.replaceChild(document.createTextNode(" "), f); return; }
      // O execCommand antigo ainda produz <font color>: vira span com cor.
      if (tag === "FONT") {
        var sp = document.createElement("span");
        var cor = f.getAttribute("color");
        if (corValida(cor)) sp.style.color = cor;
        while (f.firstChild) sp.appendChild(f.firstChild);
        no.replaceChild(sp, f);
        f = sp; tag = "SPAN";
      }
      limpar(f);
      if (!TAGS_OK[tag]) { desembrulhar(no, f); return; }
      // Atributos: só sobra style, e dentro dele só a cor.
      var cor2 = f.style && f.style.color;
      Array.prototype.slice.call(f.attributes).forEach(function (a) { f.removeAttribute(a.name); });
      if (corValida(cor2)) f.style.color = cor2;
      // <span> sem cor não serve para nada — deixa só o texto.
      if (tag === "SPAN" && !f.getAttribute("style")) desembrulhar(no, f);
    });
  }

  function sanitizar(html) {
    var caixa = document.createElement("div");
    caixa.innerHTML = String(html == null ? "" : html);
    limpar(caixa);
    return caixa.innerHTML;
  }

  // HTML seguro → texto puro (para copiar, buscar e para o WhatsApp).
  function texto(html) {
    var caixa = document.createElement("div");
    caixa.innerHTML = String(html == null ? "" : html);
    return (caixa.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function aparar(html) {
    return String(html || "").replace(/^(?:\s|&nbsp;)+/, "").replace(/(?:\s|&nbsp;)+$/, "");
  }

  /* ---------- Leitura: DOM → fórmulas ---------- */

  /* O contenteditable representa linha ora como <div>, ora como texto
     solto separado por <br>, e o Chrome aninha os dois ao colar. Aqui as
     duas formas viram a mesma lista de elementos-linha. */
  function achatar(el, saida) {
    var buffer = document.createElement("div");
    function fecha() { saida.push(buffer); buffer = document.createElement("div"); }
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === "BR") { fecha(); return; }
      if (n.nodeType === 1 && /^(DIV|P|LI|UL|OL|SECTION|H\d)$/.test(n.tagName)) {
        if (buffer.childNodes.length) fecha();
        achatar(n, saida);
        return;
      }
      buffer.appendChild(n.cloneNode(true));
    });
    if (buffer.childNodes.length) saida.push(buffer);
  }
  function linhasDe(el) {
    var out = [];
    achatar(el, out);
    return out;
  }

  // Deslocamento em caracteres de texto → ponto (nó, offset) para o Range.
  function ponto(raiz, alvo) {
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null, false);
    var acc = 0, n;
    while ((n = w.nextNode())) {
      var len = n.nodeValue.length;
      if (acc + len >= alvo) return { no: n, off: alvo - acc };
      acc += len;
    }
    return { no: raiz, off: raiz.childNodes.length, borda: true };
  }
  /* Recorta o HTML entre dois deslocamentos de texto. O Range fecha as
     tags abertas sozinho — é por isso que o corte é feito aqui e não
     com split() em cima da string. */
  function fatia(linha, ini, fim) {
    /* Encolhe até o primeiro/último caractere que não é espaço ANTES de
       recortar: aparar() só limparia as pontas da string, e o espaço que
       sobra dentro de um <b> vira "<b>300 </b>" no banco. */
    var t = linha.textContent || "";
    while (ini < fim && /\s/.test(t.charAt(ini))) ini++;
    while (fim > ini && /\s/.test(t.charAt(fim - 1))) fim--;
    if (fim <= ini) return "";
    var a = ponto(linha, ini), b = ponto(linha, fim);
    var r = document.createRange();
    if (a.borda) r.setStart(linha, linha.childNodes.length); else r.setStart(a.no, a.off);
    if (b.borda) r.setEnd(linha, linha.childNodes.length); else r.setEnd(b.no, b.off);
    var caixa = document.createElement("div");
    caixa.appendChild(r.cloneContents());
    return aparar(sanitizar(caixa.innerHTML));
  }

  /* Mesma sintaxe de sempre:
       "# Título"                abre uma fórmula
       "- Ativo | dose | obs"    componente
       "Posologia:/Duração:/Via:" nas linhas próprias           */
  function formulasDe(el) {
    var out = [], atual = null;
    function garante() { if (!atual) { atual = { titulo: "", componentes: [] }; out.push(atual); } }

    linhasDe(el).forEach(function (linha) {
      var t = (linha.textContent || "").replace(/\u00a0/g, " ");
      if (!t.trim()) return;

      var mTit = /^\s*#\s+/.exec(t);
      if (mTit) {
        atual = { titulo: fatia(linha, mTit[0].length, t.length), componentes: [] };
        out.push(atual);
        return;
      }
      var mCampo = /^\s*(posologia|dura[çc][ãa]o|via)\s*:\s*/i.exec(t);
      if (mCampo) {
        garante();
        var chave = mCampo[1].toLowerCase();
        var valor = fatia(linha, mCampo[0].length, t.length);
        if (chave.indexOf("pos") === 0) atual.posologia = valor;
        else if (chave.indexOf("via") === 0) atual.via = valor;
        else atual.duracao = valor;
        return;
      }
      garante();
      var mMarca = /^\s*[-•*]\s*/.exec(t) || /^\s*/.exec(t);
      var partes = [], corte = mMarca[0].length;
      for (var i = corte; i <= t.length; i++) {
        if (i === t.length || t.charAt(i) === "|") { partes.push(fatia(linha, corte, i)); corte = i + 1; }
      }
      atual.componentes.push({
        ativo: partes[0] || "",
        dose: partes[1] || "",
        obs: partes.slice(2).filter(Boolean).join(" ")
      });
    });
    return out;
  }

  // Fórmulas → as linhas que aparecem no editor (com a formatação de volta).
  function paraEditor(formulas) {
    var linhas = [];
    (formulas || []).forEach(function (f, i) {
      if (i) linhas.push("");
      if (f.titulo) linhas.push("# " + sanitizar(f.titulo));
      (f.componentes || []).forEach(function (c) {
        linhas.push("- " + [c.ativo, c.dose, c.obs].filter(Boolean).map(sanitizar).join(" | "));
      });
      if (f.posologia) linhas.push("Posologia: " + sanitizar(f.posologia));
      if (f.duracao) linhas.push("Duração: " + sanitizar(f.duracao));
      if (f.via) linhas.push("Via: " + sanitizar(f.via));
    });
    return linhas.map(function (l) { return "<div>" + (l || "<br>") + "</div>"; }).join("");
  }

  /* ---------- Campo ---------- */
  function botao(cmd, rotulo, titulo, cls) {
    return '<button type="button" class="ef__b ' + (cls || "") + '" data-ef-cmd="' + cmd + '" ' +
      'title="' + esc(titulo) + '" aria-label="' + esc(titulo) + '">' + rotulo + '</button>';
  }
  function amostra(c) {
    return '<button type="button" class="ef__cor" data-ef-cmd="cor" data-ef-cor="' + c.cor + '" ' +
      'style="--c:' + c.cor + '" title="' + esc(c.lbl) + '" aria-label="Cor: ' + esc(c.lbl) + '"></button>';
  }

  var seq = 0;
  function campo(opts) {
    opts = opts || {};
    var id = opts.id || ("ef-" + (++seq));
    return '<div class="ef">' +
      '<div class="ef__barra" role="toolbar" aria-label="Formatação do texto">' +
        botao("bold", "N", "Negrito (Ctrl+B)", "ef__b--n") +
        botao("italic", "I", "Itálico (Ctrl+I)", "ef__b--i") +
        botao("underline", "S", "Sublinhado (Ctrl+U)", "ef__b--u") +
        '<span class="ef__sep"></span>' +
        CORES.map(amostra).join("") +
        '<span class="ef__sep"></span>' +
        botao("limpar", "Limpar", "Tirar a formatação do trecho selecionado", "ef__b--limpar") +
      '</div>' +
      '<div class="ef__area" id="' + esc(id) + '" contenteditable="true" role="textbox" ' +
        'aria-multiline="true" aria-label="' + esc(opts.rotulo || "Fórmulas") + '" ' +
        'data-ef-area="1" data-ph="' + esc(opts.placeholder || "") + '" ' +
        'style="min-height:' + (opts.altura || 200) + 'px">' + (opts.valorHTML || "") + '</div>' +
      (opts.hint ? '<p class="ef__hint">' + opts.hint + '</p>' : "") +
    '</div>';
  }

  /* Fia as barras dentro de `root`. Pode ser chamada de novo sem
     duplicar handler (cada barra guarda que já foi fiada). */
  function wire(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll(".ef"), function (bloco) {
      if (bloco._efWired) return;
      bloco._efWired = true;
      var barra = bloco.querySelector(".ef__barra");
      var area = bloco.querySelector(".ef__area");
      if (!barra || !area) return;

      // mousedown no botão tirava a seleção do texto antes do clique chegar.
      barra.addEventListener("mousedown", function (e) { e.preventDefault(); });
      barra.addEventListener("click", function (e) {
        var b = e.target.closest("[data-ef-cmd]");
        if (!b) return;
        e.preventDefault();
        area.focus();
        var cmd = b.getAttribute("data-ef-cmd");
        /* styleWithCSS decide o que o execCommand produz. Ligado, o negrito
           sairia como <span style="font-weight:bold"> — e o sanitizador só
           deixa passar COR dentro do style, então a formatação se perdia ao
           salvar. Ligado só para a cor (que precisa virar span com color);
           desligado para negrito/itálico/sublinhado, que viram <b>/<i>/<u>. */
        try { document.execCommand("styleWithCSS", false, cmd === "cor"); } catch (err) {}
        if (cmd === "cor") document.execCommand("foreColor", false, b.getAttribute("data-ef-cor"));
        else if (cmd === "limpar") document.execCommand("removeFormat", false, null);
        else document.execCommand(cmd, false, null);
        atualizaEstado();
      });

      // Colar entra como TEXTO: HTML de fora traria fonte, fundo e tabela.
      area.addEventListener("paste", function (e) {
        e.preventDefault();
        var t = ((e.clipboardData || window.clipboardData).getData("text/plain") || "");
        document.execCommand("insertText", false, t);
      });
      area.addEventListener("keyup", atualizaEstado);
      area.addEventListener("mouseup", atualizaEstado);
      area.addEventListener("focus", atualizaEstado);

      function atualizaEstado() {
        [["bold", "ef__b--n"], ["italic", "ef__b--i"], ["underline", "ef__b--u"]].forEach(function (par) {
          var bt = barra.querySelector("." + par[1]);
          if (!bt) return;
          var on = false;
          try { on = document.queryCommandState(par[0]); } catch (err) {}
          bt.classList.toggle("is-on", !!on);
        });
      }
    });
  }

  /* Lê o campo. Aceita a própria área, um container que a contenha ou um
     elemento solto com o HTML das linhas (é o que o teste usa). */
  function ler(el) {
    if (!el) return [];
    var area = (el.classList && el.classList.contains("ef__area")) ? el
             : (el.querySelector && el.querySelector(".ef__area")) || el;
    return formulasDe(area);
  }

  window.EditorFormulas = {
    CORES: CORES,
    campo: campo,
    wire: wire,
    ler: ler,
    sanitizar: sanitizar,
    texto: texto,
    paraEditor: paraEditor
  };
})();
