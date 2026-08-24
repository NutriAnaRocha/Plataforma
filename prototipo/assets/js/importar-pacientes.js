/* ============================================================
   Anutri — Importador de pacientes (CSV / XLSX)
   ------------------------------------------------------------
   Assistente de 4 passos para a nutri trazer a carteira de
   pacientes de outra plataforma:
     1. Arquivo    — CSV ou XLSX (é o que todo sistema exporta)
     2. Mapeamento — coluna do arquivo -> campo da Anutri
     3. Prévia     — normalização, duplicados, erros
     4. Importar   — insert em lote + relatório

   Deliberadamente NÃO importa histórico, antropometria ou plano:
   o que trava a troca de plataforma é redigitar o cadastro.

   Expõe window.NutriImportar.abrir().
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Campos que a Anutri aceita no import ---------- */
  var CAMPOS = [
    { k: "nome",            l: "Nome completo",       req: true,
      alias: ["nome", "nomecompleto", "paciente", "nomedopaciente", "nomepaciente", "cliente", "nomecliente", "nomedocliente"] },
    { k: "dataNascimento",  l: "Data de nascimento",
      alias: ["datadenascimento", "datanascimento", "nascimento", "dtnascimento", "datanasc", "nasc", "aniversario", "dtnasc", "datadenasc"] },
    { k: "sexo",            l: "Sexo",
      alias: ["sexo", "genero", "sexobiologico", "generobiologico"] },
    { k: "cpf",             l: "CPF",
      alias: ["cpf", "documento", "cpfcnpj", "ndocumento", "numerodocumento"] },
    { k: "tel",             l: "Telefone",
      alias: ["telefone", "celular", "tel", "whatsapp", "whats", "fone", "telefonecelular", "telcelular", "contato", "telefone1", "numero"] },
    { k: "email",           l: "E-mail",
      alias: ["email", "emails", "emailpaciente", "correioeletronico", "mail", "endereçoemail", "enderecoemail"] },
    { k: "cidade",          l: "Cidade",
      alias: ["cidade", "municipio", "localidade", "cidadeuf"] },
    { k: "objetivo",        l: "Objetivo",
      alias: ["objetivo", "objetivos", "objetivodaconsulta", "motivo", "motivodaconsulta", "queixa", "queixaprincipal"] },
    { k: "observacoes",     l: "Observações",
      alias: ["observacoes", "observacao", "obs", "anotacoes", "anotacao", "comentarios", "notas", "historico"] }
  ];

  var MAX_LINHAS = 2000;   // teto de segurança por arquivo
  var LOTE = 40;           // linhas por insert

  /* ============================================================
     Utilidades
     ============================================================ */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // "Data de Nascimento" -> "datadenascimento" (sem acento, só alfanumérico)
  function slug(s) {
    return String(s == null ? "" : s)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function digitos(s) { return String(s == null ? "" : s).replace(/\D/g, ""); }

  /* ---------- Normalizações ---------- */

  // Aceita DD/MM/AAAA, DD-MM-AAAA, AAAA-MM-DD e serial do Excel.
  // Devolve "AAAA-MM-DD" ou "" se não reconhecer.
  function normData(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return "";

    // Serial do Excel (dias desde 30/12/1899). Faixa útil: 1900–2050.
    if (/^\d+(\.\d+)?$/.test(s)) {
      var n = parseFloat(s);
      if (n > 1 && n < 80000) {
        var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
        return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      }
      return "";
    }

    var m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(s);          // AAAA-MM-DD
    if (m) return valida(+m[1], +m[2], +m[3]);

    m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/.exec(s);            // DD/MM/AAAA
    if (m) {
      var ano = +m[3];
      if (ano < 100) ano += (ano > 30 ? 1900 : 2000);
      return valida(ano, +m[2], +m[1]);
    }
    return "";

    function iso(a, me, di) {
      return a + "-" + (me < 10 ? "0" : "") + me + "-" + (di < 10 ? "0" : "") + di;
    }
    function valida(a, me, di) {
      if (a < 1900 || a > 2100 || me < 1 || me > 12 || di < 1 || di > 31) return "";
      return iso(a, me, di);
    }
  }

  function normSexo(v) {
    var s = slug(v);
    if (!s) return "";
    if (/^(f|fem|feminino|mulher|female|2)$/.test(s)) return "F";
    if (/^(m|masc|masculino|homem|male|1)$/.test(s)) return "M";
    return "";
  }

  // Guarda no formato brasileiro quando reconhece; senão devolve o original.
  function normTel(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) return "";
    var d = digitos(s);
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);   // +55
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return s;
  }

  function normCpf(v) {
    var d = digitos(v);
    if (d.length !== 11) return String(v == null ? "" : v).trim();
    return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  }

  function normEmail(v) {
    var s = String(v == null ? "" : v).trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : (s ? s : "");
  }

  /* ============================================================
     Leitura do arquivo
     ============================================================ */

  // Excel brasileiro salva CSV em windows-1252; o resto do mundo em UTF-8.
  function decodificar(buf) {
    var u8 = new Uint8Array(buf);
    if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) {
      return new TextDecoder("utf-8").decode(u8.subarray(3));
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(u8);
    } catch (e) {
      return new TextDecoder("windows-1252").decode(u8);
    }
  }

  function detectarSeparador(texto) {
    var linha = texto.split(/\r?\n/)[0] || "";
    var fora = linha.replace(/"[^"]*"/g, "");
    var cands = [";", ",", "\t", "|"];
    var melhor = ",", max = 0;
    cands.forEach(function (c) {
      var n = fora.split(c).length - 1;
      if (n > max) { max = n; melhor = c; }
    });
    return melhor;
  }

  function parseCSV(texto, sep) {
    var linhas = [], linha = [], campo = "", aspas = false, i = 0;
    while (i < texto.length) {
      var ch = texto.charAt(i);
      if (aspas) {
        if (ch === '"') {
          if (texto.charAt(i + 1) === '"') { campo += '"'; i += 2; continue; }
          aspas = false; i++; continue;
        }
        campo += ch; i++; continue;
      }
      if (ch === '"') { aspas = true; i++; continue; }
      if (ch === sep) { linha.push(campo); campo = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      if (ch === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; i++; continue; }
      campo += ch; i++;
    }
    if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas;
  }

  /* ---------- XLSX: zip + XML, sem biblioteca ---------- */

  function descompactar(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf);
    var eocd = -1, limite = Math.max(0, u8.length - 22 - 65536);
    for (var i = u8.length - 22; i >= limite; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("Arquivo .xlsx inválido.");

    var total = dv.getUint16(eocd + 10, true);
    var p = dv.getUint32(eocd + 16, true);
    var entradas = [];
    for (var k = 0; k < total; k++) {
      if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
      var metodo = dv.getUint16(p + 10, true);
      var comp = dv.getUint32(p + 20, true);
      var fnLen = dv.getUint16(p + 28, true);
      var exLen = dv.getUint16(p + 30, true);
      var cmLen = dv.getUint16(p + 32, true);
      var loc = dv.getUint32(p + 42, true);
      var nome = new TextDecoder("utf-8").decode(u8.subarray(p + 46, p + 46 + fnLen));
      p += 46 + fnLen + exLen + cmLen;
      var lfn = dv.getUint16(loc + 26, true), lex = dv.getUint16(loc + 28, true);
      var ini = loc + 30 + lfn + lex;
      entradas.push({ nome: nome, metodo: metodo, dados: u8.subarray(ini, ini + comp) });
    }
    return entradas;
  }

  function inflar(entrada) {
    if (!entrada) return Promise.resolve("");
    if (entrada.metodo === 0) {
      return Promise.resolve(new TextDecoder("utf-8").decode(entrada.dados));
    }
    if (typeof DecompressionStream === "undefined") {
      return Promise.reject(new Error("Este navegador não abre .xlsx. Salve a planilha como CSV e tente de novo."));
    }
    var ds = new DecompressionStream("deflate-raw");
    var w = ds.writable.getWriter();
    w.write(entrada.dados); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (ab) {
      return new TextDecoder("utf-8").decode(new Uint8Array(ab));
    });
  }

  function colParaIndice(ref) {
    var m = /^([A-Z]+)/.exec(String(ref || "").toUpperCase());
    if (!m) return -1;
    var n = 0, s = m[1];
    for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n - 1;
  }

  function lerXLSX(buf) {
    var entradas;
    try { entradas = descompactar(buf); }
    catch (e) { return Promise.reject(e); }

    var acha = function (nome) {
      for (var i = 0; i < entradas.length; i++) if (entradas[i].nome === nome) return entradas[i];
      return null;
    };
    var planilha = acha("xl/worksheets/sheet1.xml");
    if (!planilha) {
      for (var i = 0; i < entradas.length; i++) {
        if (/^xl\/worksheets\/.*\.xml$/.test(entradas[i].nome)) { planilha = entradas[i]; break; }
      }
    }
    if (!planilha) return Promise.reject(new Error("Não encontrei nenhuma planilha dentro do arquivo."));

    return Promise.all([inflar(acha("xl/sharedStrings.xml")), inflar(planilha)])
      .then(function (r) {
        var strs = [], parser = new DOMParser();
        if (r[0]) {
          var ds = parser.parseFromString(r[0], "application/xml");
          var sis = ds.getElementsByTagName("si");
          for (var i = 0; i < sis.length; i++) {
            var ts = sis[i].getElementsByTagName("t"), txt = "";
            for (var j = 0; j < ts.length; j++) txt += ts[j].textContent;
            strs.push(txt);
          }
        }

        var doc = parser.parseFromString(r[1], "application/xml");
        var rows = doc.getElementsByTagName("row"), out = [];
        for (var x = 0; x < rows.length && out.length < MAX_LINHAS + 5; x++) {
          var cs = rows[x].getElementsByTagName("c"), linha = [];
          for (var y = 0; y < cs.length; y++) {
            var c = cs[y];
            var idx = colParaIndice(c.getAttribute("r"));
            if (idx < 0) idx = y;
            var tipo = c.getAttribute("t"), valor = "";
            if (tipo === "s") {
              var vEl = c.getElementsByTagName("v")[0];
              var n = vEl ? parseInt(vEl.textContent, 10) : NaN;
              valor = (!isNaN(n) && strs[n] != null) ? strs[n] : "";
            } else if (tipo === "inlineStr") {
              var its = c.getElementsByTagName("t");
              for (var z = 0; z < its.length; z++) valor += its[z].textContent;
            } else {
              var v2 = c.getElementsByTagName("v")[0];
              valor = v2 ? v2.textContent : "";
            }
            while (linha.length < idx) linha.push("");
            linha[idx] = valor;
          }
          out.push(linha);
        }
        return out;
      });
  }

  // -> Promise({ cabecalho: [..], linhas: [[..]] })
  function lerArquivo(file) {
    return file.arrayBuffer().then(function (buf) {
      var xlsx = /\.xlsx$/i.test(file.name) ||
        (new Uint8Array(buf, 0, 2)[0] === 0x50 && new Uint8Array(buf, 0, 2)[1] === 0x4B);
      var p = xlsx
        ? lerXLSX(buf)
        : Promise.resolve(function () {
            var texto = decodificar(buf);
            return parseCSV(texto, detectarSeparador(texto));
          }());
      return p.then(function (grade) {
        // Descarta linhas totalmente vazias e usa a primeira que sobrar como cabeçalho.
        var util = grade.filter(function (l) {
          return l.some(function (c) { return String(c == null ? "" : c).trim() !== ""; });
        });
        if (!util.length) throw new Error("O arquivo está vazio.");
        var cabecalho = util[0].map(function (c, i) {
          var t = String(c == null ? "" : c).trim();
          return t || ("Coluna " + (i + 1));
        });
        var linhas = util.slice(1, MAX_LINHAS + 1);
        if (!linhas.length) throw new Error("O arquivo só tem o cabeçalho — nenhuma linha de paciente.");
        return { cabecalho: cabecalho, linhas: linhas, cortado: util.length - 1 > MAX_LINHAS };
      });
    });
  }

  /* ---------- Detecção automática do mapeamento ---------- */
  function autoMapear(cabecalho) {
    var mapa = {}, usadas = {};
    CAMPOS.forEach(function (campo) {
      for (var i = 0; i < cabecalho.length; i++) {
        if (usadas[i]) continue;
        var s = slug(cabecalho[i]);
        if (!s) continue;
        var bate = campo.alias.indexOf(s) >= 0;
        // "Telefone / WhatsApp" e afins: o alias aparece dentro do cabeçalho.
        if (!bate && s.length > 3) {
          bate = campo.alias.some(function (a) { return a.length > 3 && s.indexOf(a) === 0; });
        }
        if (bate) { mapa[campo.k] = i; usadas[i] = true; return; }
      }
      mapa[campo.k] = -1;
    });
    return mapa;
  }

  /* ============================================================
     Estado do assistente
     ============================================================ */
  var S = null;
  var overlay = null;

  function abrir() {
    S = {
      passo: 1, arquivo: null, cabecalho: [], linhas: [], mapa: {},
      cortado: false, prontos: [], erros: [], duplicados: [],
      pularDuplicados: true, existentes: null, msg: ""
    };
    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.className = "pf-overlay imp-overlay";
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) fechar(); });
    render();
  }

  function fechar() {
    if (overlay) { overlay.remove(); overlay = null; }
    S = null;
  }

  function render() {
    if (!overlay) return;
    var corpo = S.passo === 1 ? passoArquivo()
              : S.passo === 2 ? passoMapa()
              : S.passo === 3 ? passoPrevia()
              : passoFim();

    overlay.innerHTML =
      '<div class="pf-modal imp-modal" role="dialog" aria-modal="true" aria-label="Importar pacientes">' +
        '<div class="pf-modal__head">' +
          '<h3>Importar pacientes</h3>' +
          '<button class="pf-close" type="button" aria-label="Fechar">✕</button>' +
        '</div>' +
        passosBarra() +
        '<div class="imp-body">' +
          (S.msg ? '<p class="pf-msg">' + esc(S.msg) + '</p>' : "") +
          corpo +
        '</div>' +
      '</div>';

    overlay.querySelector(".pf-close").addEventListener("click", fechar);
    ligar();
  }

  function passosBarra() {
    var nomes = ["Arquivo", "Colunas", "Conferir", "Pronto"];
    return '<ol class="imp-steps">' + nomes.map(function (n, i) {
      var st = (i + 1) < S.passo ? " is-done" : (i + 1) === S.passo ? " is-now" : "";
      return '<li class="imp-step' + st + '"><span class="imp-step__n">' + (i + 1) + '</span>' + esc(n) + '</li>';
    }).join("") + '</ol>';
  }

  /* ---------- Passo 1: arquivo ---------- */
  function passoArquivo() {
    return '' +
      '<p class="imp-lead">Traga a lista de pacientes que você exportou da sua plataforma atual. ' +
      'Aceitamos <strong>CSV</strong> e <strong>Excel (.xlsx)</strong> — é o que todo sistema exporta.</p>' +
      '<div class="imp-drop" id="imp-drop" tabindex="0" role="button">' +
        '<span class="imp-drop__ico">📄</span>' +
        '<strong>Arraste o arquivo aqui</strong>' +
        '<span class="imp-drop__hint">ou clique para escolher · CSV ou XLSX, até ' + MAX_LINHAS + ' linhas</span>' +
        '<input type="file" id="imp-file" accept=".csv,.txt,.xlsx" hidden />' +
      '</div>' +
      '<details class="imp-ajuda">' +
        '<summary>Como exportar da minha plataforma atual</summary>' +
        '<p>Procure por <em>Exportar</em>, <em>Relatório de pacientes</em> ou <em>Baixar em Excel</em> ' +
        'na tela de pacientes. No WebDiet o caminho é a lista de pacientes → exportar em Excel. ' +
        'Se o seu sistema não exportar, monte uma planilha com uma coluna por informação ' +
        '(nome, nascimento, telefone…) — a primeira linha é o cabeçalho.</p>' +
      '</details>' +
      '<div class="pf-actions"><button class="btn btn--ghost" type="button" id="imp-cancel">Cancelar</button></div>';
  }

  /* ---------- Passo 2: mapeamento ---------- */
  function passoMapa() {
    var opcoes = function (sel) {
      return '<option value="-1">— não importar —</option>' +
        S.cabecalho.map(function (h, i) {
          return '<option value="' + i + '"' + (sel === i ? " selected" : "") + ">" + esc(h) + "</option>";
        }).join("");
    };
    var amostra = function (idx) {
      if (idx < 0) return "";
      for (var i = 0; i < S.linhas.length && i < 8; i++) {
        var v = String(S.linhas[i][idx] == null ? "" : S.linhas[i][idx]).trim();
        if (v) return '<span class="imp-map__ex">ex.: ' + esc(v.slice(0, 34)) + "</span>";
      }
      return "";
    };

    return '' +
      '<p class="imp-lead"><strong>' + esc(S.arquivo) + '</strong> · ' + S.linhas.length +
        ' linha' + (S.linhas.length === 1 ? "" : "s") + ' · ' + S.cabecalho.length + ' colunas. ' +
        'Confira o que cada coluna vira aqui dentro.' +
        (S.cortado ? ' <span class="imp-aviso">Só as ' + MAX_LINHAS + ' primeiras linhas serão lidas.</span>' : "") +
      '</p>' +
      '<div class="imp-map">' + CAMPOS.map(function (c) {
        return '<div class="imp-map__row">' +
          '<label class="imp-map__lbl" for="map-' + c.k + '">' + esc(c.l) +
            (c.req ? ' <span class="imp-req">obrigatório</span>' : "") + '</label>' +
          '<div class="imp-map__sel">' +
            '<select id="map-' + c.k + '" data-campo="' + c.k + '">' + opcoes(S.mapa[c.k]) + '</select>' +
            amostra(S.mapa[c.k]) +
          '</div>' +
        '</div>';
      }).join("") + '</div>' +
      '<div class="pf-actions">' +
        '<button class="btn btn--ghost" type="button" id="imp-voltar">Voltar</button>' +
        '<button class="btn btn--primary" type="button" id="imp-conferir">Conferir</button>' +
      '</div>';
  }

  /* ---------- Passo 3: prévia ---------- */
  function passoPrevia() {
    var novos = S.prontos.length;
    var linhasPreview = S.prontos.slice(0, 8);

    var tabela = novos
      ? '<div class="imp-tab-wrap"><table class="imp-tab">' +
          '<thead><tr><th>Nome</th><th>Nascimento</th><th>Sexo</th><th>Telefone</th><th>E-mail</th></tr></thead>' +
          '<tbody>' + linhasPreview.map(function (p) {
            return "<tr>" +
              "<td>" + esc(p.nome) + "</td>" +
              "<td>" + esc(p.dataNascimento || "—") + "</td>" +
              "<td>" + esc(p.sexo || "—") + "</td>" +
              "<td>" + esc((p.contato && p.contato.tel) || "—") + "</td>" +
              "<td>" + esc((p.contato && p.contato.email) || "—") + "</td>" +
            "</tr>";
          }).join("") + "</tbody></table></div>" +
          (novos > 8 ? '<p class="imp-mais">… e mais ' + (novos - 8) + ".</p>" : "")
      : '<p class="imp-vazio">Nenhum paciente novo para importar.</p>';

    var blocos = '<div class="imp-cards">' +
      '<div class="imp-card imp-card--ok"><strong>' + novos + "</strong><span>a importar</span></div>" +
      '<div class="imp-card"><strong>' + S.duplicados.length + "</strong><span>já cadastrados</span></div>" +
      '<div class="imp-card' + (S.erros.length ? " imp-card--erro" : "") + '"><strong>' + S.erros.length + "</strong><span>com problema</span></div>" +
      "</div>";

    var dups = S.duplicados.length
      ? '<details class="imp-ajuda"><summary>' + S.duplicados.length + ' já parecem cadastrados</summary>' +
        '<ul class="imp-lista">' + S.duplicados.slice(0, 30).map(function (d) {
          return "<li>Linha " + d.linha + " — <strong>" + esc(d.nome) + "</strong>: " + esc(d.motivo) + "</li>";
        }).join("") + "</ul>" +
        '<label class="imp-check"><input type="checkbox" id="imp-pular"' + (S.pularDuplicados ? " checked" : "") + " /> " +
        "Pular os repetidos (recomendado)</label></details>"
      : "";

    var errs = S.erros.length
      ? '<details class="imp-ajuda" open><summary>' + S.erros.length + " linha(s) não podem ser importadas</summary>" +
        '<ul class="imp-lista">' + S.erros.slice(0, 30).map(function (e) {
          return "<li>Linha " + e.linha + " — " + esc(e.motivo) + "</li>";
        }).join("") + "</ul></details>"
      : "";

    var podeIr = novos > 0 || (S.duplicados.length > 0 && !S.pularDuplicados);
    return blocos + tabela + dups + errs +
      '<p class="imp-nota">Os importados entram como <strong>ativos</strong> e recebem a etiqueta ' +
      '<strong>importado</strong>, para você achá-los depois. Nada além do cadastro é criado.</p>' +
      '<div class="pf-actions">' +
        '<button class="btn btn--ghost" type="button" id="imp-voltar">Voltar</button>' +
        '<button class="btn btn--primary" type="button" id="imp-gravar"' + (podeIr ? "" : " disabled") + ">Importar " +
          (podeIr ? aImportar().length + " paciente" + (aImportar().length === 1 ? "" : "s") : "") + "</button>" +
      "</div>";
  }

  function aImportar() {
    return S.pularDuplicados
      ? S.prontos
      : S.prontos.concat(S.duplicados.map(function (d) { return d.paciente; }));
  }

  /* ---------- Passo 4: resultado ---------- */
  function passoFim() {
    var f = S.fim || { ok: 0, falhas: [] };
    return '' +
      '<div class="imp-fim">' +
        '<span class="imp-fim__ico">' + (f.falhas.length ? "⚠️" : "✅") + "</span>" +
        "<h4>" + f.ok + " paciente" + (f.ok === 1 ? "" : "s") + " importado" + (f.ok === 1 ? "" : "s") + ".</h4>" +
        (f.falhas.length
          ? "<p>" + f.falhas.length + " não entraram. Confira e tente de novo só com essas linhas.</p>" +
            '<ul class="imp-lista">' + f.falhas.slice(0, 15).map(function (x) {
              return "<li><strong>" + esc(x.nome) + "</strong>: " + esc(x.motivo) + "</li>";
            }).join("") + "</ul>"
          : "<p>Eles já estão na sua lista, com a etiqueta <strong>importado</strong>.</p>") +
      "</div>" +
      '<div class="pf-actions"><button class="btn btn--primary" type="button" id="imp-fechar">Ver meus pacientes</button></div>';
  }

  /* ============================================================
     Eventos
     ============================================================ */
  function ligar() {
    var q = function (sel) { return overlay.querySelector(sel); };

    var cancel = q("#imp-cancel"); if (cancel) cancel.addEventListener("click", fechar);
    var fim = q("#imp-fechar");
    if (fim) fim.addEventListener("click", function () { fechar(); recarregarLista(); });

    var voltar = q("#imp-voltar");
    if (voltar) voltar.addEventListener("click", function () { S.msg = ""; S.passo--; render(); });

    /* Passo 1 */
    var drop = q("#imp-drop"), input = q("#imp-file");
    if (drop && input) {
      drop.addEventListener("click", function () { input.click(); });
      drop.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
      });
      input.addEventListener("change", function () {
        var f = input.files && input.files[0];
        input.value = "";
        if (f) carregar(f);
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
      });
      drop.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) carregar(f);
      });
    }

    /* Passo 2 */
    var selects = overlay.querySelectorAll(".imp-map select");
    Array.prototype.forEach.call(selects, function (sel) {
      sel.addEventListener("change", function () {
        S.mapa[sel.getAttribute("data-campo")] = parseInt(sel.value, 10);
        render();
      });
    });
    var conferir = q("#imp-conferir");
    if (conferir) conferir.addEventListener("click", irParaPrevia);

    /* Passo 3 */
    var pular = q("#imp-pular");
    if (pular) pular.addEventListener("change", function () {
      S.pularDuplicados = pular.checked; render();
    });
    var gravar = q("#imp-gravar");
    if (gravar) gravar.addEventListener("click", gravarTudo);
  }

  function carregar(file) {
    S.msg = "";
    var drop = overlay.querySelector("#imp-drop");
    if (drop) drop.innerHTML = '<span class="imp-drop__ico">⏳</span><strong>Lendo ' + esc(file.name) + "…</strong>";

    lerArquivo(file).then(function (r) {
      S.arquivo = file.name;
      S.cabecalho = r.cabecalho;
      S.linhas = r.linhas;
      S.cortado = r.cortado;
      S.mapa = autoMapear(r.cabecalho);
      S.passo = 2;
      render();
    }).catch(function (err) {
      S.msg = (err && err.message) || "Não consegui ler esse arquivo. Tente salvá-lo como CSV.";
      render();
    });
  }

  /* ---------- Normaliza tudo e cruza com quem já existe ---------- */
  function irParaPrevia() {
    if (S.mapa.nome == null || S.mapa.nome < 0) {
      S.msg = "Escolha qual coluna tem o nome do paciente — sem isso não dá para importar.";
      render(); return;
    }
    S.msg = "";
    var btn = overlay.querySelector("#imp-conferir");
    if (btn) { btn.disabled = true; btn.textContent = "Conferindo…"; }

    existentes().then(function (idx) {
      var prontos = [], erros = [], dups = [];
      var vistosCpf = {}, vistosEmail = {}, vistosNome = {};

      S.linhas.forEach(function (linha, i) {
        var nLinha = i + 2;  // +1 do cabeçalho, +1 porque planilha começa em 1
        var col = function (k) {
          var idxc = S.mapa[k];
          if (idxc == null || idxc < 0) return "";
          return String(linha[idxc] == null ? "" : linha[idxc]).trim();
        };

        var nome = col("nome").replace(/\s+/g, " ");
        if (!nome) { erros.push({ linha: nLinha, motivo: "sem nome" }); return; }
        if (nome.length > 120) nome = nome.slice(0, 120);

        var cpf = normCpf(col("cpf"));
        var email = normEmail(col("email"));
        var nasc = col("dataNascimento");
        var nascOk = normData(nasc);

        var p = {
          nome: nome,
          dataNascimento: nascOk,
          sexo: normSexo(col("sexo")) || null,
          cpf: cpf || null,
          objetivo: col("objetivo") || null,
          observacoes: col("observacoes") || null,
          status: "ativo",
          tags: ["importado"],
          contato: { tel: normTel(col("tel")), email: email, cidade: col("cidade") }
        };

        // Duplicado — contra o banco e contra o próprio arquivo.
        var chaveCpf = digitos(cpf), chaveNome = slug(nome);
        var motivo = "";
        if (chaveCpf.length === 11 && (idx.cpf[chaveCpf] || vistosCpf[chaveCpf])) motivo = "CPF já cadastrado";
        else if (email && (idx.email[email] || vistosEmail[email])) motivo = "e-mail já cadastrado";
        else if (idx.nome[chaveNome] || vistosNome[chaveNome]) motivo = "já existe um paciente com esse nome";

        if (chaveCpf.length === 11) vistosCpf[chaveCpf] = 1;
        if (email) vistosEmail[email] = 1;
        vistosNome[chaveNome] = 1;

        if (motivo) dups.push({ linha: nLinha, nome: nome, motivo: motivo, paciente: p });
        else prontos.push(p);

        if (nasc && !nascOk) {
          erros.push({ linha: nLinha, motivo: 'data de nascimento "' + nasc + '" não reconhecida — ' + nome + " entra sem ela" });
        }
      });

      S.prontos = prontos; S.duplicados = dups; S.erros = erros;
      S.passo = 3; render();
    }).catch(function (err) {
      S.msg = "Não consegui conferir com a sua lista atual. " + ((err && err.message) || "");
      render();
    });
  }

  // Índices de quem já está cadastrado, para não duplicar.
  function existentes() {
    if (S.existentes) return Promise.resolve(S.existentes);
    if (!window.NutriPacientes) return Promise.resolve({ cpf: {}, email: {}, nome: {} });
    return window.NutriPacientes.list().then(function (rows) {
      var idx = { cpf: {}, email: {}, nome: {} };
      (rows || []).forEach(function (p) {
        var c = digitos(p.cpf);
        if (c.length === 11) idx.cpf[c] = 1;
        var e = ((p.contato && p.contato.email) || "").trim().toLowerCase();
        if (e) idx.email[e] = 1;
        var n = slug(p.nome);
        if (n) idx.nome[n] = 1;
      });
      S.existentes = idx;
      return idx;
    });
  }

  /* ---------- Grava em lote ---------- */
  function gravarTudo() {
    var fila = aImportar();
    if (!fila.length) return;

    var btn = overlay.querySelector("#imp-gravar");
    var ok = 0, falhas = [];

    var passo = function (i) {
      if (i >= fila.length) {
        S.fim = { ok: ok, falhas: falhas };
        S.passo = 4; render();
        return Promise.resolve();
      }
      var lote = fila.slice(i, i + LOTE);
      if (btn) btn.textContent = "Importando " + Math.min(i + lote.length, fila.length) + " de " + fila.length + "…";

      return window.NutriPacientes.createMany(lote).then(function () {
        ok += lote.length;
        return passo(i + LOTE);
      }).catch(function (err) {
        // O lote caiu: tenta um a um para salvar o que dá e apontar quem falhou.
        return lote.reduce(function (cadeia, p) {
          return cadeia.then(function () {
            return window.NutriPacientes.create(p).then(function () { ok++; })
              .catch(function (e2) {
                falhas.push({ nome: p.nome, motivo: amigo((e2 && e2.message) || (err && err.message) || "") });
              });
          });
        }, Promise.resolve()).then(function () { return passo(i + LOTE); });
      });
    };

    if (btn) btn.disabled = true;
    passo(0);
  }

  function amigo(m) {
    if (/schema cache|column .* does not exist|could not find/i.test(m)) {
      return "o banco está sem um campo do cadastro (rode as migrações pendentes)";
    }
    if (/offline|failed to fetch|networkerror/i.test(m)) return "sem conexão com o servidor";
    if (/row-level security|permission/i.test(m)) return "sem permissão para gravar";
    return m || "erro desconhecido";
  }

  function recarregarLista() {
    if (window.NutriPacientesTela && window.NutriPacientesTela.recarregar) {
      window.NutriPacientesTela.recarregar();
    } else {
      window.location.reload();
    }
  }

  window.NutriImportar = { abrir: abrir };
})();
