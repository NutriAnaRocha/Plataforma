/* ============================================================
   WHATSAPP — ENVIO (fase 1: assistido por wa.me)
   window.WAEnvio = { config, templates, tel, resolver, link,
                      abrir, registrar, listar, render, wire, painelHistorico }

   Como funciona: a plataforma monta a mensagem já com nome, data e
   hora resolvidos e abre a conversa do WhatsApp com o texto pronto —
   a nutri só aperta enviar. Zero custo e zero risco de banimento do
   número pessoal dela (o que aconteceria com bibliotecas não oficiais).
   O envio automático de verdade só entra com a Cloud API da Meta.

   Como o WhatsApp não devolve confirmação, o que gravamos em
   whatsapp_envios (0071) é o que a plataforma ENTREGOU para envio.
   Os modelos e as variáveis vêm da central (whatsapp-data.js +
   profiles.whatsapp_config, editados em whatsapp.html).
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function client() { return window.NutriDBReady; }

  var COLS = "id,paciente_id,paciente_nome,consulta_id,template_id,titulo,telefone,texto,canal,enviado_em";

  /* Aviso próprio — telas que já têm toast (a ficha) passam o delas em opts.toast;
     a agenda não tem, e envio silencioso esconderia erro de registro. */
  var _toastTimer;
  function toastPadrao(msg, erro) {
    var t = document.getElementById("wae-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "wae-toast";
      t.className = "wae-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.toggle("is-error", !!erro);
    t.classList.add("is-on");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3000);
  }

  /* ---------- Config (defaults do WA_DATA + o que a nutri salvou) ---------- */
  var _cfg = null, _cfgPromise = null, _perfil = {};

  function montar(salvo) {
    salvo = salvo || {};
    var WA = window.WA_DATA || { automacoes: [], customs: [] };
    var lista = [];
    (WA.automacoes || []).forEach(function (a) {
      var s = (salvo.automacoes && salvo.automacoes[a.id]) || {};
      var ativo = (typeof s.ativo === "boolean") ? s.ativo : a.ativoPadrao;
      if (!ativo) return;                       // desligada na central: não aparece para enviar
      lista.push({
        id: a.id, titulo: a.titulo, icone: a.icone || "💬", quando: a.quando || "",
        texto: (typeof s.texto === "string") ? s.texto : a.texto
      });
    });
    (salvo.customs || []).forEach(function (c) {
      if (c.ativo === false) return;
      lista.push({
        id: c.id, titulo: c.titulo || "Mensagem personalizada", icone: "✨",
        quando: c.quando || "Envio manual", texto: c.texto || ""
      });
    });
    return {
      templates: lista,
      cupom: salvo.cupom || "RETORNO10",
      linkAgendamento: salvo.linkAgendamento || "",
      googleReviewLink: salvo.googleReviewLink || "",
      numeroEnvio: salvo.numeroEnvio || ""
    };
  }

  function config() {
    if (_cfg) return Promise.resolve(_cfg);
    if (_cfgPromise) return _cfgPromise;
    if (!window.NutriPerfil) { _cfg = montar({}); return Promise.resolve(_cfg); }
    _cfgPromise = window.NutriPerfil.get().then(function (p) {
      _perfil = p || {};
      _cfg = montar(_perfil.whatsappConfig || {});
      return _cfg;
    }).catch(function () {
      _cfg = montar({});                        // offline: vale o catálogo padrão
      return _cfg;
    });
    return _cfgPromise;
  }
  function templates() { return (_cfg ? _cfg.templates : []).slice(); }

  /* ---------- Telefone: devolve só dígitos com DDI, ou "" se não der ---------- */
  function tel(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.length > 11 && d.slice(0, 2) === "55") d = d.slice(2);   // já veio com DDI
    if (d.length === 10 || d.length === 11) return "55" + d;        // DDD + número
    if (d.length >= 12 && d.length <= 15) return d;                 // número estrangeiro completo
    return "";
  }
  function telBonito(raw) {
    var d = tel(raw);
    if (!d) return String(raw || "");
    var n = d.slice(2);
    if (n.length === 11) return "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
    if (n.length === 10) return "(" + n.slice(0, 2) + ") " + n.slice(2, 6) + "-" + n.slice(6);
    return "+" + d;
  }

  function dataBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  function primeiroNome(nome) { return String(nome || "").trim().split(/\s+/)[0] || ""; }

  /* ---------- Troca as variáveis pelos valores reais ---------- */
  function resolver(texto, ctx) {
    ctx = ctx || {};
    var cfg = _cfg || montar({});
    var mapa = {
      "{nome}": primeiroNome(ctx.nome),
      "{data_consulta}": ctx.dataConsulta || "",
      "{hora_consulta}": ctx.horaConsulta || "",
      "{nutricionista}": primeiroNome(_perfil.nome || ""),
      "{cupom}": cfg.cupom || "",
      "{link_agendamento}": cfg.linkAgendamento || "",
      "{link_google_reviews}": cfg.googleReviewLink || ""
    };
    var out = String(texto || "");
    Object.keys(mapa).forEach(function (k) { out = out.split(k).join(mapa[k]); });
    return out;
  }

  /* api.whatsapp.com/send e NÃO wa.me: o encurtador wa.me redireciona
     estragando emoji de 4 bytes (💜 chega como "?"), e os modelos da Ana
     são cheios deles. api.whatsapp.com abre o app no celular e a tela
     "Conversar" no computador, com o texto intacto. */
  function link(numero, texto) {
    var d = tel(numero);
    if (!d) return "";
    return "https://api.whatsapp.com/send?phone=" + d + "&text=" + encodeURIComponent(texto || "");
  }

  /* ---------- Registro do envio ---------- */
  function registrar(reg) {
    if (!client()) return Promise.resolve(null);
    return client().then(function (c) {
      return c.from("whatsapp_envios").insert({
        paciente_id: reg.pacienteId || null,
        paciente_nome: reg.pacienteNome || "",
        consulta_id: reg.consultaId || null,
        template_id: reg.templateId || "livre",
        titulo: reg.titulo || null,
        telefone: tel(reg.telefone),
        texto: reg.texto || "",
        canal: "link"
      }).select(COLS).single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  function listar(opts) {
    opts = opts || {};
    if (!client()) return Promise.resolve([]);
    return client().then(function (c) {
      var q = c.from("whatsapp_envios").select(COLS)
        .order("enviado_em", { ascending: false })
        .limit(opts.limit || 50);
      if (opts.pacienteId) q = q.eq("paciente_id", opts.pacienteId);
      return q;
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data || [];
    });
  }

  /* ============================================================
     SELETOR — escolhe o modelo, confere o texto e abre a conversa
     ============================================================ */
  var _ov = null, _sel = null;

  function fecharSeletor() {
    if (_ov) { _ov.remove(); _ov = null; }
    _sel = null;
    document.removeEventListener("keydown", onEsc);
  }
  function onEsc(e) { if (e.key === "Escape") fecharSeletor(); }

  /* opts: { pacienteId, nome, telefone, consultaId, dataConsulta, horaConsulta,
             templateId, toast, onEnviado } */
  function abrir(opts) {
    opts = opts || {};
    config().then(function (cfg) {
      var numero = tel(opts.telefone);
      var lista = cfg.templates.slice();
      lista.push({ id: "livre", titulo: "Mensagem livre", icone: "✍️", quando: "Escrita agora", texto: "" });

      var idx = 0;
      if (opts.templateId) {
        for (var i = 0; i < lista.length; i++) { if (lista[i].id === opts.templateId) { idx = i; break; } }
      }

      _sel = { opts: opts, cfg: cfg, lista: lista, numero: numero, idx: idx };

      var options = lista.map(function (t, i) {
        return '<option value="' + i + '"' + (i === idx ? " selected" : "") + '>' +
          t.icone + " " + esc(t.titulo) + "</option>";
      }).join("");

      var aviso = numero ? "" :
        '<p class="wae-alerta">⚠️ Este paciente está sem telefone válido no cadastro. ' +
        'Preencha o telefone na aba <strong>Perfil</strong> da ficha para enviar.</p>';

      _ov = document.createElement("div");
      _ov.className = "wae-ov";
      _ov.innerHTML =
        '<div class="wae-card" role="dialog" aria-modal="true" aria-label="Enviar mensagem no WhatsApp">' +
          '<div class="wae-card__head">' +
            '<div><h3 class="wae-card__tit">Enviar no WhatsApp</h3>' +
              '<p class="wae-card__sub">' + esc(opts.nome || "Paciente") +
                (numero ? ' · ' + esc(telBonito(numero)) : '') + '</p></div>' +
            '<button class="wae-x" type="button" data-wae-fechar aria-label="Fechar">✕</button>' +
          '</div>' +
          '<div class="wae-card__body">' +
            aviso +
            '<label class="wae-field"><span>Modelo</span>' +
              '<select id="wae-modelo">' + options + '</select></label>' +
            '<label class="wae-field"><span>Mensagem (dá para ajustar antes de enviar)</span>' +
              '<textarea id="wae-texto" rows="9"></textarea></label>' +
            '<p class="wae-hint">A conversa abre com este texto já digitado. Você confere e aperta enviar no WhatsApp.</p>' +
          '</div>' +
          '<div class="wae-card__foot">' +
            '<button class="btn btn--ghost" type="button" data-wae-fechar>Cancelar</button>' +
            '<button class="btn btn--primary" type="button" id="wae-enviar"' + (numero ? "" : " disabled") + '>' +
              'Abrir no WhatsApp</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(_ov);

      var ta = _ov.querySelector("#wae-texto");
      var selEl = _ov.querySelector("#wae-modelo");
      ta.value = textoDe(lista[idx]);

      selEl.addEventListener("change", function () {
        _sel.idx = +selEl.value;
        ta.value = textoDe(lista[_sel.idx]);
      });
      _ov.addEventListener("click", function (e) {
        if (e.target === _ov || e.target.closest("[data-wae-fechar]")) fecharSeletor();
      });
      document.addEventListener("keydown", onEsc);

      var btn = _ov.querySelector("#wae-enviar");
      if (btn) btn.addEventListener("click", function () { enviar(ta.value); });

      setTimeout(function () { (numero ? selEl : ta).focus(); }, 80);
    });

    function textoDe(t) {
      return resolver(t.texto, {
        nome: opts.nome,
        dataConsulta: opts.dataConsulta || "",
        horaConsulta: opts.horaConsulta || ""
      });
    }

    // O window.open tem de sair no MESMO clique, senão o navegador bloqueia
    // como pop-up. Só depois gravamos o registro.
    function enviar(texto) {
      var s = _sel;
      if (!s || !s.numero) return;
      var url = link(s.numero, texto);
      if (!url) return;
      window.open(url, "_blank", "noopener");
      var t = s.lista[s.idx] || { id: "livre", titulo: "Mensagem livre" };
      var reg = {
        pacienteId: opts.pacienteId || null,
        pacienteNome: opts.nome || "",
        consultaId: opts.consultaId || null,
        templateId: t.id,
        titulo: t.titulo,
        telefone: s.numero,
        texto: texto
      };
      var say = opts.toast || toastPadrao;
      fecharSeletor();
      registrar(reg).then(function () {
        say("Conversa aberta no WhatsApp — registrado no histórico.");
        if (opts.onEnviado) opts.onEnviado(reg);
      }).catch(function (e) {
        say("Mensagem aberta, mas não deu para registrar. " + (e && e.message ? e.message : ""), true);
        if (opts.onEnviado) opts.onEnviado(reg);
      });
    }
  }

  /* ============================================================
     FICHA DO PACIENTE — aba Comunicação
     ============================================================ */
  var _p = null, _ctx = null;

  function render(p) {
    var numero = tel(p && p.contato && p.contato.tel);
    var cabeca = numero
      ? '<p class="pl-hint">WhatsApp do paciente: <strong>' + esc(telBonito(numero)) + '</strong>. ' +
        'Escolha um modelo, confira o texto e a conversa abre pronta para enviar.</p>'
      : '<p class="pl-hint">Este paciente ainda não tem telefone no cadastro. ' +
        'Preencha o telefone na aba <strong>Perfil</strong> para poder enviar mensagens.</p>';
    return '<section class="fsec">' +
      '<div class="fsec__head">' +
        '<h2 class="fsec__title">WhatsApp</h2>' +
        '<div class="pl-res__acoes">' +
          '<button class="btn btn--primary btn--sm" type="button" data-wae-enviar' +
            (numero ? "" : " disabled") + '>💬 Enviar no WhatsApp</button>' +
        '</div>' +
      '</div>' +
      cabeca +
      '<div id="wae-hist"><div class="empty-state">Carregando histórico…</div></div>' +
      '</section>';
  }

  function itemHTML(e) {
    var d = new Date(e.enviado_em);
    var quando = isNaN(d) ? "" :
      ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear() +
      " às " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    return '<div class="wae-item">' +
      '<span class="wae-item__ico">💬</span>' +
      '<div class="wae-item__body">' +
        '<div class="wae-item__head">' +
          '<strong>' + esc(e.titulo || "Mensagem") + '</strong>' +
          '<span class="wae-item__data">' + esc(quando) + '</span>' +
        '</div>' +
        '<p class="wae-item__txt">' + esc(e.texto).replace(/\n/g, "<br>") + '</p>' +
      '</div>' +
    '</div>';
  }

  function pintarHistorico(lista) {
    var box = document.getElementById("wae-hist");
    if (!box) return;
    box.innerHTML = lista.length
      ? '<div class="wae-lista">' + lista.map(itemHTML).join("") + '</div>'
      : '<div class="empty-state">Nenhuma mensagem enviada ainda por aqui.</div>';
  }

  function carregarHistorico() {
    if (!_p) return;
    listar({ pacienteId: _p.id, limit: 30 })
      .then(pintarHistorico)
      .catch(function () {
        var box = document.getElementById("wae-hist");
        if (box) box.innerHTML = '<div class="empty-state">Não foi possível carregar o histórico.</div>';
      });
  }

  function wire(p, ctx) {
    _p = p; _ctx = ctx || {};
    config();
    carregarHistorico();
    var btn = document.querySelector("[data-wae-enviar]");
    if (btn) {
      btn.addEventListener("click", function () {
        abrir({
          pacienteId: p.id,
          nome: p.nome,
          telefone: (p.contato && p.contato.tel) || "",
          dataConsulta: dataBR(p.proxConsulta) || p.proxConsulta || "",
          toast: _ctx.toast,
          onEnviado: function () { carregarHistorico(); }
        });
      });
    }
  }

  /* ============================================================
     CENTRAL (whatsapp.html) — painel de histórico geral
     ============================================================ */
  function painelHistorico(box) {
    if (!box) return;
    listar({ limit: 60 }).then(function (lista) {
      if (!lista.length) {
        box.innerHTML =
          '<section class="card cfg-card"><div class="card__body">' +
            '<div class="wa-empty"><div class="wa-empty__ico">🕓</div>' +
            '<h3>O histórico aparece aqui</h3>' +
            '<p class="cfg-hint">Cada mensagem que você abrir no WhatsApp pela ficha do paciente ou pela agenda ' +
            'fica registrada aqui e na aba Comunicação da ficha, com data, hora e o texto enviado.</p>' +
            '</div></div></section>';
        return;
      }
      var itens = lista.map(function (e) {
        return itemHTML({
          titulo: (e.paciente_nome ? e.paciente_nome + " · " : "") + (e.titulo || "Mensagem"),
          texto: e.texto, enviado_em: e.enviado_em
        });
      }).join("");
      box.innerHTML =
        '<section class="card cfg-card"><div class="card__body">' +
          '<p class="cfg-hint">Últimas mensagens preparadas e abertas no WhatsApp.</p>' +
          '<div class="wae-lista">' + itens + '</div>' +
        '</div></section>';
    }).catch(function () {
      box.innerHTML = '<section class="card cfg-card"><div class="card__body">' +
        '<div class="empty-state">Não foi possível carregar o histórico.</div></div></section>';
    });
  }

  window.WAEnvio = {
    config: config,
    templates: templates,
    tel: tel,
    telBonito: telBonito,
    dataBR: dataBR,
    resolver: resolver,
    link: link,
    abrir: abrir,
    registrar: registrar,
    listar: listar,
    render: render,
    wire: wire,
    painelHistorico: painelHistorico
  };
})();
