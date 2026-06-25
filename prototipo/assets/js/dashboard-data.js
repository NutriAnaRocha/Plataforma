/* ============================================================
   DASHBOARD DATA — mock realista da Tela 2 (Dashboard).
   Disponibilizado como JS (window.DASH_DATA) e não JSON de
   propósito: fetch() de arquivo local é bloqueado em file://.
   ============================================================ */
window.DASH_DATA = {

  /* Nutricionista logada (mock) */
  user: { nome: "Ana Luísa", saudacao: "Ana", crn: "CRN-3 12345" },

  /* Cards de indicadores do topo */
  stats: [
    { id: "ativos",    label: "Pacientes ativos", valor: "148", delta: "+12", deltaTipo: "up",   sub: "este mês",        ico: "👥", cor: "vinho" },
    { id: "consultas", label: "Consultas hoje",   valor: "7",   delta: "2 online", deltaTipo: "neutro", sub: "1 encaixe",  ico: "📅", cor: "rosa"  },
    { id: "aniver",    label: "Aniversariantes",  valor: "3",   delta: "hoje",     deltaTipo: "neutro", sub: "enviar mensagem", ico: "🎂", cor: "rosa" },
    { id: "pend",      label: "Pendências",       valor: "5",   delta: "2 urgentes", deltaTipo: "down", sub: "a resolver", ico: "⚠️", cor: "alerta" }
  ],

  /* Agenda inteligente — consultas de hoje */
  agenda: [
    { hora: "08:00", paciente: "Marina Costa",      tipo: "Retorno",        modo: "Presencial", status: "concluida",  ini: "MC" },
    { hora: "09:00", paciente: "Rafael Andrade",    tipo: "Primeira consulta", modo: "Online",  status: "concluida",  ini: "RA" },
    { hora: "10:30", paciente: "Juliana Prado",     tipo: "Retorno",        modo: "Presencial", status: "emandamento", ini: "JP" },
    { hora: "13:00", paciente: "Bruno Tavares",     tipo: "Avaliação física", modo: "Presencial", status: "proxima",  ini: "BT" },
    { hora: "14:30", paciente: "Camila Nogueira",   tipo: "Retorno",        modo: "Online",     status: "proxima",   ini: "CN" },
    { hora: "16:00", paciente: "Diego Martins",     tipo: "Reavaliação",    modo: "Presencial", status: "proxima",   ini: "DM" },
    { hora: "17:30", paciente: "Letícia Souza",     tipo: "Encaixe",        modo: "Online",     status: "proxima",   ini: "LS" }
  ],

  /* Gráfico de evolução — adesão média dos pacientes (%) por semana */
  evolucao: {
    titulo: "Evolução & adesão dos pacientes",
    sub: "Adesão média ao plano alimentar — últimas 8 semanas",
    unidade: "%",
    pontos: [62, 68, 65, 72, 78, 75, 83, 88],
    labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
    resumo: "+26 pts"
  },

  /* Pacientes recentes / em acompanhamento */
  pacientes: [
    { nome: "Marina Costa",    obj: "Emagrecimento",      progresso: 82, ini: "MC", ult: "hoje" },
    { nome: "Rafael Andrade",  obj: "Hipertrofia",        progresso: 64, ini: "RA", ult: "hoje" },
    { nome: "Juliana Prado",   obj: "Saúde intestinal",   progresso: 91, ini: "JP", ult: "há 2 dias" },
    { nome: "Bruno Tavares",   obj: "Performance",        progresso: 47, ini: "BT", ult: "há 3 dias" },
    { nome: "Camila Nogueira", obj: "Gestação saudável",  progresso: 73, ini: "CN", ult: "há 5 dias" }
  ],

  /* Aniversariantes do dia */
  aniversariantes: [
    { nome: "Patrícia Lima",  idade: 34, ini: "PL" },
    { nome: "Eduardo Reis",   idade: 41, ini: "ER" },
    { nome: "Sofia Almeida",  idade: 28, ini: "SA" }
  ],

  /* Pendências / tarefas */
  pendencias: [
    { texto: "Liberar plano alimentar de Bruno Tavares",   prazo: "hoje",      urgente: true  },
    { texto: "Revisar exames de Camila Nogueira",          prazo: "hoje",      urgente: true  },
    { texto: "Responder mensagem de Marina Costa",         prazo: "amanhã",    urgente: false },
    { texto: "Enviar receita para Rafael Andrade",         prazo: "amanhã",    urgente: false },
    { texto: "Fechar relatório financeiro do mês",         prazo: "sex, 27",   urgente: false }
  ],

  /* Sugestões rápidas do Nútri AI */
  aiSugestoes: [
    "Resuma a evolução da Marina Costa",
    "Quais pacientes faltaram esta semana?",
    "Monte um cardápio low-carb de 1.500 kcal",
    "Quem está com adesão abaixo de 50%?"
  ],

  /* Resposta mock do assistente (demonstração) */
  aiRespostaDemo:
    "Com base nos dados dos seus pacientes, <strong>3 pessoas</strong> estão com adesão abaixo de 50% " +
    "(Bruno Tavares, 47%). Sugiro um retorno de reforço esta semana e ajuste de metas. " +
    "Posso preparar uma mensagem de acompanhamento para cada um?"
};
