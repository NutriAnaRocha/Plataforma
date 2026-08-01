/* ============================================================
   PORTAL DO PACIENTE — visão do próprio acompanhamento.
   Dois modos:
     • real     — um paciente logado (profiles.tipo = 'paciente'),
                  vê e edita a própria conversa. RLS filtra tudo.
     • preview  — a nutri logada abre ?preview=<paciente_id> para
                  ver "como o paciente veria" (somente leitura no chat).
   Requer supabase-client.js + pacientes-db.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  var ctx = { mode: "real", paciente: null, user: null, marcas: {}, assinatura: null };

  // WhatsApp da Ana — canal do convite de renovação. O programa é
  // pagamento único por período: renovar é uma decisão nova da paciente,
  // conversada, nunca uma cobrança que dispara sozinha (ver 0043).
  var WA_NUTRI = "5521994094557";
  var SITE_PROGRAMA = "https://nutrianarocha.github.io/site/meu-plano.html";

  window.NutriDBReady.then(function (c) {
    return c.auth.getSession().then(function (r) {
      if (!r.data.session) { window.location.replace("index.html"); return null; }
      ctx.user = r.data.session.user;
      var previewId = new URLSearchParams(window.location.search).get("preview");

      return c.from("profiles").select("tipo,nome").maybeSingle().then(function (pr) {
        var tipo = (pr.data && pr.data.tipo) || "nutri";
        if (tipo === "nutri") {
          if (!previewId) { window.location.replace("dashboard.html"); return null; }
          ctx.mode = "preview";
          return window.NutriPacientes.get(previewId);
        }
        // paciente real: a própria ficha (RLS devolve só ela)
        ctx.mode = "real";
        return window.NutriPacientes.list().then(function (rows) { return rows[0] || null; });
      });
    });
  }).then(function (paciente) {
    if (paciente === undefined) return;
    if (!paciente) { showNoData(); return; }
    ctx.paciente = paciente;
    return window.NutriPacientes.getAdesao(paciente.id)
      .then(function (marcas) { ctx.marcas = marcas || {}; })
      .catch(function () { ctx.marcas = {}; })
      .then(function () { return carregarAssinatura(paciente); })
      .then(function () { boot(); });
  }).catch(function () {
    el("portal-loading").textContent = "Não foi possível carregar. Verifique a conexão e recarregue.";
  });

  function showNoData() {
    el("portal-loading").innerHTML = "Ainda não há um acompanhamento vinculado a esta conta. " +
      "Fale com sua nutricionista. <br><br><button class='btn btn--outline' data-logout type='button'>Sair</button>";
    wireLogout();
  }

  /* Assinatura do programa "Meu Plano" — é dela que saem o relógio da
     reavaliação e a data de fim da vigência. Uma consulta só; a RLS da
     0043 já recorta (a paciente enxerga a própria, a nutri as da
     carteira dela, e o filtro por paciente_id serve aos dois modos).
     Quem não está no programa simplesmente não tem linha: tudo o que
     depende disso fica invisível, sem erro. */
  function carregarAssinatura(p) {
    return window.NutriDBReady.then(function (c) {
      return c.from("programa_assinaturas")
        .select("id,status,plano,inicio,fim,proxima_reavaliacao,reavaliacoes_feitas,ultima_reavaliacao_em")
        .eq("paciente_id", p.id)
        .order("fim", { ascending: false })
        .limit(1);
    }).then(function (res) {
      ctx.assinatura = (res && res.data && res.data[0]) || null;
    }).catch(function () { ctx.assinatura = null; });
  }

  function boot() {
    var p = ctx.paciente;
    el("portal-loading").hidden = true;
    el("portal").hidden = false;
    if (ctx.mode === "preview") el("preview-bar").hidden = false;

    var primeiro = (p.nome || "").split(/\s+/)[0] || "";
    el("portal-hi").textContent = "Olá, " + primeiro;
    el("portal-avatar").textContent = p.ini || "?";
    el("portal-name").textContent = p.nome || "—";
    el("portal-sub").textContent = subTexto(p, anamnesePendente(p));

    el("pane-anamnese").innerHTML =
      (window.AnamneseView && temAnamnese(p)) ? window.AnamneseView.portalHTML(p) : "";
    el("pane-reavaliacao").innerHTML =
      temReavaliacao(p) ? window.ReavaliacaoView.portalHTML() : "";
    el("pane-plano").innerHTML = renderPlano(p);
    el("pane-treino").innerHTML = window.TreinoView ? window.TreinoView.portalHTML(p, ctx.marcas, ctx.mode === "preview") : "";
    el("pane-metas").innerHTML = window.MetasView ? window.MetasView.portalHTML(p, ctx.marcas, ctx.mode === "preview") : "";
    el("pane-evolucao").innerHTML = renderEvolucao(p);
    hidratarFotosPortal(p);
    hidratarFotosRefeicao();
    el("pane-consultas").innerHTML = renderConsultas(p);

    // Abas
    el("portal-tabs").querySelectorAll(".ptab").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.getAttribute("data-t")); });
    });

    applyFeatureGate(p);
    drawWeightChart(p);
    initChat();
    wireLogout();

    if (window.AnamneseView && temAnamnese(p)) {
      window.AnamneseView.wire(p, {
        user: ctx.user,
        readonly: ctx.mode === "preview",
        // Depois de enviar, some o destaque de pendência do cabeçalho —
        // a bola passa a estar com a nutri.
        onSalvo: function () { el("portal-sub").textContent = subTexto(p, false); }
      });
    }

    if (temReavaliacao(p)) {
      window.ReavaliacaoView.wire(p, ctx.assinatura, {
        readonly: ctx.mode === "preview",
        onSalvo: function () { el("portal-sub").textContent = subTexto(p, false); }
      });
    }
  }

  /* A anamnese do programa é a porta de entrada de quem comprou o
     "Meu Plano": enquanto ela não for enviada, não existe avaliação — e
     sem avaliação não existe plano. Por isso ela vira a aba ativa.

     Só vale para quem está no programa (a tag entra na ficha junto com a
     compra, no programa-webhook). Sem esse recorte, todo paciente antigo
     abriria o portal sendo cobrado a responder um questionário de 10
     etapas que não tem nada a ver com o atendimento dele. */
  function noPrograma(p) {
    return (p.tags || []).indexOf("programa") >= 0;
  }
  function anamnesePendente(p) {
    return !!(window.AnamneseView && window.AnamneseView.pendente(p)) && noPrograma(p);
  }
  // Já respondida, a aba fica mostrando o prazo de entrega até o plano
  // sair; aí some, porque cumpriu o papel.
  function anamneseRespondida(p) {
    return !!(window.AnamneseView && !window.AnamneseView.pendente(p));
  }
  function temAnamnese(p) {
    if (anamnesePendente(p)) return true;
    return anamneseRespondida(p) && !planosLiberados(p).length;
  }
  /* A reavaliação é o outro lado do que foi vendido: o programa é
     acompanhamento, não entrega única. A aba aparece quando o ciclo abre
     (proxima_reavaliacao já chegou) e fica alguns dias depois do envio,
     só para a paciente ver que chegou. Fora disso, some. */
  function temReavaliacao(p) {
    // Nunca antes da anamnese: não se reavalia um acompanhamento que
    // ainda não começou. Se a paciente demorou mais de 30 dias para
    // responder a anamnese, o ciclo até abre no banco, mas o portal
    // continua cobrando a única coisa que faz sentido.
    if (anamnesePendente(p)) return false;
    return !!(window.ReavaliacaoView && noPrograma(p) &&
              window.ReavaliacaoView.mostrar(p, ctx.assinatura));
  }
  function reavaliacaoAberta() {
    return !!(window.ReavaliacaoView && window.ReavaliacaoView.aberta(ctx.assinatura));
  }

  function subTexto(p, pendente) {
    if (pendente) return "Comece pela anamnese — é com ela que eu monto o seu plano.";
    if (reavaliacaoAberta()) return "Chegou a hora de reavaliar — me conte como foram estas semanas.";
    return (p.objetivo ? "Objetivo: " + p.objetivo + " · " : "") +
      "Próxima consulta: " + (p.proxConsulta || "a agendar");
  }

  /* ---------- Renovação ----------
     Vigência acabando: convite, não cobrança. O pagamento é único por
     período (0043) exatamente para não repetir a cobrança-surpresa que
     enche o Reclame Aqui dos concorrentes — então quem decide renovar é
     ela, e o caminho é conversar com a Ana.
     Sem promessa, sem prazo de resultado, sem escassez artificial: só a
     data real do contrato dela. */
  var AVISO_RENOVACAO_DIAS = 15;
  function isoHoje() {
    var d = new Date(), p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  }
  function diasAte(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    if (!m) return null;
    var h = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoHoje());
    return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) -
                       Date.UTC(+h[1], +h[2] - 1, +h[3])) / 86400000);
  }
  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  function renovacaoHTML() {
    var a = ctx.assinatura;
    if (!a || !a.fim) return "";
    if (a.status === "cancelada" || a.status === "reembolsada") return "";
    var dias = diasAte(a.fim);
    if (dias == null || dias > AVISO_RENOVACAO_DIAS) return "";

    var venceu = dias < 0;
    var titulo = venceu ? "Seu acompanhamento chegou ao fim" : "Seu acompanhamento está perto do fim";
    var corpo = venceu
      ? "O período que você contratou foi até " + dataBR(a.fim) + ". Se quiser continuar comigo, " +
        "a gente abre um novo ciclo — com reavaliação e plano revisado."
      : "O período que você contratou vai até " + dataBR(a.fim) +
        (dias === 0 ? " (é hoje)." : dias === 1 ? " (falta 1 dia)." : " (faltam " + dias + " dias).") +
        " Se quiser seguir, é só me avisar que eu preparo a continuação.";
    var wa = "https://wa.me/" + WA_NUTRI + "?text=" +
      encodeURIComponent("Olá, Ana! Quero conversar sobre continuar o meu acompanhamento 🌸");

    return '<div class="pcard renov' + (venceu ? " renov--fim" : "") + '">' +
      '<h2 class="pcard__title">' + esc(titulo) + '</h2>' +
      '<p class="renov__txt">' + esc(corpo) + '</p>' +
      '<div class="renov__acoes">' +
        '<a class="btn btn--primary" href="' + wa + '" target="_blank" rel="noopener">Falar com a Ana</a>' +
        '<a class="btn btn--outline" href="' + SITE_PROGRAMA + '" target="_blank" rel="noopener">Ver os planos</a>' +
      '</div>' +
      '<p class="renov__nota">Nada é cobrado automaticamente: o pagamento aqui é único por período.</p>' +
    '</div>';
  }

  // Mostra só as seções liberadas para este paciente (pacientes.portal_features).
  // O chat tem gate real de RLS; as demais são apenas ocultadas aqui.
  function applyFeatureGate(p) {
    var feats = Array.isArray(p.portalFeatures) ? p.portalFeatures : ["plano", "evolucao", "consultas", "chat"];
    // Metas não é feature paga: aparece quando há conteúdo liberado.
    var TREINO_ATIVO = false; // PROJETO FUTURO — Treino em casa oculto por ora (código preservado)
    var temTreino = TREINO_ATIVO && !!(p.treino && p.treino.publicado && (p.treino.blocos || []).length);
    var temMetas = !!(p.metas && p.metas.publicado && (p.metas.itens || []).some(function (i) { return (i.texto || "").trim(); }));
    var tabsWrap = el("portal-tabs");
    var visiveis = [];
    tabsWrap.querySelectorAll(".ptab").forEach(function (t) {
      var id = t.getAttribute("data-t");
      var on;
      if (id === "treino") on = temTreino;
      else if (id === "metas") on = temMetas;
      else if (id === "anamnese") on = temAnamnese(p);
      else if (id === "reavaliacao") on = temReavaliacao(p);
      else on = feats.indexOf(id) >= 0;
      t.hidden = !on;
      if (on) visiveis.push(id);
    });
    tabsWrap.hidden = visiveis.length <= 1; // 0 ou 1 seção: nem mostra a barra de abas
    if (!visiveis.length) {
      el("portal").querySelectorAll(".portal-pane").forEach(function (pn) { pn.classList.remove("is-active"); });
      var pp = el("pane-plano");
      pp.classList.add("is-active");
      pp.innerHTML = '<div class="pcard"><div class="empty-state">Seu acesso ainda não tem seções liberadas. Fale com sua nutricionista.</div></div>';
      return;
    }
    // Bolinha de novidade na aba do plano — o mesmo aviso da faixa, para
    // quem chegou por outra aba (ou voltou pelo chat) não passar batido.
    var tabPlano = tabsWrap.querySelector('.ptab[data-t="plano"]');
    if (tabPlano) tabPlano.classList.toggle("ptab--novo", planoNovidade(p));

    // Anamnese pendente ganha a tela: é o único passo que depende dela.
    if (visiveis.indexOf("anamnese") >= 0 && anamnesePendente(p)) { switchTab("anamnese"); return; }
    // Ciclo aberto: a reavaliação é a próxima ação dela, então abre nela.
    if (visiveis.indexOf("reavaliacao") >= 0 && reavaliacaoAberta()) { switchTab("reavaliacao"); return; }
    /* Anamnese enviada e plano ainda não liberado: a aba Meu plano existe e
       nasce ativa no HTML, então ela caía num "ainda não foi publicado" que
       parece tela vazia. A Anamnese responde a pergunta real desse momento
       ("e agora?") com o prazo de entrega — por isso ganha a tela. */
    if (visiveis.indexOf("anamnese") >= 0 && !planosLiberados(p).length) { switchTab("anamnese"); return; }
    /* Nenhum destaque a dar: confirma a aba ativa passando por switchTab em
       vez de deixar o is-active do HTML de pé. Parece redundante, mas é o
       que faz o "abriu o plano = viu o aviso" valer também para o caso mais
       comum de todos — plano liberado, ela cai direto nele. */
    var ativo = tabsWrap.querySelector(".ptab.is-active");
    switchTab(!ativo || ativo.hidden ? visiveis[0] : ativo.getAttribute("data-t"));
  }

  function switchTab(id) {
    var root = el("portal");
    root.querySelectorAll(".ptab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-t") === id); });
    root.querySelectorAll(".portal-pane").forEach(function (pn) { pn.classList.toggle("is-active", pn.getAttribute("data-pane") === id); });
    /* Abriu o plano = viu o aviso. A faixa continua na tela desta visita
       (ela acabou de chegar nela); some da próxima vez. */
    if (id === "plano" && ctx.paciente) {
      marcarPlanoVisto(ctx.paciente);
      var tp = root.querySelector('.ptab[data-t="plano"]');
      if (tp) tp.classList.remove("ptab--novo");
    }
    if (id === "evolucao") drawWeightChart(ctx.paciente);
    if (id === "chat") { var box = el("chat-scroll"); if (box) box.scrollTop = box.scrollHeight; }
  }

  /* ---------- Meu plano ---------- */
  // Planos liberados pela nutri (flag publicado). Cai no formato antigo de plano único.
  function planosLiberados(p) {
    var pl = p.plano || {};
    if (Array.isArray(pl.planos)) return pl.planos.filter(function (x) { return x && x.publicado; });
    if ((pl.refeicoes || []).length) return [pl];
    return [];
  }
  /* ---------- "Seu plano está pronto" ----------
     A anamnese e a reavaliação prometem à paciente que ela "recebe um
     aviso aqui no portal" quando o plano for liberado. Sem isto o plano
     só aparecia, calado, e a promessa ficava por cumprir.

     O que conta como novidade: mudou o conjunto de planos liberados
     (id + data de atualização). Assim vale tanto para o 1º plano quanto
     para um plano revisado depois da reavaliação.

     O "já vi" mora no localStorage do aparelho dela, não no banco: é
     preferência de leitura, não dado clínico — não vale uma coluna, uma
     migration e uma escrita a cada visita. Em outro aparelho ela vê o
     aviso de novo, o que é aceitável (e até útil). */
  var LS_PLANO_VISTO = "nutri:plano-visto:";
  function planoAssinatura(p) {
    return planosLiberados(p).map(function (x) {
      return (x.id || x.titulo || "plano") + "@" + (x.atualizadoEm || "");
    }).join("|");
  }
  function planoNovidade(p) {
    var atual = planoAssinatura(p);
    if (!atual) return false;
    try { return localStorage.getItem(LS_PLANO_VISTO + p.id) !== atual; }
    catch (e) { return false; } // sem localStorage, melhor calar do que avisar sempre
  }
  // A nutri em preview não "consome" o aviso da paciente: ela está olhando
  // a tela dela, não lendo o próprio plano.
  function marcarPlanoVisto(p) {
    if (ctx.mode === "preview") return;
    try { localStorage.setItem(LS_PLANO_VISTO + p.id, planoAssinatura(p)); } catch (e) {}
  }
  function planoNovoHTML() {
    return '<div class="pcard plano-novo" id="plano-novo">' +
      '<h2 class="pcard__title">Seu plano está pronto 🌸</h2>' +
      '<p class="plano-novo__txt">Ele está logo abaixo, com as minhas orientações. ' +
      'Leia com calma — qualquer dúvida, é só me chamar por aqui nas Mensagens.</p>' +
    '</div>';
  }

  function horaRefeicao(r) { return r.hora || r.horario || ""; }
  // Item pode ser string (formato antigo) ou objeto do construtor {alimento, medida, qtd, gramas}.
  function itemTexto(it) {
    if (it == null) return "";
    if (typeof it === "string") return it;
    var nome = it.alimento || it.nome || "";
    var q;
    if (it.medida && it.medida !== "grama") q = (it.qtd != null ? it.qtd + " " : "") + it.medida;
    else if (it.gramas != null) q = it.gramas + " g";
    else if (it.qtd != null) q = it.qtd + "";
    return nome + (q ? " — " + q : "");
  }
  // Substitutos que a nutri autorizou para o item ("ou: ovo, merluza…").
  function itemSubs(it) {
    if (!it || typeof it !== "object") return "";
    var s = (it.subs || []).filter(function (x) { return x && (x.alimento || x.nome); })
      .map(function (x) { return itemTexto(x); });
    return s.length ? s.join(" · ") : "";
  }

  function renderPlano(p) {
    // O convite de renovação vem antes do plano porque é o único aviso do
    // portal com data para vencer — mas só aparece nos últimos 15 dias.
    var renov = renovacaoHTML();
    var planos = planosLiberados(p);
    if (!planos.length) {
      return renov + '<div class="pcard"><div class="empty-state">Seu plano alimentar ainda não foi publicado. ' +
        'Assim que sua nutricionista liberar, ele aparece aqui.</div></div>';
    }
    // O aviso de plano novo vem depois da renovação: quem está no fim da
    // vigência precisa ver as duas coisas, e a data é a que tem prazo.
    var novo = planoNovidade(p) ? planoNovoHTML() : "";
    var readonly = ctx.mode === "preview";
    var multi = planos.length > 1;
    var corpo = planos.map(function (plano, pi) {
      var refs = plano.refeicoes || [];
      // Só o 1º plano liberado é "interativo" (checkboxes + adesão), casando com a
      // adesão que a nutri acompanha (chaves ri:ii sobre o plano espelhado no topo).
      var interativo = pi === 0;
      var head;
      if (interativo) {
        var pct = adesaoPct(p);
        head = '<div class="pcard pcard--head"><h2>' + esc(plano.titulo || "Plano alimentar") + '</h2>' +
          (plano.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(plano.atualizadoEm) + '</span>' : '') +
          '<div class="plano-adesao"><div class="plano-adesao__bar"><span id="adesao-fill" style="width:' + pct + '%"></span></div>' +
            '<span class="plano-adesao__pct" id="adesao-pct">' + pct + '% seguido</span></div>' +
          '<p class="pcard__hint">Marque o que você seguiu — sua nutricionista acompanha sua adesão por aqui.</p></div>';
      } else {
        head = '<div class="pcard pcard--head"><h2>' + esc(plano.titulo || "Plano alimentar") + '</h2>' +
          (plano.atualizadoEm ? '<span class="pcard__meta">Atualizado em ' + esc(plano.atualizadoEm) + '</span>' : '') +
          '<p class="pcard__hint">Plano adicional liberado pela sua nutricionista.</p></div>';
      }
      var body = refs.map(function (r, ri) {
        var itens = (r.itens || []).map(function (it, ii) {
          var texto = itemTexto(it);
          var subs = itemSubs(it);
          var troca = subs ? '<span class="meal-item__subs"><b>ou</b> ' + esc(subs) + '</span>' : '';
          if (!interativo) return '<li class="meal-item"><span>' + esc(texto) + '</span>' + troca + '</li>';
          var key = ri + ":" + ii;
          var done = checkGet(key);
          return '<li class="meal-item"><label><input type="checkbox" data-check="' + esc(key) + '"' +
            (done ? " checked" : "") + (readonly ? " disabled" : "") + '> ' +
            '<span>' + esc(texto) + '</span></label>' + troca + '</li>';
        }).join("");
        var hora = horaRefeicao(r);
        // Refeição alternativa: opção no lugar da refeição do mesmo horário,
        // por isso não soma no total nem conta na adesão.
        var alt = !!r.alternativa;
        // Foto do prato montado pela nutri: mostra a porção melhor do que "120 g".
        // Só o caminho vem no plano; a URL assinada chega em hidratarFotosRefeicao.
        var foto = r.foto
          ? '<div class="meal__foto" data-refeicao-foto="' + esc(r.foto) + '">' +
              '<img alt="Foto de ' + esc(r.nome || "refeição") + '" loading="lazy" /></div>'
          : '';
        return '<div class="pcard meal' + (alt ? ' meal--alt' : '') + '"><div class="meal__head">' +
          '<span class="meal__nome">' + esc(r.nome) + '</span>' +
          (alt ? '<span class="meal__badge">outra opção</span>' : '') +
          (hora ? '<span class="meal__hora">' + esc(hora) + '</span>' : '') + '</div>' +
          (alt ? '<p class="meal__hint">Você pode fazer esta refeição <strong>no lugar</strong> da do mesmo horário — escolha uma das duas.</p>' : '') +
          foto +
          '<ul class="meal__list">' + itens + '</ul></div>';
      }).join("");
      return (multi ? '<div class="plano-sep">' + esc(plano.titulo || "Plano alimentar") + '</div>' : '') + head + body;
    }).join("");
    // Lista de compras (uma só, do 1º plano liberado) + dicas de marmita.
    var compras = window.ListaCompras ? window.ListaCompras.htmlPortal(planos[0], ctx.marcas, readonly) : "";
    return renov + novo + corpo + compras;
  }

  // Marcação do plano sincronizada no banco (tabela plano_adesao, gravada pelo
  // próprio paciente via RLS). A nutri só lê. Salvamento é debounced.
  function checkGet(key) { return ctx.marcas[key] === true; }
  var saveTimer = null;
  function checkSet(key, val) {
    if (val) ctx.marcas[key] = true; else delete ctx.marcas[key];
    if (ctx.mode === "preview") return; // nutri em preview não grava (e RLS bloquearia)
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      window.NutriPacientes.setAdesao(ctx.paciente.id, ctx.marcas).catch(function () {});
    }, 500);
  }

  // % de itens do plano marcados como seguidos (só conta itens que ainda existem).
  function adesaoPct(p) {
    var refs = (p.plano && p.plano.refeicoes) || [];
    var total = 0, feitos = 0;
    refs.forEach(function (r, ri) {
      if (r && r.alternativa) return; // opção alternativa não pesa na adesão
      (r.itens || []).forEach(function (_it, ii) { total++; if (ctx.marcas[ri + ":" + ii] === true) feitos++; });
    });
    return total ? Math.round(feitos * 100 / total) : 0;
  }
  function refreshAdesaoUI() {
    var pct = adesaoPct(ctx.paciente);
    var fill = el("adesao-fill"), lbl = el("adesao-pct");
    if (fill) fill.style.width = pct + "%";
    if (lbl) lbl.textContent = pct + "% seguido";
  }

  /* ---------- Evolução ---------- */
  function renderEvolucao(p) {
    var dif = (p.pesoAtual != null && p.pesoInicial != null) ? (p.pesoAtual - p.pesoInicial) : null;
    var difTxt = dif == null ? "—" : (dif <= 0 ? "▼ " : "▲ ") + Math.abs(dif).toFixed(1) + " kg";
    return '<div class="pcard"><div class="chart" id="weight-chart"></div></div>' +
      '<div class="portal-stats">' +
        stat("Peso atual", (p.pesoAtual != null ? p.pesoAtual + " kg" : "—")) +
        stat("Variação total", difTxt) +
        stat("Meta", (p.meta != null ? p.meta + " kg" : "Sem meta")) +
        stat("IMC", (p.imc != null ? String(p.imc) : "—")) +
      '</div>' +
      renderFotosEvolucao(p);
  }
  function stat(l, v) { return '<div class="pstat"><div class="pstat__lbl">' + esc(l) + '</div><div class="pstat__val">' + esc(v) + '</div></div>'; }

  /* Fotos de evolução que a nutri enviou (só leitura no portal).
     Os arquivos ficam num bucket privado; aqui resolvemos URLs assinadas
     (o RLS libera porque o paciente é dono da ficha). Fotos antigas em
     base64 (f.data) continuam funcionando. */
  var FOTO_LBL = { frente: "Frente", lado: "Lado", costas: "Costas" };
  var portalSigned = {}; // path -> signedUrl
  function fmtDataFoto(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; }
  function fotoUrlPortal(f) { return (f.path && portalSigned[f.path]) || f.data || ""; }
  function renderFotosEvolucao(p) {
    var fotos = ((p.antropometria || {}).fotos || []).slice()
      .sort(function (a, b) { return String(b.dataISO || "").localeCompare(String(a.dataISO || "")); });
    if (!fotos.length) return "";
    var cards = fotos.map(function (f) {
      var tipo = FOTO_LBL[f.tipo] || "Foto";
      var meta = [tipo];
      if (f.peso != null && f.peso !== "") meta.push(String(f.peso).replace(".", ",") + " kg");
      var src = fotoUrlPortal(f);
      return '<figure class="evo-card' + (src ? '' : ' is-loading') + '">' +
        '<button type="button" class="evo-card__img" data-pfoto="' + esc(f.id) + '" aria-label="Ampliar foto">' +
          '<img data-foto-img="' + esc(f.id) + '" ' + (src ? 'src="' + esc(src) + '"' : '') + ' alt="Foto de evolução — ' + esc(tipo) + '" loading="lazy" /></button>' +
        '<figcaption class="evo-card__cap">' +
          '<span class="evo-card__date">' + esc(fmtDataFoto(f.dataISO)) + '</span>' +
          '<span class="evo-card__meta">' + esc(meta.join(" · ")) + '</span>' +
          (f.obs ? '<span class="evo-card__obs">' + esc(f.obs) + '</span>' : '') +
        '</figcaption></figure>';
    }).join("");
    return '<div class="pcard"><h2 class="pcard__title">Sua evolução em fotos</h2>' +
      '<p class="card__sub" style="margin:-4px 0 12px">Registros que sua nutricionista adicionou. Toque para ampliar.</p>' +
      '<div class="evo-grid">' + cards + '</div></div>';
  }
  // Busca as URLs assinadas e preenche as imagens do painel de evolução.
  function hidratarFotosPortal(p) {
    if (!window.NutriPacientes || !window.NutriPacientes.assinarFotosEvolucao) return;
    var fotos = (p.antropometria || {}).fotos || [];
    var pend = fotos.filter(function (f) { return f.path && !portalSigned[f.path]; });
    if (!pend.length) return;
    window.NutriPacientes.assinarFotosEvolucao(pend.map(function (f) { return f.path; })).then(function (mapa) {
      Object.keys(mapa).forEach(function (k) { portalSigned[k] = mapa[k]; });
      pend.forEach(function (f) {
        var u = fotoUrlPortal(f); if (!u) return;
        var img = document.querySelector('[data-foto-img="' + f.id + '"]');
        if (img) { img.src = u; var card = img.closest(".evo-card"); if (card) card.classList.remove("is-loading"); }
      });
    }).catch(function () {});
  }
  /* Fotos das refeições do plano (bucket 'refeicoes'). Uma chamada só para
     todos os caminhos da tela; falha em assinar deixa o card sem foto, que é
     degradação aceitável — o texto da refeição continua lá. */
  function hidratarFotosRefeicao() {
    if (!window.NutriPacientes || !window.NutriPacientes.assinarFotosRefeicao) return;
    var boxes = [].slice.call(document.querySelectorAll("[data-refeicao-foto]"));
    if (!boxes.length) return;
    var paths = [];
    boxes.forEach(function (b) {
      var p = b.getAttribute("data-refeicao-foto");
      if (p && paths.indexOf(p) < 0) paths.push(p);
    });
    window.NutriPacientes.assinarFotosRefeicao(paths).then(function (mapa) {
      boxes.forEach(function (b) {
        var u = mapa[b.getAttribute("data-refeicao-foto")];
        var img = b.querySelector("img");
        if (u && img) img.src = u; else b.remove();
      });
    }).catch(function () {
      boxes.forEach(function (b) { b.remove(); });
    });
  }

  // Lightbox das fotos no portal (delegação global).
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-pfoto]");
    if (!btn || !ctx.paciente) return;
    var id = btn.getAttribute("data-pfoto");
    var f = (((ctx.paciente.antropometria || {}).fotos) || []).filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    var tipo = FOTO_LBL[f.tipo] || "Foto";
    var cap = [fmtDataFoto(f.dataISO), tipo];
    if (f.peso != null && f.peso !== "") cap.push(String(f.peso).replace(".", ",") + " kg");
    var ov = document.createElement("div");
    ov.className = "evo-lb";
    ov.innerHTML = '<button class="evo-lb__close" aria-label="Fechar">✕</button>' +
      '<figure class="evo-lb__fig"><img src="' + esc(fotoUrlPortal(f)) + '" alt="Foto de evolução ampliada" />' +
      '<figcaption>' + esc(cap.join(" · ")) + (f.obs ? " — " + esc(f.obs) : "") + '</figcaption></figure>';
    function fechar() { ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(ev) { if (ev.key === "Escape") fechar(); }
    ov.addEventListener("click", function (ev) { if (ev.target === ov || ev.target.closest(".evo-lb__close")) fechar(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
  });

  function drawWeightChart(p) {
    var host = el("weight-chart");
    if (!host || !p || !p.evolucao) return;
    var pts = p.evolucao.peso || [], labels = p.evolucao.labels || [];
    if (pts.length < 2) { host.innerHTML = '<div class="empty-state">Ainda não há histórico de peso suficiente para o gráfico.</div>'; return; }
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
      '<span class="card__sub">peso · ' + esc(labels[0] || "") + '–' + esc(labels[labels.length - 1] || "") + '</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolução de peso">' +
      '<defs><linearGradient id="gradWineP" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#840B55" stop-opacity="0.20"/><stop offset="100%" stop-color="#840B55" stop-opacity="0"/></linearGradient></defs>' +
      '<path class="chart__area" style="fill:url(#gradWineP)" d="' + area + '"></path>' +
      '<path class="chart__line" d="' + line + '"></path>' + dots + lbls + '</svg>';
  }

  /* ---------- Consultas ---------- */
  function renderConsultas(p) {
    var prox = '<div class="pcard pcard--next"><span class="pcard__meta">Próxima consulta</span>' +
      '<div class="next-big">' + esc(p.proxConsulta || "a agendar") + '</div></div>';
    var hist = (p.consultas || []);
    if (!hist.length) return prox + '<div class="pcard"><div class="empty-state">Sem consultas registradas ainda.</div></div>';
    var tl = '<div class="pcard"><h2 class="pcard__title">Histórico</h2><div class="timeline">' + hist.map(function (c) {
      return '<div class="tl-item"><div class="tl-date">' + esc(c.data) + '</div>' +
        '<div class="tl-tipo">' + esc(c.tipo) + '</div>' + (c.nota ? '<p class="tl-nota">' + esc(c.nota) + '</p>' : '') + '</div>';
    }).join("") + '</div></div>';
    return prox + tl;
  }

  /* ---------- Chat ---------- */
  function initChat() {
    var readonly = ctx.mode === "preview";
    el("pane-chat").innerHTML =
      '<div class="pcard chat">' +
        '<div class="chat__scroll" id="chat-scroll"><div class="empty-state">Carregando mensagens…</div></div>' +
        (readonly
          ? '<div class="chat__note">Pré-visualização: no acesso real, o paciente escreve aqui.</div>'
          : '<form class="chat__form" id="chat-form">' +
              '<input type="text" id="chat-input" placeholder="Escreva uma mensagem para sua nutricionista…" autocomplete="off" />' +
              '<button class="btn btn--primary" type="submit">Enviar</button></form>') +
      '</div>';
    loadChat();
    if (!readonly) {
      el("chat-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = el("chat-input");
        var txt = inp.value.trim();
        if (!txt) return;
        inp.value = ""; inp.disabled = true;
        window.NutriPacientes.sendMensagem(ctx.paciente.id, "paciente", txt).then(function () {
          inp.disabled = false; inp.focus(); loadChat();
        }).catch(function () {
          inp.disabled = false; inp.value = txt;
          alert("Não foi possível enviar. Tente novamente.");
        });
      });
    }
  }

  function loadChat() {
    window.NutriPacientes.listMensagens(ctx.paciente.id).then(function (msgs) {
      var box = el("chat-scroll");
      if (!box) return;
      if (!msgs.length) { box.innerHTML = '<div class="empty-state">Nenhuma mensagem ainda. Diga um oi 👋</div>'; return; }
      box.innerHTML = msgs.map(function (m) {
        var mine = m.autor === "paciente";
        return '<div class="msg ' + (mine ? "msg--me" : "msg--nutri") + '">' +
          '<div class="msg__bubble">' + esc(m.corpo) + '</div>' +
          '<div class="msg__time">' + fmtTime(m.created_at) + (mine ? "" : " · nutri") + '</div></div>';
      }).join("");
      box.scrollTop = box.scrollHeight;
    }).catch(function () {
      var box = el("chat-scroll"); if (box) box.innerHTML = '<div class="empty-state">Não foi possível carregar as mensagens.</div>';
    });
  }

  function fmtTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  /* ---------- Logout ---------- */
  function wireLogout() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-logout]");
      if (!t) return;
      e.preventDefault();
      window.NutriDBReady.then(function (c) {
        return c.auth.signOut();
      }).then(function () { window.location.replace("index.html"); });
    });
  }

  /* Marcação do plano (delegação) */
  document.addEventListener("change", function (e) {
    var cb = e.target.closest && e.target.closest("[data-check]");
    if (!cb) return;
    checkSet(cb.getAttribute("data-check"), cb.checked);
    refreshAdesaoUI();
  });
})();
