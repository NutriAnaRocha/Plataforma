/* ============================================================
   ARQUIVOS DO PACIENTE — anexos da ficha (PDFs, fotos, documentos).
   Lado NUTRI:    window.ArquivosPaciente = { render, wire }
   Lado PACIENTE: window.ArquivosView     = { carregar, portalHTML, wire }

   Regra que organiza a tela: arquivo aqui é documento do atendimento,
   não galeria. Por isso ele nasce PRIVADO — a nutri decide, um a um, o
   que a paciente pode ver no portal (o "👁 Liberado"). Nada sobe visível
   por padrão: um laudo interno vazado é dano que não se desfaz.
   Depende de arquivos-db.js (window.NutriArquivos).
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var CATS = [
    { id: "exame",      ico: "🧪", lbl: "Exame" },
    { id: "laudo",      ico: "📃", lbl: "Laudo" },
    { id: "prescricao", ico: "💊", lbl: "Prescrição" },
    { id: "plano",      ico: "🥗", lbl: "Plano" },
    { id: "contrato",   ico: "📝", lbl: "Contrato/Termo" },
    { id: "atestado",   ico: "🩺", lbl: "Atestado" },
    { id: "foto",       ico: "🖼️", lbl: "Foto" },
    { id: "outros",     ico: "📎", lbl: "Outros" }
  ];
  function cat(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return CATS[CATS.length - 1];
  }

  function icoDe(a) {
    var m = String(a.mime || "").toLowerCase(), n = String(a.nome || "").toLowerCase();
    if (m.indexOf("pdf") >= 0 || /\.pdf$/.test(n)) return "📕";
    if (m.indexOf("image") === 0 || /\.(png|jpe?g|gif|webp|heic)$/.test(n)) return "🖼️";
    if (/sheet|excel|csv/.test(m) || /\.(xlsx?|csv)$/.test(n)) return "📊";
    if (/word|document/.test(m) || /\.(docx?|odt|rtf)$/.test(n)) return "📄";
    return cat(a.categoria).ico;
  }

  function tamanho(bytes) {
    var b = Number(bytes || 0);
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
    return (b / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
  }
  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  function mesLabel(iso) {
    var m = /^(\d{4})-(\d{2})/.exec(String(iso || ""));
    if (!m) return "Sem data";
    var txt = MESES[+m[2] - 1] + " de " + m[1];
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  function mesChave(iso) {
    var m = /^(\d{4})-(\d{2})/.exec(String(iso || ""));
    return m ? m[1] + "-" + m[2] : "0000-00";
  }

  /* Abre uma URL assinada sem cair no bloqueador de pop-up: a janela é
     aberta no clique (gesto do usuário) e só depois recebe o endereço. */
  function abrirDepois(promise, onErr) {
    var w = window.open("", "_blank");
    promise.then(function (url) {
      if (!url) throw new Error("link indisponível");
      if (w) w.location.href = url; else window.location.href = url;
    }).catch(function (e) {
      if (w) w.close();
      if (onErr) onErr(e);
    });
  }

  /* ==========================================================
     LADO NUTRI — ficha do paciente
     ========================================================== */
  var _p = null, _ctx = null, _lista = [], _filtro = "todos", _estado = "load";

  function toast(m, e) { if (_ctx && _ctx.toast) _ctx.toast(m, e); }
  function root() { return document.getElementById("arq-root"); }

  function render(p) {
    return '<section class="fsec">' +
      '<div class="fsec__head">' +
        '<h2 class="fsec__title">Arquivos do paciente</h2>' +
        '<div class="pl-res__acoes">' +
          '<button class="btn btn--primary btn--sm" type="button" data-arq-add>📎 Enviar arquivos</button>' +
        '</div>' +
      '</div>' +
      '<p class="pl-hint">Exames em PDF, laudos, termos assinados, fotos de rótulo — tudo que pertence a esta ficha. ' +
        'Cada arquivo nasce <strong>privado</strong>; libere no 👁 o que a paciente pode ver no portal.</p>' +
      '<input type="file" id="arq-input" multiple hidden ' +
        'accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.odt,.rtf,.xls,.xlsx,.csv,.txt" />' +
      '<div class="arq-drop" id="arq-drop"><span>⬆️</span> Arraste arquivos aqui ou clique para escolher <small>até 20 MB cada</small></div>' +
      '<div id="arq-root"><div class="empty-state">Carregando arquivos…</div></div>' +
      '</section>';
  }

  function filtrosHTML() {
    var usadas = {};
    _lista.forEach(function (a) { usadas[a.categoria] = (usadas[a.categoria] || 0) + 1; });
    var chips = '<button class="chip" type="button" data-arq-f="todos" aria-pressed="' + (_filtro === "todos") +
      '">Todos <span class="count">' + _lista.length + '</span></button>';
    CATS.forEach(function (c) {
      if (!usadas[c.id]) return;
      chips += '<button class="chip" type="button" data-arq-f="' + c.id + '" aria-pressed="' + (_filtro === c.id) + '">' +
        c.ico + ' ' + esc(c.lbl) + ' <span class="count">' + usadas[c.id] + '</span></button>';
    });
    return '<div class="filters arq-filters">' + chips + '</div>';
  }

  function itemHTML(a) {
    var c = cat(a.categoria);
    return '<div class="arq-item" data-arq-id="' + esc(a.id) + '">' +
      '<span class="arq-item__ico">' + icoDe(a) + '</span>' +
      '<div class="arq-item__body">' +
        '<button class="arq-item__nome" type="button" data-arq-abrir title="Abrir arquivo">' + esc(a.nome) + '</button>' +
        '<div class="arq-item__meta">' +
          '<span class="arq-tag">' + c.ico + ' ' + esc(c.lbl) + '</span>' +
          '<span>' + tamanho(a.tamanho) + '</span>' +
          '<span>' + dataBR(a.criadoEm) + '</span>' +
          (a.visivel ? '<span class="arq-tag arq-tag--on">👁 Liberado no portal</span>' : '') +
        '</div>' +
        (a.observacao ? '<p class="arq-item__obs">' + esc(a.observacao) + '</p>' : '') +
      '</div>' +
      '<div class="arq-item__acoes">' +
        '<button class="icon-btn" type="button" data-arq-vis title="' +
          (a.visivel ? "Liberado — clique para ocultar do paciente" : "Privado — clique para liberar no portal") + '">' +
          (a.visivel ? "👁" : "🔒") + '</button>' +
        '<button class="icon-btn" type="button" data-arq-editar title="Editar nome, categoria e observação">✏️</button>' +
        '<button class="icon-btn" type="button" data-arq-baixar title="Baixar">⬇️</button>' +
        '<button class="icon-btn" type="button" data-arq-excluir title="Excluir">🗑️</button>' +
      '</div>' +
      '</div>';
  }

  function editorHTML(a) {
    var opts = CATS.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === a.categoria ? " selected" : "") + '>' + c.ico + " " + esc(c.lbl) + '</option>';
    }).join("");
    return '<div class="arq-item arq-item--edit" data-arq-id="' + esc(a.id) + '">' +
      '<div class="arq-edit">' +
        '<label class="pl-field pl-field--wide"><span>Nome do arquivo</span>' +
          '<input type="text" data-arq-nome value="' + esc(a.nome) + '" /></label>' +
        '<label class="pl-field"><span>Categoria</span><select data-arq-cat>' + opts + '</select></label>' +
        '<label class="pl-field pl-field--wide"><span>Observação (só você vê)</span>' +
          '<input type="text" data-arq-obs value="' + esc(a.observacao) + '" placeholder="ex.: exame de 03/2026, trouxe impresso" /></label>' +
        '<div class="pl-actions">' +
          '<button class="btn btn--primary btn--sm" type="button" data-arq-salvar>💾 Salvar</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-arq-cancelar>Cancelar</button>' +
        '</div>' +
      '</div></div>';
  }

  function listaHTML() {
    if (_estado === "load") return '<div class="empty-state">Carregando arquivos…</div>';
    if (_estado === "erro") {
      return '<div class="empty-state">Não foi possível carregar os arquivos. ' +
        '<button class="link-btn" type="button" data-arq-retry>tente de novo</button>.</div>';
    }
    if (!_lista.length) {
      return '<div class="empty-state">Nenhum arquivo anexado ainda. Envie o primeiro exame ou documento acima.</div>';
    }
    var vis = _lista.filter(function (a) { return _filtro === "todos" || a.categoria === _filtro; });
    if (!vis.length) return filtrosHTML() + '<div class="empty-state">Nenhum arquivo nesta categoria.</div>';

    var grupos = [], mapa = {};
    vis.forEach(function (a) {
      var k = mesChave(a.criadoEm);
      if (!mapa[k]) { mapa[k] = { k: k, label: mesLabel(a.criadoEm), itens: [] }; grupos.push(mapa[k]); }
      mapa[k].itens.push(a);
    });
    grupos.sort(function (x, y) { return y.k.localeCompare(x.k); });

    return filtrosHTML() + grupos.map(function (g) {
      return '<div class="arq-grupo"><h3 class="arq-grupo__mes">' + esc(g.label) + '</h3>' +
        g.itens.map(itemHTML).join("") + '</div>';
    }).join("");
  }

  function pintar() {
    var r = root();
    if (r) r.innerHTML = listaHTML();
  }

  function achar(id) {
    for (var i = 0; i < _lista.length; i++) if (_lista[i].id === id) return _lista[i];
    return null;
  }

  function carregar() {
    if (!window.NutriArquivos) { _estado = "erro"; pintar(); return; }
    _estado = "load"; pintar();
    window.NutriArquivos.list(_p.id).then(function (rows) {
      _lista = rows || []; _estado = "ok"; pintar();
    }).catch(function () { _estado = "erro"; pintar(); });
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {}; _lista = []; _filtro = "todos";
    var input = document.getElementById("arq-input");
    var drop = document.getElementById("arq-drop");
    var sec = drop && drop.closest(".fsec");
    if (!input || !sec) return;

    var btnAdd = sec.querySelector("[data-arq-add]");
    if (btnAdd) btnAdd.addEventListener("click", function () { input.click(); });
    drop.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      enviar([].slice.call(input.files || []));
      input.value = "";
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) {
      var fs = (e.dataTransfer && e.dataTransfer.files) || [];
      enviar([].slice.call(fs));
    });

    sec.addEventListener("click", function (e) {
      var t = e.target;
      var f = t.closest("[data-arq-f]");
      if (f) { _filtro = f.getAttribute("data-arq-f"); pintar(); return; }
      if (t.closest("[data-arq-retry]")) { carregar(); return; }

      var item = t.closest("[data-arq-id]");
      if (!item) return;
      var a = achar(item.getAttribute("data-arq-id"));
      if (!a) return;

      if (t.closest("[data-arq-abrir]")) abrir(a);
      else if (t.closest("[data-arq-baixar]")) baixar(a);
      else if (t.closest("[data-arq-vis]")) alternarVisivel(a);
      else if (t.closest("[data-arq-editar]")) item.outerHTML = editorHTML(a);
      else if (t.closest("[data-arq-cancelar]")) item.outerHTML = itemHTML(a);
      else if (t.closest("[data-arq-salvar]")) salvarEdicao(a, item);
      else if (t.closest("[data-arq-excluir]")) excluir(a);
    });

    carregar();
  }

  /* Upload em série (não em paralelo): 5 exames de 15 MB disparados de
     uma vez derrubam a conexão de celular e a nutri não descobre qual
     falhou. Um de cada vez, com o progresso na tela. */
  function enviar(files) {
    if (!files.length) return;
    if (!window.NutriArquivos) { toast("Banco indisponível.", true); return; }
    var drop = document.getElementById("arq-drop");
    var total = files.length, feitos = 0, falhas = 0;

    function passo() {
      if (!files.length) {
        if (drop) { drop.classList.remove("is-busy"); drop.innerHTML = dropTexto(); }
        if (falhas) toast(falhas + " arquivo(s) não subiram.", true);
        else toast(feitos === 1 ? "Arquivo enviado" : feitos + " arquivos enviados");
        pintar();
        return;
      }
      var f = files.shift();
      if (drop) {
        drop.classList.add("is-busy");
        drop.innerHTML = '<span>⏳</span> Enviando ' + esc(f.name) + ' <small>' + (feitos + falhas + 1) + ' de ' + total + '</small>';
      }
      window.NutriArquivos.upload(_p.id, f, { categoria: adivinharCategoria(f), visivel: false })
        .then(function (a) { _lista.unshift(a); feitos++; })
        .catch(function (e) { falhas++; toast((f.name || "arquivo") + ": " + (e && e.message ? e.message : "falhou"), true); })
        .then(passo);
    }
    passo();
  }
  function dropTexto() {
    return '<span>⬆️</span> Arraste arquivos aqui ou clique para escolher <small>até 20 MB cada</small>';
  }

  /* Chute de categoria pelo nome do arquivo — só para a lista já nascer
     organizada. A nutri corrige em dois cliques no ✏️. */
  function adivinharCategoria(f) {
    var n = String(f.name || "").toLowerCase();
    if (/exame|hemograma|sangue|lab|resultado/.test(n)) return "exame";
    if (/laudo/.test(n)) return "laudo";
    if (/prescri|receita|suplement/.test(n)) return "prescricao";
    if (/plano|cardapio|cardápio/.test(n)) return "plano";
    if (/contrato|termo|consentimento|tcle/.test(n)) return "contrato";
    if (/atestado/.test(n)) return "atestado";
    if (/^image\//.test(String(f.type || "")) || /\.(png|jpe?g|webp|heic)$/.test(n)) return "foto";
    return "outros";
  }

  function abrir(a) {
    abrirDepois(
      window.NutriArquivos.assinar([a.path]).then(function (m) { return m[a.path]; }),
      function () { toast("Não foi possível abrir o arquivo.", true); }
    );
  }
  function baixar(a) {
    abrirDepois(
      window.NutriArquivos.assinarDownload(a.path, a.nome),
      function () { toast("Não foi possível baixar o arquivo.", true); }
    );
  }

  function alternarVisivel(a) {
    window.NutriArquivos.update(a.id, { visivel: !a.visivel }).then(function (novo) {
      trocar(a, novo);
      toast(novo.visivel ? "Arquivo liberado no portal da paciente" : "Arquivo ocultado do portal");
    }).catch(function (e) { toast("Não foi possível alterar. " + (e && e.message ? e.message : ""), true); });
  }

  function salvarEdicao(a, item) {
    var nome = (item.querySelector("[data-arq-nome]") || {}).value || a.nome;
    var categoria = (item.querySelector("[data-arq-cat]") || {}).value || a.categoria;
    var obs = (item.querySelector("[data-arq-obs]") || {}).value || "";
    if (!nome.trim()) { toast("O arquivo precisa de um nome.", true); return; }
    window.NutriArquivos.update(a.id, { nome: nome, categoria: categoria, observacao: obs }).then(function (novo) {
      trocar(a, novo);
      toast("Arquivo atualizado");
    }).catch(function (e) { toast("Não foi possível salvar. " + (e && e.message ? e.message : ""), true); });
  }

  function excluir(a) {
    if (!window.confirm('Excluir "' + a.nome + '" desta ficha? O arquivo é apagado de vez.')) return;
    window.NutriArquivos.remove(a).then(function () {
      _lista = _lista.filter(function (x) { return x.id !== a.id; });
      pintar();
      toast("Arquivo excluído");
    }).catch(function (e) { toast("Não foi possível excluir. " + (e && e.message ? e.message : ""), true); });
  }

  function trocar(antigo, novo) {
    for (var i = 0; i < _lista.length; i++) if (_lista[i].id === antigo.id) _lista[i] = novo;
    pintar();
  }

  /* ==========================================================
     LADO PACIENTE — aba "Documentos" do portal
     ========================================================== */
  function carregarPortal(pacienteId) {
    if (!window.NutriArquivos) return Promise.resolve([]);
    return window.NutriArquivos.list(pacienteId).then(function (rows) {
      // Cinto e suspensório: a RLS já filtra, mas no modo "ver como
      // paciente" quem consulta é a nutri — e ela veria tudo.
      return (rows || []).filter(function (a) { return a.visivel; });
    }).catch(function () { return []; });
  }

  function portalHTML(lista) {
    if (!lista || !lista.length) {
      return '<div class="pcard"><div class="empty-state">Sua nutricionista ainda não compartilhou documentos com você. 📎</div></div>';
    }
    var itens = lista.map(function (a) {
      return '<li class="arq-pitem" data-arq-path="' + esc(a.path) + '" data-arq-nome="' + esc(a.nome) + '">' +
        '<span class="arq-pitem__ico">' + icoDe(a) + '</span>' +
        '<span class="arq-pitem__txt"><strong>' + esc(a.nome) + '</strong>' +
          '<small>' + esc(cat(a.categoria).lbl) + ' · ' + tamanho(a.tamanho) + ' · ' + dataBR(a.criadoEm) + '</small></span>' +
        '<button class="btn btn--outline btn--sm" type="button" data-arq-pabrir>Abrir</button>' +
        '</li>';
    }).join("");
    return '<div class="pcard">' +
      '<h2 class="pcard__title">📎 Meus documentos</h2>' +
      '<p class="pcard__sub">Arquivos que sua nutricionista compartilhou com você.</p>' +
      '<ul class="arq-plist">' + itens + '</ul></div>';
  }

  function wirePortal(paneId) {
    var pane = document.getElementById(paneId || "pane-documentos");
    if (!pane) return;
    pane.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-arq-pabrir]");
      if (!btn) return;
      var li = btn.closest("[data-arq-path]");
      var path = li.getAttribute("data-arq-path");
      var nome = li.getAttribute("data-arq-nome");
      abrirDepois(
        window.NutriArquivos.assinarDownload(path, nome),
        function () { window.alert("Não foi possível abrir o arquivo agora. Tente de novo em instantes."); }
      );
    });
  }

  window.ArquivosPaciente = { render: render, wire: wire };
  window.ArquivosView = { carregar: carregarPortal, portalHTML: portalHTML, wire: wirePortal };
})();
