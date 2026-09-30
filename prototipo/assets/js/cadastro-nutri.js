/* ============================================================
   cadastro-nutri.js — os planos e o cadastro público da nutri
   em /seja-indicada (14/09/2026).

   Substitui o "fale no WhatsApp": a nutricionista responde o quiz,
   escolhe o plano e a conta é criada na hora pela edge function
   `criar-conta-nutri`. O perfil NÃO vai ao ar aqui — entra na fila,
   e a NutriPlat confere o CRN em até 7 dias (CFN 856).

   Não usa supabase-client.js: a página abre sem login, como o resto
   da vitrine. Uma function, e mais nada.
   ============================================================ */
(function () {
  "use strict";

  var BASE = "https://btsqrpxzlkmucrfvsytl.supabase.co/functions/v1/";
  var ANON = "sb_publishable_WinaFUxjvv0ODjSs7sT2dQ_k7GlLLxh";
  var PRAZO = 7; // dias de análise prometidos na tela e no e-mail

  /* Preço em centavos. Tabela de 17/09/2026 (migração 0097): 15 dias grátis
     SEM vitrine, 3 mensalidades com 50% off, depois R$ 79,90 — abaixo do
     WebDiet (94,90) e do Dietbox (semestral 83,65/mês, anual 76,58/mês).
     O preço cobrado quem decide é nutriplat_preco() no banco. */
  var PLANOS = [
    {
      id: "plataforma", nome: "NutriPlat", destaque: true,
      resumo: "O consultório inteiro, com o seu perfil na vitrine incluso.",
      preco: { mensal: 7990, semestral: 41940, anual: 71900 },
      entrada: 3995, mesesEntrada: 3,
      itens: [
        "Perfil em Encontre sua nutri, enquanto a assinatura estiver ativa",
        "Prontuário, antropometria e evolução",
        "Planos alimentares com a tabela TACO",
        "Portal do paciente e inteligência clínica",
        "Agenda, financeiro e documentos em PDF"
      ],
      nao: []
    }
  ];

  var CICLOS = [
    { id: "mensal", nome: "Mensal", meses: 1, selo: "" },
    { id: "semestral", nome: "Semestral", meses: 6, selo: "−12%" },
    { id: "anual", nome: "Anual", meses: 12, selo: "−25%" }
  ];

  var UFS = ("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO")
    .split(" ");

  var estado = { ciclo: "mensal", tier: "plataforma", passo: 0, especialidades: [] };

  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function reais(cents) {
    return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
  }
  function porMes(plano, ciclo) {
    var c = CICLOS.filter(function (x) { return x.id === ciclo; })[0];
    return Math.round(plano.preco[ciclo] / c.meses);
  }

  /* ---------------- planos ---------------- */

  function desenharPlanos() {
    var alvo = $("#planos");
    if (!alvo) return;

    var abas = CICLOS.map(function (c) {
      return '<button type="button" class="ciclo' + (estado.ciclo === c.id ? " is-on" : "") +
        '" data-ciclo="' + c.id + '">' + c.nome +
        (c.selo ? ' <span class="ciclo__selo">' + c.selo + "</span>" : "") + "</button>";
    }).join("");

    var cartoes = PLANOS.map(function (p) {
      var mensal = estado.ciclo === "mensal";
      var mes = mensal ? p.entrada : porMes(p, estado.ciclo);
      var linhaTotal = mensal
        ? "50% off nas " + p.mesesEntrada + " primeiras mensalidades, depois " + reais(p.preco.mensal) + "/mês"
        : reais(p.preco[estado.ciclo]) + " cobrados a cada " + (estado.ciclo === "anual" ? "12" : "6") + " meses";

      return '<div class="plano' + (p.destaque ? " plano--destaque" : "") + '">' +
        "<h3>" + esc(p.nome) + "</h3>" +
        '<div class="valor">' + reais(mes) + " <span>/mês</span></div>" +
        '<p class="plano__cobranca">' + esc(linhaTotal) + "</p>" +
        '<p class="plano__resumo">' + esc(p.resumo) + "</p>" +
        "<ul>" +
          p.itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
          p.nao.map(function (i) { return '<li class="nao">' + esc(i) + "</li>"; }).join("") +
        "</ul>" +
        '<button type="button" class="btn ' + (p.destaque ? "btn--primario" : "btn--contorno") +
          ' btn--bloco" data-assinar="' + p.id + '">' +
          /* "Começar com o Vitrine" tropeça no gênero; "plano X" resolve os
             quatro nomes de uma vez. */
          "Assinar a " + esc(p.nome) + "</button>" +
      "</div>";
    }).join("");

    alvo.innerHTML = '<div class="ciclos">' + abas + "</div>" +
      '<div class="planos" style="grid-template-columns:minmax(0,440px);justify-content:center">' + cartoes + "</div>" +
      '<p class="plano__trial">15 dias grátis para testar a plataforma. ' +
      "O perfil entra na busca só depois da assinatura e da conferência do CRN, e fica lá enquanto ela estiver ativa.</p>";

    alvo.querySelectorAll("[data-ciclo]").forEach(function (b) {
      b.addEventListener("click", function () {
        estado.ciclo = b.getAttribute("data-ciclo");
        desenharPlanos();
      });
    });
    alvo.querySelectorAll("[data-assinar]").forEach(function (b) {
      b.addEventListener("click", function () {
        estado.tier = b.getAttribute("data-assinar");
        irParaCadastro();
      });
    });
  }

  /* ---------------- quiz de cadastro ---------------- */

  function irParaCadastro() {
    var alvo = $("#cadastro");
    if (!alvo) return;
    estado.passo = 0;
    desenharCadastro();
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function campo(id, rotulo, attrs, dica) {
    return '<label class="campo"><span class="campo__rot">' + esc(rotulo) + "</span>" +
      "<input id=\"" + id + "\" " + attrs + " />" +
      (dica ? '<span class="campo__dica">' + esc(dica) + "</span>" : "") + "</label>";
  }

  var PASSOS = [
    {
      titulo: "Quem é você",
      html: function () {
        return campo("cn-nome", "Nome completo", 'type="text" autocomplete="name" maxlength="80"') +
          campo("cn-email", "E-mail", 'type="email" autocomplete="email" maxlength="120"',
                "É com ele que você entra na plataforma.") +
          campo("cn-tel", "WhatsApp", 'type="tel" autocomplete="tel" maxlength="20"') +
          campo("cn-crn", "CRN", 'type="text" maxlength="20" placeholder="CRN-4 12345"',
                "Conferimos o seu registro antes de publicar o perfil.");
      },
      ler: function (d) {
        d.nome = $("#cn-nome").value.trim();
        d.email = $("#cn-email").value.trim().toLowerCase();
        d.telefone = $("#cn-tel").value.trim();
        d.crn = $("#cn-crn").value.trim();
        if (!d.nome) return "Escreva o seu nome completo.";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return "Confira o e-mail.";
        if (!/\d{3,}/.test(d.crn)) return "Escreva o seu CRN com o número do registro.";
        return null;
      }
    },
    {
      titulo: "Como você atende",
      html: function () {
        return '<div class="campo"><span class="campo__rot">Modalidade</span>' +
            '<div class="opcoes">' +
              '<label class="opcao"><input type="checkbox" id="cn-online" checked /> Online</label>' +
              '<label class="opcao"><input type="checkbox" id="cn-presencial" /> Presencial</label>' +
            "</div></div>" +
          '<div class="dupla">' +
            campo("cn-cidade", "Cidade", 'type="text" maxlength="60"') +
            '<label class="campo"><span class="campo__rot">Estado</span><select id="cn-uf">' +
              '<option value="">—</option>' +
              UFS.map(function (u) { return '<option value="' + u + '">' + u + "</option>"; }).join("") +
            "</select></label>" +
          "</div>" +
          campo("cn-desde", "Atuando desde (ano)", 'type="number" min="1960" max="' +
                new Date().getFullYear() + '" placeholder="2018"');
      },
      ler: function (d) {
        d.atende_online = $("#cn-online").checked;
        d.atende_presencial = $("#cn-presencial").checked;
        d.cidade = $("#cn-cidade").value.trim();
        d.estado = $("#cn-uf").value;
        d.atuacao_desde = parseInt($("#cn-desde").value, 10) || null;
        if (!d.atende_online && !d.atende_presencial) return "Marque pelo menos uma modalidade.";
        if (d.atende_presencial && (!d.cidade || !d.estado))
          return "Para atendimento presencial, diga a cidade e o estado.";
        return null;
      }
    },
    {
      titulo: "Suas especialidades",
      html: function () {
        if (!estado.especialidades.length) {
          // Sem isto, uma busca que falhava deixava "Carregando…" para sempre.
          if (estado.espErro) {
            return '<p class="campo__dica">Não consegui carregar as especialidades. ' +
              '<button type="button" class="link" id="cn-esp-tentar">Tentar de novo</button></p>';
          }
          if (!estado.espCarregando) carregarEspecialidades();
          return '<p class="campo__dica">Carregando…</p>';
        }
        return '<p class="campo__dica" style="margin-bottom:12px">' +
            "Marque até 5. É por aqui que o paciente encontra você no quiz." +
          "</p><div class=\"opcoes opcoes--grade\">" +
          estado.especialidades.map(function (e) {
            return '<label class="opcao"><input type="checkbox" class="cn-esp" value="' +
              esc(e.nome) + '" /> ' + esc(e.nome) + "</label>";
          }).join("") + "</div>";
      },
      ler: function (d) {
        d.especialidades = Array.prototype.slice.call(document.querySelectorAll(".cn-esp:checked"))
          .map(function (c) { return c.value; });
        if (!d.especialidades.length) return "Marque pelo menos uma especialidade.";
        if (d.especialidades.length > 5) return "Marque no máximo 5.";
        return null;
      }
    },
    {
      titulo: "Sua foto e apresentação",
      html: function () {
        return '<div class="campo"><span class="campo__rot">Foto de perfil</span>' +
            '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
              '<img id="cn-foto-prev" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover;background:#e8eef0"' +
                (estado.foto ? ' src="' + estado.foto + '"' : " hidden") + " />" +
              // O input nativo tem largura imposta pelo navegador e estourava a tela
              // no celular: fica invisível, e o <label> vira o botão.
              '<input id="cn-foto" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden" />' +
              '<label for="cn-foto" class="btn btn--contorno">Escolher foto</label>' +
            "</div>" +
            '<span class="campo__dica">É o que faz o paciente clicar. Sem foto, o perfil não entra na vitrine.</span>' +
          "</div>" +
          '<label class="campo"><span class="campo__rot">Apresentação</span>' +
            '<textarea id="cn-bio" maxlength="220" rows="4" ' +
              'style="width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;border:1px solid #cfd8dc;border-radius:10px" ' +
              'placeholder="Ex.: Nutricionista da saúde da mulher. Ajudo quem quer engravidar a chegar na gestação com saúde.">' +
              esc(estado.bio || "") + "</textarea>" +
            '<span class="campo__dica" id="cn-bio-n"></span></label>';
      },
      depois: function () {
        var inp = $("#cn-foto"), prev = $("#cn-foto-prev"), bio = $("#cn-bio"), n = $("#cn-bio-n");
        inp.addEventListener("change", function () {
          var f = inp.files && inp.files[0];
          if (!f) return;
          window.FotoUpload.ler(f).then(function (url) {
            estado.foto = url;
            prev.src = url;
            prev.hidden = false;
            erro("");
          }).catch(function (e) {
            if (e && e.message === "cancelado") return;
            erro("Não consegui ler essa imagem. Tente outra foto.");
          }).then(function () { inp.value = ""; });
        });
        function contar() {
          estado.bio = bio.value;
          n.textContent = bio.value.trim().length + " de 220 caracteres (mínimo de 40).";
        }
        bio.addEventListener("input", contar);
        contar();
      },
      ler: function (d) {
        d.apresentacao = $("#cn-bio").value.trim();
        d.avatar_url = estado.foto || null;
        if (d.apresentacao.length < 40) return "Escreva uma apresentação com pelo menos 40 caracteres.";
        return null;
      }
    },
    {
      titulo: "Seu plano e sua senha",
      html: function () {
        var p = PLANOS[0];
        var resumo = estado.ciclo === "anual"
          ? p.nome + " · Anual — " + reais(p.preco.anual) + " por ano"
          : estado.ciclo === "semestral"
          ? p.nome + " · Semestral — " + reais(p.preco.semestral) + " a cada 6 meses"
          : p.nome + " · Mensal — " + reais(p.entrada) + "/mês nas " + p.mesesEntrada +
            " primeiras mensalidades, depois " + reais(p.preco.mensal);
        return '<div class="resumo-plano"><strong>' + esc(resumo) + "</strong>" +
            '<button type="button" class="link" id="cn-trocar">trocar</button>' +
            '<span class="campo__dica">Você começa com 15 dias grátis. O pagamento só é pedido ' +
              "depois, e a vitrine libera quando a assinatura começa.</span>" +
          "</div>" +
          campo("cn-senha", "Crie uma senha", 'type="password" autocomplete="new-password" minlength="6"',
                "Mínimo de 6 caracteres.") +
          campo("cn-cupom", "Cupom de indicação (opcional)",
                'type="text" maxlength="20" autocapitalize="characters" value="' + esc(estado.cupom || "") + '"',
                "Veio pela indicação de uma colega? Digite o cupom dela para registrar a indicação.") +
          '<label class="opcao" style="margin-top:8px"><input type="checkbox" id="cn-aceite" /> ' +
            'Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de uso</a> e a ' +
            '<a href="/privacidade" target="_blank" rel="noopener">Política de privacidade</a>.</label>' +
          '<label class="opcao"><input type="checkbox" id="cn-veracidade" /> ' +
            "Declaro que o CRN informado é meu e está ativo.</label>";
      },
      ler: function (d) {
        d.senha = $("#cn-senha").value;
        d.plano_tier = estado.tier;
        d.plano_ciclo = estado.ciclo;
        d.cupom = $("#cn-cupom").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        estado.cupom = d.cupom;
        if (d.senha.length < 6) return "A senha precisa de pelo menos 6 caracteres.";
        if (!$("#cn-aceite").checked) return "É preciso aceitar os termos.";
        if (!$("#cn-veracidade").checked) return "Confirme que o CRN é seu e está ativo.";
        return null;
      }
    }
  ];

  var dados = {};

  function desenharCadastro() {
    var alvo = $("#cadastro-form");
    if (!alvo) return;
    var p = PASSOS[estado.passo];
    var ultimo = estado.passo === PASSOS.length - 1;

    alvo.innerHTML =
      '<div class="cn-passos">' + PASSOS.map(function (_, i) {
        return '<span class="cn-bola' + (i <= estado.passo ? " is-on" : "") + '"></span>';
      }).join("") + '<span class="cn-passo-n">Passo ' + (estado.passo + 1) + " de " + PASSOS.length + "</span></div>" +
      "<h3>" + esc(p.titulo) + "</h3>" +
      '<div class="cn-campos">' + p.html() + "</div>" +
      '<p class="cn-erro" id="cn-erro" hidden></p>' +
      '<div class="cn-acoes">' +
        (estado.passo > 0 ? '<button type="button" class="btn btn--contorno" id="cn-voltar">← Voltar</button>' : "<span></span>") +
        '<button type="button" class="btn btn--primario" id="cn-seguir">' +
          (ultimo ? "Criar minha conta" : "Continuar") + "</button>" +
      "</div>";

    if (p.depois) p.depois();
    var trocar = $("#cn-trocar");
    if (trocar) {
      trocar.addEventListener("click", function () {
        $("#planos").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    var voltar = $("#cn-voltar");
    if (voltar) {
      voltar.addEventListener("click", function () {
        estado.passo--; desenharCadastro();
      });
    }
    $("#cn-seguir").addEventListener("click", seguir);
  }

  function erro(msg) {
    var e = $("#cn-erro");
    if (!e) return;
    e.textContent = msg;
    e.hidden = !msg;
  }

  function seguir() {
    var p = PASSOS[estado.passo];
    var problema = p.ler(dados);
    if (problema) { erro(problema); return; }
    erro("");

    if (estado.passo < PASSOS.length - 1) {
      estado.passo++;
      desenharCadastro();
      return;
    }
    enviar();
  }

  function enviar() {
    var botao = $("#cn-seguir");
    botao.disabled = true;
    botao.textContent = "Criando…";

    // Cupom errado é recusado ANTES de criar a conta: depois do 1º pagamento
    // a indicação não entra mais, e a nutri perderia o mês extra sem saber.
    var conferirCupom = !dados.cupom ? Promise.resolve(true) :
      fetch(BASE.replace("/functions/v1/", "/rest/v1/rpc/cupom_embaixadora"), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON },
        body: JSON.stringify({ p_cupom: dados.cupom })
      }).then(function (r) { return r.json(); }).then(function (nome) { return !!nome; })
        .catch(function () { return true; }); // fora do ar: o servidor confere de novo

    conferirCupom.then(function (valido) {
      if (valido) return criarConta(botao);
      botao.disabled = false;
      botao.textContent = "Criar minha conta";
      erro("Não encontrei esse cupom. Confira com a colega que indicou ou deixe o campo em branco.");
    });
  }

  function criarConta(botao) {
    fetch(BASE + "criar-conta-nutri", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON },
      body: JSON.stringify(dados)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (!res.ok) {
        botao.disabled = false;
        botao.textContent = "Criar minha conta";
        if (res.j.error === "email_em_uso") {
          erro("Já existe uma conta com esse e-mail. Entre pela plataforma ou use \"Esqueci minha senha\".");
        } else if (res.j.error === "senha_curta") {
          erro("A senha precisa de pelo menos 6 caracteres.");
        } else if (res.j.error === "crn_invalido") {
          erro("Confira o número do CRN.");
        } else {
          erro("Não consegui criar a conta agora. Tente de novo em instantes.");
        }
        return;
      }
      concluido(res.j);
    }).catch(function () {
      botao.disabled = false;
      botao.textContent = "Criar minha conta";
      erro("Sem conexão com o servidor. Tente de novo.");
    });
  }

  function concluido(resposta) {
    var alvo = $("#cadastro-form");
    var aviso = resposta.email_enviado
      ? "Mandamos um e-mail para <strong>" + esc(dados.email) + "</strong> confirmando o cadastro."
      : "Guarde o seu e-mail de acesso: <strong>" + esc(dados.email) + "</strong>.";

    alvo.innerHTML =
      '<div class="cn-fim">' +
        "<h3>Cadastro recebido 🌿</h3>" +
        "<p>" + aviso + "</p>" +
        "<p>Agora conferimos o seu registro no CRN. <strong>Em até " + PRAZO + " dias</strong>, " +
          "se estiver tudo certo, o seu perfil é publicado em Encontre sua nutri e você recebe o aviso.</p>" +
        "<p>Você já pode entrar na plataforma e completar o perfil — a foto e a apresentação são " +
          "o que fazem o paciente clicar.</p>" +
        '<p><a class="btn btn--primario" href="/">Entrar na plataforma</a></p>' +
      "</div>";
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* As especialidades são as mesmas da busca — vêm do banco, não de uma
     lista repetida aqui que sairia do ar na primeira mudança. */
  function carregarEspecialidades() {
    estado.espCarregando = true;
    estado.espErro = false;
    var ctrl = window.AbortController ? new AbortController() : null;
    var prazo = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;
    fetch(BASE + "diretorio-buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: "Bearer " + ANON },
      body: JSON.stringify({ acao: "filtros" }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.json();
    }).then(function (j) {
      estado.especialidades = (j && j.especialidades) || [];
      if (!estado.especialidades.length) throw new Error("vazio");
    }).catch(function () {
      estado.espErro = true;
    }).then(function () {
      if (prazo) clearTimeout(prazo);
      estado.espCarregando = false;
      if (estado.passo === 2) desenharCadastro();
    });
  }

  document.addEventListener("click", function (ev) {
    if (ev.target && ev.target.id === "cn-esp-tentar") {
      carregarEspecialidades();
      desenharCadastro();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    // Link da embaixadora: /seja-indicada?cupom=JULIANUTRI já vem preenchido.
    try {
      var c = new URLSearchParams(window.location.search).get("cupom");
      if (c) estado.cupom = c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    } catch (e) { /* navegador antigo */ }
    desenharPlanos();
    desenharCadastro();
    carregarEspecialidades();
    document.querySelectorAll("[data-ir-cadastro]").forEach(function (b) {
      b.addEventListener("click", function (ev) { ev.preventDefault(); irParaCadastro(); });
    });
  });
})();
