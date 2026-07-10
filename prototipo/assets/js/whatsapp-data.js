/* ============================================================
   WHATSAPP — catálogo padrão das automações (textos, gatilhos,
   variáveis). Estes são os DEFAULTS: a nutri pode editar tudo, e
   o que ela salvar sobrescreve isto (guardado em profiles.whatsapp_config).
   Exposto como global para funcionar por file:// (sem servidor).
   ============================================================ */
window.WA_DATA = {

  /* Variáveis dinâmicas disponíveis para inserir nas mensagens */
  variaveis: [
    { chave: "{nome}", desc: "Primeiro nome do paciente" },
    { chave: "{data_consulta}", desc: "Data da consulta" },
    { chave: "{hora_consulta}", desc: "Horário da consulta" },
    { chave: "{nutricionista}", desc: "Seu nome" },
    { chave: "{cupom}", desc: "Código do cupom de retorno" },
    { chave: "{link_agendamento}", desc: "Link para o paciente agendar" },
    { chave: "{link_google_reviews}", desc: "Link da sua avaliação no Google" }
  ],

  /* Emojis de acesso rápido */
  emojis: ["💜", "😊", "🎂", "🎉", "📅", "⏰", "⭐", "🎁", "✅", "🙏", "🥗", "💪", "👋", "❤️", "🌸"],

  /* Dados fictícios usados na PRÉVIA da mensagem */
  exemplo: {
    "{nome}": "Marina",
    "{data_consulta}": "15/07/2026",
    "{hora_consulta}": "14:30",
    "{cupom}": "RETORNO10",
    "{link_agendamento}": "https://wa.me/message/agendar",
    "{link_google_reviews}": "https://g.page/sua-clinica/review"
  },

  /* Automações (ordem de exibição). id = chave estável salva no banco. */
  automacoes: [
    {
      id: "boas_vindas",
      titulo: "Mensagem de Boas-Vindas",
      icone: "👋",
      quando: "Ao cadastrar um novo paciente",
      gatilho: "Assim que um paciente novo é criado na plataforma.",
      ativoPadrao: true,
      texto:
        "Olá, {nome}! 💜\n\n" +
        "Seja muito bem-vindo(a)!\n\n" +
        "É um prazer fazer parte da sua jornada de saúde e bem-estar. A partir de agora estarei ao seu lado para te ajudar a alcançar seus objetivos de forma leve, saudável e sustentável.\n\n" +
        "Conte comigo nessa caminhada! 😊"
    },
    {
      id: "confirmacao",
      titulo: "Confirmação de Agendamento",
      icone: "📅",
      quando: "Ao agendar uma consulta",
      gatilho: "Assim que uma consulta é marcada na agenda.",
      ativoPadrao: true,
      texto:
        "Olá, {nome}! 😊\n\n" +
        "Sua consulta foi agendada com sucesso.\n\n" +
        "📅 Data: {data_consulta}\n" +
        "⏰ Horário: {hora_consulta}\n\n" +
        "Estou te esperando! 💜"
    },
    {
      id: "lembrete_24h",
      titulo: "Lembrete de Consulta",
      icone: "⏰",
      quando: "24 horas antes da consulta",
      gatilho: "Enviado automaticamente 1 dia antes do horário marcado.",
      ativoPadrao: true,
      texto:
        "Olá, {nome}! 😊\n\n" +
        "Passando para lembrar que sua consulta acontecerá amanhã.\n\n" +
        "📅 Data: {data_consulta}\n" +
        "⏰ Horário: {hora_consulta}\n\n" +
        "Até breve! 💜"
    },
    {
      id: "pos_3dias",
      titulo: "Acompanhamento Pós-Consulta",
      icone: "🌱",
      quando: "3 dias após a consulta",
      gatilho: "Para saber como está a adaptação do paciente.",
      ativoPadrao: true,
      texto:
        "Oi, {nome}! 😊\n\n" +
        "Passando para saber como você está se sentindo após nossa consulta.\n\n" +
        "Está conseguindo seguir o plano alimentar? Encontrou alguma dificuldade?\n\n" +
        "Me conte como está sendo sua adaptação. 💜"
    },
    {
      id: "pos_10dias",
      titulo: "Acompanhamento de Evolução",
      icone: "💪",
      quando: "10 dias após a consulta",
      gatilho: "Nova mensagem para acompanhar a evolução.",
      ativoPadrao: true,
      texto:
        "Oi, {nome}! 😊\n\n" +
        "Passando para acompanhar sua evolução.\n\n" +
        "Como você está se sentindo? Está conseguindo manter os combinados da consulta?\n\n" +
        "Estou aqui para te ajudar. 💜"
    },
    {
      id: "avaliacao_google",
      titulo: "Avaliação do Atendimento (Google)",
      icone: "⭐",
      quando: "Apenas após o 1º atendimento — uma única vez",
      gatilho: "Enviado só depois da PRIMEIRA consulta realizada. Nunca se repete.",
      ativoPadrao: true,
      texto:
        "Olá, {nome}! 💜\n\n" +
        "Espero que tenha gostado do atendimento.\n\n" +
        "Sua opinião é muito importante para mim e ajuda outras pessoas a conhecerem meu trabalho.\n\n" +
        "Se puder, deixe sua avaliação através do link abaixo:\n\n" +
        "⭐ {link_google_reviews}\n\n" +
        "Muito obrigada!"
    },
    {
      id: "aniversario",
      titulo: "Mensagem de Aniversário",
      icone: "🎂",
      quando: "Na data de aniversário do paciente",
      gatilho: "Enviado no dia do aniversário (precisa da data de nascimento no cadastro).",
      ativoPadrao: true,
      texto:
        "Parabéns, {nome}! 🎂🎉\n\n" +
        "Desejo muita saúde, felicidade e conquistas neste novo ciclo.\n\n" +
        "Que seja um ano incrível para você! 💜"
    },
    {
      id: "reativacao",
      titulo: "Reativação de Pacientes Inativos",
      icone: "🎁",
      quando: "60 dias sem retornar",
      gatilho: "Campanha automática quando o paciente fica 60 dias sem consulta.",
      ativoPadrao: true,
      texto:
        "Olá, {nome}! 😊\n\n" +
        "Percebi que já faz algum tempo desde nossa última consulta.\n\n" +
        "Para te ajudar a retomar seus objetivos, preparei uma condição especial:\n\n" +
        "🎁 Cupom: {cupom}\n\n" +
        "10% de desconto para agendamentos realizados hoje.\n\n" +
        "Espero te ver em breve! 💜"
    }
  ]
};
