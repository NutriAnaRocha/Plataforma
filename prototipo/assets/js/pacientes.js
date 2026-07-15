/* ============================================================
   PACIENTES (Tela 3) — lista/busca/filtros + perfil com abas.
   Depende de pacientes-data.js (window.PAC_DATA).
   ============================================================ */
(function () {
  "use strict";

  var P = { pacientes: [], filtros: (window.PAC_DATA && window.PAC_DATA.filtros) || ["Todos", "Ativos", "Atenção", "Inativos"] };
  var statusMap = { ativo: "Ativo", atencao: "Atenção", inativo: "Inativo" };

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function iniciaisNome(nome) {
    var p = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "";
    return ((p[0][0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }

  var state = { filtro: "Todos", busca: "", tab: "resumo", current: null, load: "loading" };
  var tierAllowed = null; // teto de features do plano da nutri (null = ainda não carregado → sem restrição)

  document.addEventListener("DOMContentLoaded", function () {
    renderFilters();
    renderList();
    initSearch();
    initMobileNav();
    initCrud();
    loadPatients();
  });

  /* ---------- Carga do banco (Supabase) ---------- */
  function loadPatients() {
    if (!window.NutriPacientes) { state.load = "error"; renderList(); return; }
    state.load = "loading"; renderList();
    window.NutriPacientes.list().then(function (rows) {
      P.pacientes = rows;
      state.load = "ready";
      renderFilters(); renderList();
    }).catch(function () {
      state.load = "error";
      renderList();
    });
  }

  /* ---------- Filtros (status) ---------- */
  function matchFiltro(p) {
    if (state.filtro === "Todos") return true;
    return statusMap[p.status] === state.filtro || (state.filtro === "Ativos" && p.status === "ativo")
      || (state.filtro === "Atenção" && p.status === "atencao")
      || (state.filtro === "Inativos" && p.status === "inativo");
  }
  function countFor(f) {
    if (f === "Todos") return P.pacientes.length;
    var key = f === "Ativos" ? "ativo" : f === "Atenção" ? "atencao" : f === "Inativos" ? "inativo" : null;
    return P.pacientes.filter(function (p) { return p.status === key; }).length;
  }

  function renderFilters() {
    var wrap = el("filters");
    if (!wrap) return;
    wrap.innerHTML = P.filtros.map(function (f) {
      return '<button class="chip" type="button" data-f="' + esc(f) + '" aria-pressed="' + (f === state.filtro) + '">' +
        esc(f) + ' <span class="count">' + countFor(f) + '</span></button>';
    }).join("");
    wrap.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        state.filtro = c.getAttribute("data-f");
        renderFilters(); renderList();
      });
    });
  }

  /* ---------- Lista ---------- */
  function visiblePatients() {
    var q = state.busca.trim().toLowerCase();
    return P.pacientes.filter(matchFiltro).filter(function (p) {
      return !q || p.nome.toLowerCase().indexOf(q) > -1 || (p.objetivo || "").toLowerCase().indexOf(q) > -1;
    });
  }

  function renderList() {
    var wrap = el("plist2");
    if (!wrap) return;
    var rows = visiblePatients();
    var tot = el("pac-total");
    if (tot) tot.textContent = rows.length + " de " + P.pacientes.length + " paciente" + (P.pacientes.length === 1 ? "" : "s");
    if (state.load === "loading") {
      wrap.innerHTML = '<div class="empty-state">Carregando pacientes…</div>';
      return;
    }
    if (state.load === "error") {
      wrap.innerHTML = '<div class="empty-state">Não foi possível carregar os pacientes. Verifique a conexão e ' +
        '<button class="link-btn" id="retry-load" type="button">tente de novo</button>.</div>';
      var rb = el("retry-load"); if (rb) rb.addEventListener("click", loadPatients);
      return;
    }
    if (!rows.length) {
      if (!P.pacientes.length) {
        wrap.innerHTML = '<div class="empty-state">Você ainda não tem pacientes.' +
          '<div class="empty-state__actions">' +
          '<button class="btn btn--primary" id="empty-novo" type="button">+ Cadastrar o primeiro</button>' +
          '<button class="btn btn--outline" id="empty-seed" type="button">Carregar exemplos</button>' +
          '</div></div>';
        var en = el("empty-novo"); if (en) en.addEventListener("click", function () { openForm(null); });
        var es = el("empty-seed"); if (es) es.addEventListener("click", seedExamples);
      } else {
        wrap.innerHTML = '<div class="empty-state">Nenhum paciente encontrado para este filtro/busca.</div>';
      }
      return;
    }
    wrap.innerHTML = rows.map(function (p) {
      var low = p.adesao < 50 ? " is-low" : "";
      return '' +
        '<div class="prow2" data-id="' + p.id + '" role="button" tabindex="0">' +
          '<div class="pcell-who">' +
            '<span class="avatar avatar--sm avatar--rosa">' + esc(p.ini) + '</span>' +
            '<div><div class="pcell-nome">' + esc(p.nome) + '</div>' +
            '<div class="pcell-meta">' + p.idade + ' anos · ' + (p.sexo === "F" ? "Feminino" : "Masculino") + '</div></div>' +
          '</div>' +
          '<div class="pcell-obj">' + esc(p.objetivo) + '</div>' +
          '<div class="pcell-status"><span class="pill pill-' + p.status + '">' + statusMap[p.status] + '</span></div>' +
          '<div class="pcell-adesao"><div class="bar"><div class="bar__fill' + low + '" style="width:' + p.adesao + '%"></div></div>' +
            '<span class="val">' + p.adesao + '%</span></div>' +
          '<div class="pcell-go">›</div>' +
        '</div>';
    }).join("");
    wrap.querySelectorAll(".prow2").forEach(function (r) {
      var open = function () { openProfile(r.getAttribute("data-id")); };
      r.addEventListener("click", open);
      r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    refreshListAdesao(rows);
  }

  function initSearch() {
    var inp = el("search-pac");
    if (!inp) return;
    inp.addEventListener("input", function () { state.busca = inp.value; renderList(); });
  }

  /* ---------- Perfil ---------- */
  function openProfile(id) {
    var p = P.pacientes.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    state.current = p; state.tab = "resumo";
    // Carrega o teto de features do plano da nutri antes de montar o card do portal
    // (cacheado: só a 1ª ficha aberta na sessão faz a consulta).
    var go = function () {
      renderProfile(p);
      document.getElementById("app").classList.add("is-profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    if (tierAllowed) { go(); return; }
    window.NutriPacientes.featuresPermitidas()
      .then(function (a) { tierAllowed = a; })
      .catch(function () {})
      .then(go);
  }
  function closeProfile() {
    document.getElementById("app").classList.remove("is-profile");
  }

  /* ============================================================
     FICHA DO PACIENTE — prontuário completo numa tela só.
     Cabeçalho + ações rápidas + menu lateral de seções + painel.
     ============================================================ */
  var SECOES = [
    { id: "perfil",       ico: "👤", tit: "Perfil do Paciente",     sub: ["Dados pessoais", "Objetivos", "Observações gerais"] },
    { id: "anamnese",     ico: "📝", tit: "Anamnese",               sub: ["Anamnese inicial", "Anamneses de retorno", "Histórico completo"] },
    { id: "exames",       ico: "🧪", tit: "Exames",                 sub: ["Upload de exames", "Visualização", "Histórico"] },
    { id: "antropometria",ico: "📏", tit: "Antropometria",          sub: ["Peso, altura, IMC", "Circunferências", "Dobras", "Evolução gráfica"] },
    { id: "plano",        ico: "🥗", tit: "Planejamento Alimentar", sub: ["Plano atual", "Planos anteriores", "Histórico"] },
    { id: "metas",        ico: "🎯", tit: "Metas",                  sub: ["Metas ativas", "Concluídas", "Evolução"] },
    { id: "prescricoes",  ico: "💊", tit: "Prescrições",            sub: ["Suplementação", "Fitoterapia", "Manipulados"] },
    { id: "orientacoes",  ico: "📄", tit: "Orientações",            sub: ["Atuais", "Histórico"] },
    { id: "arquivos",     ico: "📎", tit: "Arquivos",               sub: ["PDFs", "Fotos", "Documentos"] },
    { id: "comunicacao",  ico: "💬", tit: "Comunicação",            sub: ["WhatsApp", "Mensagens automáticas", "Respostas"] },
    { id: "financeiro",   ico: "💰", tit: "Financeiro",             sub: ["Consultas pagas", "Pendências", "Notas/Recibos"] },
    { id: "prontuario",   ico: "📋", tit: "Prontuário",             sub: ["Evoluções clínicas", "Linha do tempo"] }
  ];

  var ACOES_RAPIDAS = [
    { id: "consulta",       ico: "🩺", label: "Nova Consulta" },
    { id: "anamnese",       ico: "📝", label: "Nova Anamnese" },
    { id: "antropometria",  ico: "📏", label: "Nova Avaliação" },
    { id: "plano",          ico: "🥗", label: "Novo Plano" },
    { id: "prescricao",     ico: "💊", label: "Nova Prescrição" },
    { id: "orientacao",     ico: "📄", label: "Nova Orientação" },
    { id: "whatsapp",       ico: "💬", label: "Enviar WhatsApp" },
    { id: "retorno",        ico: "📅", label: "Agendar Retorno" }
  ];

  function soDigitos(s) { return String(s || "").replace(/\D/g, ""); }
  function fmtCadastro(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d)) return "—";
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch (e) { return "—"; }
  }

  function hgField(lbl, val) {
    return '<div class="ffield"><span class="ffield__lbl">' + lbl + '</span>' +
      '<span class="ffield__val">' + (val == null || val === "" ? "—" : val) + '</span></div>';
  }

  function renderProfile(p) {
    var wrap = el("profile");
    if (!state.section) state.section = "perfil";

    var idadeTxt = (p.idade != null && p.idade !== "" ? p.idade + " anos" : "—");
    var sexoTxt = p.sexo === "F" ? "Feminino" : p.sexo === "M" ? "Masculino" : "—";
    var acesso = p.userId ? '<span class="pill pill-ativo">Portal ativo</span>' : "";

    var acoes = ACOES_RAPIDAS.map(function (a) {
      return '<button class="qact" type="button" data-qa="' + a.id + '">' +
        '<span class="qact__ico">' + a.ico + '</span><span class="qact__lbl">' + a.label + '</span></button>';
    }).join("");

    var menu = SECOES.map(function (s) {
      return '<button class="fmenu-item' + (s.id === state.section ? " is-active" : "") + '" type="button" data-sec="' + s.id + '">' +
        '<span class="fmenu-item__ico">' + s.ico + '</span>' +
        '<span class="fmenu-item__body"><span class="fmenu-item__tit">' + s.tit + '</span>' +
        '<span class="fmenu-item__sub">' + s.sub.join(" · ") + '</span></span></button>';
    }).join("");

    wrap.innerHTML = '' +
      '<button class="back-link" id="back-list">‹ Voltar para a lista</button>' +

      // ----- Cabeçalho do paciente -----
      '<div class="card fhead-card">' +
        '<div class="fhead">' +
          (p.fotoUrl
            ? '<img class="fhead__avatar" src="' + esc(p.fotoUrl) + '" alt="" />'
            : '<span class="fhead__avatar fhead__avatar--ini">' + esc(p.ini) + '</span>') +
          '<div class="fhead__id">' +
            '<h1 class="fhead__name">' + esc(p.nome) +
              ' <span class="pill pill-' + p.status + '">' + statusMap[p.status] + '</span> ' + acesso + '</h1>' +
            '<div class="fhead__grid">' +
              hgField("Idade", idadeTxt) +
              hgField("Sexo", sexoTxt) +
              hgField("Telefone", esc(p.contato.tel || "—")) +
              hgField("E-mail", esc(p.contato.email || "—")) +
              hgField("Cadastro", fmtCadastro(p.criadoEm)) +
              hgField("Última consulta", esc(p.ultConsulta || "—")) +
              hgField("Próxima consulta", esc(p.proxConsulta || "—")) +
              hgField("Objetivo", esc(p.objetivo || "—")) +
            '</div>' +
          '</div>' +
          '<div class="fhead__side">' +
            '<button class="btn btn--ghost btn--sm" id="pac-view" type="button" title="Ver como paciente">👁 Portal</button>' +
            '<button class="btn btn--ghost btn--sm" id="pac-edit" type="button">✏ Editar</button>' +
            '<button class="btn btn--ghost btn--sm btn--danger" id="pac-del" type="button">🗑 Excluir</button>' +
          '</div>' +
        '</div>' +
        '<div class="qacts">' + acoes + '</div>' +
      '</div>' +

      // ----- Corpo: menu lateral + painel -----
      '<div class="ficha">' +
        '<nav class="ficha__menu" id="ficha-menu" aria-label="Seções do paciente">' + menu + '</nav>' +
        '<div class="ficha__main" id="ficha-main"></div>' +
      '</div>';

    el("back-list").addEventListener("click", closeProfile);
    el("pac-view").addEventListener("click", function () { window.open("portal-paciente.html?preview=" + encodeURIComponent(p.id), "_blank"); });
    el("pac-edit").addEventListener("click", function () { openForm(p); });
    el("pac-del").addEventListener("click", function () { confirmDelete(p); });

    el("ficha-menu").addEventListener("click", function (e) {
      var b = e.target.closest(".fmenu-item"); if (!b) return;
      state.section = b.getAttribute("data-sec");
      wrap.querySelectorAll(".fmenu-item").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      renderSection(p);
    });

    wrap.querySelector(".qacts").addEventListener("click", function (e) {
      var b = e.target.closest(".qact"); if (!b) return;
      acaoRapida(p, b.getAttribute("data-qa"));
    });

    renderSection(p);
  }

  /* ---------- Ações rápidas ---------- */
  function irParaSecao(p, sec) {
    state.section = sec;
    el("profile").querySelectorAll(".fmenu-item").forEach(function (x) { x.classList.toggle("is-active", x.getAttribute("data-sec") === sec); });
    renderSection(p);
    var main = el("ficha-main"); if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function acaoRapida(p, id) {
    if (id === "whatsapp") {
      var tel = soDigitos(p.contato.tel);
      if (!tel) { pacToast("Este paciente não tem telefone cadastrado.", true); return; }
      var num = tel.length <= 11 ? "55" + tel : tel;
      window.open("https://wa.me/" + num, "_blank");
      return;
    }
    if (id === "consulta" || id === "retorno") { window.location.href = "agenda.html"; return; }
    if (id === "prescricao") { window.location.href = "prescricoes.html"; return; }
    var mapSec = { anamnese: "anamnese", antropometria: "antropometria", plano: "plano", orientacao: "orientacoes" };
    if (mapSec[id]) { irParaSecao(p, mapSec[id]); pacToast("Abrindo " + mapSec[id] + " — edição completa em breve."); return; }
    pacToast("Em breve nesta seção. 💜");
  }

  /* ---------- Render da seção ativa ---------- */
  function renderSection(p) {
    var main = el("ficha-main");
    if (!main) return;
    var sec = state.section;
    var html;
    switch (sec) {
      case "anamnese":      html = secAnamnese(p); break;
      case "exames":        html = secExames(p); break;
      case "antropometria": html = secAntropometria(p); break;
      case "plano":         html = secPlano(p); break;
      case "metas":         html = secMetas(p); break;
      case "prescricoes":   html = secPrescricoes(p); break;
      case "orientacoes":   html = secOrientacoes(p); break;
      case "arquivos":      html = secArquivos(p); break;
      case "comunicacao":   html = secComunicacao(p); break;
      case "financeiro":    html = secFinanceiro(p); break;
      case "prontuario":    html = secProntuario(p); break;
      default:              html = secPerfil(p);
    }
    main.innerHTML = html;

    // Fiação por seção
    if (sec === "antropometria" && window.Antropometria) {
      window.Antropometria.wire(p, {
        toast: pacToast,
        onSaved: function (saved) {
          for (var i = 0; i < P.pacientes.length; i++) { if (P.pacientes[i].id === saved.id) P.pacientes[i] = saved; }
          state.current = saved;
          renderProfile(saved);
        }
      });
    }
    if (sec === "perfil") { wirePortalCard(p); refreshAdesaoReal(p); }
    if (sec === "comunicacao") { initChatPane(p); loadChatPane(p); }
  }

  /* ---------- Blocos utilitários das seções ---------- */
  function secWrap(titulo, inner) {
    return '<section class="fsec"><h2 class="fsec__title">' + esc(titulo) + '</h2>' + inner + '</section>';
  }
  function emBreve(txt) {
    return '<div class="fbreve"><span class="fbreve__ico">🚧</span>' +
      '<p>' + esc(txt) + '</p><span class="fbreve__tag">Em construção — vamos detalhar juntas</span></div>';
  }

  /* ---------- Seções ---------- */
  function secPerfil(p) {
    var dados = '<div class="finfo-grid">' +
      hgField("Nome completo", esc(p.nome)) +
      hgField("Nascimento", p.dataNascimento ? esc(fmtData(p.dataNascimento)) : "—") +
      hgField("Idade", (p.idade != null && p.idade !== "" ? p.idade + " anos" : "—")) +
      hgField("Sexo", p.sexo === "F" ? "Feminino" : p.sexo === "M" ? "Masculino" : "—") +
      hgField("Telefone", esc(p.contato.tel || "—")) +
      hgField("E-mail", esc(p.contato.email || "—")) +
      hgField("Cidade", esc(p.contato.cidade || "—")) +
      hgField("Cadastro", fmtCadastro(p.criadoEm)) +
    '</div>';
    var objetivos = '<p class="ftxt">' + esc(p.objetivo || "Sem objetivo definido.") + '</p>' +
      (p.meta != null ? '<p class="ftxt"><strong>Meta de peso:</strong> ' + p.meta + ' kg</p>' : '') +
      ((p.tags || []).length ? '<div class="fhead__tags">' + p.tags.map(function (t) { return '<span class="mini-tag">' + esc(t) + '</span>'; }).join("") + '</div>' : '');
    var obs = '<p class="ftxt">' + esc(p.observacoes || "Sem observações registradas.") + '</p>';

    return secWrap("Dados pessoais", dados) +
      secWrap("Objetivos", objetivos) +
      secWrap("Observações gerais", obs) +
      renderPortalCard(p);
  }

  function secAnamnese(p) {
    var inicial = p.anamnese
      ? '<p class="ftxt">' + esc(p.anamnese) + '</p>'
      : '<div class="empty-state">Nenhuma anamnese inicial registrada.</div>';
    var restr = p.restricoes
      ? '<p class="ftxt">' + esc(p.restricoes) + '</p>'
      : '<div class="empty-state">Sem restrições/alergias registradas.</div>';
    return secWrap("Anamnese inicial", inicial) +
      secWrap("Restrições & alergias", restr) +
      secWrap("Anamneses de retorno & histórico", emBreve("Aqui ficará o histórico de anamneses de retorno, com data e comparação entre elas."));
  }

  function secExames(p) {
    var lista = paneLista(p.exames, "🧪", "Nenhum exame registrado ainda.");
    var upload = '<div class="fupload"><span class="fupload__ico">⬆️</span>' +
      '<p>Arraste um PDF/imagem de exame ou clique para enviar.</p>' +
      '<button class="btn btn--outline btn--sm" type="button" data-qa-inline="upload-exame">Enviar exame</button></div>';
    return secWrap("Upload de exames", upload) +
      secWrap("Exames do paciente", lista) +
      secWrap("Histórico", emBreve("Linha do tempo dos exames com comparação de marcadores ao longo do tempo."));
  }

  function secAntropometria(p) {
    if (window.Antropometria) return window.Antropometria.render(p);
    // Fallback simples (caso o módulo não carregue)
    return secWrap("Antropometria", '<div class="fmetric-grid">' +
      fmetric("Peso atual", (p.pesoAtual != null ? p.pesoAtual + " kg" : "—")) +
      fmetric("Altura", (p.altura ? p.altura.toFixed(2) + " m" : "—")) +
      fmetric("IMC", (p.imc != null ? p.imc + "" : "—"), (p.imc != null ? imcClasse(p.imc) : "")) + '</div>');
  }
  function fmetric(lbl, val, hint) {
    return '<div class="fmetric"><div class="fmetric__lbl">' + lbl + '</div>' +
      '<div class="fmetric__val">' + val + '</div>' +
      (hint ? '<div class="fmetric__hint">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function secPlano(p) {
    var atual;
    if (p.plano && (p.plano.titulo || (p.plano.refeicoes || []).length)) {
      var refs = (p.plano.refeicoes || []).map(function (r) {
        var itens = (r.itens || []).map(function (i) {
          return '<div class="fmeal__item"><span>' + esc(i.alimento || i.nome || "") + '</span><span>' + esc(i.qtd || "") + '</span></div>';
        }).join("");
        return '<div class="fmeal"><div class="fmeal__head">' + esc(r.nome || r.hora || "Refeição") + '</div>' + itens + '</div>';
      }).join("");
      atual = '<p class="ftxt"><strong>' + esc(p.plano.titulo || "Plano alimentar atual") + '</strong></p>' + (refs || '<div class="empty-state">Plano sem refeições detalhadas.</div>');
    } else {
      atual = '<div class="empty-state">Nenhum plano alimentar publicado. Crie em Prescrições ou use o botão “Novo Plano”.</div>';
    }
    return secWrap("Plano alimentar atual", atual) +
      secWrap("Planos anteriores & histórico de alterações", emBreve("Versões anteriores do plano e o que mudou em cada revisão."));
  }

  function secMetas(p) {
    var ativa = p.objetivo
      ? '<div class="fgoal"><span class="fgoal__ico">🎯</span><div><strong>' + esc(p.objetivo) + '</strong>' +
        (p.meta != null ? '<p class="ftxt">Meta de peso: ' + p.meta + ' kg · atual: ' + (p.pesoAtual != null ? p.pesoAtual + ' kg' : '—') + '</p>' : '') + '</div></div>'
      : '<div class="empty-state">Nenhuma meta ativa.</div>';
    return secWrap("Metas ativas", ativa) +
      secWrap("Metas concluídas & evolução", emBreve("Histórico de metas batidas e a evolução rumo a cada uma."));
  }

  function secPrescricoes(p) {
    var lista = paneLista(p.prescricoes, "💊", "Nenhuma prescrição registrada.");
    return secWrap("Prescrições do paciente", lista) +
      secWrap("Suplementação · Fitoterapia · Manipulados", emBreve("Prescrições separadas por tipo, com posologia e período — e geração de PDF com a sua identidade."));
  }

  function secOrientacoes(p) {
    return secWrap("Orientações atuais", emBreve("Orientações nutricionais entregues ao paciente (com geração de PDF com a sua marca).")) +
      secWrap("Histórico de orientações", emBreve("Todas as orientações já enviadas, por data."));
  }

  function secArquivos(p) {
    return secWrap("Arquivos do paciente", emBreve("PDFs, fotos e documentos enviados — organizados por tipo e data."));
  }

  function secComunicacao(p) {
    var chat = '<p class="ftxt fmuted">Conversa do portal (paciente ↔ você):</p>' + paneChat();
    return secWrap("Mensagens (portal)", chat) +
      secWrap("WhatsApp & automáticas", emBreve("Histórico de WhatsApp, mensagens automáticas enviadas e respostas do paciente aparecem aqui quando o motor de envio for conectado."));
  }

  function secFinanceiro(p) {
    return secWrap("Financeiro do paciente", emBreve("Consultas pagas, pendências, notas fiscais e recibos deste paciente.")) ;
  }

  function secProntuario(p) {
    var eventos = [];
    (p.consultas || []).forEach(function (c) { eventos.push({ ico: "🩺", tipo: "Consulta", data: c.data, txt: (c.tipo ? esc(c.tipo) + " — " : "") + esc(c.nota || "") }); });
    (p.prescricoes || []).forEach(function (x) { eventos.push({ ico: "💊", tipo: "Prescrição", data: x.data, txt: esc(x.titulo || "") }); });
    (p.exames || []).forEach(function (x) { eventos.push({ ico: "🧪", tipo: "Exame", data: x.data, txt: esc(x.titulo || "") }); });
    if (p.plano && p.plano.titulo) eventos.push({ ico: "🥗", tipo: "Plano alimentar", data: "", txt: esc(p.plano.titulo) });
    if (p.criadoEm) eventos.push({ ico: "✅", tipo: "Cadastro", data: fmtCadastro(p.criadoEm), txt: "Paciente cadastrado na plataforma" });

    var linha = eventos.length
      ? '<div class="ftimeline">' + eventos.map(function (e) {
          return '<div class="ftl"><div class="ftl__dot">' + e.ico + '</div>' +
            '<div class="ftl__body"><div class="ftl__head"><span class="ftl__tipo">' + e.tipo + '</span>' +
            (e.data ? '<span class="ftl__data">' + esc(e.data) + '</span>' : '') + '</div>' +
            (e.txt ? '<p class="ftl__txt">' + e.txt + '</p>' : '') + '</div></div>';
        }).join("") + '</div>'
      : '<div class="empty-state">A linha do tempo vai se montando conforme consultas, planos, exames e mensagens forem acontecendo.</div>';

    return secWrap("Linha do tempo do paciente", linha) +
      secWrap("Evoluções clínicas", emBreve("Registro cronológico das evoluções clínicas escritas por você a cada atendimento."));
  }

  /* ---------- Toast simples da ficha ---------- */
  var pacToastTimer;
  function pacToast(msg, erro) {
    var t = el("pac-toast");
    if (!t) { t = document.createElement("div"); t.id = "pac-toast"; t.className = "pac-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.toggle("is-error", !!erro);
    t.classList.add("is-on");
    clearTimeout(pacToastTimer);
    pacToastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  function pstat(lbl, val, hint) {
    return '<div class="pstat"><div class="pstat__lbl">' + lbl + '</div><div class="pstat__val">' + val + '</div><div class="pstat__hint">' + hint + '</div></div>';
  }
  function tabBtn(id, label) { return '<button class="tab' + (id === "resumo" ? " is-active" : "") + '" data-t="' + id + '">' + label + '</button>'; }
  function pane(id, html) { return '<div class="tabpane' + (id === "resumo" ? " is-active" : "") + '" data-pane="' + id + '">' + html + '</div>'; }

  function switchTab(id) {
    state.tab = id;
    var wrap = el("profile");
    wrap.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-t") === id); });
    wrap.querySelectorAll(".tabpane").forEach(function (pn) { pn.classList.toggle("is-active", pn.getAttribute("data-pane") === id); });
    if (id === "evolucao") drawWeightChart(state.current);
    if (id === "mensagens") loadChatPane(state.current);
  }

  // Adesão REAL: % de itens do plano que o paciente marcou (tabela plano_adesao).
  // Devolve { pct, feitos, total } ou null quando não há plano com itens.
  function realAdesao(p, marcas) {
    var refs = (p.plano && p.plano.refeicoes) || [];
    var total = refs.reduce(function (s, r) { return s + ((r.itens || []).length); }, 0);
    if (!total) return null;
    var feitos = 0;
    refs.forEach(function (r, ri) { (r.itens || []).forEach(function (_it, ii) { if ((marcas || {})[ri + ":" + ii] === true) feitos++; }); });
    return { pct: Math.round(feitos * 100 / total), feitos: feitos, total: total };
  }

  // Substitui o número manual pela adesão real na FICHA quando existe plano publicado.
  function refreshAdesaoReal(p) {
    if (!realAdesao(p, {})) return; // sem plano publicado: mantém o valor manual da ficha
    window.NutriPacientes.getAdesao(p.id).then(function (marcas) {
      var info = realAdesao(p, marcas);
      if (!info) return;
      var val = el("adesao-val"), hintEl = el("adesao-hint");
      if (val) val.textContent = info.pct;
      if (hintEl) {
        var cls = info.pct >= 70 ? "delta--up" : info.pct >= 50 ? "delta--neutro" : "delta--down";
        hintEl.outerHTML = '<span id="adesao-hint"><span class="delta ' + cls + '">' + info.feitos + '/' + info.total + ' itens · marcado pelo paciente</span></span>';
      }
    }).catch(function () { /* silencioso: mantém o valor manual */ });
  }

  // Idem na LISTA: uma query em lote e atualiza a barra dos pacientes com plano.
  function refreshListAdesao(rows) {
    var comPlano = rows.filter(function (p) { return !!realAdesao(p, {}); });
    if (!comPlano.length) return;
    window.NutriPacientes.getAdesaoBatch(comPlano.map(function (p) { return p.id; })).then(function (map) {
      comPlano.forEach(function (p) {
        var info = realAdesao(p, map[p.id] || {});
        if (!info) return;
        var row = document.querySelector('.prow2[data-id="' + p.id + '"]');
        if (!row) return;
        var fill = row.querySelector(".bar__fill"), val = row.querySelector(".val"),
            cell = row.querySelector(".pcell-adesao");
        if (fill) { fill.style.width = info.pct + "%"; fill.classList.toggle("is-low", info.pct < 50); }
        if (val) val.textContent = info.pct + "%";
        if (cell) cell.title = info.feitos + "/" + info.total + " itens marcados pelo paciente";
      });
    }).catch(function () { /* silencioso: mantém o valor manual */ });
  }

  /* ---------- Portal do paciente: acesso + features (entitlements) ---------- */
  var FEAT_LABELS = { plano: "Plano alimentar", evolucao: "Evolução", consultas: "Consultas", chat: "Chat" };

  function renderPortalCard(p) {
    var feats = window.NutriPacientes.TODAS_FEATURES;
    var atuais = p.portalFeatures || feats.slice();
    var allowed = tierAllowed || feats; // teto do plano da nutri (null → sem restrição)
    var toggles = feats.map(function (f) {
      var permitido = allowed.indexOf(f) >= 0;
      var on = permitido && atuais.indexOf(f) >= 0;
      var extra = permitido ? "" : ' <small class="feat-lock">(fora do seu plano)</small>';
      return '<label class="feat-toggle' + (permitido ? "" : " feat-toggle--locked") + '">' +
        '<input type="checkbox" data-feat="' + f + '"' + (on ? " checked" : "") + (permitido ? "" : " disabled") + '>' +
        '<span>' + esc(FEAT_LABELS[f]) + (f === "chat" ? ' <small>(controla o envio de mensagens)</small>' : '') + extra + '</span></label>';
    }).join("");

    var acesso = p.userId
      ? '<div class="portal-acesso portal-acesso--on"><span class="pill pill-ativo">Acesso ativo</span>' +
          '<span class="portal-acesso__hint">O paciente já tem login e vê o próprio acompanhamento.</span></div>'
      : '<div class="portal-acesso"><button class="btn btn--primary btn--sm" id="pac-criar-acesso" type="button">🔑 Criar acesso do paciente</button>' +
          '<span class="portal-acesso__hint">Gera um login para o paciente entrar no portal.</span></div>';

    return '<div class="card portal-card" style="padding:var(--sp-5)">' +
      '<div class="portal-card__head"><h2 class="pcard__title" style="margin:0">Portal do paciente</h2>' +
        '<span class="portal-card__saved" id="feat-saved" hidden>✓ salvo</span></div>' +
      acesso +
      '<div class="portal-card__feats"><span class="portal-card__lbl">O que aparece no portal:</span>' +
        '<div class="feat-toggles">' + toggles + '</div></div>' +
    '</div>';
  }

  function wirePortalCard(p) {
    var btn = el("pac-criar-acesso");
    if (btn) btn.addEventListener("click", function () { openAcessoModal(p); });

    var saved = el("feat-saved"), savedT;
    el("profile").querySelectorAll("[data-feat]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var feats = [];
        el("profile").querySelectorAll("[data-feat]").forEach(function (x) { if (x.checked) feats.push(x.getAttribute("data-feat")); });
        el("profile").querySelectorAll("[data-feat]").forEach(function (x) { x.disabled = true; });
        window.NutriPacientes.setPortalFeatures(p.id, feats).then(function (novo) {
          p.portalFeatures = novo;
          if (saved) { saved.hidden = false; clearTimeout(savedT); savedT = setTimeout(function () { saved.hidden = true; }, 1600); }
        }).catch(function () {
          alert("Não foi possível salvar as permissões. Tente novamente.");
          // reverte a UI ao estado salvo
          el("profile").querySelectorAll("[data-feat]").forEach(function (x) {
            x.checked = (p.portalFeatures || []).indexOf(x.getAttribute("data-feat")) >= 0;
          });
        }).then(function () {
          el("profile").querySelectorAll("[data-feat]").forEach(function (x) { x.disabled = false; });
        });
      });
    });
  }

  function acessoErro(code) {
    return ({
      email_em_uso: "Este e-mail já tem uma conta. Use outro e-mail para o paciente.",
      ja_tem_acesso: "Este paciente já tem acesso criado.",
      ficha_nao_e_sua: "Esta ficha não pertence à sua conta.",
      ficha_inexistente: "Ficha não encontrada. Recarregue a página.",
      email_invalido: "E-mail inválido.",
      senha_curta: "A senha precisa ter ao menos 6 caracteres.",
      faltam_campos: "Informe o e-mail do paciente.",
      invalid_token: "Sua sessão expirou. Faça login de novo.",
      missing_auth: "Sua sessão expirou. Faça login de novo."
    })[code] || "Não foi possível criar o acesso. Tente novamente.";
  }

  function openAcessoModal(p) {
    if (formOverlay) formOverlay.remove();
    formOverlay = document.createElement("div");
    formOverlay.className = "pf-overlay";
    formOverlay.innerHTML =
      '<div class="pf-modal pf-modal--sm" role="dialog" aria-modal="true" aria-label="Criar acesso do paciente">' +
        '<div class="pf-modal__head"><h3>Criar acesso · ' + esc(p.nome) + '</h3>' +
          '<button class="pf-close" type="button" aria-label="Fechar">✕</button></div>' +
        '<form class="pf-form" id="acesso-form">' +
          '<p class="pf-msg" hidden></p>' +
          '<p class="pf-note">O paciente vai usar este e-mail e senha para entrar no portal. ' +
            'A senha é definida agora (não é enviada por e-mail).</p>' +
          '<div class="pf-grid">' +
            field("E-mail do paciente", "email", (p.contato && p.contato.email) || "", { type: "email", required: true, wide: true, placeholder: "email@paciente.com" }) +
            field("Senha (opcional)", "senha", "", { wide: true, placeholder: "deixe em branco para gerar automaticamente" }) +
          '</div>' +
          '<div class="pf-actions">' +
            '<button class="btn btn--ghost" type="button" id="acesso-cancel">Cancelar</button>' +
            '<button class="btn btn--primary" type="submit" id="acesso-save">Criar acesso</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(formOverlay);
    requestAnimationFrame(function () { formOverlay.classList.add("is-open"); });

    var closeIt = function () { if (formOverlay) { formOverlay.remove(); formOverlay = null; } };
    formOverlay.querySelector(".pf-close").addEventListener("click", closeIt);
    formOverlay.querySelector("#acesso-cancel").addEventListener("click", closeIt);
    formOverlay.addEventListener("click", function (e) { if (e.target === formOverlay) closeIt(); });
    formOverlay.querySelector("[name=email]").focus();

    formOverlay.querySelector("#acesso-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var email = String(f.get("email") || "").trim();
      var senha = String(f.get("senha") || "").trim();
      var msg = e.target.querySelector(".pf-msg");
      var save = el("acesso-save");
      if (!email) { msg.textContent = "Informe o e-mail do paciente."; msg.hidden = false; return; }
      save.disabled = true; save.textContent = "Criando…"; msg.hidden = true;
      window.NutriPacientes.criarAcessoPaciente(p.id, email, senha).then(function (cred) {
        p.userId = cred.user_id;
        showCredencial(p, cred);
      }).catch(function (err) {
        save.disabled = false; save.textContent = "Criar acesso";
        msg.textContent = acessoErro(err && err.code); msg.hidden = false;
      });
    });
  }

  function showCredencial(p, cred) {
    if (!formOverlay) return;
    var modal = formOverlay.querySelector(".pf-modal");
    modal.innerHTML =
      '<div class="pf-modal__head"><h3>✅ Acesso criado</h3>' +
        '<button class="pf-close" type="button" aria-label="Fechar">✕</button></div>' +
      '<div class="pf-form">' +
        '<p class="pf-note">Envie estes dados para <strong>' + esc(p.nome) + '</strong>. ' +
          'Anote agora: a senha não fica visível depois.</p>' +
        '<div class="cred-box">' +
          '<div class="cred-row"><span class="cred-lbl">Link</span><code id="cred-link">' + esc(location.origin + location.pathname.replace(/[^/]*$/, "") + "index.html") + '</code></div>' +
          '<div class="cred-row"><span class="cred-lbl">E-mail</span><code id="cred-email">' + esc(cred.email) + '</code></div>' +
          '<div class="cred-row"><span class="cred-lbl">Senha</span><code id="cred-senha">' + esc(cred.senha) + '</code></div>' +
        '</div>' +
        '<div class="pf-actions">' +
          '<button class="btn btn--ghost" type="button" id="cred-copy">📋 Copiar tudo</button>' +
          '<button class="btn btn--primary" type="button" id="cred-done">Concluir</button>' +
        '</div>' +
      '</div>';
    var closeAndRefresh = function () {
      if (formOverlay) { formOverlay.remove(); formOverlay = null; }
      // p já tem userId setado; re-renderiza a ficha com "acesso ativo".
      if (state.current && state.current.id === p.id) renderProfile(p);
      loadPatients(); // atualiza a lista em segundo plano
    };
    modal.querySelector(".pf-close").addEventListener("click", closeAndRefresh);
    modal.querySelector("#cred-done").addEventListener("click", closeAndRefresh);
    modal.querySelector("#cred-copy").addEventListener("click", function () {
      var txt = "Portal: " + el("cred-link").textContent + "\nE-mail: " + cred.email + "\nSenha: " + cred.senha;
      navigator.clipboard.writeText(txt).then(function () {
        var b = el("cred-copy"); b.textContent = "✓ Copiado"; setTimeout(function () { b.textContent = "📋 Copiar tudo"; }, 1500);
      }).catch(function () {});
    });
  }

  /* ---------- Chat (visão nutri) ---------- */
  function paneChat() {
    return '<div class="chat">' +
      '<div class="chat__scroll" id="nchat-scroll"><div class="empty-state">Carregando mensagens…</div></div>' +
      '<form class="chat__form" id="nchat-form">' +
        '<input type="text" id="nchat-input" placeholder="Responder ao paciente…" autocomplete="off" />' +
        '<button class="btn btn--primary" type="submit">Enviar</button></form>' +
    '</div>';
  }
  function initChatPane(p) {
    var form = el("nchat-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = el("nchat-input");
      var txt = inp.value.trim();
      if (!txt) return;
      inp.value = ""; inp.disabled = true;
      window.NutriPacientes.sendMensagem(p.id, "nutri", txt).then(function () {
        inp.disabled = false; inp.focus(); loadChatPane(p);
      }).catch(function () { inp.disabled = false; inp.value = txt; alert("Não foi possível enviar."); });
    });
  }
  function loadChatPane(p) {
    if (!p) return;
    var box = el("nchat-scroll");
    if (!box) return;
    window.NutriPacientes.listMensagens(p.id).then(function (msgs) {
      if (!msgs.length) { box.innerHTML = '<div class="empty-state">Nenhuma mensagem ainda com este paciente.</div>'; return; }
      box.innerHTML = msgs.map(function (m) {
        var mine = m.autor === "nutri";
        return '<div class="msg ' + (mine ? "msg--me" : "msg--nutri") + '">' +
          '<div class="msg__bubble">' + esc(m.corpo) + '</div>' +
          '<div class="msg__time">' + fmtChatTime(m.created_at) + (mine ? "" : " · paciente") + '</div></div>';
      }).join("");
      box.scrollTop = box.scrollHeight;
    }).catch(function () { box.innerHTML = '<div class="empty-state">Não foi possível carregar as mensagens.</div>'; });
  }
  function fmtChatTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  /* ---------- Conteúdo das abas ---------- */
  function paneResumo(p) {
    return '<div class="pgrid">' +
      '<div>' +
        block("Anamnese", p.anamnese) +
        block("Restrições & alergias", p.restricoes) +
        block("Observações clínicas", p.observacoes) +
      '</div>' +
      '<div>' +
        '<div class="info-block"><p class="info-block__label">Contato</p>' +
          '<p class="info-block__text">📞 ' + esc(p.contato.tel) + '<br>✉ ' + esc(p.contato.email) + '<br>📍 ' + esc(p.contato.cidade) + '</p></div>' +
        (p.dataNascimento ? '<div class="info-block"><p class="info-block__label">Nascimento</p>' +
          '<p class="info-block__text">🎂 ' + esc(fmtData(p.dataNascimento)) + '</p></div>' : "") +
        '<div class="info-block"><p class="info-block__label">Agenda</p>' +
          '<p class="info-block__text">Última consulta: <strong>' + esc(p.ultConsulta) + '</strong><br>Próxima: <strong>' + esc(p.proxConsulta) + '</strong></p></div>' +
        '<div class="info-block"><p class="info-block__label">Antropometria</p>' +
          '<p class="info-block__text">Altura: ' + p.altura.toFixed(2) + ' m<br>Peso inicial: ' + p.pesoInicial + ' kg → atual: <strong>' + p.pesoAtual + ' kg</strong></p></div>' +
      '</div>' +
    '</div>';
  }
  function block(label, text) { return '<div class="info-block"><p class="info-block__label">' + label + '</p><p class="info-block__text">' + esc(text) + '</p></div>'; }

  function paneEvolucao(p) {
    return '<div class="pgrid">' +
      '<div><div class="chart" id="weight-chart"></div></div>' +
      '<div>' +
        '<div class="info-block"><p class="info-block__label">Resumo da evolução</p>' +
        '<p class="info-block__text">Variação total: <strong>' + (p.pesoAtual - p.pesoInicial).toFixed(1) + ' kg</strong><br>' +
        'Peso atual: <strong>' + p.pesoAtual + ' kg</strong>' + (p.meta != null ? ' · Meta: ' + p.meta + ' kg' : '') + '<br>' +
        'IMC atual: <strong>' + p.imc + '</strong> (' + imcClasse(p.imc) + ')</p></div>' +
      '</div>' +
    '</div>';
  }

  function paneConsultas(p) {
    if (!p.consultas || !p.consultas.length) return '<div class="empty-state">Sem consultas registradas.</div>';
    return '<div class="timeline">' + p.consultas.map(function (c) {
      return '<div class="tl-item"><div class="tl-date">' + esc(c.data) + '</div>' +
        '<div class="tl-tipo">' + esc(c.tipo) + '</div><p class="tl-nota">' + esc(c.nota) + '</p></div>';
    }).join("") + '</div>';
  }

  function paneLista(items, ico, vazio) {
    if (!items || !items.length) return '<div class="empty-state">' + vazio + '</div>';
    return '<div class="ilist">' + items.map(function (it) {
      return '<div class="iitem"><span class="iitem__ico">' + ico + '</span>' +
        '<div class="iitem__info"><div class="iitem__title">' + esc(it.titulo) + '</div>' +
        '<div class="iitem__date">' + esc(it.data) + '</div></div>' +
        '<span class="istatus is-' + esc(it.status) + '">' + esc(it.status) + '</span></div>';
    }).join("") + '</div>';
  }

  /* ---------- Gráfico de peso (SVG, mesma técnica do dashboard) ---------- */
  function drawWeightChart(p) {
    var host = el("weight-chart");
    if (!host || !p) return;
    var pts = p.evolucao.peso, labels = p.evolucao.labels;
    var W = 520, H = 210, padX = 18, padY = 26;
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
    var span = (max - min) || 1;
    var stepX = (W - padX * 2) / (pts.length - 1);
    function x(i) { return padX + i * stepX; }
    function y(v) { return padY + (H - padY * 2) * (1 - (v - min) / span); }
    var line = pts.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ");
    var area = "M" + x(0).toFixed(1) + " " + (H - padY).toFixed(1) + " " +
      pts.map(function (v, i) { return "L" + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join(" ") +
      " L" + x(pts.length - 1).toFixed(1) + " " + (H - padY).toFixed(1) + " Z";
    var dots = pts.map(function (v, i) {
      return '<g><circle class="chart__pt" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3.2) + '"></circle>' +
        '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (y(v) - 10).toFixed(1) + '" text-anchor="middle">' + v + '</text></g>';
    }).join("");
    var lbls = labels.map(function (l, i) {
      return '<text class="chart__lbl" x="' + x(i).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + esc(l) + '</text>';
    }).join("");
    host.innerHTML = '<div class="chart__head"><span class="chart__big">' + pts[pts.length - 1] + ' kg</span>' +
      '<span class="card__sub">peso · ' + esc(labels[0]) + '–' + esc(labels[labels.length - 1]) + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução de peso">' +
      '<defs><linearGradient id="gradWine2" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#7B284C" stop-opacity="0.20"/><stop offset="100%" stop-color="#7B284C" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="chart__area" style="fill:url(#gradWine2)" d="' + area + '"></path>' +
      '<path class="chart__line" d="' + line + '"></path>' + dots + lbls + '</svg>';
  }

  function imcClasse(imc) {
    if (imc < 18.5) return "Abaixo do peso";
    if (imc < 25) return "Eutrófico";
    if (imc < 30) return "Sobrepeso";
    return "Obesidade";
  }

  /* ---------- Navegação mobile (reaproveita do dashboard) ---------- */
  function initMobileNav() {
    var app = el("app"), toggle = el("menu-toggle"), scrim = el("scrim");
    if (!app || !toggle) return;
    toggle.addEventListener("click", function () { app.classList.toggle("nav-open"); });
    if (scrim) scrim.addEventListener("click", function () { app.classList.remove("nav-open"); });
  }

  /* ============================================================
     CRUD — cadastro/edição/exclusão de pacientes (Supabase).
     ============================================================ */
  function initCrud() {
    var novo = el("btn-novo-pac");
    if (novo) novo.addEventListener("click", function () { openForm(null); });
  }

  function seedExamples() {
    if (!window.NutriPacientes) return;
    var btn = el("empty-seed");
    if (btn) { btn.disabled = true; btn.textContent = "Carregando…"; }
    window.NutriPacientes.seedExamples().then(function () {
      loadPatients();
    }).catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = "Carregar exemplos"; }
      alert("Não foi possível carregar os exemplos. Tente novamente.");
    });
  }

  function confirmDelete(p) {
    if (!window.confirm('Excluir o paciente "' + p.nome + '"? Esta ação não pode ser desfeita.')) return;
    window.NutriPacientes.remove(p.id).then(function () {
      closeProfile();
      loadPatients();
    }).catch(function () { alert("Não foi possível excluir. Tente novamente."); });
  }

  /* ---------- Modal de formulário ---------- */
  var formOverlay = null;

  // "YYYY-MM-DD" -> idade em anos completos (ou null).
  function idadeAnos(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return null;
    var h = new Date(), a = h.getFullYear() - (+m[1]), d = (h.getMonth() + 1) - (+m[2]);
    if (d < 0 || (d === 0 && h.getDate() < (+m[3]))) a--;
    return (a >= 0 && a < 130) ? a : null;
  }
  // "YYYY-MM-DD" -> "DD/MM/YYYY".
  function fmtData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? (m[3] + "/" + m[2] + "/" + m[1]) : "";
  }

  function field(label, name, val, opts) {
    opts = opts || {};
    var v = esc(val == null ? "" : val);
    var input;
    if (opts.type === "textarea") {
      input = '<textarea name="' + name + '" rows="' + (opts.rows || 2) + '">' + v + '</textarea>';
    } else if (opts.type === "select") {
      input = '<select name="' + name + '">' + opts.options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (String(val) === String(o.v) ? " selected" : "") + '>' + esc(o.l) + '</option>';
      }).join("") + '</select>';
    } else {
      input = '<input type="' + (opts.type || "text") + '" name="' + name + '" value="' + v + '"' +
        (opts.type === "number" ? ' step="' + (opts.step || "any") + '"' : "") +
        (opts.required ? " required" : "") + (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : "") + ' />';
    }
    return '<label class="pf-field' + (opts.wide ? " pf-field--wide" : "") + '"><span>' + esc(label) + '</span>' + input + '</label>';
  }

  function openForm(p) {
    var edit = !!p;
    p = p || {};
    var c = p.contato || {};
    if (formOverlay) formOverlay.remove();

    formOverlay = document.createElement("div");
    formOverlay.className = "pf-overlay";
    formOverlay.innerHTML =
      '<div class="pf-modal" role="dialog" aria-modal="true" aria-label="' + (edit ? "Editar paciente" : "Novo paciente") + '">' +
        '<div class="pf-modal__head"><h3>' + (edit ? "Editar paciente" : "Novo paciente") + '</h3>' +
          '<button class="pf-close" type="button" aria-label="Fechar">✕</button></div>' +
        '<form class="pf-form" id="pf-form">' +
          '<p class="pf-msg" hidden></p>' +
          '<div class="pf-foto">' +
            (p.fotoUrl
              ? '<img class="pf-foto__img" id="pf-foto-prev" src="' + esc(p.fotoUrl) + '" alt="" />'
              : '<span class="pf-foto__img pf-foto__img--ini" id="pf-foto-prev">' + esc(iniciaisNome(p.nome) || "📷") + '</span>') +
            '<div class="pf-foto__side">' +
              '<span class="pf-foto__lbl">Foto do paciente</span>' +
              '<input type="file" id="pf-foto-input" accept="image/png,image/jpeg,image/webp" hidden />' +
              '<button class="btn btn--outline btn--sm" type="button" id="pf-foto-btn">' + (p.fotoUrl ? "Trocar foto" : "Enviar foto") + '</button>' +
              '<span class="pf-foto__hint">JPG ou PNG, até 3 MB (opcional).</span>' +
            '</div>' +
          '</div>' +
          '<div class="pf-grid">' +
            field("Nome completo", "nome", p.nome, { required: true, wide: true }) +
            field("Data de nascimento", "dataNascimento", p.dataNascimento, { type: "date" }) +
            field("CPF", "cpf", p.cpf, { placeholder: "000.000.000-00" }) +
            field("Telefone", "tel", c.tel, { type: "tel", wide: true, placeholder: "(21) 99999-9999" }) +
          '</div>' +
          '<div class="pf-actions">' +
            '<button class="btn btn--ghost" type="button" id="pf-cancel">Cancelar</button>' +
            '<button class="btn btn--primary" type="submit" id="pf-save">' + (edit ? "Salvar alterações" : "Cadastrar paciente") + '</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(formOverlay);
    requestAnimationFrame(function () { formOverlay.classList.add("is-open"); });

    var closeIt = function () { if (formOverlay) { formOverlay.remove(); formOverlay = null; } };
    formOverlay.querySelector(".pf-close").addEventListener("click", closeIt);
    formOverlay.querySelector("#pf-cancel").addEventListener("click", closeIt);
    formOverlay.addEventListener("click", function (e) { if (e.target === formOverlay) closeIt(); });
    formOverlay.querySelector("[name=nome]").focus();

    // Foto do paciente: escolhe arquivo, comprime e guarda como data URL no form.
    var formEl = formOverlay.querySelector("#pf-form");
    formEl._fotoUrl = p.fotoUrl || "";
    var fotoInput = formOverlay.querySelector("#pf-foto-input");
    var fotoBtn = formOverlay.querySelector("#pf-foto-btn");
    var fotoPrev = formOverlay.querySelector("#pf-foto-prev");
    if (fotoBtn && fotoInput) {
      fotoBtn.addEventListener("click", function () { fotoInput.click(); });
      fotoInput.addEventListener("change", function () {
        var file = fotoInput.files && fotoInput.files[0];
        fotoInput.value = "";
        if (!file) return;
        if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { alert("Use uma imagem JPG, PNG ou WEBP."); return; }
        if (file.size > 3 * 1024 * 1024) { alert("A imagem passa de 3 MB. Escolha uma menor."); return; }
        processarFotoPaciente(file).then(function (dataUrl) {
          formEl._fotoUrl = dataUrl;
          var novo = document.createElement("img");
          novo.className = "pf-foto__img"; novo.id = "pf-foto-prev"; novo.src = dataUrl; novo.alt = "";
          fotoPrev.replaceWith(novo); fotoPrev = novo;
          fotoBtn.textContent = "Trocar foto";
        }).catch(function () { alert("Não foi possível carregar a foto."); });
      });
    }

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      saveForm(e.target, edit ? p : null, closeIt);
    });
  }

  // Redimensiona a foto do paciente para no máx. 360px e devolve JPEG data URL.
  function processarFotoPaciente(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("img")); };
        img.onload = function () {
          var MAX = 360, w = img.naturalWidth, h = img.naturalHeight;
          var s = Math.min(1, MAX / Math.max(w, h));
          var cw = Math.round(w * s), ch = Math.round(h * s);
          var cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
          cv.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function saveForm(form, existing, closeIt) {
    var f = new FormData(form);
    var g = function (k) { var v = f.get(k); return v == null ? "" : String(v).trim(); };
    var msg = form.querySelector(".pf-msg");
    var save = form.querySelector("#pf-save");

    var nome = g("nome");
    if (!nome) { msg.textContent = "Informe o nome do paciente."; msg.hidden = false; return; }

    // Cadastro enxuto: nome, foto, nascimento, CPF, telefone. Ao editar,
    // parte do paciente existente para NÃO apagar os demais campos (geridos
    // nas seções da ficha: antropometria, plano, anamnese, etc.).
    var base = existing ? Object.assign({}, existing) : { status: "ativo" };
    var payload = Object.assign(base, {
      nome: nome,
      dataNascimento: g("dataNascimento"),
      cpf: g("cpf"),
      fotoUrl: form._fotoUrl || "",
      contato: Object.assign({}, (existing && existing.contato) || {}, { tel: g("tel") })
    });

    save.disabled = true; save.textContent = "Salvando…"; msg.hidden = true;
    var op = existing ? window.NutriPacientes.update(existing.id, payload)
                      : window.NutriPacientes.create(payload);
    op.then(function (saved) {
      closeIt();
      state.load = "ready";
      return window.NutriPacientes.list().then(function (rows) {
        P.pacientes = rows;
        renderFilters(); renderList();
        if (existing) { var fresh = rows.filter(function (x) { return x.id === saved.id; })[0]; if (fresh) openProfile(fresh.id); }
      });
    }).catch(function (err) {
      save.disabled = false; save.textContent = existing ? "Salvar alterações" : "Cadastrar paciente";
      var m = (err && err.message) || "";
      var amigo;
      if (/schema cache|column .* does not exist|could not find/i.test(m)) {
        amigo = "O banco ainda não tem os campos novos do cadastro. Rode a migração 0015 no Supabase (cpf, foto_url, antropometria) e o reload do schema.";
      } else if (/offline|failed to fetch|networkerror|load supabase/i.test(m)) {
        amigo = "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
      } else {
        amigo = "Não foi possível salvar. " + (m || "Tente novamente.");
      }
      msg.textContent = amigo; msg.hidden = false;
    });
  }
})();
