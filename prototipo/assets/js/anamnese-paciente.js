/* ============================================================
   ANAMNESE DO PROGRAMA — preenchida PELA PACIENTE no portal.

   É a peça que sustenta o "Meu Plano com a Nutri Ana" eticamente: o
   atendimento é 100% assíncrono, então a avaliação individual acontece
   aqui. Sem ela não existe prescrição — o portal nem mostra plano.

   Antes do formulário vem o TCLE de telenutrição (Res. CFN 760/2023,
   que exige informar possibilidades, limitações e fragilidades do
   atendimento a distância). O aceite é gravado em public.consentimentos
   com versão e data, para se poder provar QUAL texto foi aceito.

   As medidas informadas são AUTORREFERIDAS: vão para
   antropometria.autorreferida, nunca para peso_atual/altura/imc da
   ficha. Quem decide o que entra no prontuário como dado clínico é a
   nutricionista, que responde por ele (Art. 35 da Res. CFN 856/2026).

   window.AnamneseView = { MODELO_ID, pendente, portalHTML, wire }.
   Requer supabase-client.js ANTES deste arquivo.
   ============================================================ */
(function () {
  "use strict";

  var MODELO_ID = "anamnese-programa";
  var TITULO = "Anamnese do programa";
  var TCLE_TIPO = "telenutricao";
  // Bump em 29/07: o texto saiu da devolutiva em vídeo para as orientações
  // escritas. A versão existe justamente para provar QUAL texto foi aceito, e
  // pendente() consulta por tipo (não por versão) — então quem já aceitou não
  // é obrigado a reaceitar.
  var TCLE_VERSAO = "2026-07-29";
  // Pedido expresso para começar a elaborar o plano. Fica separado do TCLE de
  // propósito: é o que a cláusula 8 dos termos promete registrar "com data e
  // hora", e é ele que sustenta o caráter personalíssimo do documento diante do
  // art. 49 do CDC. Aceite genérico e enterrado no meio do termo não serve —
  // a jurisprudência só afasta o arrependimento quando o aviso é prévio,
  // claro e destacado.
  var PLANO_TIPO = "plano-personalizado";
  var PLANO_VERSAO = "2026-07-29";
  var RASCUNHO_KEY = "nutri:anamnese:rascunho";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- O questionário ----------
     Fundo o suficiente para substituir a conversa da consulta: história,
     saúde, ciclo, intestino, sono, atividade, o que ela realmente come,
     o que ela não come de jeito nenhum e quanto tempo tem para cozinhar.
     Um plano montado sem isso seria dieta de prateleira. */
  var PASSOS = [
    {
      id: "voce",
      titulo: "Sobre você",
      dica: "Para eu saber com quem estou falando e como é o seu dia.",
      campos: [
        { id: "nome_completo", label: "Nome completo", tipo: "texto", req: true },
        { id: "nascimento", label: "Data de nascimento", tipo: "data", req: true },
        { id: "whatsapp", label: "WhatsApp (com DDD)", tipo: "texto", req: true, placeholder: "(21) 99999-9999" },
        { id: "cidade", label: "Cidade e estado", tipo: "texto", req: true },
        { id: "profissao", label: "O que você faz e como é a sua rotina de trabalho?", tipo: "area", req: true,
          dica: "Horários, se trabalha fora, se faz plantão, se come na rua." },
        { id: "casa", label: "Quem mora com você e quem cozinha?", tipo: "area", req: true }
      ]
    },
    {
      id: "objetivo",
      titulo: "O que te trouxe até aqui",
      campos: [
        { id: "objetivo", label: "Qual é o seu objetivo com o acompanhamento?", tipo: "area", req: true },
        { id: "motivo", label: "Por que agora? O que aconteceu para você decidir começar?", tipo: "area", req: true },
        { id: "tentativas", label: "O que você já tentou antes?", tipo: "area",
          dica: "Dietas, aplicativos, outros profissionais — e o que deu certo ou errado em cada um." },
        { id: "expectativa", label: "O que faria você sentir que valeu a pena?", tipo: "area" }
      ]
    },
    {
      id: "saude",
      titulo: "Sua saúde",
      dica: "Nada aqui é julgamento — é o que me permite montar um plano seguro para você.",
      campos: [
        { id: "condicoes", label: "Você tem alguma condição de saúde diagnosticada?", tipo: "multi",
          opcoes: ["Nenhuma", "Hipertensão", "Diabetes ou pré-diabetes", "Colesterol/triglicerídeos alterados",
                   "Tireoide (hipo ou hipertireoidismo)", "Gastrite ou refluxo", "Anemia",
                   "Doença renal", "Doença hepática/esteatose", "Outra"] },
        { id: "condicoes_outra", label: "Se marcou 'Outra', qual?", tipo: "texto" },
        { id: "medicamentos", label: "Medicamentos que você usa hoje (nome e dose)", tipo: "area", req: true,
          dica: "Escreva 'nenhum' se for o caso. Inclua anticoncepcional e qualquer uso contínuo." },
        { id: "caneta", label: "Você usa ou já usou caneta emagrecedora (Ozempic, Mounjaro, Saxenda, similares)?", tipo: "radio",
          opcoes: ["Não, nunca usei", "Uso atualmente", "Já usei e parei"], req: true },
        { id: "caneta_detalhe", label: "Se usa ou usou: qual, em que dose e há quanto tempo?", tipo: "texto" },
        { id: "suplementos", label: "Suplementos e vitaminas em uso", tipo: "area",
          dica: "Escreva 'nenhum' se for o caso." },
        { id: "cirurgias", label: "Cirurgias que você já fez", tipo: "texto" },
        { id: "alergias", label: "Alergias ou intolerâncias alimentares", tipo: "area", req: true,
          dica: "Ex.: lactose, glúten, frutos do mar. Escreva 'nenhuma' se for o caso." },
        { id: "exames", label: "Você tem exames de sangue recentes (até 6 meses)?", tipo: "radio",
          opcoes: ["Sim, tenho em mãos", "Tenho, mas são antigos", "Não tenho"], req: true },
        { id: "fumo_alcool", label: "Você fuma ou bebe? Com que frequência?", tipo: "texto" }
      ]
    },
    {
      id: "mulher",
      titulo: "Saúde da mulher",
      dica: "Se algum item não se aplica a você, escreva 'não se aplica'.",
      campos: [
        { id: "ciclo", label: "Como é o seu ciclo menstrual?", tipo: "radio",
          opcoes: ["Regular", "Irregular", "Não menstruo (contraceptivo)", "Menopausa", "Não se aplica"], req: true },
        { id: "tpm", label: "Você tem sintomas na TPM? Quais?", tipo: "area",
          dica: "Inchaço, vontade de doce, dor, alteração de humor, intestino." },
        { id: "gineco", label: "Alguma dessas condições?", tipo: "multi",
          opcoes: ["Nenhuma", "SOP (ovários policísticos)", "Endometriose", "Miomas", "Infertilidade em investigação", "Outra"] },
        { id: "gestacao", label: "Você está grávida ou amamentando?", tipo: "radio",
          opcoes: ["Não", "Estou grávida", "Estou amamentando", "Estou tentando engravidar"], req: true }
      ]
    },
    {
      id: "digestivo",
      titulo: "Digestão e intestino",
      campos: [
        { id: "intestino_freq", label: "Com que frequência você evacua?", tipo: "radio",
          opcoes: ["Todo dia", "Dia sim, dia não", "2 a 3 vezes por semana", "Menos de 2 vezes por semana", "Mais de uma vez por dia"], req: true },
        { id: "intestino_como", label: "Como costuma ser?", tipo: "radio",
          opcoes: ["Normal", "Ressecado / com esforço", "Amolecido", "Varia muito"] },
        { id: "digestivos", label: "Você sente algum destes sintomas?", tipo: "multi",
          opcoes: ["Nenhum", "Azia ou queimação", "Empachamento (comida parada)", "Gases", "Inchaço na barriga", "Náusea", "Dor abdominal"] },
        { id: "agua", label: "Quanta água você bebe por dia?", tipo: "radio",
          opcoes: ["Menos de 1 litro", "1 a 1,5 litro", "1,5 a 2 litros", "Mais de 2 litros"], req: true }
      ]
    },
    {
      id: "rotina",
      titulo: "Sono, energia e movimento",
      campos: [
        { id: "sono_horas", label: "Quantas horas você dorme por noite, em média?", tipo: "texto", req: true },
        { id: "sono_qualidade", label: "Como é a qualidade do seu sono?", tipo: "radio",
          opcoes: ["Durmo bem", "Demoro a pegar no sono", "Acordo várias vezes", "Acordo cansada mesmo dormindo"] },
        { id: "energia", label: "Como está a sua energia durante o dia?", tipo: "area" },
        { id: "estresse", label: "Como anda o seu nível de estresse e ansiedade?", tipo: "area" },
        { id: "atividade", label: "Você pratica atividade física?", tipo: "radio",
          opcoes: ["Não pratico", "1 a 2 vezes por semana", "3 a 4 vezes por semana", "5 ou mais vezes por semana"], req: true },
        { id: "atividade_qual", label: "Se pratica: o quê, por quanto tempo e em que horário?", tipo: "texto" }
      ]
    },
    {
      id: "alimentacao",
      titulo: "Como você come hoje",
      dica: "Seja honesta — não existe resposta errada, e é daqui que sai o seu plano de verdade.",
      campos: [
        { id: "cafe", label: "Café da manhã: o que e a que horas?", tipo: "area", req: true },
        { id: "lanche_manha", label: "Lanche da manhã", tipo: "texto" },
        { id: "almoco", label: "Almoço: o que e a que horas?", tipo: "area", req: true },
        { id: "lanche_tarde", label: "Lanche da tarde", tipo: "texto" },
        { id: "jantar", label: "Jantar: o que e a que horas?", tipo: "area", req: true },
        { id: "ceia", label: "Come alguma coisa depois do jantar?", tipo: "texto" },
        { id: "fds", label: "O fim de semana é diferente? Como?", tipo: "area" },
        { id: "beliscos", label: "Você belisca fora das refeições? O quê e quando?", tipo: "area" },
        { id: "compulsao", label: "Acontece de comer muito além da fome, sem conseguir parar?", tipo: "radio",
          opcoes: ["Nunca", "Às vezes", "Com frequência", "Quase todo dia"], req: true },
        { id: "gatilhos", label: "Se acontece, em que situações?", tipo: "texto",
          dica: "Ex.: ansiedade, cansaço, à noite, TPM, depois de um dia difícil." },
        { id: "fora", label: "Quantas vezes por semana você come fora ou pede delivery?", tipo: "texto", req: true }
      ]
    },
    {
      id: "preferencias",
      titulo: "O que cabe na sua vida",
      dica: "É isso que faz o plano ser seguível em vez de bonito no papel.",
      campos: [
        { id: "adora", label: "Quais alimentos você ama e não quer tirar?", tipo: "area", req: true },
        { id: "detesta", label: "O que você não come de jeito nenhum?", tipo: "area", req: true },
        { id: "restricao", label: "Você segue alguma restrição alimentar?", tipo: "multi",
          opcoes: ["Nenhuma", "Vegetariana", "Vegana", "Sem lactose", "Sem glúten", "Restrição religiosa", "Outra"] },
        { id: "cozinha", label: "Quanto tempo você tem para cozinhar em um dia comum?", tipo: "radio",
          opcoes: ["Não cozinho", "Até 15 minutos", "Cerca de 30 minutos", "Mais de 30 minutos", "Cozinho no fim de semana e congelo"], req: true },
        { id: "marmita", label: "Você leva ou levaria marmita?", tipo: "radio",
          opcoes: ["Já levo", "Levaria, se soubesse como", "Não tenho como levar"] },
        { id: "orcamento", label: "Tem algum limite de orçamento que eu deva respeitar nas compras?", tipo: "area" },
        { id: "onde_compra", label: "Onde você faz as compras?", tipo: "texto",
          dica: "Mercado do bairro, feira, atacado, delivery — para eu sugerir o que você realmente encontra." }
      ]
    },
    {
      id: "medidas",
      titulo: "Suas medidas",
      dica: "Meça em jejum, de manhã, com roupa leve. Se não tiver fita métrica, preencha só peso e altura — a gente completa depois.",
      medidas: true,
      campos: [
        { id: "peso", label: "Peso hoje", tipo: "numero", unidade: "kg", req: true },
        { id: "altura", label: "Altura", tipo: "numero", unidade: "cm", req: true },
        { id: "peso_maior", label: "Maior peso que você já teve", tipo: "numero", unidade: "kg" },
        { id: "peso_menor", label: "Menor peso na vida adulta", tipo: "numero", unidade: "kg" },
        { id: "cintura", label: "Cintura", tipo: "numero", unidade: "cm",
          dica: "Na parte mais estreita do tronco, acima do umbigo, sem apertar." },
        { id: "quadril", label: "Quadril", tipo: "numero", unidade: "cm",
          dica: "Na parte mais larga, com os pés juntos." },
        { id: "braco", label: "Braço", tipo: "numero", unidade: "cm",
          dica: "No meio do braço relaxado, entre o ombro e o cotovelo." }
      ]
    },
    {
      id: "final",
      titulo: "Só mais uma coisa",
      campos: [
        { id: "acompanhamento_saude", label: "Você faz acompanhamento médico ou psicológico atualmente?", tipo: "area",
          dica: "Se sim, com qual especialidade." },
        { id: "transtorno", label: "Você tem ou já teve diagnóstico de transtorno alimentar?", tipo: "radio",
          opcoes: ["Não", "Sim, já tive", "Sim, atualmente", "Prefiro conversar sobre isso"], req: true },
        { id: "livre", label: "Tem mais alguma coisa que você queira que eu saiba?", tipo: "area" }
      ]
    }
  ];

  /* ---------- Estado ---------- */
  var _resp = {};      // { campoId: valor }
  var _passo = 0;
  var _pac = null;
  var _user = null;
  var _readonly = false;
  var _onSalvo = null;

  /* ---------- Já respondeu? ---------- */
  function instancia(p) {
    var qs = (p && p.questionarios) || [];
    for (var i = 0; i < qs.length; i++) {
      if (qs[i] && qs[i].origem === "portal" && qs[i].modeloId === MODELO_ID) return qs[i];
    }
    return null;
  }
  function pendente(p) { return !instancia(p); }

  /* ---------- Rascunho local (não perder o que digitou) ---------- */
  function salvarRascunho() {
    try { localStorage.setItem(RASCUNHO_KEY, JSON.stringify({ passo: _passo, resp: _resp })); } catch (e) {}
  }
  function lerRascunho() {
    try {
      var raw = localStorage.getItem(RASCUNHO_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function limparRascunho() { try { localStorage.removeItem(RASCUNHO_KEY); } catch (e) {} }

  /* ---------- HTML ---------- */
  function campoHTML(c) {
    var val = _resp[c.id];
    var req = c.req ? ' <span class="anm-req" aria-hidden="true">*</span>' : "";
    var dica = c.dica ? '<span class="anm-dica">' + esc(c.dica) + '</span>' : "";
    var input = "";

    if (c.tipo === "area") {
      input = '<textarea class="anm-input" rows="3" data-campo="' + esc(c.id) + '"' +
        (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") + '>' + esc(val || "") + '</textarea>';
    } else if (c.tipo === "radio") {
      input = '<div class="anm-opts">' + (c.opcoes || []).map(function (o, i) {
        var id = "anm-" + c.id + "-" + i;
        return '<label class="anm-opt" for="' + id + '"><input type="radio" id="' + id + '" name="anm-' + esc(c.id) + '"' +
          ' data-campo="' + esc(c.id) + '" value="' + esc(o) + '"' + (val === o ? " checked" : "") + '>' +
          '<span>' + esc(o) + '</span></label>';
      }).join("") + '</div>';
    } else if (c.tipo === "multi") {
      var marcados = Array.isArray(val) ? val : [];
      input = '<div class="anm-opts">' + (c.opcoes || []).map(function (o, i) {
        var id = "anm-" + c.id + "-" + i;
        return '<label class="anm-opt" for="' + id + '"><input type="checkbox" id="' + id + '"' +
          ' data-campo="' + esc(c.id) + '" data-multi="1" value="' + esc(o) + '"' +
          (marcados.indexOf(o) >= 0 ? " checked" : "") + '><span>' + esc(o) + '</span></label>';
      }).join("") + '</div>';
    } else if (c.tipo === "numero") {
      input = '<div class="anm-num"><input class="anm-input" type="number" inputmode="decimal" step="0.1" min="0"' +
        ' data-campo="' + esc(c.id) + '" value="' + esc(val == null ? "" : val) + '">' +
        (c.unidade ? '<span class="anm-unid">' + esc(c.unidade) + '</span>' : "") + '</div>';
    } else {
      input = '<input class="anm-input" type="' + (c.tipo === "data" ? "date" : "text") + '"' +
        ' data-campo="' + esc(c.id) + '" value="' + esc(val || "") + '"' +
        (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") + '>';
    }

    return '<div class="anm-campo" data-campo-wrap="' + esc(c.id) + '">' +
      '<label class="anm-label">' + esc(c.label) + req + '</label>' + dica + input +
      '<span class="anm-erro" hidden>Este campo é necessário para eu montar o seu plano.</span></div>';
  }

  function passoHTML() {
    var p = PASSOS[_passo];
    var pct = Math.round((_passo / PASSOS.length) * 100);
    var ultimo = _passo === PASSOS.length - 1;
    return '<div class="pcard anm">' +
      '<div class="anm-prog"><div class="anm-prog__bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="anm-prog__txt">Etapa ' + (_passo + 1) + ' de ' + PASSOS.length + '</span></div>' +
      '<h2 class="pcard__title">' + esc(p.titulo) + '</h2>' +
      (p.dica ? '<p class="anm-passo-dica">' + esc(p.dica) + '</p>' : "") +
      '<div class="anm-campos">' + p.campos.map(campoHTML).join("") + '</div>' +
      (ultimo ? consentPlanoHTML() : "") +
      '<div class="anm-nav">' +
        (_passo > 0 ? '<button type="button" class="btn btn--outline" data-anm-voltar>‹ Voltar</button>' : '<span></span>') +
        '<button type="button" class="btn btn--primary" data-anm-avancar>' +
          (ultimo ? "Enviar para a nutri" : "Continuar ›") + '</button>' +
      '</div>' +
      '<p class="anm-salvo">Suas respostas ficam salvas neste aparelho — dá para parar e voltar depois.</p>' +
    '</div>';
  }

  /* Último passo: pedido expresso para eu começar o plano.
     Desmarcada por padrão e obrigatória — se ela não marcar, não envia. */
  function consentPlanoHTML() {
    return '<div class="anm-tcle anm-tcle--curto">' +
      '<p><strong>Antes de enviar.</strong> A partir daqui eu começo a montar o seu plano ' +
        'alimentar, feito só para você a partir do que você respondeu aqui.</p>' +
      '<p><strong>Você pode cancelar quando quiser</strong>, do primeiro ao último dia, sem multa ' +
        'e sem prazo mínimo. Se desistir <strong>antes</strong> de eu entregar o plano, devolvo o ' +
        'valor integral. <strong>Depois</strong> de entregue, o plano fica com você e eu devolvo a ' +
        'parte proporcional aos ciclos de 30 dias que você ainda não usou.</p>' +
      '<p>Como o plano é um documento personalizado e fácil de copiar, uma vez entregue ele não ' +
        'tem como ser devolvido — por isso eu só começo com o seu pedido expresso abaixo.</p>' +
      '</div>' +
      '<label class="anm-opt anm-aceite" for="anm-consent-plano">' +
        '<input type="checkbox" id="anm-consent-plano"> ' +
        '<span>Li e entendi. Peço que a Ana comece a elaborar o meu plano alimentar agora.</span>' +
      '</label>' +
      '<p class="anm-erro" data-consent-erro hidden>Você precisa confirmar o pedido para enviar.</p>';
  }

  function tcleHTML() {
    return '<div class="pcard anm">' +
      '<h2 class="pcard__title">Antes de começar</h2>' +
      '<p class="anm-passo-dica">Este é o termo de consentimento do atendimento a distância. ' +
        'Leia com calma — ele diz o que este acompanhamento é e o que ele não é.</p>' +
      '<div class="anm-tcle">' +
        '<p><strong>O que é.</strong> Você contratou um acompanhamento nutricional individual realizado ' +
          'por telenutrição, na modalidade assíncrona, com a nutricionista Ana Luísa Rocha (CRN 25100401), ' +
          'conforme a Resolução CFN nº 760/2023.</p>' +
        '<p><strong>Como funciona.</strong> A avaliação é feita a partir das informações que você preenche ' +
          'nesta anamnese. Com base nelas, a nutricionista elabora o seu plano alimentar individualizado e ' +
          'escreve as orientações dela explicando cada escolha. Ao longo do programa há reavaliações ' +
          'periódicas e um canal de mensagens para dúvidas.</p>' +
        '<p><strong>Limitações — leia com atenção.</strong> Por ser a distância, não há exame físico nem ' +
          'aferição de medidas por profissional: as medidas são informadas por você e podem conter erro. ' +
          'Isso restringe a avaliação da composição corporal. A qualidade do plano depende diretamente da ' +
          'sinceridade e da completude do que você responder aqui.</p>' +
        '<p><strong>Quando não é indicado.</strong> A nutricionista pode concluir que o seu caso não é ' +
          'adequado para atendimento a distância — por exemplo, em gestação de risco, transtorno alimentar ' +
          'em curso ou doença que exija avaliação presencial. Nessa hipótese ela te informa, indica o ' +
          'caminho adequado e devolve integralmente o valor pago.</p>' +
        '<p><strong>O que não é.</strong> Este acompanhamento não substitui consulta médica, diagnóstico ' +
          'médico nem tratamento de qualquer outra especialidade, e não trabalha com promessa de resultado, ' +
          'prazo ou quantidade de peso.</p>' +
        '<p><strong>Seus dados.</strong> As informações de saúde que você registra aqui são dado pessoal ' +
          'sensível (LGPD), ficam guardadas com acesso restrito à sua nutricionista e são usadas apenas ' +
          'para o seu atendimento. Você pode pedir cópia ou exclusão a qualquer momento.</p>' +
        '<p><strong>Registro.</strong> O atendimento é registrado em prontuário, como manda a legislação ' +
          'profissional.</p>' +
      '</div>' +
      '<label class="anm-opt anm-aceite" for="anm-aceite">' +
        '<input type="checkbox" id="anm-aceite"> ' +
        '<span>Li, entendi e concordo com as condições do atendimento por telenutrição.</span></label>' +
      '<p class="anm-erro" data-tcle-erro hidden>Você precisa aceitar para continuar.</p>' +
      '<div class="anm-nav"><span></span>' +
        '<button type="button" class="btn btn--primary" data-anm-aceitar>Aceitar e começar</button></div>' +
    '</div>';
  }

  /* Respostas em leitura, agrupadas pela seção do formulário.
     Fica fechado num <details> de propósito: quem acabou de enviar quer ver o
     prazo, não reler 10 etapas. Quem voltou meses depois abre e confere.
     Não há como editar — a anamnese enviada é registro do atendimento, e a
     nutri já leu o que está ali. Mudança depois disso é conversa na aba
     Mensagens, que fica gravada junto. */
  function respostasHTML(inst) {
    var rs = (inst && inst.respostas) || [];
    if (!rs.length) return "";
    var secoes = [], porSecao = {};
    rs.forEach(function (r) {
      var s = r.secao || "Respostas";
      if (!porSecao[s]) { porSecao[s] = []; secoes.push(s); }
      porSecao[s].push(r);
    });
    var corpo = secoes.map(function (s) {
      var itens = porSecao[s].map(function (r) {
        return '<div class="anm-resp__item">' +
          '<dt class="anm-resp__label">' + esc(r.label) + '</dt>' +
          '<dd class="anm-resp__valor">' + esc(r.valor) + '</dd>' +
        '</div>';
      }).join("");
      return '<section class="anm-resp__secao">' +
        '<h3 class="anm-resp__titulo">' + esc(s) + '</h3>' +
        '<dl class="anm-resp__lista">' + itens + '</dl>' +
      '</section>';
    }).join("");
    return '<details class="anm-resp">' +
      '<summary class="anm-resp__toggle">Ver minhas respostas</summary>' +
      corpo +
      '<p class="anm-salvo">Não dá para alterar o que já foi enviado. ' +
        'Se algo mudou, me conte na aba Mensagens.</p>' +
    '</details>';
  }

  /* planoLiberado: o plano já saiu, então o prazo de entrega virou passado e
     prometer "até 2 dias úteis" a quem já recebeu soa quebrado. O cartão passa
     a ser só o arquivo da anamnese. */
  function enviadaHTML(inst, planoLiberado) {
    if (planoLiberado) {
      return '<div class="pcard anm">' +
        '<h2 class="pcard__title">Minha anamnese</h2>' +
        '<p class="anm-passo-dica">Estas são as respostas que você me enviou' +
          (inst && inst.data ? " em " + esc(fmtBR(inst.data)) : "") + ', ' +
          'e é delas que saiu o seu plano.</p>' +
        respostasHTML(inst) +
      '</div>';
    }
    return '<div class="pcard anm">' +
      '<h2 class="pcard__title">Anamnese enviada ✓</h2>' +
      '<p class="anm-passo-dica">Recebi as suas respostas' + (inst && inst.data ? " em " + esc(fmtBR(inst.data)) : "") + '. ' +
        'Agora é comigo: vou analisar tudo com calma e montar o seu plano.</p>' +
      '<div class="anm-prazo">' +
        '<strong>Prazo de entrega: até 2 dias úteis.</strong>' +
        '<span>Você recebe um aviso quando o plano estiver liberado aqui no portal, junto com as minhas orientações escritas.</span>' +
      '</div>' +
      respostasHTML(inst) +
      '<p class="anm-salvo">Lembrou de alguma coisa importante depois de enviar? Me escreva na aba Mensagens.</p>' +
    '</div>';
  }

  function fmtBR(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : String(iso || "");
  }

  /* ---------- API pública ---------- */
  function portalHTML(p, opts) {
    var inst = instancia(p);
    if (inst) return enviadaHTML(inst, !!(opts && opts.planoLiberado));
    return '<div id="anm-root"><div class="pcard"><div class="empty-state">Carregando…</div></div></div>';
  }

  function wire(p, opts) {
    opts = opts || {};
    _pac = p;
    _user = opts.user || null;
    _readonly = !!opts.readonly;
    _onSalvo = opts.onSalvo || null;
    if (!pendente(p)) return;

    var host = document.getElementById("anm-root");
    if (!host) return;

    if (_readonly) {
      host.innerHTML = '<div class="pcard"><div class="empty-state">' +
        'Pré-visualização: no acesso real, a paciente preenche a anamnese aqui.</div></div>';
      return;
    }

    var rasc = lerRascunho();
    if (rasc && rasc.resp) { _resp = rasc.resp; _passo = Math.min(rasc.passo || 0, PASSOS.length - 1); }

    // TCLE aceito? Consulta best-effort: se der erro, pede o aceite de novo
    // (repetir o aceite é inofensivo; pular seria o problema).
    window.NutriDBReady.then(function (c) {
      return c.from("consentimentos").select("id").eq("tipo", TCLE_TIPO).limit(1);
    }).then(function (res) {
      var aceito = !!(res && res.data && res.data.length);
      render(host, aceito);
    }).catch(function () { render(host, false); });
  }

  function render(host, aceito) {
    host.innerHTML = aceito ? passoHTML() : tcleHTML();
    host.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Coleta ---------- */
  function lerCampos() {
    var host = document.getElementById("anm-root");
    if (!host) return;
    host.querySelectorAll("[data-campo]").forEach(function (inp) {
      var id = inp.getAttribute("data-campo");
      if (inp.type === "radio") {
        if (inp.checked) _resp[id] = inp.value;
      } else if (inp.getAttribute("data-multi")) {
        var arr = Array.isArray(_resp[id]) ? _resp[id].slice() : [];
        var i = arr.indexOf(inp.value);
        if (inp.checked && i < 0) arr.push(inp.value);
        if (!inp.checked && i >= 0) arr.splice(i, 1);
        _resp[id] = arr;
      } else {
        _resp[id] = inp.value;
      }
    });
    salvarRascunho();
  }

  function validar() {
    var passo = PASSOS[_passo];
    var host = document.getElementById("anm-root");
    var primeiroErro = null;
    passo.campos.forEach(function (c) {
      var wrap = host.querySelector('[data-campo-wrap="' + c.id + '"]');
      if (!wrap) return;
      var v = _resp[c.id];
      var vazio = c.tipo === "multi" ? !(Array.isArray(v) && v.length) : !(v != null && String(v).trim());
      var ruim = !!c.req && vazio;
      wrap.classList.toggle("is-erro", ruim);
      var msg = wrap.querySelector(".anm-erro");
      if (msg) msg.hidden = !ruim;
      if (ruim && !primeiroErro) primeiroErro = wrap;
    });
    if (primeiroErro) { primeiroErro.scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
    return true;
  }

  /* Formato { id, label, valor } — é exatamente o que questionarios.js já
     lê no histórico da ficha, no modal de detalhe e no PDF. 'secao' é
     extra nosso, ignorado por quem não usa. Mudar isso quebra a leitura
     do lado da nutri. */
  function montarRespostas() {
    var out = [];
    PASSOS.forEach(function (passo) {
      passo.campos.forEach(function (c) {
        var v = _resp[c.id];
        if (Array.isArray(v)) v = v.join(", ");
        v = (v == null ? "" : String(v)).trim();
        if (!v) return;
        out.push({ id: c.id, label: c.label, valor: v, secao: passo.titulo });
      });
    });
    return out;
  }

  function montarMedidas() {
    var passo = null;
    PASSOS.forEach(function (s) { if (s.medidas) passo = s; });
    if (!passo) return {};
    var m = {};
    passo.campos.forEach(function (c) {
      var v = _resp[c.id];
      if (v == null || String(v).trim() === "") return;
      var n = parseFloat(String(v).replace(",", "."));
      if (!isNaN(n)) m[c.id] = n;
    });
    return m;
  }

  function enviar(btn) {
    var respostas = montarRespostas();
    if (!respostas.length) return;

    // Sem o pedido expresso não sai nada. O registro vai ANTES da anamnese de
    // propósito: se ele falhar, nada foi enviado e nenhum plano é montado —
    // o contrário deixaria um pedido de plano sem consentimento gravado.
    var host0 = document.getElementById("anm-root");
    var chk = document.getElementById("anm-consent-plano");
    var errC = host0 && host0.querySelector("[data-consent-erro]");
    if (!chk || !chk.checked) {
      if (errC) errC.hidden = false;
      if (chk) chk.focus();
      return;
    }
    if (errC) errC.hidden = true;

    btn.disabled = true;
    var txt = btn.textContent;
    btn.textContent = "Enviando…";

    window.NutriDBReady.then(function (c) {
      return c.from("consentimentos").insert({
        user_id: _user && _user.id, tipo: PLANO_TIPO, versao: PLANO_VERSAO
      }).then(function (res) {
        if (res && res.error) throw res.error;
        return c;
      });
    }).then(function (c) {
      return c.rpc("salvar_anamnese_paciente", {
        p_respostas: respostas,
        p_medidas: montarMedidas(),
        p_modelo_id: MODELO_ID,
        p_titulo: TITULO
      });
    }).then(function (res) {
      if (res && res.error) throw res.error;
      limparRascunho();
      var host = document.getElementById("anm-root");
      if (host) host.innerHTML = enviadaHTML({
        data: new Date().toISOString().slice(0, 10), respostas: respostas
      });
      if (_onSalvo) _onSalvo(respostas);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = txt;
      alert("Não consegui enviar agora. Suas respostas estão salvas — confira a conexão e tente de novo.");
    });
  }

  /* ---------- Eventos (delegação) ---------- */
  document.addEventListener("change", function (e) {
    if (!e.target.closest || !e.target.closest("#anm-root")) return;
    if (e.target.matches("[data-campo]")) lerCampos();
  });
  document.addEventListener("input", function (e) {
    if (!e.target.closest || !e.target.closest("#anm-root")) return;
    if (e.target.matches("[data-campo]")) {
      var wrap = e.target.closest("[data-campo-wrap]");
      if (wrap && wrap.classList.contains("is-erro")) {
        wrap.classList.remove("is-erro");
        var msg = wrap.querySelector(".anm-erro");
        if (msg) msg.hidden = true;
      }
      lerCampos();
    }
  });

  document.addEventListener("click", function (e) {
    var host = document.getElementById("anm-root");
    if (!host) return;

    // Aceite do TCLE
    if (e.target.closest("[data-anm-aceitar]")) {
      var chk = document.getElementById("anm-aceite");
      var erro = host.querySelector("[data-tcle-erro]");
      if (!chk || !chk.checked) { if (erro) erro.hidden = false; return; }
      if (erro) erro.hidden = true;
      var btn = e.target.closest("[data-anm-aceitar]");
      btn.disabled = true;
      window.NutriDBReady.then(function (c) {
        return c.from("consentimentos").insert({
          user_id: _user && _user.id, tipo: TCLE_TIPO, versao: TCLE_VERSAO
        });
      }).then(function () { render(host, true); })
        .catch(function () {
          btn.disabled = false;
          alert("Não consegui registrar o aceite agora. Confira a conexão e tente de novo.");
        });
      return;
    }

    if (e.target.closest("[data-anm-voltar]")) {
      lerCampos();
      _passo = Math.max(0, _passo - 1);
      salvarRascunho();
      render(host, true);
      return;
    }

    var avancar = e.target.closest("[data-anm-avancar]");
    if (avancar) {
      lerCampos();
      if (!validar()) return;
      if (_passo === PASSOS.length - 1) { enviar(avancar); return; }
      _passo++;
      salvarRascunho();
      render(host, true);
    }
  });

  window.AnamneseView = {
    MODELO_ID: MODELO_ID,
    TCLE_VERSAO: TCLE_VERSAO,
    PLANO_TIPO: PLANO_TIPO,
    PLANO_VERSAO: PLANO_VERSAO,
    pendente: pendente,
    portalHTML: portalHTML,
    wire: wire
  };
})();
